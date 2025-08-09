# Ava Language Documentation

Welcome to Ava – a small, expressive language with:
- A clear, newline/semicolon–based syntax
- First-class lists and simple control flow
- Helpful built-ins for I/O, types, PoW (Proof-of-Work), and running files
- LLM-powered code conversion/project scaffolding (Solidity, Rust)
- One-command EVM deployment from Ava source

This documentation is written progressively: each chapter starts with simple examples and ramps up to more realistic programs. Every snippet is runnable in the REPL.

## Contents
- 01_basics.md: Language tour, comments, statements, errors, running code
- 02_variables.md: Variables, reassignment, naming, pitfalls
- 03_operators.md: Arithmetic, comparison, logical, precedence, gotchas
- 04_control_flow.md: if/elif/else, while, for, break/continue/return – with patterns
- 05_functions.md: Arrow/block forms, recursion, higher-order usage
- 06_lists.md: Indexing, mutation helpers, patterns (filter/map/fold by hand)
- 07_builtins.md: I/O, type checks, system tools, `ava_exec` and headers
- 08_pow.md: Manual/automatic PoW, performance and tuning
- 09_llm_and_deploy.md: Converting code, generating projects, deploying to EVM
- 10_repl.md: REPL flags, spinner, JSON/Stdout/PoW panels
- 99_reference.md: Syntax and built-ins at a glance

## Quickstart

1) Start the REPL and try:
```ava
show("Hello, Ava!")
```

2) Explore control flow:
```ava
var n = 5
if n > 3 then show("big") else show("small") end
```

3) Define a function:
```ava
fun fib(n)
  if n <= 1 then return n end
  return fib(n-1) + fib(n-2)
end
show(fib(8))
```

4) Learn by doing: open the chapters in order and paste the examples into the REPL.

## Conventions used in docs
- Comments use `#`
- Each code block is runnable; paste directly in the REPL
- When we say “prints X”, it’s produced by `show(...)`
- Errors are deliberate to teach constraints and show diagnostics

Happy hacking!
