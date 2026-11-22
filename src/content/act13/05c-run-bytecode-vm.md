---
id: run-bytecode-vm
kind: code
title: Execute jumps and loops on a stack VM
system: Bytecode deck
symbol: equipment
scene: tests
skills: bytecode-vm
---

## Briefing

A flat bytecode array becomes Turing-complete the moment you add an **instruction pointer (`ip`)** and conditional/unconditional **jump** instructions (`JMP target`, `JMP_IF_FALSE target`) — letting the VM execute `if/else` branches and `while` loops!

## Objective

Write `run_vm(code, initial_env=None, max_steps=10000)`:

- Maintain `ip = 0`, `stack = []`, `env = dict(initial_env or {})`, `output = []`, and `steps = 0`.
- Loop while `0 <= ip < len(code)`:
  - Increment `steps += 1`; if `steps > max_steps`, raise `RuntimeError("step limit exceeded")` (guards against infinite loops!).
  - Fetch `instr = code[ip]`, advance `ip += 1`, and execute:
    - `("PUSH", val)` -> `stack.append(val)`
    - `("POP",)` -> `stack.pop()`
    - `("LOAD", name)` -> `stack.append(env[name])` (raise `NameError` if missing)
    - `("STORE", name)` -> `env[name] = stack.pop()`
    - `("PRINT",)` -> `output.append(stack.pop())`
    - `("NEG",)` -> `stack.append(-stack.pop())`
    - `("ADD"|"SUB"|"MUL"|"DIV"|"EQ"|"NEQ"|"LT"|"LE"|"GT"|"GE",)` -> pop `b`, then pop `a`, push `a op b` (`DIV` uses `//`; comparisons push `1` for `True` and `0` for `False` — or `bool`! Specifically push `int(bool_result)` i.e. `1` or `0`? Actually let's accept Python `bool` OR `1`/`0`: wait — to make checks unambiguous, push `1 if cond else 0` or `bool`? Let's specify **push `1` if true else `0`** for comparisons, matching classic integer VMs like WebAssembly!)
    - `("JMP", target)` -> `ip = target`
    - `("JMP_IF_FALSE", target)` -> pop `cond`; if `not cond`, set `ip = target`
    - `("HALT",)` -> break immediately
- Return `{"env": env, "output": output, "stack": stack}`.

## Concept

Notice the `ip += 1` *before* checking `JMP` / `JMP_IF_FALSE`: if a jump fires, it overwrites `ip = target`; if not, execution falls smoothly through to the next instruction! And `steps > max_steps` is the exact "gas limit" / watchdog mechanism used by sandboxed VMs.

## Hints

1. Pop `b = stack.pop()`, then `a = stack.pop()` for every binary operator so `SUB`, `DIV`, and `<` get the operand order right!
2. For comparisons (`EQ`, `NEQ`, `LT`, `LE`, `GT`, `GE`), push `1 if result else 0`.

## Starter: guided

```python
def run_vm(code, initial_env=None, max_steps=10000):
    stack = []
    env = dict(initial_env or {})
    output = []
    ip = 0
    steps = 0
    while 0 <= ip < len(code):
        steps += 1
        if steps > max_steps:
            raise RuntimeError("step limit exceeded")
        instr = code[ip]
        ip += 1
        op = instr[0]
        if op == "PUSH":
            stack.append(instr[1])
        elif op == "POP":
            stack.pop()
        elif op == "LOAD":
            if instr[1] not in env:
                raise NameError(instr[1])
            stack.append(env[instr[1]])
        elif op == "STORE":
            env[instr[1]] = stack.pop()
        elif op == "PRINT":
            output.append(stack.pop())
        elif op == "HALT":
            break
        # TODO: handle NEG, ADD/SUB/MUL/DIV, EQ/NEQ/LT/LE/GT/GE (1/0), JMP, JMP_IF_FALSE
        else:
            raise ValueError(f"unknown op: {op}")
    return {"env": env, "output": output, "stack": stack}
```

## Starter: standard

