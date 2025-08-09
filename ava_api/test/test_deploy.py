import os
import json
import argparse
from typing import Any, Dict, List

import requests


def pretty(obj: Any) -> str:
    try:
        return json.dumps(obj, indent=2, ensure_ascii=False)
    except Exception:
        return str(obj)


def parse_args_list(raw: str) -> List[Any]:
    if not raw:
        return []
    # Try JSON first, then Python literal fallback
    try:
        val = json.loads(raw)
        if isinstance(val, list):
            return val
        return [val]
    except Exception:
        try:
            import ast
            val = ast.literal_eval(raw)
            if isinstance(val, list):
                return val
            return [val]
        except Exception:
            return [raw]


def main() -> int:
    parser = argparse.ArgumentParser(description="Test client for /deploy-contract endpoint")
    parser.add_argument("--base", default="http://127.0.0.1:8000", help="Base URL for the API")
    parser.add_argument("--private-key", default=os.getenv("TEST_DEPLOY_PRIVATE_KEY"), help="Deployer private key (required to actually deploy)")
    parser.add_argument("--rpc", default=os.getenv("TEST_DEPLOY_RPC"), help="RPC URL (optional; server defaults if omitted)")
    parser.add_argument("--name", default=None, help="Contract name to deploy (if multiple in source)")
    parser.add_argument("--args", default="", help="Constructor args as JSON array (e.g. [42,\"hello\"]) or Python literal")
    parser.add_argument("--source-file", default=None, help="Path to .sol file to deploy. If omitted, a minimal Hello contract is used")
    args = parser.parse_args()

    base_url = args.base.rstrip("/")
    private_key = args.private_key
    rpc_url = args.rpc
    contract_name = args.name
    ctor_args = parse_args_list(args.args)

    if args.source_file and os.path.isfile(args.source_file):
        with open(args.source_file, "r", encoding="utf-8") as fh:
            solidity_source = fh.read()
    else:
        # Minimal contract (no constructor)
        solidity_source = (
            "pragma solidity ^0.8.20;\n"
            "contract Hello {\n"
            "  string public greeting = 'hello';\n"
            "}\n"
        )

    print("\n=== POST /deploy-contract ===")
    if not private_key:
        print("Skipping deploy test: --private-key not provided (set TEST_DEPLOY_PRIVATE_KEY or pass --private-key)")
        return 0

    payload: Dict[str, Any] = {
        "solidity_source": solidity_source,
        "private_key": private_key,
    }
    if rpc_url:
        payload["rpc_url"] = rpc_url
    if contract_name:
        payload["contract_name"] = contract_name
    if ctor_args:
        payload["constructor_args"] = ctor_args

    try:
        r = requests.post(f"{base_url}/deploy-contract", json=payload, timeout=300)
        print(f"status: {r.status_code}")
        ct = r.headers.get("content-type", "")
        if ct.startswith("application/json"):
            data = r.json()
        else:
            data = {"raw": r.text[:400]}
        if r.status_code == 200:
            # Show important fields only
            out = {
                "address": data.get("address"),
                "txHash": data.get("txHash"),
                "contractName": data.get("contractName"),
                "chainId": data.get("chainId"),
                "solcVersion": data.get("solcVersion"),
                "abi_len": len(data.get("abi") or []),
            }
            print(pretty(out))
        else:
            print(pretty(data))
    except Exception as e:
        print(f"/deploy-contract error: {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


