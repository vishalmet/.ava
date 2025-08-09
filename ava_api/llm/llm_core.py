import os
import re
import json
from typing import Optional, List, Dict, Any
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# ---- LLM init (cached) ----
# Hardcoded Groq API key (requested)
# WARNING: Storing secrets in source code is insecure. Rotate if leaked.
GROQ_HARDCODED_API_KEY: str = "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"
# Cache LLM instances by API key so user-supplied keys create their own instance
_llm_cache: Dict[str, ChatGroq] = {}

def get_llm(api_key: Optional[str] = None) -> ChatGroq:
    """
    Lazily initialize and cache the Groq chat model.
    If an API key is provided, use it for this instance; otherwise fall back
    to the hardcoded key. Instances are cached per key.
    """
    effective_key = (api_key or "").strip() or GROQ_HARDCODED_API_KEY
    if not effective_key:
        raise RuntimeError("No Groq API key provided and hardcoded key is empty.")

    if effective_key in _llm_cache:
        return _llm_cache[effective_key]

    llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=effective_key)
    _llm_cache[effective_key] = llm
    return llm


# ---- One-shot prompt -> output ----
def run_prompt(prompt: str, system: Optional[str] = None, api_key: Optional[str] = None) -> str:
    """
    Send a single prompt to the LLM and return its output as plain text.

    Args:
        prompt: The user prompt text.
        system: Optional system prompt to steer behavior.

    Returns:
        The LLM output as a string.
    """
    messages: List[Any] = []
    if system:
        messages.append(SystemMessage(content=system))
    messages.append(HumanMessage(content=prompt))

    llm = get_llm(api_key)
    result = llm.invoke(messages)
    return result.content if hasattr(result, "content") else str(result)


# ---- Optional: simple conversational memory by conversation_id ----
_conversation_history: Dict[str, List[Any]] = {}

def run_prompt_chat(
    prompt: str,
    conversation_id: str,
    system: Optional[str] = None,
    keep_last_n: int = 20,
    api_key: Optional[str] = None,
) -> str:
    """
    Chat-style interaction that keeps conversation history for a given conversation_id.

    Args:
        prompt: New user message.
        conversation_id: Key used to maintain history across calls.
        system: Optional system prompt (inserted only when a new conversation starts).
        keep_last_n: Trim history to the most recent N messages to keep prompts small.

    Returns:
        The LLM output as a string.
    """
    history = _conversation_history.get(conversation_id)
    if history is None:
        history = []
        if system:
            history.append(SystemMessage(content=system))
        _conversation_history[conversation_id] = history

    # Build message list: prior history + new user message
    messages = history[-keep_last_n:] + [HumanMessage(content=prompt)]

    llm = get_llm(api_key)
    result = llm.invoke(messages)
    output = result.content if hasattr(result, "content") else str(result)

    # Persist turn
    history.append(HumanMessage(content=prompt))
    history.append(AIMessage(content=output))

    # Trim aggressively if needed
    if len(history) > 2 * keep_last_n:
        _conversation_history[conversation_id] = history[-2 * keep_last_n :]

    return output


def _extract_code_from_text(text: str, preferred_language: Optional[str] = None) -> str:
    """
    Try to extract a code block from model output. If a preferred language is
    provided, prefer matching fenced code blocks. Fallback to first fenced
    block or the raw text.
    """
    if not text:
        return ""
    cleaned = text.strip()
    # Prefer language-specific fences: ```lang\n...\n```
    if preferred_language:
        pattern = rf"```\s*{re.escape(preferred_language)}\s*\n([\s\S]*?)```"
        m = re.search(pattern, cleaned, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip()
    # Any fenced block
    m2 = re.search(r"```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)```", cleaned)
    if m2:
        return m2.group(1).strip()
    # Strip common leading labels like "Output:" or markdown
    cleaned = re.sub(r"^\s*Output\s*:\s*", "", cleaned, flags=re.IGNORECASE)
    # Return as-is if no fences found
    return cleaned


def convert_code_to_language(
    source_code: str,
    target_language: str,
    system: Optional[str] = None,
    api_key: Optional[str] = None,
) -> str:
    """
    Convert the given source code (in Ava/DSL or general pseudocode) to a
    specific language, returning only the converted code as a string.

    Supported languages: "solidity", "rust" (case-insensitive; aliases "sol", "rs").
    """
    language_map = {
        "sol": "solidity",
        "solidity": "solidity",
        "rs": "rust",
        "rust": "rust",
    }
    normalized = target_language.strip().lower()
    if normalized not in language_map:
        # Try alias normalization
        normalized = language_map.get(normalized, normalized)
    if normalized not in ("solidity", "rust"):
        raise ValueError("Unsupported target_language. Use 'solidity' or 'rust'.")

    system_prompt = (
        "You are a senior compiler engineer. Convert the input code into the"
        f" target language: {normalized}. Return ONLY the converted code. Do not"
        " include explanations, comments, or markdown fences. Ensure the result"
        " is syntactically valid and idiomatic for the target language."
    )
    if system:
        system_prompt = system_prompt + "\n" + str(system)

    messages: List[Any] = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=source_code),
    ]

    llm = get_llm(api_key)
    result = llm.invoke(messages)
    raw = result.content if hasattr(result, "content") else str(result)

    # Extract clean code (strip any unexpected fences)
    code_only = _extract_code_from_text(raw, preferred_language=normalized)
    return code_only