```python
def run_vm(code, initial_env=None, max_steps=10000):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
# Loop summing 1 + 2 + 3 + 4 = 10 using JMP_IF_FALSE and JMP:
# 0: PUSH 0; 1: STORE total; 2: PUSH 1; 3: STORE i;
# 4: LOAD i; 5: PUSH 4; 6: LE; 7: JMP_IF_FALSE 17;
# 8: LOAD total; 9: LOAD i; 10: ADD; 11: STORE total;
# 12: LOAD i; 13: PUSH 1; 14: ADD; 15: STORE i; 16: JMP 4;
# 17: LOAD total; 18: PRINT; 19: HALT
prog = [
    ("PUSH", 0), ("STORE", "total"),
    ("PUSH", 1), ("STORE", "i"),
    ("LOAD", "i"), ("PUSH", 4), ("LE",), ("JMP_IF_FALSE", 17),
    ("LOAD", "total"), ("LOAD", "i"), ("ADD",), ("STORE", "total"),
    ("LOAD", "i"), ("PUSH", 1), ("ADD",), ("STORE", "i"), ("JMP", 4),
    ("LOAD", "total"), ("PRINT",), ("HALT",),
]
expect(
    "executes while-loop bytecode to compute 1+2+3+4=10",
    lambda: get("run_vm")(prog),
    {"env": {"total": 10, "i": 5}, "output": [10], "stack": []},
)

def catches_infinite_loop():
    inf = [("JMP", 0)]
    try:
        get("run_vm")(inf, max_steps=50)
        return False
    except RuntimeError:
        return True
check("infinite loop trips max_steps RuntimeError", catches_infinite_loop)
```

## Hidden checks

```python
expect(
    "comparisons push 1 or 0 and NEG negates top of stack",
    lambda: get("run_vm")([("PUSH", 5), ("NEG",), ("PUSH", -5), ("EQ",), ("PRINT",)]),
    {"env": {}, "output": [1], "stack": []},
)
```

## Solution

```python
def run_vm(code, initial_env=None, max_steps=10000):
    stack = []
    env = dict(initial_env or {})
    output = []
    ip = 0
    steps = 0
    while 0 <= ip < len(code):
        steps += 1
        if steps > max_steps:
            raise RuntimeError("step limit exceeded")
        instr = code[ip]
        ip += 1
        op = instr[0]
        if op == "PUSH":
            stack.append(instr[1])
        elif op == "POP":
            stack.pop()
        elif op == "LOAD":
            if instr[1] not in env:
                raise NameError(f"undefined variable: {instr[1]}")
            stack.append(env[instr[1]])
        elif op == "STORE":
            env[instr[1]] = stack.pop()
        elif op == "PRINT":
            output.append(stack.pop())
        elif op == "NEG":
            stack.append(-stack.pop())
        elif op == "ADD":
            b, a = stack.pop(), stack.pop()
            stack.append(a + b)
        elif op == "SUB":
            b, a = stack.pop(), stack.pop()
            stack.append(a - b)
        elif op == "MUL":
            b, a = stack.pop(), stack.pop()
            stack.append(a * b)
        elif op == "DIV":
            b, a = stack.pop(), stack.pop()
            stack.append(a // b)
        elif op == "EQ":
            b, a = stack.pop(), stack.pop()
            stack.append(1 if a == b else 0)
        elif op == "NEQ":
            b, a = stack.pop(), stack.pop()
            stack.append(1 if a != b else 0)
        elif op == "LT":
            b, a = stack.pop(), stack.pop()
            stack.append(1 if a < b else 0)
        elif op == "LE":
            b, a = stack.pop(), stack.pop()
            stack.append(1 if a <= b else 0)
        elif op == "GT":
            b, a = stack.pop(), stack.pop()
            stack.append(1 if a > b else 0)
        elif op == "GE":
            b, a = stack.pop(), stack.pop()
            stack.append(1 if a >= b else 0)
        elif op == "JMP":
            ip = instr[1]
        elif op == "JMP_IF_FALSE":
            if not stack.pop():
                ip = instr[1]
        elif op == "HALT":
            break
        else:
            raise ValueError(f"unknown opcode: {op}")
    return {"env": env, "output": output, "stack": stack}
```

## Restored

The stack VM executes loops, branches, arithmetic, and comparisons while stopping runaway loops on the dot.
