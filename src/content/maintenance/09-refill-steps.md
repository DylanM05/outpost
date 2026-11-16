---
id: maintenance-refill-steps
title: Estimate the refill
system: Reservoir
symbol: equipment
scene: tests
skills: loops
reviewSkill: loops
prerequisite: pump-the-reservoir
---

## Briefing

The reservoir is refilled in fixed batches. The operator needs to know how many batches will reach the target.

## Objective

Write `refill_steps(current, target, batch)`. Return the fewest batches needed to reach or exceed target. Current and target are nonnegative integers; batch is a positive integer. If current already meets target, return 0.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Track how much water you have and how many batches you added.
2. Keep adding while the amount is below target.
3. Make sure the amount increases on every iteration so the loop can stop.

## Starter

```python

```

## Checks

```python
cases = [((2, 10, 3), 3), ((5, 5, 2), 0)]
for args, expected in cases:
    expect(f"refill_steps{args!r}", lambda: get("refill_steps")(*args), expected)
```

## Hidden checks

```python
cases = [((0, 1, 5), 1), ((10, 2, 3), 0), ((0, 12, 4), 3)]
for args, expected in cases:
    expect(f"refill_steps{args!r}", lambda: get("refill_steps")(*args), expected)
```

## Solution

```python
def refill_steps(current, target, batch):
    steps = 0
    while current < target:
        current += batch
        steps += 1
    return steps
```

## Restored

The operator orders exactly enough batches to fill the reservoir, without wasting a single run of the pump.
