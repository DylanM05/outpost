---
id: maintenance-shift-total
title: Read the shift meter
system: Reservoir
symbol: equipment
scene: tests
skills: loops
reviewSkill: loops
prerequisite: pump-the-reservoir
---

## Briefing

A meter sends signed changes in water storage. The shift report needs their combined effect.

## Objective

Write `shift_total(changes)`. Return the sum of all numbers in the list, including negative changes. An empty list totals 0.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Keep a running total, starting from zero.
2. Each item contributes its signed value.
3. Return only after every item has been processed.

## Starter

```python

```

## Checks

```python
cases = [(([4, -2, 7],), 9), (([3, 3],), 6)]
for args, expected in cases:
    expect(f"shift_total{args!r}", lambda: get("shift_total")(*args), expected)
```

## Hidden checks

```python
cases = [(([],), 0), (([-5, -1],), -6), (([0, 2, -2],), 0)]
for args, expected in cases:
    expect(f"shift_total{args!r}", lambda: get("shift_total")(*args), expected)
```

## Solution

```python
def shift_total(changes):
    total = 0
    for change in changes:
        total += change
    return total
```

## Restored

The shift report shows the net change in water storage, with the morning's losses and the afternoon's refill in the same total.
