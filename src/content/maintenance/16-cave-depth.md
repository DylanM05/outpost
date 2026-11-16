---
id: maintenance-cave-depth
title: Measure the cave's depth
system: Cave survey
symbol: controller
scene: calls
skills: recursion
reviewSkill: recursion
prerequisite: count-the-crystals
---

## Briefing

The surveyors want to know how many levels the cave notes go down, so they know how much rope the deepest chamber needs.

## Objective

Write `depth(chamber)`, using recursion. A chamber is a list whose items are numbers or other chambers. A chamber with no side chambers has depth 1. Otherwise its depth is 1 more than its deepest side chamber.

```python
depth([4, 2])            # 1
depth([1, [2, [3]], []])  # 3
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. `isinstance(item, list)` tells you whether an item is a side chamber.
2. Find the deepest side chamber by calling `depth` on each one, and keep the biggest answer.
3. Return 1 plus that, or just 1 if there were no side chambers.

## Starter

```python
```

## Checks

```python
expect_recursive("depth([4, 2])", "depth", ([4, 2],), 1, recurse=False)
expect_recursive("depth([1, [2, [3]], []])", "depth", ([1, [2, [3]], []],), 3)
```

## Hidden checks

```python
expect_recursive("depth([])", "depth", ([],), 1, recurse=False)
expect_recursive("depth([[]])", "depth", ([[]],), 2)
expect_recursive("depth([[[[[5]]]]])", "depth", ([[[[[5]]]]],), 5)
expect_recursive("depth([[1], [[2]], 3])", "depth", ([[1], [[2]], 3],), 3)
```

## Solution

```python
def depth(chamber):
    deepest = 0
    for item in chamber:
        if isinstance(item, list):
            deepest = max(deepest, depth(item))
    return 1 + deepest
```

## Restored

Three levels down. The surveyors pack rope for the deepest chamber and a little more.
