---
id: recalibrate
title: Recalibrate the mast
system: Sensor mast
symbol: instrument
scene: tests
skills: lists, loops
---

## Briefing

Every sensor on the mast reads a few degrees too warm, by the same amount. The mast's other programs all read from one shared list of readings, so the fix has to change that list itself. A corrected copy would sit unused while everything else carried on with the wrong numbers.

## Objective

Write `recalibrate(readings, offset)`. Subtract `offset` from every reading, changing the list `readings` itself. A reading can't go below zero: if subtracting the offset would make it negative, store `0` instead. The function doesn't need to return anything.

```python
mast = [12, 15, 1]
recalibrate(mast, 2)
print(mast)  # [10, 13, 0]
```

## Concept

When you pass a list to a function, the function gets the same list, not a copy. Change it inside the function, and the caller sees the change, because both names refer to one list. This is called changing a list **in place**. `append()` works this way too.

The calibration script showed how to change every item: loop over positions, and assign back to each one.

```python
for i in range(len(levels)):
    levels[i] = levels[i] * 10
```

A function that changes a list in place usually returns nothing. The caller already has the list, so there's nothing to hand back.

Building a new list and returning it is the other option, and it's often the safer one, because nothing else changes behind your back. It's just not what this mast needs.

## Hints

1. Loop over positions with `for i in range(len(readings)):`.
2. Work out the corrected value, `readings[i] - offset`, and store it back with `readings[i] = ...`.
3. If the corrected value is below 0, store 0 instead. An `if` before the assignment, or right after it, both work.

## Starter: guided

```python
def recalibrate(readings, offset):
    for i in range(len(readings)):
        # Store the corrected reading back at position i,
        # but never below 0.
        print(i, readings[i])


mast = [12, 15, 1]
recalibrate(mast, 2)
print(mast)
```

## Starter: standard

```python
def recalibrate(readings, offset):
    # This builds a corrected copy, so the mast's list never changes.
    # Change readings itself instead, and don't let a reading go below 0.
    corrected = []
    for reading in readings:
        corrected.append(reading - offset)
    return corrected
```

## Starter: challenge

```python
```

## Checks

```python
def after(readings, offset):
    get("recalibrate")(readings, offset)
    return readings

hint = "Change the items in readings itself, by position, instead of building a new list."
expect("readings after recalibrate([12, 15, 1], 2)", lambda: after([12, 15, 1], 2), [10, 13, 0], hint)
expect("readings after recalibrate([30, 25], 5)", lambda: after([30, 25], 5), [25, 20], hint)
```

## Hidden checks

```python
expect("readings after recalibrate([], 3)", lambda: after([], 3), [], hint)
expect("readings after recalibrate([4, 9], 0)", lambda: after([4, 9], 0), [4, 9], hint)
expect("readings after recalibrate([5, 6], 5)", lambda: after([5, 6], 5), [0, 1], hint)
expect("readings after recalibrate([3, 2, 1], 10)", lambda: after([3, 2, 1], 10), [0, 0, 0], hint)
mast = [20, 21, 22]
after(mast, 1)
expect("calling recalibrate twice", lambda: after(mast, 1), [18, 19, 20], hint)
```

## Solution

```python
def recalibrate(readings, offset):
    for i in range(len(readings)):
        readings[i] = readings[i] - offset
        if readings[i] < 0:
            readings[i] = 0
```

## Restored

Every program on the mast now reads true temperatures from the same corrected list. The overnight frost warning goes out an hour earlier than it used to.
