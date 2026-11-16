---
id: investigate-outage
title: Investigate the outage
system: Weather sensors
symbol: instrument
scene: tests
skills: debugging
---

## Briefing

Last night the weather station crashed and took the heaters down with it. The prime suspect is the function that averages temperature readings. It runs, but some of its answers are wrong, and sometimes it crashes instead of answering. Nobody else is going to find the bug.

## Objective

Fix `average_temp(readings)` so it returns the average of a list of temperatures. If the list is empty, return `None` instead of crashing.

## Concept

The hardest bugs are the ones that don't produce an error message. A reliable method:

1. **Reproduce it.** Find an input that gives the wrong answer. The tests give you some.
2. **Work it out by hand.** Calculate what the answer should be.
3. **Trace the code.** Add `print()` calls to watch the values change, and find the first place they differ from what you expected.
4. **Fix the cause,** not the symptom. Then run the tests again.

This code loops over positions with `range(1, len(readings))`, the same loop you used to find jumps at the sensor mast. There, starting at 1 was deliberate, because each reading was compared with the one before it. Here, nothing is compared, so ask what starting at 1 leaves out.

When Python does crash, read the **traceback** from the bottom up. The last line names the error, and the lines above it show where it happened.

`None` is Python's value for "nothing here". Returning `None` makes sense when there's no meaningful answer, such as the average of no readings.

## Hints

1. Work out `average_temp([10, 20, 30])` by hand, then add `print(total)` after the loop to see what the code actually added up.
2. `range(1, len(readings))` starts at position 1. Which reading does that skip?
3. Handle the empty list before dividing: `if len(readings) == 0:` then `return None`.

## Starter

```python
def average_temp(readings):
    total = 0
    for i in range(1, len(readings)):
        total += readings[i]
    return total / len(readings)


print(average_temp([10, 20, 30]))
```

## Checks

```python
expect("average_temp([10, 20, 30])", lambda: get("average_temp")([10, 20, 30]), 20.0)
expect("average_temp([-4, 2])", lambda: get("average_temp")([-4, 2]), -1.0)
```

## Hidden checks

```python
expect("average_temp([])", lambda: get("average_temp")([]), None)
expect("average_temp([7])", lambda: get("average_temp")([7]), 7.0)
expect("average_temp([-12, -8, -10, -6])", lambda: get("average_temp")([-12, -8, -10, -6]), -9.0)
```

## Solution

```python
def average_temp(readings):
    if len(readings) == 0:
        return None
    total = 0
    for reading in readings:
        total += reading
    return total / len(readings)
```

## Restored

The weather station reports a steady average of minus nine degrees. The heaters come back on, and this time they stay on.
