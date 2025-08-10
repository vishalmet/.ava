from __future__ import annotations

import os
import re
import io
import math
import json
import time
from typing import Any, Dict, List, Tuple, Optional, Iterable

# ------------------------------
# Tokenization / utilities
# ------------------------------

_WORD_RE = re.compile(r"[A-Za-z0-9_]+")


def _tokenize(text: str, stopwords: Optional[Iterable[str]] = None) -> List[str]:
    toks = [w.lower() for w in _WORD_RE.findall(text or "")]
    if stopwords:
        sw = set(s.lower() for s in stopwords)
        toks = [t for t in toks if t not in sw]
    return toks


def _split_sentences(text: str) -> List[str]:
    parts = re.split(r"(?<=[.!?])\s+", (text or "").strip())
    return [p.strip() for p in parts if p.strip()]


def _read_file(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def _split_markdown_into_chunks(md: str, max_chars: int = 1500) -> List[Tuple[str, str]]:
    """
    Split by headings (#, ##, ###). Keep current heading as title.
    Return list of (title, body). Oversized bodies are further split.
    """
    lines = (md or "").splitlines()
    chunks: List[Tuple[str, str]] = []
    current_title = "(intro)"
    current_buf: List[str] = []

    def _flush():
        nonlocal chunks, current_buf, current_title
        if not current_buf:
            return
        body = "\n".join(current_buf).strip()
        if not body:
            return
        if len(body) > max_chars:
            for i in range(0, len(body), max_chars):
                chunks.append((current_title, body[i : i + max_chars]))
        else:
            chunks.append((current_title, body))
        current_buf = []

    for ln in lines:
        if ln.startswith("# " ) or ln.startswith("## ") or ln.startswith("### "):
            _flush()
            current_title = ln.lstrip("# ").strip() or current_title
        else:
            current_buf.append(ln)
    _flush()
    return chunks


# ------------------------------
# Tiny TF-IDF
# ------------------------------

class _Tfidf:
    def __init__(self, docs: List[List[str]]):
        self.docs = docs
        self.num_docs = len(docs)
        self.vocab: Dict[str, int] = {}
        self.df: Dict[str, int] = {}
        self._build_vocab()
        self.idf: Dict[str, float] = {
            t: math.log((self.num_docs + 1) / (df + 1)) + 1.0
            for t, df in self.df.items()
        }
        self.doc_vecs: List[Dict[str, float]] = [self._tfidf_vector(tokens) for tokens in docs]

    def _build_vocab(self) -> None:
        for tokens in self.docs:
            seen: set = set()
            for t in tokens:
                if t not in self.vocab:
                    self.vocab[t] = len(self.vocab)
                if t not in seen:
                    self.df[t] = self.df.get(t, 0) + 1
                    seen.add(t)

    def _tfidf_vector(self, tokens: List[str]) -> Dict[str, float]:
        tf: Dict[str, int] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        if not tokens:
            return {}
        inv_len = 1.0 / float(len(tokens))
        vec: Dict[str, float] = {}
        for t, c in tf.items():
            vec[t] = (c * inv_len) * self.idf.get(t, 0.0)
        return vec

    @staticmethod
    def _cosine(a: Dict[str, float], b: Dict[str, float]) -> float:
        if not a or not b:
            return 0.0
        dot = 0.0
        for k, v in a.items():
            if k in b:
                dot += v * b[k]
        na = math.sqrt(sum(v * v for v in a.values()))
        nb = math.sqrt(sum(v * v for v in b.values()))
        if na == 0.0 or nb == 0.0:
            return 0.0
        return dot / (na * nb)

    def query(self, tokens: List[str], top_k: int = 5) -> List[Tuple[int, float]]:
        q_vec = self._tfidf_vector(tokens)
        scored: List[Tuple[int, float]] = []
        for i, dvec in enumerate(self.doc_vecs):
            scored.append((i, self._cosine(q_vec, dvec)))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]


# ------------------------------
# Generic Docs Bot
# ------------------------------

