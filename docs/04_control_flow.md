# 04. Control Flow

## if / elif / else
```ava
var x = 5
if x > 3 then
  show("gt")
elif x == 3 then
  show("eq")
else
  show("lt")
end
# Expected: gt
```

```ava
# Nested
var n = 7
if n % 2 == 0 then
  show("even")
else
  if n % 3 == 0 then show("div by 3") else show("odd") end
end
# Expected: odd
```

## while
```ava
var i = 0
while i < 3 then
  show(i)
  var i = i + 1
end
# Expected:
# 0
# 1
# 2
```

```ava
# Countdown
var t = 3
while t > 0 then
  show(t)
  var t = t - 1
end
show("Go!")
# Expected:
# 3
# 2
# 1
# Go!
```

## for
- Syntax: `for i = START to END step STEP then ... end`
- `step` is optional; when omitted, loop increments by 1 until `i < END`

```ava
for i = 0 to 5 then
  show(i)       # 0..4
end
# Expected: 0 1 2 3 4 (one per line)
```

```ava
for i = 5 to 0 step -2 then
  show(i)
end
# Expected: 5 3 1
```

## break / continue / return
```ava
var i = 0
while i < 5 then
  var i = i + 1
  if i == 3 then continue end
  if i == 4 then break end
  show(i)
end
# Expected: 1 2
```

```ava
# Search first element > 10
fun first_gt(xs)
  for i = 0 to len(xs) then
    var v = xs / i
    if v > 10 then return v end
  end
  return null
end
show(first_gt([2,9,11,4]))
# Expected: 11
```

## Patterns to know
- Accumulators:
```ava
var sum = 0
for i = 1 to 6 then
  var sum = sum + i
end
show(sum)
# Expected: 21
```

- Filter:
```ava
var xs = [1,5,7,2]
var ys = []
for i = 0 to len(xs) then
  var v = xs / i
  if v > 3 then add(ys, v) end
end
show(ys)
# Expected: [5,7]
```
