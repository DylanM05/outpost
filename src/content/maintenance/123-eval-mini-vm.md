---
id: maintenance-eval-mini-vm
title: Fix operand order in a stack VM
system: Bytecode deck
symbol: equipment
scene: tests
skills: bytecode-vm
reviewSkill: bytecode-vm
prerequisite: compile-statements
---

## Briefing

The station's mini stack VM is returning `-7` instead of `7` for `10 - 3`, and `SWAP` is duplicating the top element instead of exchanging the top two. Fix the interpreter!

## Objective

Fix `eval_bytecode(code)` in the editor so it correctly executes:
- `("PUSH", value)` — push `value`
- `("ADD",)` — pop `b`, pop `a`, push `a + b`
- `("SUB",)` — pop `b`, pop `a`, push `a - b`
- `("MUL",)` — pop `b`, pop `a`, push `a * b`
- `("DUP",)` — duplicate top of stack
- `("SWAP",)` — swap the top two elements on the stack

Raise `ValueError` on stack underflow or if the stack is empty at the end; otherwise return the top value on the stack (`stack[-1]`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Remember LIFO stack order for `SUB`: the *second* operand (`b`) is popped first, and the *first* operand (`a`) is popped second, so push `a - b`.
2. For `SWAP`, check `len(stack) < 2`, then swap `stack[-1], stack[-2] = stack[-2], stack[-1]`. Also guard underflow on `ADD`, `SUB`, `MUL`, `DUP`, and an empty stack at return.

## Starter

```python
def eval_bytecode(code):
    stack = []
    for instr in code:
        op = instr[0]
        if op == "PUSH":
            stack.append(instr[1])
        elif op == "ADD":
            a = stack.pop()
            b = stack.pop()
            stack.append(a + b)
        elif op == "SUB":
            a = stack.pop()
            b = stack.pop()
            stack.append(a - b)
        elif op == "MUL":
            a = stack.pop()
            b = stack.pop()
            stack.append(a * b)
        elif op == "DUP":
            stack.append(stack[-1])
        elif op == "SWAP":
            stack[-2] = stack[-1]
        else:
            raise ValueError(f"unknown opcode: {op}")
    return stack[-1]
```

## Checks

```python
expect("SUB computes a - b in stack order", lambda: get("eval_bytecode")([("PUSH", 10), ("PUSH", 3), ("SUB",)]), 7)
expect("SWAP exchanges top two values before SUB", lambda: get("eval_bytecode")([("PUSH", 3), ("PUSH", 10), ("SWAP",), ("SUB",)]), 7)
expect("DUP and MUL compute square", lambda: get("eval_bytecode")([("PUSH", 6), ("DUP",), ("MUL",)]), 36)
```

## Hidden checks

```python
def _underflow():
    for bad in ([], [("PUSH", 1), ("SWAP",)], [("DUP",)], [("PUSH", 1), ("SUB",)]):
        try:
            get("eval_bytecode")(bad)
            return False
        except ValueError:
            pass
    return True
expect("underflow and empty result raise ValueError", _underflow, True)
```

## Solution

```python
def eval_bytecode(code):
    stack = []
    for instr in code:
        op = instr[0]
        if op == "PUSH":
            stack.append(instr[1])
        elif op in ("ADD", "SUB", "MUL"):
            if len(stack) < 2:
                raise ValueError(f"stack underflow on {op}")
            b = stack.pop()
            a = stack.pop()
            if op == "ADD":
                stack.append(a + b)
            elif op == "SUB":
                stack.append(a - b)
            else:
                stack.append(a * b)
        elif op == "DUP":
            if not stack:
                raise ValueError("stack underflow on DUP")
            stack.append(stack[-1])
        elif op == "SWAP":
            if len(stack) < 2:
                raise ValueError("stack underflow on SWAP")
            stack[-1], stack[-2] = stack[-2], stack[-1]
        else:
            raise ValueError(f"unknown opcode: {op}")
    if not stack:
        raise ValueError("empty stack at end of program")
    return stack[-1]
```

## Restored

Stack-machine subtraction, swap, and underflow guards now execute accurately.
