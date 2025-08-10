# 99. Quick Reference

## Syntax
- Comment: `# ...`
- Statement separator: newline or `;`
- Variable: `var name = expr` (use `var` for reassignment too)
- Strings: double-quoted with `\n`, `\t`
- Lists: `[e1, e2, ...]`, index with `list / index` (0-based)
- Blocks: `then ... end`

## Operators
- Arithmetic: `+ - * / ^`
- Comparison: `== != < > <= >=` → 1/0
- Logical: `and or not` (0 is false, non-zero true)
- Precedence: `^` > unary > `* /` > `+ -` > comparisons > `and` > `or`

## Control flow
```ava
if cond then ... elif cond then ... else ... end
while cond then ... end
for i = start to end step step then ... end
break, continue, return
```

## Functions
```ava
fun name(args) -> expr
fun name(args)
  ...
  return value
end
```

## Built-ins (signatures)
- I/O: `show(v)`, `print_ret(v)`, `input()`, `input_int()`, `clear()`, `clr()`, `help([topic])`, `exit([code])`
- Types: `is_num(v)`, `is_str(v)`, `is_list(v)`, `is_fun(v)`
- Lists: `add(list,v)`, `pop(list,i)`, `extend(listA,listB)`, `len(list)`
- System: `ava_exec(path)` (file must start with header dict; requires `pk`)
- PoW: `pow_mine(data,bits)`, `pow_cfg(enable,bits)`, `pow_max_nonce(n)`
- LLM: `code_convert(path,lang,[api_key])`, `code_convert_project(path,lang,root,[api_key],[preset],[overwrite])`
- Web3: `deploy(path,private_key,api_key,[rpc_url],[contract_name],[constructor_args])`

## Mini examples
```ava
var xs = [1,2,3]
add(xs, 4)
show(xs / 2)         # 3
```

```ava
fun inc(x) -> x + 1
show(inc(10))         # 11
```

```ava
for i = 0 to 3 then show(i) end
```

```ava
# Deploy (fund account first)
# deploy("prog.ava", "0xyourpk", "gsk_...")
```