class LangDocsBot:
    """
    Generic, project-agnostic documentation QA bot.
    - Point it at a docs root and a project name.
    - Optionally customize file extensions and stopwords.
    - Uses a local TF-IDF retriever; optional Groq LLM for answer synthesis.
    """

    def __init__(
        self,
        project_name: str,
        docs_root: Optional[str] = None,
        file_extensions: Tuple[str, ...] = (".md", ".rst", ".txt"),
        stopwords: Optional[Iterable[str]] = None,
    ):
        self.project_name = project_name
        self.project_root = docs_root or os.getcwd()
        self.file_extensions = tuple(e.lower() for e in file_extensions)
        self.stopwords = set(s.lower() for s in (stopwords or []))

        self.docs_files: List[str] = []
        self.chunks: List[Dict[str, Any]] = []  # {title, body, path, idx, title_tokens}
        self._mtime_index: Dict[str, float] = {}
        self._tfidf: Optional[_Tfidf] = None

        self._load_index()

    # --------- Indexing ---------

    def _list_doc_files(self) -> List[str]:
        out: List[str] = []
        for root, _dirs, files in os.walk(self.project_root):
            for fn in files:
                if os.path.splitext(fn)[1].lower() in self.file_extensions:
                    out.append(os.path.join(root, fn))
        out.sort()
        return out

    def _load_index(self) -> None:
        self.docs_files = self._list_doc_files()
        chunks: List[Dict[str, Any]] = []
        for path in self.docs_files:
            try:
                mtime = os.path.getmtime(path)
                self._mtime_index[path] = mtime
                text = _read_file(path)
                for idx, (title, body) in enumerate(_split_markdown_into_chunks(text)):
                    code_blocks = []
                    has_ava_code = False
                    try:
                        # Extract code blocks and detect Ava snippets
                        for lang, code in self._extract_code_blocks(body):
                            code_blocks.append({"lang": lang, "code": code})
                            if lang == "ava":
                                has_ava_code = True
                        # Heuristic: treat blocks that look like Ava even if not fenced as such
                        if not has_ava_code:
                            lowered = body.lower()
                            if ("fun " in lowered or " if " in lowered or " then" in lowered) and "```" in body:
                                # There is fenced code and it looks like Ava syntax
                                has_ava_code = True
                    except Exception:
                        pass
                    chunks.append({
                        "path": path,
                        "title": title,
                        "title_tokens": _tokenize(title, self.stopwords),
                        "body": body,
                        "idx": idx,
                        "code_blocks": code_blocks,
                        "has_ava_code": has_ava_code,
                    })
            except Exception:
                continue
        self.chunks = chunks
        self._tfidf = _Tfidf([_tokenize(c["title"] + "\n" + c["body"], self.stopwords) for c in self.chunks])

    def _refresh_if_changed(self) -> None:
        changed = False
        current = self._list_doc_files()
        if set(current) != set(self.docs_files):
            changed = True
        else:
            for p in current:
                try:
                    if os.path.getmtime(p) != self._mtime_index.get(p):
                        changed = True
                        break
                except Exception:
                    changed = True
                    break
        if changed:
            self._load_index()

    # --------- Public APIs ---------

    def retrieve(self, question: str, top_k: int = 5) -> List[Dict[str, Any]]:
        self._refresh_if_changed()
        if not question or not question.strip():
            return []
        if not self.chunks or not self._tfidf:
            return []
        q_tokens = _tokenize(question, self.stopwords)
        hits = self._tfidf.query(q_tokens, top_k=top_k)
        picked: List[Dict[str, Any]] = []
        for idx, score in hits:
            c = self.chunks[idx]
            picked.append({
                "path": c["path"],
                "title": c["title"],
                "score": round(float(score), 4),
                "preview": c["body"][:400],
                "idx": idx,
            })
        return picked

    def answer(self, question: str, top_k: int = 5) -> Dict[str, Any]:
        """Pure extractive mode: pick best sentences from retrieved chunks."""
        self._refresh_if_changed()
        if not question or not question.strip():
            return {"answer": "Please provide a question.", "sources": []}
        if not self.chunks or not self._tfidf:
            return {"answer": "Documentation is empty or unavailable.", "sources": []}

        q_tokens = _tokenize(question, self.stopwords)
        hits = self._tfidf.query(q_tokens, top_k=top_k)
        picked_meta: List[Dict[str, Any]] = []
        bodies: List[str] = []

        for idx, score in hits:
            c = self.chunks[idx]
            picked_meta.append({
                "path": c["path"],
                "title": c["title"],
                "score": round(float(score), 4),
                "preview": c["body"][:400],
            })
            bodies.append(c["body"])

        synthesis = self._synthesize_extractive(question, bodies)

        # Prefer grounded Ava code snippets from the docs
        wants_code = any(word in question.lower() for word in ["example", "code", "program", "sample", "show", "function", "fun", "loop", "if", "list"])
        if wants_code:
            ava_snips = self._gather_ava_snippets([i for i, _ in hits], q_tokens, max_snippets=4)
            if ava_snips:
                synthesis += "\n\nAva code from docs:\n" + "\n\n".join([f"```ava\n{sn}\n```" for sn in ava_snips[:2]])
            else:
                ava_example = self._get_ava_examples(question)
                synthesis += "\n\nHere's an Ava language example:\n" + ava_example
        
        return {"answer": synthesis, "sources": picked_meta}

    def chat(
        self,
        question: str,
        api_key: Optional[str] = None,
        model_name: str = "llama-3.1-8b-instant",
        top_k: int = 6,
        max_context_chars: int = 8000,
        system_prompt: Optional[str] = None,
        enforce_code_lang: str = "ava",  # Default to enforcing Ava language
        use_full_context: bool = False,
        full_context_max_chars: int = 120000,
    ) -> Dict[str, Any]:
        """
        Generative mode using Groq via LangChain. If Groq isn't installed/available,
        returns a helpful message. API key is hardcoded.
        """
        self._refresh_if_changed()
        if not question or not question.strip():
            return {"answer": "Please provide a question.", "sources": []}
        if not self.chunks or not self._tfidf:
            return {"answer": "Documentation is empty or unavailable.", "sources": []}

        try:
            from langchain_groq import ChatGroq  # type: ignore
            from langchain_core.messages import SystemMessage, HumanMessage  # type: ignore
        except Exception:
            return {"answer": "LLM not available (install langchain-groq and langchain-core)."}

        # Context construction
        q_tokens = _tokenize(question, self.stopwords)
        if use_full_context:
            # Concatenate most of the docs into one context block
            ctx = self._render_full_context(max_chars=full_context_max_chars)
            hits = [(i, 1.0) for i in range(min(len(self.chunks), 50))]  # dummy hits for sourcing
            picked = [
                {
                    "path": c["path"],
                    "title": c["title"],
                    "score": 1.0,
                    "preview": c["body"][:400],
                }
                for c in self.chunks[:min(len(self.chunks), 10)]
            ]
        else:
            # Retrieve + diversify
            hits = self._tfidf.query(q_tokens, top_k=max(top_k * 2, 8))
            hits = self._rerank_with_title_boost(hits, q_tokens, alpha=0.85, beta=0.15)
            hits = self._mmr_select(hits, k=top_k, lambda_param=0.6)

            picked: List[Dict[str, Any]] = []
            contexts: List[str] = []
            for idx, score in hits:
                c = self.chunks[idx]
                picked.append({
                    "path": c["path"],
                    "title": c["title"],
                    "score": round(float(score), 4),
                    "preview": c["body"][:400],
                })
                header = f"Title: {c['title']}\nFile: {os.path.basename(c['path'])}"
                snippet = self._best_sentences(c["body"], q_tokens, max_sentences=4)
                contexts.append(header + "\n" + snippet)

            ctx = "\n\n---\n\n".join(contexts)
            if len(ctx) > max_context_chars:
                ctx = ctx[:max_context_chars]

        sys_msg = system_prompt or (
            f"You are a helpful assistant for the {self.project_name} documentation. "
            f"Answer only using the provided documentation context. Do NOT fabricate APIs or fields. "
            f"Prefer returning complete, runnable Ava PROGRAMS over isolated data structures when the user asks for examples. "
            f"Syntax rules: use 'if <expr> then ... end', 'while <expr> then ... end', 'for i = a to b [step s] then ... end'; no braces, no semicolons. "
            f"Always fence code as ```ava``` and keep to constructs present in the provided code snippets. "
            f"If no relevant Ava code exists in context, state that briefly, then provide a minimal Ava example that matches the request."
        )

        # Gather candidate Ava snippets from the selected documents
        ava_snippets = self._gather_ava_snippets([i for i, _s in hits], q_tokens, max_snippets=6)

        code_section = ""
        if ava_snippets:
            joined = "\n\n".join([f"```ava\n{snip}\n```" for snip in ava_snippets])
            code_section = "\n\nAva Code Snippets from Docs (ground truth, use and adapt without inventing new APIs):\n" + joined

        user_msg = (
            "Question:\n" + question.strip() + "\n\n" +
            ("Full Documentation (flattened):\n" if use_full_context else "Documentation Context (excerpts):\n") + ctx + code_section
        )

        # API key: hardcoded
        api_key = "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"
        if not api_key:
            return {"answer": "Missing Groq API key. Pass api_key=... or set GROQ_API_KEY."}

        llm = ChatGroq(api_key=api_key, temperature=0.0, model_name=model_name)
        def _try_invoke(msg: str) -> Optional[str]:
            try:
                resp = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=msg)])
                return getattr(resp, "content", None) or str(resp)
            except Exception:
                return None

        text = _try_invoke(user_msg)

        # If full context is too large and call failed, retry with smaller context windows
        if text is None and use_full_context:
            for cap in (60000, 30000, 15000):
                ctx_small = self._render_full_context(max_chars=cap)
                user_msg_small = (
                    "Question:\n" + question.strip() + "\n\n" +
                    "Full Documentation (flattened):\n" + ctx_small + code_section
                )
                text = _try_invoke(user_msg_small)
                if text is not None:
                    break

        # Final fallback: extractive answer without LLM
        if text is None:
            picked_meta: List[Dict[str, Any]] = []
            bodies: List[str] = []
            for idx, score in (hits or [])[:top_k]:
                c = self.chunks[idx]
                picked_meta.append({
                    "path": c["path"],
                    "title": c["title"],
                    "score": round(float(score), 4),
                    "preview": c["body"][:400],
                })
                bodies.append(c["body"])
            synthesis = self._synthesize_extractive(question, bodies)
            if any(word in question.lower() for word in ["example", "code", "program", "sample", "show"]) and not re.search(r"```ava[\s\S]*?```", synthesis):
                ava_snippets = self._gather_ava_snippets([i for i, _ in (hits or [])], q_tokens, max_snippets=2)
                if ava_snippets:
                    synthesis += "\n\n" + "\n\n".join([f"```ava\n{sn}\n```" for sn in ava_snippets])
                else:
                    synthesis += "\n\n" + self._get_ava_examples(question)
            return {"answer": synthesis, "sources": picked_meta or picked}

        if enforce_code_lang:
            text = self._maybe_rewrite_as_lang(text, llm, sys_msg, enforce_code_lang)

        # If the answer contains non-Ava code but the user asked for code, try to rewrite it to Ava
        if any(w in question.lower() for w in ["example", "code", "program", "sample", "show"]) and "```ava" not in text:
            ava_snippets_for_fix = self._gather_ava_snippets([i for i, _ in hits], q_tokens, max_snippets=4)
            text = self._rewrite_code_to_ava(text, llm, sys_msg, ava_snippets_for_fix)

        # Validate any ava-fenced blocks; if they don't look like Ava, rewrite using grounding
        code_blocks = self._extract_code_blocks(text)
        bad_blocks = []
        for lang, code in code_blocks:
            if lang == "ava" and not self._is_valid_ava_code(code):
                bad_blocks.append(code)
        if bad_blocks:
            ava_snippets_for_fix = self._gather_ava_snippets([i for i, _ in hits], q_tokens, max_snippets=4)
            text = self._rewrite_code_to_ava(text, llm, sys_msg, ava_snippets_for_fix)

        # Prefer real Ava snippets from docs; fall back to curated examples only if none present
        if any(word in question.lower() for word in ["example", "code", "program", "sample", "show"]) and "```ava" not in text:
            if ava_snippets:
                synthesized = "\n\nBased on the docs, here's a runnable Ava program aligned with your request (grounded in provided snippets):\n" + "\n\n".join([f"```ava\n{snip}\n```" for snip in ava_snippets[:2]])
                text += synthesized
            else:
                ava_example = self._get_ava_examples(question)
                text += "\n\nHere's an Ava language example:\n" + ava_example

        return {"answer": text, "sources": picked}

    # --------- Internals ---------

    def _synthesize_extractive(self, question: str, bodies: List[str]) -> str:
        q_set = set(_tokenize(question, self.stopwords))
        scored: List[Tuple[float, str]] = []
        for body in bodies:
            for sent in _split_sentences(body)[:50]:
                toks = set(_tokenize(sent, self.stopwords))
                if not toks:
                    continue
                overlap = len(q_set & toks)
                if overlap == 0:
                    continue
                precision = overlap / max(1, len(toks))
                recall = overlap / max(1, len(q_set))
                f1 = (2 * precision * recall) / max(1e-9, precision + recall)
                scored.append((f1, sent))
        if not scored:
            for body in bodies:
                sample = "\n".join(body.splitlines()[:6]).strip()
                if sample:
                    return sample
            return "No answer found in docs."
        scored.sort(key=lambda x: x[0], reverse=True)
        best = [s for _score, s in scored[:5]]
        return "\n".join(best)

    def _extract_code_blocks(self, text: str) -> List[Tuple[str, str]]:
        blocks: List[Tuple[str, str]] = []
        code_re = re.compile(r"```(\w+)?\n([\s\S]*?)```", re.MULTILINE)
        for m in code_re.finditer(text or ""):
            lang = (m.group(1) or "").strip().lower()
            code = m.group(2) or ""
            blocks.append((lang, code))
        return blocks

    def _looks_like_lang(self, text: str, lang_hint: str) -> bool:
        # If any code blocks exist and specify a different language, we ask for rewrite
        for lang, _code in self._extract_code_blocks(text):
            if lang and lang != lang_hint:
                return False
        return True

    def _maybe_rewrite_as_lang(self, text: str, llm, sys_msg: str, lang_hint: str) -> str:
        if self._looks_like_lang(text, lang_hint):
            return text
        # Ask the model to reformat code blocks
        try:
            fix_prompt = (
                f"Rewrite the following answer so that any code blocks are fenced as ```{lang_hint}```. "
                f"Do not change semantics; just fix code fences and minor syntax if obviously not matching {lang_hint}. "
                f"Return only the revised answer.\n\n===\n{text}"
            )
            from langchain_core.messages import SystemMessage, HumanMessage  # type: ignore
            resp2 = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=fix_prompt)])
            text2 = getattr(resp2, "content", None) or str(resp2)
            return text2 or text
        except Exception:
            return text

    def _is_valid_ava_code(self, code: str) -> bool:
        """Heuristic check that a snippet looks like Ava, not another language."""
        src = code.strip()
        if not src:
            return False
        lowered = src.lower()
        # Disallow obvious non-Ava tokens
        forbidden = ["local ", "function ", "console.log", "#include", "public static", "class ", "let ", "const ", "=>", "begin", "end;", "var ", " := "]
        # Note: we allow 'var ' which Ava uses, so remove it from forbidden if present
        forbidden = [t for t in forbidden if t != "var "]
        if any(tok in lowered for tok in forbidden):
            return False
        # Require presence of some Ava-ish constructs
        has_var = re.search(r"\bvar\s+\w+\b", src) is not None
        has_fun = re.search(r"\bfun\s+\w+\s*\(", src) is not None
        has_flow = re.search(r"\b(if|while|for)\b.*\bthen\b", lowered) is not None or "end" in lowered
        # Consider it valid if at least one of these patterns appears
        return has_var or has_fun or has_flow

    def _rewrite_code_to_ava(self, text: str, llm, sys_msg: str, grounding_snippets: List[str]) -> str:
        """Ask the model to convert any code blocks to valid Ava syntax, grounded on provided snippets."""
        try:
            from langchain_core.messages import SystemMessage, HumanMessage  # type: ignore
        except Exception:
            return text
        grounding = "\n\n".join([f"```ava\n{sn}\n```" for sn in grounding_snippets[:4]]) if grounding_snippets else ""
        prompt = (
            "Convert any code in the following answer into valid Ava language. "
            "Rules: use 'var' for variables, 'fun name(args) ... end' for functions, 'if <expr> then ... end', "
            "'while <expr> then ... end', 'for i = a to b [step s] then ... end', lists with [..], indexing with '/', "
            "and builtins like show, add, len. Do not invent new APIs or fields not shown in the docs. "
            "Keep the logic and variable names where reasonable. Fence all code as ```ava```. "
            "Here are Ava snippets from the docs for reference:" + ("\n" + grounding if grounding else "") +
            "\n\nAnswer to convert:\n" + text
        )
        try:
            resp = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=prompt)])
            fixed = getattr(resp, "content", None) or str(resp)
            return fixed or text
        except Exception:
            return text

    def _rerank_with_title_boost(
        self,
        hits: List[Tuple[int, float]],
        q_tokens: List[str],
        alpha: float = 0.85,
        beta: float = 0.15,
    ) -> List[Tuple[int, float]]:
        if not hits:
            return hits
        q_set = set(q_tokens)
        rescored: List[Tuple[int, float]] = []
        for idx, base in hits:
            c = self.chunks[idx]
            title_tokens = set(c.get("title_tokens", []))
            overlap = 0.0
            if q_set and title_tokens:
                overlap = len(q_set & title_tokens) / float(len(q_set))
            # Boost chunks that actually contain Ava code blocks if the user seems to want code
            wants_code = any(t in q_set for t in ["example", "examples", "code", "program", "sample", "show", "function", "fun", "loop", "if", "list"])
            code_boost = 0.1 if (wants_code and c.get("has_ava_code")) else 0.0
            score = alpha * float(base) + beta * overlap + code_boost
            rescored.append((idx, score))
        rescored.sort(key=lambda x: x[1], reverse=True)
        return rescored

    def _mmr_select(
        self,
        hits: List[Tuple[int, float]],
        k: int,
        lambda_param: float = 0.6,
    ) -> List[Tuple[int, float]]:
        # Maximal Marginal Relevance selection to improve diversity
        k = max(1, min(k, len(hits)))
        if k >= len(hits):
            return hits[:k]
        selected: List[Tuple[int, float]] = []
        candidates = hits[:]
        doc_vecs = self._tfidf.doc_vecs if self._tfidf else []
        selected.append(candidates.pop(0))
        while len(selected) < k and candidates:
            best_idx = -1
            best_score = -1e9
            for ci, (cand_idx, cand_rel) in enumerate(candidates):
                max_sim = 0.0
                for sel_idx, _ in selected:
                    try:
                        v1 = doc_vecs[cand_idx]
                        v2 = doc_vecs[sel_idx]
                        sim = _Tfidf._cosine(v1, v2)
                        if sim > max_sim:
                            max_sim = sim
                    except Exception:
                        pass
                mmr = lambda_param * float(cand_rel) - (1.0 - lambda_param) * max_sim
                if mmr > best_score:
                    best_score = mmr
                    best_idx = ci
            if best_idx >= 0:
                selected.append(candidates.pop(best_idx))
            else:
                break
        return selected

    def _best_sentences(self, body: str, q_tokens: List[str], max_sentences: int = 4) -> str:
        q_set = set(q_tokens)
        scored: List[Tuple[float, str]] = []
        for sent in _split_sentences(body):
            toks = set(_tokenize(sent, self.stopwords))
            if not toks:
                continue
            overlap = len(q_set & toks)
            if overlap == 0:
                continue
            precision = overlap / max(1, len(toks))
            recall = overlap / max(1, len(q_set)) if q_set else 0.0
            f1 = (2 * precision * recall) / max(1e-9, precision + recall)
            scored.append((f1, sent))
        if not scored:
            return body[:600]
        scored.sort(key=lambda x: x[0], reverse=True)
        return "\n".join([s for _sc, s in scored[:max_sentences]])

    def _render_full_context(self, max_chars: int = 120000) -> str:
        """Flatten most of the docs into a single context string with headings, clipped to max_chars."""
        parts: List[str] = []
        for c in self.chunks:
            parts.append(f"# {c['title']}\n(File: {os.path.basename(c['path'])})\n\n{c['body']}")
            if sum(len(p) for p in parts) > max_chars:
                break
        ctx = "\n\n---\n\n".join(parts)
        if len(ctx) > max_chars:
            ctx = ctx[:max_chars]
        return ctx

    def _gather_ava_snippets(self, hit_indices: List[int], q_tokens: List[str], max_snippets: int = 6) -> List[str]:
        """Collect and rank Ava code snippets from selected chunks, biased toward token overlap."""
        if not hit_indices:
            return []
        q_set = set(q_tokens)
        candidates: List[Tuple[float, str]] = []
        for idx in hit_indices:
            c = self.chunks[idx]
            for blk in c.get("code_blocks", []) or []:
                lang = (blk.get("lang") or "").lower()
                code = blk.get("code") or ""
                if not code.strip():
                    continue
                if lang and lang != "ava":
                    continue
                # Simple relevance: token overlap on code text
                toks = set(_tokenize(code, self.stopwords))
                overlap = len(q_set & toks)
                # Additional signal: snippets that contain functions/flow are preferred
                has_fun = 1 if re.search(r"\bfun\b", code) else 0
                has_flow = 1 if re.search(r"\b(if|while|for)\b", code) else 0
                score = (overlap * 1.0) + (has_fun * 2.0) + (has_flow * 1.5)
                candidates.append((score, code.strip()))
        if not candidates:
            return []
        candidates.sort(key=lambda x: x[0], reverse=True)
        unique: List[str] = []
        seen = set()
        for _sc, code in candidates:
            if code in seen:
                continue
            seen.add(code)
            unique.append(code)
            if len(unique) >= max_snippets:
                break
        return unique

    def _get_ava_examples(self, question: str) -> str:
        """Provide Ava language examples based on the question context."""
        examples = {
            "variable": """```ava
var x = 10
var message = "Hello, Ava!"
var numbers = [1, 2, 3, 4, 5]
var is_active = true
```""",
            "function": """```ava
fun greet(name) -> "Hello, " + name

fun calculate_area(width, height)
    var area = width * height
    return area
end

fun factorial(n)
    if n <= 1 then
        return 1
    else
        return n * factorial(n - 1)
    end
end
```""",
            "control_flow": """```ava
var x = 5
if x > 3 then
    show("x is greater than 3")
elif x == 3 then
    show("x equals 3")
else
    show("x is less than 3")
end

var i = 0
while i < 5 then
    show(i)
    var i = i + 1
end

for i = 0 to 4 step 1 then
    show(i)
end
```""",
            "list_operations": """```ava
var xs = [1, 2, 3, 4, 5]
var first = xs / 0
var last = xs / (len(xs) - 1)
add(xs, 6)
var sum = 0
for i = 0 to len(xs) - 1 then
    var sum = sum + (xs / i)
end
```""",
            "basic_program": """```ava
var message = "Welcome to Ava!"
var tips = []
var total_donated = 0

fun setMessage(newMessage)
    var message = newMessage
    return null
end

fun getMessage() -> message

fun buyCoffee(note)
    var tip = ["from", "amount", note, "time"]
    add(tips, tip)
    var total_donated = total_donated + 1
    return null
end

fun getTipsCount() -> len(tips)
```""",
            "default": """```ava
var x = 10
var y = 20
var sum = x + y
show("Sum: " + sum)

fun double(n) -> n * 2
var result = double(5)
show("Double of 5: " + result)
```"""
        }
        
        # Determine which example to show based on question keywords
        question_lower = question.lower()
        if any(word in question_lower for word in ["variable", "var", "declare"]):
            return examples["variable"]
        elif any(word in question_lower for word in ["function", "fun", "method"]):
            return examples["function"]
        elif any(word in question_lower for word in ["if", "else", "while", "for", "loop", "control"]):
            return examples["control_flow"]
        elif any(word in question_lower for word in ["list", "array", "add", "remove"]):
            return examples["list_operations"]
        elif any(word in question_lower for word in ["program", "example", "code", "sample"]):
            return examples["basic_program"]
        else:
            return examples["default"]


