---
id: recent-average
title: Recent average
system: Sensor mast
symbol: instrument
scene: tests
skills: lists
---

## Briefing

The mast keeps every reading it has ever taken, but the night shift only cares about the last few. A slow rise hides in a long average, so the shift report should show the average of the most recent readings instead.

## Objective

Write `recent_average(readings, n)`. Return the average of the last `n` readings. If there are fewer than `n` readings, average all of them. `readings` always has at least one reading, and `n` is at least 1.

```python
recent_average([4, 8, 15, 16, 23, 42], 2)  # 32.5
recent_average([10, 20], 5)                # 15.0
```

## Concept

A **slice** copies part of a list into a new list. Write the start and end positions with a colon between them:

```python
readings = [4, 8, 15, 16, 23, 42]
readings[1:4]   # [8, 15, 16]: positions 1, 2 and 3
readings[:2]    # [4, 8]: leave out the start to begin at 0
readings[4:]    # [23, 42]: leave out the end to go to the end
readings[-2:]   # [23, 42]: the last two
```

As with `range`, the start is included and the end isn't. A slice is a new list, so changing it doesn't change the original.

A slice never goes out of range. Ask for more items than there are, and you just get the ones that exist: `[10, 20][-5:]` is `[10, 20]`.

`sum()` adds up a list of numbers, and `len()` counts them, so `sum(values) / len(values)` is their average.

## Hints

1. `readings[-n:]` gives the last `n` readings, or all of them if there are fewer than `n`.
2. Average the slice, not the whole list.
3. Divide by the slice's length, not by `n`. They differ when there are fewer than `n` readings.

## Starter: guided

```python
def recent_average(readings, n):
    recent = readings  # Replace readings with a slice: the last n readings.
    return sum(recent) / len(recent)


print(recent_average([4, 8, 15, 16, 23, 42], 2))
```

## Starter: standard

```python
def recent_average(readings, n):
    # Slice off the last n readings, then return their average.
    return 0
```

## Starter: challenge

```python
```

## Checks

```python
expect("recent_average([4, 8, 15, 16, 23, 42], 2)", lambda: get("recent_average")([4, 8, 15, 16, 23, 42], 2), 32.5)
expect("recent_average([10, 20], 5)", lambda: get("recent_average")([10, 20], 5), 15.0)
```

## Hidden checks

```python
expect("recent_average([7], 1)", lambda: get("recent_average")([7], 1), 7.0)
expect("recent_average([1, 2, 3, 4], 1)", lambda: get("recent_average")([1, 2, 3, 4], 1), 4.0)
expect("recent_average([1, 2, 3, 4], 4)", lambda: get("recent_average")([1, 2, 3, 4], 4), 2.5)
expect("recent_average([2, 4, 6, 8, 100], 3)", lambda: get("recent_average")([2, 4, 6, 8, 100], 3), 38.0)
log = [5, 6, 7]
check(
    "Leaves the readings unchanged",
    lambda: (get("recent_average")(log, 2), log)[1] == [5, 6, 7],
    "Slice the list instead of removing readings from it.",
)
```

## Solution

```python
def recent_average(readings, n):
    recent = readings[-n:]
    return sum(recent) / len(recent)
```

## Restored

The shift report shows the recent average beside the full log. The next slow rise stands out hours before it would have.
