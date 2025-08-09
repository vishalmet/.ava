import os
import json
import argparse
from typing import Any, Dict

import requests


def pretty(obj: Any) -> str:
    try:
        return json.dumps(obj, indent=2, ensure_ascii=False)
    except Exception:
        return str(obj)


def main() -> int:
    parser = argparse.ArgumentParser(description="Test client for Ava convert API")
    parser.add_argument("--base", default="http://127.0.0.1:8000", help="Base URL for the API")
    parser.add_argument("--lang", default="solidity", choices=["solidity", "rust"], help="Target language")
    parser.add_argument("--api-key", default=os.getenv("GROQ_API_KEY"), help="Groq API key (optional)")
    args = parser.parse_args()

    base_url = args.base.rstrip("/")
    api_key = args.api_key
    target_language = args.lang

    # Minimal source code for demonstration
    source_code = (
        "# Counter in Ava-like pseudo\n"
        "var count = 0\n"
        "fun inc() -> count = count + 1\n"
    )

    # Test convert-code endpoint
    print("\n=== POST /convert-code ===")
    try:
        payload_code: Dict[str, Any] = {
            "source_code": source_code,
            "target_language": target_language,
        }
        if api_key:
            payload_code["api_key"] = api_key
        r1 = requests.post(f"{base_url}/convert-code", json=payload_code, timeout=120)
        print(f"status: {r1.status_code}")
        data1 = r1.json() if r1.headers.get("content-type", "").startswith("application/json") else {"raw": r1.text}
        print(pretty({
            "language": data1.get("language"),
            "code_preview": (data1.get("code") or "")[:400]
        }))
    except Exception as e:
        print(f"/convert-code error: {e}")

    # Test convert-project endpoint
    print("\n=== POST /convert-project ===")
    try:
        payload_proj: Dict[str, Any] = {
            "source_code": source_code,
            "target_language": target_language,
        }
        if api_key:
            payload_proj["api_key"] = api_key
        r2 = requests.post(f"{base_url}/convert-project", json=payload_proj, timeout=180)
        print(f"status: {r2.status_code}")
        data2 = r2.json() if r2.headers.get("content-type", "").startswith("application/json") else {"raw": r2.text}
        files = data2.get("files") or []
        print(pretty({
            "projectType": data2.get("projectType"),
            "files_count": len(files),
            "first_file": files[0] if files else None,
            "nextSteps": data2.get("nextSteps") or []
        }))
    except Exception as e:
        print(f"/convert-project error: {e}")

    # Test convert-project-zip endpoint (downloads into memory)
    print("\n=== POST /convert-project-zip ===")
    try:
        payload_zip: Dict[str, Any] = {
            "source_code": source_code,
            "target_language": target_language,
        }
        if api_key:
            payload_zip["api_key"] = api_key
        r3 = requests.post(f"{base_url}/convert-project-zip", json=payload_zip, timeout=180)
        print(f"status: {r3.status_code}")
        ct = r3.headers.get("content-type", "")
        if r3.status_code == 200 and ct.startswith("application/zip"):
            size_kb = len(r3.content) / 1024.0
            disp = r3.headers.get("content-disposition", "")
            print(pretty({
                "zip_kb": round(size_kb, 2),
                "content_disposition": disp
            }))
        else:
            # Try JSON error
            try:
                print(pretty(r3.json()))
            except Exception:
                print(r3.text[:400])
    except Exception as e:
        print(f"/convert-project-zip error: {e}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())


