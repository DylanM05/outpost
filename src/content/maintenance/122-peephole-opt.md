---
id: maintenance-peephole-opt
title: Strip redundant bytecode with peephole rules
system: Bytecode deck
symbol: equipment
scene: tests
skills: bytecode-vm
reviewSkill: bytecode-vm
prerequisite: compile-statements
---

## Briefing

Simple compilers emit redundant instruction pairs like `PUSH x` followed immediately by `POP`, or double negation `NEG; NEG`. A peephole pass collapses them cleanly — including cascading pairs exposed after an earlier cancellation.

## Objective

Write `peephole_optimize(code)` where `code` is a list of instruction tuples.

Repeatedly eliminate these adjacent pairs until no more reductions apply:
1. `("PUSH", x)` followed immediately by `("POP",)`
2. `("NEG",)` followed immediately by `("NEG",)`

Return the optimized list of instructions (without mutating the input list).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Build the output with a stack `out = []`: for each instruction `ins` in `code`, inspect `out[-1]` before appending!
2. If `ins == ("POP",)` and `out` ends with `("PUSH", ...)`, pop `out[-1]` instead of appending `ins`. Do the same when `ins == ("NEG",)` and `out` ends with `("NEG",)`. This automatically handles cascading patterns like `PUSH 5; NEG; NEG; POP`!

## Starter

```python
```

## Checks

```python
expect("eliminates PUSH followed by POP", lambda: get("peephole_optimize")([("PUSH", 1), ("POP",), ("PUSH", 2)]), [("PUSH", 2)])
expect("eliminates double NEG", lambda: get("peephole_optimize")([("LOAD", "x"), ("NEG",), ("NEG",)]), [("LOAD", "x")])
expect("cascades double NEG exposing PUSH/POP", lambda: get("peephole_optimize")([("PUSH", 9), ("NEG",), ("NEG",), ("POP",)]), [])
```

## Hidden checks

```python
expect("triple NEG reduces to single NEG", lambda: get("peephole_optimize")([("LOAD", "a"), ("NEG",), ("NEG",), ("NEG",)]), [("LOAD", "a"), ("NEG",)])
expect("preserves LOAD followed by POP", lambda: get("peephole_optimize")([("LOAD", "a"), ("POP",)]), [("LOAD", "a"), ("POP",)])
```

## Solution

```python
def peephole_optimize(code):
    out = []
    for instr in code:
        if instr == ("POP",) and out and out[-1][0] == "PUSH":
            out.pop()
        elif instr == ("NEG",) and out and out[-1] == ("NEG",):
            out.pop()
        else:
            out.append(instr)
    return out
```

## Restored

Redundant stack pushes and double negations vanish in a single linear peephole pass.
