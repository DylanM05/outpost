---
id: halve-the-search
kind: predict
title: Halve the search
system: Map archive
symbol: equipment
scene: console
skills: searching, reading-code
---

## Briefing

The map archive files survey markers by elevation, lowest first. The archivist can find any marker in a handful of steps, and she says it's all in how she opens the drawers. Trace her method.

## Objective

Predict exactly what this program prints.

## Concept

To find a word in a dictionary, you don't start at page one. You open it in the middle, see whether your word comes before or after that page, and ignore the half it can't be in. Repeat, and you're there in a few steps.

That's **binary search**. It only works on sorted data. It keeps two positions, `low` and `high`, marking the range where the target could still be. Each step looks at the middle position, `(low + high) // 2`, and moves `low` or `high` past it.

Each step halves the range, so a million sorted items take at most about 20 looks, where checking them one by one could take a million. Binary search is `O(log n)`.

`break` ends a loop immediately, even if its condition is still true.

## Hints

1. Write down `low`, `high`, and `mid` for each pass. Remember that `//` drops the remainder.
2. On the first pass, `low` is 0 and `high` is 7, so `mid` is 3. The program prints the elevation at position 3.
3. When the elevation at `mid` is smaller than the target, `low` moves to `mid + 1`. When it's larger, `high` moves to `mid - 1`.

## Program

```python
elevations = [120, 340, 410, 560, 610, 780, 905, 990]
target = 905

low = 0
high = len(elevations) - 1
while low <= high:
    mid = (low + high) // 2
    print(f"check {mid}: {elevations[mid]}")
    if elevations[mid] == target:
        print(f"found at {mid}")
        break
    elif elevations[mid] < target:
        low = mid + 1
    else:
        high = mid - 1
```

## Output

```text
check 3: 560
check 5: 780
check 6: 905
found at 6
```

## Restored

Three looks for eight drawers. The archivist was right, and now the terminal can search the same way.