def code_convert(input_path: str, target_language: str, api_key: Optional[str] = None) -> str:
    """
    Read a .ava (or any text) file at input_path, convert its contents to the
    given target language ("solidity" or "rust"), write the converted code
    alongside the source file, and return the output file path.

    - If api_key is provided, it will be used for the conversion; otherwise the
      hardcoded key is used.
    - Output extension: .sol (Solidity), .rs (Rust)
    - Overwrites existing output file
    """
    if not isinstance(input_path, str) or not input_path:
        raise ValueError("input_path must be a non-empty string")
    if not isinstance(target_language, str) or not target_language:
        raise ValueError("target_language must be a non-empty string")

    # Normalize target language and extension mapping
    lang_map = {"sol": "solidity", "solidity": "solidity", "rs": "rust", "rust": "rust"}
    normalized = target_language.strip().lower()
    normalized = lang_map.get(normalized, normalized)
    if normalized not in ("solidity", "rust"):
        raise ValueError("Unsupported target_language. Use 'solidity' or 'rust'.")
    out_ext = ".sol" if normalized == "solidity" else ".rs"

    abs_in = os.path.abspath(input_path)
    if not os.path.isfile(abs_in):
        raise FileNotFoundError(f"Input file not found: {abs_in}")

    with open(abs_in, "r", encoding="utf-8") as f:
        source = f.read()

    converted = convert_code_to_language(source_code=source, target_language=normalized, api_key=api_key)

    base_dir = os.path.dirname(abs_in)
    base_name = os.path.splitext(os.path.basename(abs_in))[0]
    out_path = os.path.join(base_dir, base_name + out_ext)

    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(converted)

    return out_path


# -------- Project generation (one-click deploy concept) --------

def _project_preset_for_language(target_language: str, preset: Optional[str] = None) -> str:
    normalized = (preset or '').strip().lower()
    if normalized:
        return normalized
    lang = target_language.strip().lower()
    if lang in ("sol", "solidity"):
        return "solidity-hardhat"
    if lang in ("rs", "rust"):
        return "rust-cargo"
    return "generic"


