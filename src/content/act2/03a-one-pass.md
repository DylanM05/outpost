---
id: one-pass
kind: predict
title: One pass
system: Sample sorter
symbol: instrument
scene: console
skills: sorting, reading-code
---

## Briefing

The sample sorter lines up ice cores by depth, shallowest first, so the surveyors can read the layers in order. Its sorting program works in passes along the rack. Trace two passes and see what each one actually achieves.

## Objective

Predict exactly what this program prints.

## Concept

Most sorts are built from one small move, repeated. **Bubble sort** uses the smallest move there is: compare two neighbors, and swap them if they're in the wrong order.

One **pass** walks along the list doing that for every neighboring pair. The loop stops one short of the end, because the last item has no neighbor after it, which is why it uses `range(len(samples) - 1)`.

Swapping two items in Python takes one line:

```python
a, b = b, a
samples[i], samples[i + 1] = samples[i + 1], samples[i]
```

Python works out the whole right side first, then assigns both values, so nothing is overwritten halfway through.

Watch what a pass does to the biggest item. Once a pass reaches it, every comparison carries it one step further right, all the way to the end. Small items have it harder: they only move left one step per pass.

## Hints

1. In the first pass, 42 is bigger than each item after it, so it's swapped at every step and carried to the end.
2. `print(samples)` is inside the first loop, so it runs after every comparison, whether or not that comparison swapped.
3. The second pass starts from `[17, 35, 8, 42]`. Only one pair is out of order, and 8 moves one step left.

## Program

```python
samples = [42, 17, 35, 8]
swaps = 0

for i in range(len(samples) - 1):
    if samples[i] > samples[i + 1]:
        samples[i], samples[i + 1] = samples[i + 1], samples[i]
        swaps += 1
    print(samples)

print(f"{swaps} swaps")

for i in range(len(samples) - 1):
    if samples[i] > samples[i + 1]:
        samples[i], samples[i + 1] = samples[i + 1], samples[i]
print(samples)
```

## Output

```text
[17, 42, 35, 8]
[17, 35, 42, 8]
[17, 35, 8, 42]
3 swaps
[17, 8, 35, 42]
```

## Restored

Two passes, and the rack still isn't in order. The deepest core went straight to the end, but the shallowest one is crawling left a single step per pass.
