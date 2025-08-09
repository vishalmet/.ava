# 03. Operators

- Arithmetic: `+ - * / ^` (division yields a Number; treat as real division)
- Comparison: `== != < > <= >=` (returns 1 for true, 0 for false)
- Logical: `and or not` (operates on numeric truthiness; 0 is false, non-zero is true)
- Unary: `-x`, `+x`
- Precedence (high→low): `^`, unary, `* /`, `+ -`, comparisons, `and`, `or`

## Arithmetic
```ava
show(2 + 3 * 4)        # Expected: 14
show((2 + 3) * 4)      # Expected: 20
show(7 / 2)            # Expected: 3.5
show(2 ^ 5)            # Expected: 32
```

## Comparison
```ava
show(5 == 5)           # Expected: 1
show(5 != 3)           # Expected: 1
show(2 < 1)            # Expected: 0
show(3 >= 3)           # Expected: 1
```

## Logical and truthiness
```ava
show(not 0)            # Expected: 1 (true)
show(1 and 0)          # Expected: 0
show(1 or 0)           # Expected: 1
```

```ava
# Combine comparison and logic
var a = 5
var b = 2
show((a > b) and (b > 10))  # Expected: 0
```

## Precedence pitfalls
```ava
# not binds before and/or
a = 0; b = 1
var res = not a and b
show(res)              # Expected: 1
```

```ava
# Parentheses help clarity
show( (not a) and b )  # Expected: 1
```

## Mini challenges
1) Compute the area of a circle `pi*r^2` for r=3.
2) Check if a number is between 10 and 20 inclusive (print 1 or 0).
3) Compute `(3+4)^2 / (1+1)`.

