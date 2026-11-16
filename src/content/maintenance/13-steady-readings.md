---
id: maintenance-steady-readings
title: Count the steady readings
system: Sensor mast
symbol: instrument
scene: tests
skills: lists
reviewSkill: lists
prerequisite: find-the-jumps
---

## Briefing

A sensor that reports the same value twice in a row may be stuck. The mast wants a count of how often that happens.

## Objective

Write `steady_count(readings)`. Return how many readings are exactly equal to the reading just before them.

```python
steady_count([3, 3, 4, 4, 4, 5])  # 3
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Compare each reading with the one before it, by position.
2. The first reading has nothing before it, so start at position 1.
3. `readings[i] == readings[i - 1]` means reading `i` is steady.

## Starter

```python
```

## Checks

```python
expect("steady_count([3, 3, 4, 4, 4, 5])", lambda: get("steady_count")([3, 3, 4, 4, 4, 5]), 3)
expect("steady_count([1, 2, 3])", lambda: get("steady_count")([1, 2, 3]), 0)
```

## Hidden checks

```python
expect("steady_count([])", lambda: get("steady_count")([]), 0)
expect("steady_count([7])", lambda: get("steady_count")([7]), 0)
expect("steady_count([5, 1, 5])", lambda: get("steady_count")([5, 1, 5]), 0, "Only neighbors count. The last reading is not before the first.")
expect("steady_count([2, 2, 2, 2])", lambda: get("steady_count")([2, 2, 2, 2]), 3)
```

## Solution

```python
def steady_count(readings):
    count = 0
    for i in range(1, len(readings)):
        if readings[i] == readings[i - 1]:
            count += 1
    return count
```

## Restored

Three stuck readings flagged. The crew taps the sensor housing, and the numbers start moving again.
