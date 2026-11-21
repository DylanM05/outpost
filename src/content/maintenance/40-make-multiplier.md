---
id: maintenance-make-multiplier
title: Scale factory
system: Memo desk
symbol: instrument
scene: tests
skills: functional
reviewSkill: functional
prerequisite: cache-the-readings
---

## Briefing

Build a closure factory that creates independent unit-conversion functions (like km-to-miles or Celsius-to-Kelvin shifts) on demand.

## Objective

Write `make_linear(scale, offset=0)`. It returns a function `f(x)` that computes `x * scale + offset`. Separate calls to `make_linear` must return independent functions.

```python
c_to_f = make_linear(1.8, 32)
c_to_f(0)    # 32.0
c_to_f(100)  # 212.0
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Define an inner function `def convert(x): return x * scale + offset` and return `convert` (without calling it).

## Starter

```python
```

## Checks

```python
c_to_f = get("make_linear")(1.8, 32)
double = get("make_linear")(2)
expect("c_to_f(0)", lambda: c_to_f(0), 32.0)
expect("c_to_f(100)", lambda: c_to_f(100), 212.0)
expect("double(7) stays independent", lambda: double(7), 14)
```

## Hidden checks

```python
neg = get("make_linear")(-1, 10)
expect("neg(4)", lambda: neg(4), 6)
expect("c_to_f still remembers 1.8 and 32", lambda: c_to_f(20), 68.0)
```

## Solution

```python
def make_linear(scale, offset=0):
    def convert(x):
        return x * scale + offset
    return convert
```

## Restored

Every gauge gets its own lightweight conversion closure in one line.
