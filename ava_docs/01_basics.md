# 01. Basics

Ava is minimal and predictable. This chapter teaches comments, statements, printing, expressions, and how to run code and understand errors.

## Comments and whitespace
- A comment starts with `#` and goes to the end of the line
- Blank lines are ignored
- Indentation is free-form (no syntactic meaning), but we recommend two spaces

```ava
# Single-line comment
show("visible")  # trailing is fine too
# Expected:
# visible

# Blank lines are allowed

show("also visible")
# Expected:
# also visible
```

## Statements and separators
- A statement is typically one expression or command per line
- You can also separate statements with `;` on the same line

```ava
show("A")
show("B")
# Expected:
# A
# B
```

```ava
show("A"); show("B"); show("C")
# Expected (order preserved):
# A
# B
# C
```

## Printing and basic expressions
```ava
show(1 + 2 * 3)        # 7
show((1 + 2) * 3)      # 9
show("hi" + " there") # hi there
```

```ava
# Numbers: ints and floats
show(3)                # 3
show(3.14)             # 3.14
```

## Typical errors (and how to read them)
Ava surfaces precise error messages with a caret showing where the problem occurred.

```ava
# ERROR: invalid token (do not paste the @)
@oops
```

```ava
# ERROR: unmatched parenthesis
show((1 + 2)
```

Learn to lean on the error text; it includes file name, line/column, and a code excerpt.

## Running code in files
Use `ava_exec(path)` to run another file inside the REPL session. The target file must start with a header comment containing a dict (see 07_builtins and 09_llm_and_deploy for details). Minimal body example:

```text
# {"pk": "0xYOUR_PRIVATE_KEY"}
show("from file")
```

```ava
ava_exec("examples/hello.ava")
# Expected:
# from file
```

## A combined example
```ava
# Simple score tracker
var score = 0
show("start: " + print_ret(score))
var score = score + 10
show("after bonus: " + print_ret(score))
if score > 5 then
  show("passed")
else
  show("retry")
end
# Expected:
# start: 0
# after bonus: 10
# passed
```

## Practice
1) Print your name and favorite number.
2) Compute `((7+5)/4)^2`.
3) Concatenate two strings and print the length (strings are printed directly; `len` is for lists).

