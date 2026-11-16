---
id: rope-total
title: Rope total
system: Cave survey
symbol: controller
scene: calls
skills: recursion
---

## Briefing

The cave rope is spliced together from segments of different lengths, listed from the top down. Before each descent, the surveyors need its total length, and the cave program does everything recursively, so this function should too.

## Objective

Write `rope_total(segments)`. Return the total length of all the segments, using recursion: `rope_total` should call itself, with no `for` or `while` loop.

```python
rope_total([4, 2, 7])  # 13
rope_total([])         # 0
```

## Concept

Recursion fits a list when you see it as **the first item, plus the rest**. The rest is a shorter list, so it's a smaller version of the same problem:

- The total of `[4, 2, 7]` is `4` plus the total of `[2, 7]`.
- The total of `[2, 7]` is `2` plus the total of `[7]`.
- The total of `[7]` is `7` plus the total of `[]`.
- The total of `[]` is `0`. That's the base case: no items left, nothing to add.

`segments[0]` is the first item, and the slice `segments[1:]` is the rest. Here's the same idea counting items instead of adding them:

```python
def count(items):
    if len(items) == 0:
        return 0
    return 1 + count(items[1:])
```

Every call works on a list one item shorter, so the calls are guaranteed to reach the empty list and stop.

In real Python, you'd write `sum(segments)`. Practicing on a problem you can check against a loop makes recursion easier to trust in the next cave, where loops can't do the job.

The call tree beside the board shows every call your function makes, indented under the call that made it, and what each one returned.

## Hints

1. Base case first: if the list is empty, return 0.
2. Otherwise, return the first segment plus the total of the rest.
3. `return segments[0] + rope_total(segments[1:])`

## Starter: guided

```python
def rope_total(segments):
    if len(segments) == 0:
        return 0
    # Return the first segment plus the total of the rest, using rope_total.
    return segments[0]


print(rope_total([4, 2, 7]))
```

## Starter: standard

```python
def rope_total(segments):
    # Base case: an empty rope. Otherwise: the first segment plus the
    # total of the rest.
    return 0
```

## Starter: challenge

```python
```

## Checks

```python
check(
    "Uses recursion, not a loop",
    lambda: not uses("for", "while", "sum"),
    "Call rope_total on the rest of the list instead of looping.",
)
expect_recursive("rope_total([4, 2, 7])", "rope_total", ([4, 2, 7],), 13)
expect_recursive("rope_total([])", "rope_total", ([],), 0, recurse=False)
```

## Hidden checks

```python
expect_recursive("rope_total([9])", "rope_total", ([9],), 9)
expect_recursive("rope_total([1, 1, 1, 1, 1])", "rope_total", ([1, 1, 1, 1, 1],), 5)
expect_recursive("rope_total([0, 0, 5])", "rope_total", ([0, 0, 5],), 5)
long_rope = [(i * 7) % 10 + 1 for i in range(200)]
expect_recursive("rope_total(200 segments)", "rope_total", (long_rope,), sum(long_rope))
```

## Solution

```python
def rope_total(segments):
    if len(segments) == 0:
        return 0
    return segments[0] + rope_total(segments[1:])
```

## Restored

Thirteen meters, the same answer the surveyors got with a tape. The cave program has its first piece it can trust.
