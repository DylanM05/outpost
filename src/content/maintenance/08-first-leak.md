---
id: maintenance-first-leak
title: Locate the leak
system: Reservoir
symbol: equipment
scene: tests
skills: loops
reviewSkill: loops
prerequisite: pump-the-reservoir
---

## Briefing

A line of pressure sensors reports in order. The crew needs the first failing sensor, not the last.

## Objective

Write `first_leak(readings, minimum)`. Return the zero-based index of the first reading strictly below minimum. Return -1 if none is below. Readings is a list of numbers.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Process the readings in their original order.
2. You need the position of the reading, not its value.
3. Return as soon as a reading is too low; return -1 after the loop if none was found.

## Starter

```python

```

## Checks

```python
cases = [(([8, 3, 2], 5), 1), (([7, 8], 5), -1)]
for args, expected in cases:
    expect(f"first_leak{args!r}", lambda: get("first_leak")(*args), expected)
```

## Hidden checks

```python
cases = [(([], 5), -1), (([1, 9], 5), 0), (([5, 5, 4], 5), 2)]
for args, expected in cases:
    expect(f"first_leak{args!r}", lambda: get("first_leak")(*args), expected)
```

## Solution

```python
def first_leak(readings, minimum):
    for index in range(len(readings)):
        if readings[index] < minimum:
            return index
    return -1
```

## Restored

The crew walks straight to the first failing sensor and finds the leak where it starts.
