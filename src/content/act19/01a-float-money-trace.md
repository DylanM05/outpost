---
id: float-money-trace
kind: predict
title: Why financial systems avoid binary floats
system: Mint bench
symbol: instrument
scene: console
skills: financial-ledgers, reading-code
---

## Briefing

Binary floating-point numbers cannot represent `0.1` or `0.2` exactly — summing ten dimes in `float` drifts off by a tiny fraction and breaks exact equality checks! Real ledgers store integer **minor units** (cents) instead.

## Objective

Trace the float vs. integer-cent comparison below and predict **every line it prints**.

## Concept

In IEEE 754 binary64:
- `0.1 + 0.2 == 0.3` evaluates to `False`!
- Adding `0.1` ten times in a loop accumulates binary rounding error (`0.9999999999999999`), so `total == 1.0` is `False`, whereas integer cents `10 + 20 + 75 == 105` is always exact (`True`)!

## Hints

1. Check all three boolean comparisons: `0.1 + 0.2 == 0.3` (`False`), adding `0.1` ten times in a float accumulator (`total == 1.0` -> `False`), and integer cents `cents == 105` (`True`).
2. `f"${cents // 100}.{cents % 100:02d}"` formats `105` cents as `"$1.05"`.

## Program

```python
print(0.1 + 0.2 == 0.3)
total = 0.0
for _ in range(10):
    total += 0.1
print(total == 1.0)
cents = 10 + 20 + 75
print(cents == 105)
print(f"${cents // 100}.{cents % 100:02d}")
```

## Output

```text
False
False
True
$1.05
```

## Restored

You see firsthand why production payment ledgers compute exclusively in integer minor units.
