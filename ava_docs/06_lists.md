# 06. Lists

Lists are ordered collections. Use `[ ... ]` to create them. Index with `list / index` (0-based). Mutate with helpers.

## Basics
```ava
var xs = [10, 20, 30]
show(xs / 0)      # Expected: 10
show(xs / 2)      # Expected: 30
```

```ava
# Append and length
var xs = [1,2]
add(xs, 3)
show(xs)          # Expected: [1,2,3]
show(len(xs))     # Expected: 3
```

## Combining lists
```ava
var a = [1]
var b = [2,3]
extend(a, b)
show(a)           # Expected: [1,2,3]
```

## Nested lists
```ava
var m = [[1,2],[3,4]]
show(m / 0)         # Expected: [1,2]
show((m / 1) / 0)   # Expected: 3
```

## Building new lists
```ava
# Squares 0..4
var out = []
for i = 0 to 5 then
  add(out, i * i)
end
show(out)         # Expected: [0,1,4,9,16]
```

## Reverse a list (loop)
```ava
var xs = [1,2,3,4]
var ys = []
for i = len(xs)-1 to -1 step -1 then
  add(ys, xs / i)
end
show(ys)          # Expected: [4,3,2,1]
```

## Bounds and errors
```ava
var xs = [1]
# This will error (index out of bounds)
pop(xs, 5)
```

## Mini exercises
1) Build `[2,4,6,8]` programmatically.
2) Merge two lists alternately into a third list.
3) Reverse a list using a for loop (no built-in).
