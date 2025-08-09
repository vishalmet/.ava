# 10. REPL Usage

The REPL is the fastest way to learn Ava. It presents panels for Execution Summary, JSON (trace), PoW, Final Value, and Stdout.

## Flags
- `--no-json` – hide JSON panels for the session
- `--json` – re-enable JSON (per-line, prefix `--no-json <code>` to hide for only that run)
- `--no-spinner` – disable loading animation (also `AVA_NO_SPINNER=1`)
- `--help`/`-h` – usage and flags

## Quality-of-life
- Shortcuts without parentheses: `clear`, `clr`, `exit`, `help` become `clear()`, etc.
- When PoW panel appears, Stdout is auto scrubbed of PoW progress lines to avoid duplication
- Prompt shows `»`; with prompt_toolkit installed you get syntax coloring

## Example transcript
```text
[ava] » var x = 2
[ava] » show(x * 3)
6
# Execution Summary panel shows OK status and elapsed time
```

```text
[ava] » --no-json show("compact")
compact
```

```text
[ava] » pow_cfg(1, 14)
[ava] » show("auto pow after run")
auto pow after run
# PoW panel appears summarizing bits, nonce, iterations, rate
[ava] » pow_cfg(0, 0)
```

```text
[ava] » help("if")
# Prints a boxed help panel for 'if'
```

```text
[ava] » clr()
# Clears the terminal
```

## Panels explained
- Execution Summary: timestamp, status, elapsed, config flags
- PoW: difficulty bits, nonce, hash prefix, iterations, time, hash rate
- JSON: complete trace (lexer tokens, AST root, execution events, stdout)
- Final Value: value of the last expression
- Stdout: printed program output

Tip: leave JSON on while learning—it’s a great mental model for what the runtime is doing.
