# 02. Variables

Variables are created and reassigned with the `var` keyword. There is no bare `x = ...`. Re-declaration overwrites the prior value.

## Declaring and reassigning
```ava
var x = 10
show(x)            # Expected: 10
var x = x + 5
show(x)            # Expected: 15
```

```ava
# Works with strings
var msg = "hi"
var msg = msg + " there"
show(msg)          # Expected: hi there
```

```ava
# Works with lists
var xs = [1, 2]
var xs = xs        # no copy; xs still refers to same list value
add(xs, 3)
show(xs)           # Expected: [1,2,3]
```

## Naming rules and style
- Start with a letter or underscore, then letters/digits/underscore
- Prefer descriptive names: `totalCount` over `tc`
- Re-assign using `var name = ...` again

```ava
var total = 0
var total = total + 3
show(total)        # Expected: 3
```

## Pitfalls and errors
```ava
# ERROR: bare assignment is not supported – always use 'var'
x = 42
```

```ava
# ERROR: referencing before declaration
show(y)
var y = 1
```

## Building up a small program
```ava
# Sum of first N integers
var N = 5
var sum = 0
for i = 1 to N+1 then
  var sum = sum + i
end
show(sum)          # Expected: 15
```

```ava
# Track a running message
var msg = ""
for i = 0 to 3 then
  var msg = msg + "#"
end
show(msg)          # Expected: ###
```
