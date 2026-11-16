---
id: zip-the-logs
kind: predict
title: Zip the logs
system: Merge yard
symbol: equipment
scene: console
skills: sorting, reading-code
---

## Briefing

Two survey teams each keep a log of the times they reached each marker, in order. The merge yard combines logs into one timeline, and it never sorts from scratch: it zips the two logs together. Trace how.

## Objective

Predict exactly what this program prints.

## Concept

Two lists that are **already sorted** can be combined into one sorted list in a single pass. Keep a position in each list, `i` and `j`, both starting at 0:

- Compare `left[i]` with `right[j]`, and append the smaller one.
- Move forward in the list you took from. The other position stays put.
- Stop when either list runs out.

Whatever's left in the other list is already sorted, and bigger than everything taken so far, so it goes on the end as it is.

Two new list tools help with that last step. `a + b` makes a new list with the items of `a` followed by those of `b`, and `a += b` adds `b`'s items to the end of `a`. A slice from a position past the end, like `left[3:]` on a 3-item list, is just an empty list.

Each comparison places one item for good, so merging lists with `n` items in total takes at most `n` comparisons. That's linear, and it's the step that makes the next repairs fast.

## Hints

1. Compare the fronts: 3 against 5, then the loser stays to be compared again.
2. `print(merged)` is inside the loop, so it shows the list after every item is placed.
3. The loop stops when `left` runs out at 14. Then `right[j:]` is `[20]`, which goes on the end.

## Program

```python
left = [3, 9, 14]
right = [5, 6, 20]
merged = []
i = 0
j = 0

while i < len(left) and j < len(right):
    if left[i] <= right[j]:
        merged.append(left[i])
        i += 1
    else:
        merged.append(right[j])
        j += 1
    print(merged)

merged += left[i:]
merged += right[j:]
print(merged)
```

## Output

```text
[3]
[3, 5]
[3, 5, 6]
[3, 5, 6, 9]
[3, 5, 6, 9, 14]
[3, 5, 6, 9, 14, 20]
```

## Restored

Six entries, in order, from two logs and five comparisons. The merge yard's method is simpler than anyone expected.
