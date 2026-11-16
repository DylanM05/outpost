---
id: find-the-jumps
title: Find the jumps
system: Sensor mast
symbol: instrument
scene: tests
skills: lists, loops
---

## Briefing

The mast's wind sensor logs a reading every minute. A slow rise is just weather, but a sudden jump from one minute to the next means a gust front is coming down the valley, and the drones need to land before it arrives.

## Objective

Write `find_jumps(readings, limit)`. Return a list of the **positions** where a reading is more than `limit` above the reading just before it, in order.

```python
find_jumps([20, 21, 35, 36, 50], 10)  # [2, 4]
```

At position 2 the wind rose from 21 to 35, a jump of 14. At position 4 it rose from 36 to 50.

## Concept

Some questions are about neighbors: how each item compares with the one before it. The item before position `i` is at position `i - 1`.

Position 0 has nothing before it, so start the loop at 1. `range(1, len(readings))` gives every position from 1 to the last:

```python
for i in range(1, len(readings)):
    change = readings[i] - readings[i - 1]
```

Starting at 0 would be a quiet bug. At `i = 0`, `readings[i - 1]` is `readings[-1]`, the **last** reading, so the first reading gets compared with the end of the list. There's no error message, just a wrong answer now and then.

## Hints

1. Start with an empty list of jumps, and loop with `for i in range(1, len(readings)):`.
2. The rise at position `i` is `readings[i] - readings[i - 1]`. A drop gives a negative rise.
3. If the rise is greater than `limit`, append `i`, the position, not the reading.

## Starter: guided

```python
def find_jumps(readings, limit):
    jumps = []
    for i in range(1, len(readings)):
        rise = 0  # Replace 0: how far did reading i rise from the one before it?
        if rise > limit:
            jumps.append(i)
    return jumps


print(find_jumps([20, 21, 35, 36, 50], 10))
```

## Starter: standard

```python
def find_jumps(readings, limit):
    # Compare each reading with the one before it, and collect the
    # positions where it rose by more than limit.
    return []
```

## Starter: challenge

```python
```

## Checks

```python
expect("find_jumps([20, 21, 35, 36, 50], 10)", lambda: get("find_jumps")([20, 21, 35, 36, 50], 10), [2, 4])
expect("find_jumps([9, 7, 4], 0)", lambda: get("find_jumps")([9, 7, 4], 0), [])
```

## Hidden checks

```python
expect("find_jumps([], 5)", lambda: get("find_jumps")([], 5), [])
expect("find_jumps([40], 5)", lambda: get("find_jumps")([40], 5), [])
expect("find_jumps([1, 11], 10)", lambda: get("find_jumps")([1, 11], 10), [])
expect("find_jumps([1, 12], 10)", lambda: get("find_jumps")([1, 12], 10), [1])
expect(
    "find_jumps([30, 5, 6], 10)",
    lambda: get("find_jumps")([30, 5, 6], 10),
    [],
    "Position 0 has no reading before it. Start the loop at 1.",
)
expect("find_jumps([0, 20, 0, 20], 15)", lambda: get("find_jumps")([0, 20, 0, 20], 15), [1, 3])
```

## Solution

```python
def find_jumps(readings, limit):
    jumps = []
    for i in range(1, len(readings)):
        rise = readings[i] - readings[i - 1]
        if rise > limit:
            jumps.append(i)
    return jumps
```

## Restored

The mast flags two jumps. The drones are on the pad when the gust front hits, and nothing gets blown off the ridge.
