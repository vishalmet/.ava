# 05. Functions

Functions can be concise (arrow) or block-based (with explicit `return`).

## Arrow form
```ava
fun inc(x) -> x + 1
show(inc(41))
# Expected: 42
```

```ava
# Compose two arithmetic steps
fun double(x) -> x * 2
fun shift(x)  -> x + 3
show(shift(double(5)))
# Expected: 13
```

## Block form
```ava
fun fact(n)
  if n <= 1 then
    return 1
  end
  return n * fact(n - 1)
end
show(fact(5))
# Expected: 120
```

```ava
# Max of list (imperative style)
fun max_of(xs)
  if len(xs) == 0 then return null end
  var m = xs / 0
  for i = 1 to len(xs) then
    var v = xs / i
    if v > m then var m = v end
  end
  return m
end
show(max_of([3,9,2,7]))
# Expected: 9
```

## Higher-order usage
```ava
fun apply_twice(f, x) -> f(f(x))
fun next(x) -> x + 1
show(apply_twice(next, 10))
# Expected: 12
```

```ava
# Map over a list by doubling values
fun map_double(xs)
  var out = []
  for i = 0 to len(xs) then
    add(out, (xs / i) * 2)
  end
  return out
end
show(map_double([1,2,3]))
# Expected: [2,4,6]
```

```ava
# Build a "map" using a passed function
fun map_with(xs, f)
  var out = []
  for i = 0 to len(xs) then
    add(out, f(xs / i))
  end
  return out
end
fun square(x) -> x * x
show(map_with([2,3,4], square))
# Expected: [4,9,16]
```

## Tips
- Use arrow form for one-liners; block form for complex logic
- Always `return` in block form (last expression is not implicitly returned)
- Prefer descriptive argument names
