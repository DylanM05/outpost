---
id: maintenance-reserve
title: Split the reserve
system: Battery bank
symbol: equipment
scene: tests
skills: functions
reviewSkill: functions
prerequisite: restore-power
---

## Briefing

The backup cells now share their reserve with a visiting crew. The controller needs a reusable calculation.

## Objective

Write `reserve(total, crews)`. Return the whole number of cells each crew receives after 4 cells are kept at the outpost. Inputs are integers, total is at least 4, and crews is positive. Do not print the result.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Work out how many cells remain after keeping four.
2. Use whole-number division for the equal shares.
3. Return the calculation from a function with both parameters.

## Starter

```python

```

## Checks

```python
cases = [((16, 3), 4), ((11, 2), 3)]
for args, expected in cases:
    expect(f"reserve{args!r}", lambda: get("reserve")(*args), expected)
```

## Hidden checks

```python
cases = [((4, 1), 0), ((20, 4), 4), ((100, 3), 32)]
for args, expected in cases:
    expect(f"reserve{args!r}", lambda: get("reserve")(*args), expected)
```

## Solution

```python
def reserve(total, crews):
    return (total - 4) // crews
```

## Restored

The visiting crew gets its share of the reserve cells, and four stay behind at the outpost for emergencies.
