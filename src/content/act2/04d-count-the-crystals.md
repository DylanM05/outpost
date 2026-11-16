---
id: count-the-crystals
title: Count the crystals
system: Cave survey
symbol: controller
scene: calls
skills: recursion, lists
---

## Briefing

The surveyors are cataloguing ice crystals. The cave branches unpredictably: a chamber can open into side chambers, which open into more side chambers, as deep as the cave goes. Their notes follow the same shape, and nobody can say in advance how deep they'll nest.

## Objective

Write `count_crystals(chamber)`. A chamber is a list. Each item in it is either a number, the crystals found at one spot, or another list: a side chamber, laid out the same way. Return the total number of crystals in the chamber and everything inside it.

```python
count_crystals([3, [2, 1], 4])      # 10
count_crystals([[], [[5]], 1])      # 6
```

## Concept

This is the problem recursion is for. One loop handles a flat list. A loop inside a loop handles one level of side chambers. But no fixed number of loops handles nesting of any depth, and a function that calls itself on each side chamber does.

Loop over the chamber's items, as usual. For each one, ask what it is:

- A number: add it.
- A list: it's a whole chamber of its own, so count it with `count_crystals`, and add that.

`isinstance(item, list)` is `True` when `item` is a list, and `False` for a number.

Where's the base case? A chamber with no side chambers never makes a recursive call: its loop just adds up numbers. Every recursive call is on a chamber nested one level deeper, and the cave can't nest forever, so the calls always stop.

## Hints

1. Start a total at 0, and loop `for item in chamber:`.
2. If `isinstance(item, list)`, add `count_crystals(item)` to the total. Otherwise, add `item`.
3. Return the total after the loop. An empty chamber returns 0 without any special case.

## Starter: guided

```python
def count_crystals(chamber):
    total = 0
    for item in chamber:
        if isinstance(item, list):
            # item is a side chamber: count its crystals with
            # count_crystals, and add them to total.
            print("side chamber:", item)
        else:
            total += item
    return total


print(count_crystals([3, [2, 1], 4]))
```

## Starter: standard

```python
def count_crystals(chamber):
    # This handles one level of side chambers, but not chambers inside those.
    total = 0
    for item in chamber:
        if isinstance(item, list):
            for inner in item:
                total += inner
        else:
            total += item
    return total
```

## Starter: challenge

```python
```

## Checks

```python
expect_recursive("count_crystals([3, [2, 1], 4])", "count_crystals", ([3, [2, 1], 4],), 10)
expect_recursive("count_crystals([[], [[5]], 1])", "count_crystals", ([[], [[5]], 1],), 6)
```

## Hidden checks

```python
expect_recursive("count_crystals([])", "count_crystals", ([],), 0, recurse=False)
expect_recursive("count_crystals([7, 8])", "count_crystals", ([7, 8],), 15, recurse=False)
expect_recursive("count_crystals([[[[[[2]]]]]])", "count_crystals", ([[[[[[2]]]]]],), 2)
expect_recursive("count_crystals([[1, [2, [3]]], [4]])", "count_crystals", ([[1, [2, [3]]], [4]],), 10)
expect_recursive("count_crystals([[], [[]], 0])", "count_crystals", ([[], [[]], 0],), 0)
```

## Solution

```python
def count_crystals(chamber):
    total = 0
    for item in chamber:
        if isinstance(item, list):
            total += count_crystals(item)
        else:
            total += item
    return total
```

## Restored

Every crystal is counted, down to the smallest side chamber. The cave survey is complete, and the map shows how far down the ridge's ice really goes.
