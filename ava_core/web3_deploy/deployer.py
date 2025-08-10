from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional, Tuple

from web3 import Web3
from eth_account import Account

try:
    # python-solcx is used to compile Solidity sources from a string
    from solcx import (
        compile_standard,
        install_solc_pragma,
        set_solc_version,
    )
    _SOLC_AVAILABLE = True
except Exception as _e:  # pragma: no cover
    _SOLC_AVAILABLE = False
    _SOLC_IMPORT_ERROR = str(_e)


def _ensure_solc_for_source(source_code: str) -> str:
    """
    Ensure an appropriate solc version is installed and selected for the given
    source code. Returns the resolved solc version string.
    """
    if not _SOLC_AVAILABLE:  # pragma: no cover
        raise RuntimeError(
            f"python-solcx is required to compile Solidity. Import failed: {_SOLC_IMPORT_ERROR}"
        )

    # install_solc_pragma will parse `pragma solidity` and install a matching version
    version = install_solc_pragma(source_code)
    # Normalize to plain string for downstream JSON serialization
    version_str = str(version)
    set_solc_version(version_str)
    return version_str


def _build_standard_input(source_filename: str, source_code: str) -> Dict[str, Any]:
    return {
        "language": "Solidity",
        "sources": {source_filename: {"content": source_code}},
        "settings": {
            "optimizer": {"enabled": True, "runs": 200},
            "outputSelection": {
                "*": {
                    "*": [
                        "abi",
                        "evm.bytecode.object",
                        "evm.deployedBytecode.object",
                        "metadata",
                    ]
                }
            },
        },
    }


def _select_contract_name(contracts_map: Dict[str, Dict[str, Any]], preferred: Optional[str]) -> str:
    if preferred and preferred in contracts_map:
        return preferred
    # Fallback to the first contract present
    for name in contracts_map.keys():
        return name
    raise ValueError("No contracts found in compiled output")


def compile_contract_from_string(
    solidity_source: str,
    contract_name: Optional[str] = None,
) -> Tuple[str, Dict[str, Any]]:
    """
    Compile a Solidity source string and return (resolved_contract_name, artifact_dict).

    artifact_dict contains at least: {'abi': [...], 'bytecode': '0x...'}
    """
    source_filename = "Contract.sol"
    solc_version = _ensure_solc_for_source(solidity_source)
    standard_json = _build_standard_input(source_filename, solidity_source)
    compiled = compile_standard(standard_json)

    file_out = compiled.get("contracts", {}).get(source_filename, {})
    if not file_out:
        raise RuntimeError("Compiler returned no contracts for source")

    selected_name = _select_contract_name(file_out, contract_name)
    entry = file_out.get(selected_name) or {}
    abi = entry.get("abi") or []
    bytecode = (entry.get("evm") or {}).get("bytecode", {}).get("object") or ""
    if not bytecode:
        raise RuntimeError("Compiled bytecode is empty; check the contract or pragma")

    return selected_name, {
        "abi": abi,
        "bytecode": bytecode if bytecode.startswith("0x") else ("0x" + bytecode),
        "solcVersion": solc_version,
    }


def _build_eip1559_fees(w3: Web3) -> Dict[str, int]:
    try:
        latest = w3.eth.get_block("latest")
        base_fee = latest.get("baseFeePerGas")
        if base_fee is None:
            raise ValueError("no baseFeePerGas")
        # Simple defaults: +2 gwei priority, max fee = base * 2 + priority
        priority = w3.to_wei(2, "gwei")
        max_fee = int(base_fee) * 2 + int(priority)
        return {"maxFeePerGas": max_fee, "maxPriorityFeePerGas": priority}
    except Exception:
        # Fall back to legacy gasPrice
        return {"gasPrice": w3.eth.gas_price}


def deploy_contract_from_source(
    solidity_source: str,
    rpc_url: str,
    private_key: str,
    contract_name: Optional[str] = None,
    constructor_args: Optional[List[Any]] = None,
    timeout: int = 180,
) -> Dict[str, Any]:
    """
    Deploy a Solidity contract from source code (string) and return deployment info.

    Returns dict with: address, abi, txHash, contractName, chainId, solcVersion
    """
    constructor_args = constructor_args or []

    selected_name, artifact = compile_contract_from_string(solidity_source, contract_name)

    # Use a short HTTP timeout to fail fast on bad endpoints
    w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 15}))
    try:
        # Touch chain_id to assert connectivity
        _ = w3.eth.chain_id
    except Exception as e:
        raise RuntimeError(
            f"Failed to connect to RPC at {rpc_url}: {e}. "
            f"Use a reliable endpoint (e.g., Ankr `https://api.avax-test.network/ext/bc/C/rpc` or Infura/Alchemy with API key)."
        ) from e

    # Normalize private key (allow without 0x)
    if private_key and not private_key.startswith("0x"):
        private_key = "0x" + private_key
    account = Account.from_key(private_key)
    chain_id = w3.eth.chain_id

    contract_abi = artifact["abi"]
    contract = w3.eth.contract(abi=contract_abi, bytecode=artifact["bytecode"])

    # Validate constructor arity
    expected_inputs: List[Dict[str, Any]] = []
    for item in contract_abi:
        if item.get("type") == "constructor":
            expected_inputs = item.get("inputs") or []
            break
    if len(constructor_args) != len(expected_inputs):
        expected_types = [inp.get("type", "?") for inp in expected_inputs]
        raise TypeError(
            f"Constructor requires {len(expected_inputs)} argument(s) of types {expected_types}, "
            f"but got {len(constructor_args)}. Pass values via constructor_args=[...]."
        )

    # Build transaction
    tx_params: Dict[str, Any] = {
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "chainId": chain_id,
    }
    tx_params.update(_build_eip1559_fees(w3))

    # Provide a provisional gas limit to avoid default estimate (which may fail on unfunded accounts)
    provisional_gas = 1_800_000
    tx_params["gas"] = provisional_gas

    # Pre-flight balance check (worst-case cost)
    balance = w3.eth.get_balance(account.address)
    if "maxFeePerGas" in tx_params:
        worst_cost = int(tx_params["maxFeePerGas"]) * provisional_gas
    else:
        worst_cost = int(tx_params["gasPrice"]) * provisional_gas
    if balance < worst_cost:
        needed = worst_cost - balance
        raise RuntimeError(
            f"Insufficient funds for deployment. Address {account.address} has {balance} wei, "
            f"needs at least {worst_cost} wei (short by {needed} wei). "
            f"Fund the account on the target chain (chainId {chain_id}) and retry."
        )

    txn = contract.constructor(*constructor_args).build_transaction(tx_params)

    # Add gas limit using estimation with a safety margin
    # We already set a provisional gas; optionally refine if estimation succeeds
    try:
        gas_estimate = w3.eth.estimate_gas(txn)
        txn["gas"] = max(int(gas_estimate * 1.2), provisional_gas)
    except Exception:
        # Keep provisional gas if estimation fails
        pass

    signed = Account.sign_transaction(txn, private_key)
    # web3.py exposes the raw signed tx as `raw_transaction` (snake_case)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=timeout)
    if not receipt or not receipt.contractAddress:
        raise RuntimeError("Deployment failed (no contract address in receipt)")

    return {
        "address": receipt.contractAddress,
        "abi": artifact["abi"],
        "txHash": tx_hash.hex(),
        "contractName": selected_name,
        "chainId": chain_id,
        "solcVersion": artifact["solcVersion"],
    }

source = """
pragma solidity ^0.8.20;
contract Counter {
  uint256 public count;
  constructor(uint256 initial){ count = initial; }
}
"""