# ------------------------------
# Singleton helper (optional)
# ------------------------------

_BOT_SINGLETON: Optional[LangDocsBot] = None

def get_bot(
    project_name: str,
    docs_root: Optional[str] = None,
    file_extensions: Tuple[str, ...] = (".md", ".rst", ".txt"),
    stopwords: Optional[Iterable[str]] = None,
) -> LangDocsBot:
    global _BOT_SINGLETON
    if _BOT_SINGLETON is None:
        # Default Ava-specific stopwords to improve search quality
        default_stopwords = [
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
            "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
            "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those",
            "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
            "my", "your", "his", "her", "its", "our", "their", "mine", "yours", "hers", "ours", "theirs"
        ]
        
        _BOT_SINGLETON = LangDocsBot(
            project_name=project_name,
            docs_root=docs_root,
            file_extensions=file_extensions,
            stopwords=stopwords or default_stopwords,
        )
    return _BOT_SINGLETON


# ------------------------------
# CLI
# ------------------------------

if __name__ == "__main__":
    # Example:
    #   PROJECT_NAME="Ava" DOCS_ROOT="./docs" GROQ_API_KEY="gsk_..." python lang_docs_bot.py
    project_name = os.getenv("PROJECT_NAME", "Ava")
    docs_root = os.getenv("DOCS_ROOT", "../docs")  # Default to docs directory relative to ava_api

    bot = get_bot(project_name=project_name, docs_root=docs_root, stopwords=None)  # Use default Ava-optimized stopwords
    print(f"[{project_name}] Loaded {len(bot.chunks)} chunks from: {bot.project_root}")

    try:
        while True:
            q = input(f"{project_name}-docs> ").strip()
            if not q:
                continue
            if q.lower() in ("exit", "quit"):
                break

            model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
            use_llm = os.getenv("USE_LLM", "1") not in ("0", "false", "False")
            use_full = os.getenv("USE_FULL_CONTEXT", "1") not in ("0", "false", "False")
            full_cap = int(os.getenv("FULL_CONTEXT_MAX_CHARS", "90000"))

            if use_llm:
                # Hardcode the API key here as well
                res = bot.chat(
                    q,
                    api_key="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",
                    model_name=model,
                    top_k=6,
                    enforce_code_lang="ava",
                    use_full_context=use_full,
                    full_context_max_chars=full_cap,
                )
            else:
                res = bot.answer(q, top_k=6)

            print("\nAnswer:\n" + res.get("answer", ""))
            if res.get("sources"):
                print("\nSources:")
                for s in res["sources"]:
                    print(f"- {s['title']} ({os.path.basename(s['path'])}) [{s['score']}]")
            print()
    except KeyboardInterrupt:
        pass
