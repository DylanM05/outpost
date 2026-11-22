---
id: maintenance-stack-depth
title: Compute peak bytecode stack depth
system: Bytecode deck
symbol: equipment
scene: tests
skills: bytecode-vm
reviewSkill: bytecode-vm
prerequisite: compile-statements
---

## Briefing

Before running a linear bytecode block, a verifier computes its peak operand-stack depth so the runtime can pre-allocate an exact frame — and reject any block that would underflow the stack.

## Objective

Write `max_stack_depth(code)` where `code` is a list of instruction tuples with the following stack effects:
- `("PUSH", val)`, `("LOAD", name)`, `("DUP",)` -> net `+1` (note: `DUP` also requires at least `1` item on the stack beforehand!)
- `("ADD",)`, `("SUB",)`, `("MUL",)`, `("DIV",)` -> pop 2, push 1 (requires at least `2` items beforehand, net `-1`)
- `("POP",)`, `("STORE", name)` -> pop 1 (requires at least `1` item beforehand, net `-1`)
- `("NEG",)` -> pop 1, push 1 (requires at least `1` item beforehand, net `0`)

Start at `depth = 0`, simulate each instruction in order, raise `ValueError` if any instruction underflows the stack (doesn't have enough inputs before executing), and return the maximum stack depth reached.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Model each opcode as `(pops, pushes)`: for example `DUP` is `(1, 2)`, `ADD` is `(2, 1)`, `NEG` is `(1, 1)`, `PUSH` is `(0, 1)`, `POP` is `(1, 0)`.
2. For each instruction: check `if depth < pops: raise ValueError(...)`, then update `depth = depth - pops + pushes` and `peak = max(peak, depth)`.

## Starter

```python
```

## Checks

```python
expect("computes peak depth for arithmetic sequence", lambda: get("max_stack_depth")([("PUSH", 1), ("PUSH", 2), ("PUSH", 3), ("MUL",), ("ADD",)]), 3)
expect("empty bytecode has peak depth 0", lambda: get("max_stack_depth")([]), 0)
def _underflow():
    try:
        get("max_stack_depth")([("PUSH", 1), ("ADD",)])
        return False
    except ValueError:
        return True
expect("detects stack underflow on binary op", _underflow, True)
```

## Hidden checks

```python
def _dup_empty():
    try:
        get("max_stack_depth")([("DUP",)])
        return False
    except ValueError:
        return True
expect("DUP on empty stack raises ValueError", _dup_empty, True)
expect("LOAD DUP NEG STORE reaches depth 2", lambda: get("max_stack_depth")([("LOAD", "x"), ("DUP",), ("NEG",), ("STORE", "y"), ("POP",)]), 2)
```

## Solution

```python
STACK_EFFECTS = {
    "PUSH": (0, 1),
    "LOAD": (0, 1),
    "DUP": (1, 2),
    "ADD": (2, 1),
    "SUB": (2, 1),
    "MUL": (2, 1),
    "DIV": (2, 1),
    "POP": (1, 0),
    "STORE": (1, 0),
    "NEG": (1, 1),
}


def max_stack_depth(code):
    depth = 0
    peak = 0
    for instr in code:
        op = instr[0]
        if op not in STACK_EFFECTS:
            raise ValueError(f"unknown opcode: {op}")
        pops, pushes = STACK_EFFECTS[op]
        if depth < pops:
            raise ValueError(f"stack underflow on {op}")
        depth = depth - pops + pushes
        if depth > peak:
            peak = depth
    return peak
```

## Restored

Bytecode blocks are verified for stack safety and exact frame sizing before execution.
