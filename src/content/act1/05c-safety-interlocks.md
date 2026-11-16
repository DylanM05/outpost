---
id: safety-interlocks
title: Safety interlocks
system: Power router
symbol: controller
scene: tests
skills: conditionals
---

## Briefing

The router powers the airlock, and the airlock has rules. The outer door may only open when it's safe, unless a supervisor overrides it. That means several conditions have to be checked together.

## Objective

Write `can_open(pressure_ok, crew_inside, override)`. Each parameter is `True` or `False`. Return `True` when:

- the pressure is OK **and** nobody is inside the airlock, **or**
- a supervisor override is active.

Otherwise, return `False`.

## Concept

`True` and `False` are **booleans**. Comparisons produce them, and you can combine them:

| Expression | True when |
|---|---|
| `a and b` | both are true |
| `a or b` | at least one is true |
| `not a` | `a` is false |

```python
if fuel_ok and not storm:
    print("Launch")
```

A condition is already `True` or `False`, so you can return it directly instead of writing an `if`:

```python
def is_freezing(temp):
    return temp <= 0
```

When you mix `and` with `or`, use parentheses to make the grouping clear: `(a and b) or c`.

## Hints

1. "Nobody is inside" is `not crew_inside`.
2. The safe case is `pressure_ok and not crew_inside`.
3. Add the override: `return (pressure_ok and not crew_inside) or override`.

## Starter: guided

```python
def can_open(pressure_ok, crew_inside, override):
    # Safe means the pressure is OK and nobody is inside.
    safe = pressure_ok
    # Open if it's safe, or if a supervisor overrides.
    return safe


print(can_open(True, False, False))  # should be True
print(can_open(True, True, False))   # should be False
```

## Starter: standard

```python
def can_open(pressure_ok, crew_inside, override):
    # Return True or False.
    return False
```

## Starter: challenge

```python
```

## Checks

```python
cases = [
    ((True, False, False), True),
    ((True, True, False), False),
    ((False, True, True), True),
]
for args, expected in cases:
    expect(f"can_open{args}", lambda: get("can_open")(*args), expected)
```

## Hidden checks

```python
cases = [
    ((False, False, False), False),
    ((False, True, False), False),
    ((False, False, True), True),
    ((True, True, True), True),
    ((True, False, True), True),
]
for args, expected in cases:
    expect(f"can_open{args}", lambda: get("can_open")(*args), expected)
```

## Solution

```python
def can_open(pressure_ok, crew_inside, override):
    return (pressure_ok and not crew_inside) or override
```

## Restored

The airlock's outer door follows the rules. A supervisor can still override it in an emergency, and the log records every time they do.