def _extract_first_json_object(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except Exception:
        pass
    blocks = re.findall(r"```(?:json)?\s*([\s\S]*?)```", text, flags=re.IGNORECASE)
    for b in blocks:
        try:
            return json.loads(b.strip())
        except Exception:
            continue
    # Bracket scan
    starts = [i for i, ch in enumerate(text) if ch in "[{"]
    for start in starts:
        stack = []
        in_str = False
        esc = False
        for i in range(start, len(text)):
            ch = text[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == '\\':
                    esc = True
                elif ch == '"':
                    in_str = False
                continue
            else:
                if ch == '"':
                    in_str = True
                    continue
                if ch in '{[':
                    stack.append(ch)
                elif ch in '}]':
                    if not stack:
                        break
                    open_ch = stack.pop()
                    if (open_ch == '{' and ch != '}') or (open_ch == '[' and ch != ']'):
                        break
                    if not stack:
                        candidate = text[start:i+1]
                        try:
                            return json.loads(candidate)
                        except Exception:
                            break
    raise ValueError("Failed to parse JSON manifest from LLM output")


def convert_code_to_project_manifest(
    source_code: str,
    target_language: str,
    preset: Optional[str] = None,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    preset_name = _project_preset_for_language(target_language, preset)
    lang_map = {"sol": "solidity", "solidity": "solidity", "rs": "rust", "rust": "rust"}
    normalized = lang_map.get(target_language.strip().lower(), target_language.strip().lower())
    if normalized not in ("solidity", "rust"):
        raise ValueError("Unsupported target_language. Use 'solidity' or 'rust'.")

    if preset_name == "solidity-hardhat":
        system_prompt = (
            "You are a senior smart-contract engineer. Convert input code into a production-ready Solidity project using Hardhat.\n"
            "Output ONLY a JSON object with fields: projectType (\"solidity-hardhat\"), files (array of {path, content}), nextSteps (array of commands).\n"
            "Rules:\n"
            "- Include files: package.json (with hardhat, @nomicfoundation/hardhat-toolbox, ethers, dotenv), hardhat.config.js, contracts/Contract.sol, scripts/deploy.js, README.md.\n"
            "- Ensure Solidity version pragma is present (e.g., ^0.8.20) and code compiles under solc.\n"
            "- scripts/deploy.js must deploy the main contract and print address.\n"
            "- hardhat.config.js should load dotenv for private keys/networks placeholders.\n"
            "- nextSteps should enable a one-command deploy, e.g., npm install then npx hardhat run scripts/deploy.js --network localhost.\n"
            "- Do not include markdown code fences or commentary. Return JSON only."
        )
        preferred_lang_tag = "solidity"
    else:  # rust-cargo
        system_prompt = (
            "You are a senior systems engineer. Convert input code into a production-ready Rust Cargo project.\n"
            "Output ONLY a JSON object with fields: projectType (\"rust-cargo\"), files (array of {path, content}), nextSteps (array of commands).\n"
            "Rules:\n"
            "- Include files: Cargo.toml, src/lib.rs (or main.rs if binary), README.md, scripts/deploy.sh (placeholder deploy).\n"
            "- Ensure code builds with cargo build.\n"
            "- nextSteps should include cargo build and a single deploy command (scripts/deploy.sh).\n"
            "- Do not include markdown code fences or commentary. Return JSON only."
        )
        preferred_lang_tag = "rust"

    user_prompt = (
        f"Target language: {normalized}\n"
        f"Preset: {preset_name}\n"
        "Convert this source into a well-structured, compilable project with a one-command deploy path.\n"
        "Source code begins below:\n\n" + source_code
    )

    messages: List[Any] = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]
    llm = get_llm(api_key)
    result = llm.invoke(messages)
    raw_text = result.content if hasattr(result, "content") else str(result)
    manifest = _extract_first_json_object(raw_text)
    # Basic sanity
    if not isinstance(manifest, dict) or not isinstance(manifest.get("files"), list):
        raise ValueError("Manifest missing required 'files' array")
    return manifest


def write_project_from_manifest(target_dir: str, manifest: Dict[str, Any], overwrite: bool = False) -> List[str]:
    abs_root = os.path.abspath(target_dir)
    os.makedirs(abs_root, exist_ok=True)
    files = manifest.get("files", [])
    written: List[str] = []
    for f in files:
        rel_raw = f.get("path", "")
        rel = (rel_raw if isinstance(rel_raw, str) else str(rel_raw)).replace("\\", "/").lstrip("/\\")
        if not rel:
            continue
        value = f.get("content", "")
        if isinstance(value, (dict, list)):
            content = json.dumps(value, indent=2)
        elif value is None:
            content = ""
        else:
            content = str(value)
        abs_path = os.path.join(abs_root, *rel.split("/"))
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        if os.path.exists(abs_path) and not overwrite:
            continue
        with open(abs_path, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(content)
        written.append(abs_path)
    return written


def code_convert_project(
    input_path: str,
    target_language: str,
    project_root: str,
    api_key: Optional[str] = None,
    preset: Optional[str] = None,
    overwrite: bool = False,
) -> Dict[str, Any]:
    if not input_path:
        raise ValueError("input_path is required")
    if not project_root:
        raise ValueError("project_root is required")
    abs_in = os.path.abspath(input_path)
    if not os.path.isfile(abs_in):
        raise FileNotFoundError(f"Input file not found: {abs_in}")
    with open(abs_in, "r", encoding="utf-8") as f:
        source = f.read()

    manifest = convert_code_to_project_manifest(source, target_language, preset=preset, api_key=api_key)
    abs_root = os.path.abspath(project_root)
    written = write_project_from_manifest(abs_root, manifest, overwrite=overwrite)
    next_steps = manifest.get("nextSteps") or []
    return {
        "projectType": manifest.get("projectType"),
        "projectRoot": abs_root,
        "writtenCount": len(written),
        "writtenFiles": written,
        "nextSteps": next_steps,
    }
