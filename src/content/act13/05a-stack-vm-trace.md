---
id: stack-vm-trace
kind: predict
title: Trace a stack-based bytecode VM
system: Bytecode deck
symbol: equipment
scene: console
skills: bytecode-vm, reading-code
---

## Briefing

Python's own interpreter (CPython), the JVM, and WebAssembly don't walk AST trees at runtime — they compile ASTs into a flat array of tiny **bytecode instructions** that push and pop values on an operand **stack**!

## Objective

Trace this tiny stack-VM execution and predict **every line it prints**.

## Concept

Watch how `2 + 3 * 4` executes on a stack machine:
1. `PUSH 2` -> stack `[2]`
2. `PUSH 3` -> stack `[2, 3]`
3. `PUSH 4` -> stack `[2, 3, 4]`
4. `MUL` pops `b = 4`, then `a = 3`, pushes `a * b = 12` -> stack `[2, 12]`
5. `ADD` pops `b = 12`, then `a = 2`, pushes `a + b = 14` -> stack `[14]`

Notice operand order on non-commutative ops like `SUB`: the **second** operand (`b`) is on top of the stack, so `b = stack.pop(); a = stack.pop(); stack.append(a - b)`!

## Hints

1. First `PUSH 10`, `PUSH 3`, `SUB` -> `10 - 3 = 7`, stored in `vars["x"]`.
2. Then `LOAD x` (`7`), `PUSH 2`, `MUL` -> `14`, `PUSH 1`, `SUB` -> `13`.
3. `stack` ends with `[13]` and `vars["x"]` is `7`.

## Program

```python
code = [
    ("PUSH", 10),
    ("PUSH", 3),
    ("SUB",),
    ("STORE", "x"),
    ("LOAD", "x"),
    ("PUSH", 2),
    ("MUL",),
    ("PUSH", 1),
    ("SUB",),
]

stack = []
env = {}
for op, *arg in code:
    if op == "PUSH":
        stack.append(arg[0])
    elif op == "LOAD":
        stack.append(env[arg[0]])
    elif op == "STORE":
        env[arg[0]] = stack.pop()
    elif op == "SUB":
        b, a = stack.pop(), stack.pop()
        stack.append(a - b)
    elif op == "MUL":
        b, a = stack.pop(), stack.pop()
        stack.append(a * b)

print(env)
print(stack)
```

## Output

```text
{'x': 7}
[13]
```

## Restored

You traced a real stack-machine bytecode loop — the exact execution model inside CPython and WebAssembly.
