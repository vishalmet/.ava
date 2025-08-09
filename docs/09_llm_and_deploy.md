# 09. LLM Conversion and EVM Deploy

Ava integrates an LLM for code conversion and project scaffolding, and `solcx`/`web3.py` for EVM deployment. This chapter is step-by-step from simple conversions to real deployments.

## Prerequisites
- A Groq API key (pass as function argument or via env `GROQ_API_KEY` for `code_convert*`)
- For deploy: a funded private key on the target chain (e.g., Sepolia test ETH)

## Convert a single file
```ava
# Convert to Solidity, write beside the source
code_convert("prog.ava", "solidity", "gsk_...")
# Expected: returns a path like "prog.sol" and writes that file
```

```ava
# Convert to Rust
code_convert("prog.ava", "rust", "gsk_...")
# Expected: returns "prog.rs"
```

Tips:
- `lang` accepts aliases: `sol` for `solidity`, `rs` for `rust`
- On success, returns the output path

## Generate a full project
```ava
# Solidity Hardhat project in ./out
code_convert_project("prog.ava", "solidity", "./out", "gsk_...", "solidity-hardhat", 1)
# Expected: returns a JSON string describing files written and next steps
```

```ava
# Rust Cargo project
code_convert_project("prog.ava", "rust", "./rust_out", "gsk_...", "rust-cargo", 1)
```

What you get:
- A manifest describing files written and next steps
- In Solidity/Hardhat: contracts/, scripts/, tests/, config
- In Rust/Cargo: src/, Cargo.toml

## Deploy to EVM
```ava
# Minimal deploy (uses default Sepolia RPC if omitted)
deploy("contract.ava", "0xYOUR_PRIVATE_KEY", "gsk_...")
# Expected: a JSON string like {"address":"0x...","abi":[...],"txHash":"0x...","chainId":11155111,...}
```

```ava
# With explicit name and constructor args
deploy("token.ava", "0xyourpk", "gsk_...", "https://eth-sepolia.public.blastapi.io", "Token", ["Ava", "AVA", 18])
```

What happens under the hood:
1) Ava source is converted to Solidity via LLM
2) If a snippet (no `contract`/`library`/`interface`), it’s safely wrapped into `contract Contract { ... }`, preserving SPDX/pragma/imports
3) `solcx` compiles; ABI/bytecode extracted
4) `web3.py` deploys; receipt is awaited
5) Returns JSON: `address, abi, txHash, contractName, chainId, solcVersion`

## Troubleshooting
- Insufficient funds:
  - “Insufficient funds … needs at least X wei” — fund the deployer address on the same chain
- RPC connectivity:
  - “Failed to connect to RPC …” — use reliable endpoints (Ankr/Infura/Alchemy), check network/URL
- Constructor args mismatch:
  - “Constructor requires N argument(s) … but got M” — pass `constructor_args=[...]` in the right order and types
- Bad source code:
  - “Compiled bytecode is empty; check the contract or pragma” — ensure the wrapped code is valid Solidity

## Good practices
- Pin pragma in your Ava→Solidity output (`pragma solidity ^0.8.20;` is added if missing)
- Start with testnets (Sepolia), verify on a block explorer
- Log the returned ABI and address; you’ll use them to interact with the contract

## API alternative (server)
See `ava_api/app.py` for REST endpoints (`/convert-code`, `/convert-project`, `/convert-project-zip`, `/deploy-contract`) if you prefer HTTP over REPL built-ins.
