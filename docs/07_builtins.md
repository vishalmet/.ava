# 07. Built-ins

This is a practical guide to Ava’s built-in functions with runnable examples.

## I/O and system
- `show(value)` → prints to stdout
- `print_ret(value)` → returns string representation without printing
- `input()` → reads a line (interactive) — alias: `get()`
- `input_int()` → reads an int (re-prompts on invalid input) — alias: `get_int()`
- `clear()` / `clr()` → clears terminal
- `help([topic])` → shows help for keywords/built-ins; try `help("if")`
- `exit([code])` → exits REPL
- `pyexe(code_string)` → prints and executes a Python string (utility for quick experiments)

```ava
show("hello")                 # Expected: hello
var s = print_ret([1,2,3])
show(s)                        # Expected: [1, 2, 3]
```

```ava
# Aliases for input (interactive; shown for completeness)
a = input()        # same as get()
b = input_int()    # same as get_int()
```

```ava
# Execute a Python one-liner (use with care)
pyexe("print('from python')")
# Expected: from python
```

### Advanced: Launch a Python app (Ursina voxel demo)
Requirements in your Python environment (outside Ava):
- Install Ursina: `pip install ursina`

Notes:
- `app.run()` opens a window and blocks until you close it
- After closing, the REPL resumes and prints the final `show(...)`

```ava
pyexe("""


from ursina import *
from ursina import Button
from ursina.prefabs.first_person_controller import FirstPersonController

app = Ursina()

# Define a function to create a voxel
def create_voxel(position=(0, 0, 0)):
    from ursina import Button
    from ursina import scene
    from ursina import color
    import random
    return Button(
        parent=scene,
        position=position,
        model='cube',
        origin_y=0.5,
        texture='white_cube',
        color=color.hsv(0, 0, random.uniform(0.9, 1.0)),
        highlight_color=color.lime,
    )

# Create voxels in a grid pattern
for z in range(8):
    for x in range(8):
        voxel = create_voxel(position=(x, 0, z))

# Define the input function to handle mouse clicks
def input(key):
    if key == 'left mouse down':
        hit_info = raycast(camera.world_position, camera.forward, distance=5)
        if hit_info.hit:
            create_voxel(position=hit_info.entity.position + hit_info.normal)
    if key == 'right mouse down' and mouse.hovered_entity:
        destroy(mouse.hovered_entity)

player = FirstPersonController()

app.run()


""")

show("runned...!")
# Expected:
# (Ursina window appears; interact; close window)
# runned...!
```

## Type checks
- `is_num(x)`, `is_str(x)`, `is_list(x)`, `is_fun(x)` → 1 if true else 0

```ava
show(is_num(3.14))            # Expected: 1
show(is_str("hi"))           # Expected: 1
show(is_list([1]))            # Expected: 1
```

## Lists
- `add(list, value)` – append in place
- `pop(list, index)` – remove and return element at index
- `extend(listA, listB)` – append elements of B into A
- `len(list)` – element count

```ava
var xs = [1]
add(xs, 2)
show(pop(xs, 0))              # Expected: 1
show(xs)                      # Expected: [2]
```

## Running files: `ava_exec(path)`
The target file must start with a header line (first non-empty line) that is a JSON/Python dict. The `pk` (private key) entry is required for security gating and Web3-enabled flows:

```
# {"pk": "0xYOUR_PRIVATE_KEY", "pow_always": true, "pow_bits": 18}
show("from file")
```

```ava
ava_exec("examples/demo.ava")
# Expected: from file
```

Header parsing is robust: strict JSON is attempted first, then Python literal (`ast.literal_eval`) with a normalization fallback (e.g., single quotes, trailing commas). If `pk` is missing, execution fails early (error is shown in the REPL Error panel).

## Proof-of-Work (PoW)
- `pow_mine(data, bits)` → `[nonce, hash, iterations, elapsed]`
- `pow_cfg(enable, bits)` → enable/disable automatic PoW after each command
- `pow_max_nonce(n)` → cap search space

See 08_pow.md for deep dive.

## LLM and Deploy
- `code_convert(path, lang, [api_key])` – convert file to Solidity/Rust and write beside source
- `code_convert_project(path, lang, project_root, [api_key], [preset], [overwrite])` – scaffold full project
- `deploy(path, private_key, api_key, [rpc_url], [contract_name], [constructor_args])` – Ava→Solidity→compile→deploy; returns JSON

See 09_llm_and_deploy.md for full workflows, API keys, presets, and deployment tips.
