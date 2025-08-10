# 11. Script Headers (Required first line for ava_exec)

When running a file via `ava_exec("path/to/file.ava")`, the target file must begin with a header line. This header is a single-line JSON/Python dict placed as the first non-empty line. It provides required credentials and optional flags that control REPL behavior.

## Why a header?
- Security gate for file execution (requires `pk`)
- Optional toggles such as automatic PoW and JSON panel visibility
- A consistent place to pass metadata without changing language syntax

## Format
- First non-empty line must be a comment containing a dict
- Strict JSON is preferred; Python literal is accepted as fallback

### Example A (strict JSON, minimal)
```text
# {"pk": "0xABCDEF0123456789"}
show("Header OK")
```
Run:
```ava
ava_exec("examples/a_minimal.ava")
```
Expected:
- Stdout: `Header OK`
- JSON panel visible (unless disabled by flags)

### Example B (Python literal, with toggles)
```text
# {'pk': '0xABCDEF0123456789', 'pow_always': True, 'pow_bits': 14, 'show_json': True}
show("Auto PoW demo")
```
Run:
```ava
ava_exec("examples/b_literal_pow.ava")
```
Expected:
- Stdout: `Auto PoW demo`
- PoW panel appears (bits=14)
- JSON panel visible

### Example C (strict JSON, different toggles)
```text
# {"pk":"0xABCDEF0123456789","pow_always":false,"pow_bits":20,"show_json":false}
show("No auto PoW; hide JSON")
```
Run:
```ava
ava_exec("examples/c_json_toggles.ava")
```
Expected:
- Stdout: `No auto PoW; hide JSON`
- No PoW (pow_always=false)
- JSON panel hidden for this run (unless CLI forces hide already)

### Example D (normalized fallback: single quotes + trailing comma)
```text
# {'pk': '0xABCDEF0123456789', 'pow_always': False, 'pow_bits': 16,}
show("Normalized header parsed")
```
Run:
```ava
ava_exec("examples/d_normalized.ava")
```
Expected:
- Stdout: `Normalized header parsed`
- Parser normalizes booleans/trailing comma and succeeds

### Example E (extra, ignored fields)
```text
# {"pk":"0xABCDEF0123456789","env":"test","notes":"ok","pow_always":true,"pow_bits":12}
show("Extras are ignored safely")
```
Run:
```ava
ava_exec("examples/e_extra_fields.ava")
```
Expected:
- Stdout: `Extras are ignored safely`
- PoW panel appears (bits=12)

### Example F (error: missing `pk`)
```text
# {"pow_always": true, "pow_bits": 16}
show("This will not run")
```
Run:
```ava
ava_exec("examples/f_missing_pk.ava")
```
Expected:
- Error panel: `Missing required 'pk' in header`
- Program body is not executed

## Parsing order
1) Try JSON
2) If JSON fails, try Python literal (`ast.literal_eval`)
3) If that fails, attempt a normalized literal (converting `true/false/null` and removing trailing commas)

If parsing still fails or `pk` is missing, `ava_exec(...)` aborts with an error.

## Required fields
- `pk` (string): Private key for Web3 operations and security gating. Must be present (e.g., `"0x..."`).

## Optional fields
- `pow_always` (bool): Enable automatic Proof-of-Work after each execution within the run. Default: false.
- `pow_bits` (number): Difficulty (leading zero bits) for PoW when `pow_always` is enabled.
- `show_json` (bool): REPL hint to show/hide JSON panel for this run (the `--no-json` CLI flag still overrides to hide).

Other keys are ignored safely.

## Security tips
- Keep `pk` private. Do not commit headers with real keys to version control
- Prefer using test keys on testnets while developing
- Consider externalizing secrets for production (e.g., template headers + secure inject)

## Reference checklist
- First non-empty line starts with `#` and contains a dict
- Must include: `pk`
- Optional: `pow_always`, `pow_bits`, `show_json`
- Valid JSON strongly recommended
- Test quickly by running `ava_exec("path.ava")` in the REPL
