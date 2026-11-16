---
id: trace-the-calibration
kind: predict
title: Trace the calibration
system: Sensor mast
symbol: instrument
scene: console
skills: lists, loops, reading-code
---

## Briefing

The sensor mast's readings drift a little higher every day, so a calibration script is meant to adjust them each morning. The crew swears the first half of the script does nothing at all. Trace it and see whether they're right.

## Objective

Predict exactly what this program prints.

## Concept

A loop variable holds each item in turn. Giving it a new value changes the variable, but not the list it came from:

```python
levels = [1, 2]
for level in levels:
    level = 0
print(levels)  # [1, 2]
```

To change the list itself, assign to a position. `levels[0] = 9` replaces the item at position 0. To change every item, loop over the positions:

```python
for i in range(len(levels)):
    levels[i] = levels[i] * 10
print(levels)  # [10, 20]
```

The right-hand side is worked out first, using the old item, and the result is stored back at the same position.

## Hints

1. In the first loop, `reading` is a variable that holds each number in turn. Giving it a new value doesn't reach back into the list.
2. The second loop assigns to `readings[i]`, which replaces the item at each position, so this one does change the list.
3. After the second loop the list is `[15, 25, 35]`. Then position 0 is replaced, and `readings[-1]` is the last item.

## Program

```python
readings = [10, 20, 30]

for reading in readings:
    reading = reading + 1
print(readings)

for i in range(len(readings)):
    readings[i] = readings[i] + 5
print(readings)

readings[0] = 0
print(readings[0], readings[-1])
```

## Output

```text
[10, 20, 30]
[15, 25, 35]
0 35
```

## Restored

The crew was right: the first loop never changed a single reading, which is why the mast kept drifting. The script now updates the readings by position.
