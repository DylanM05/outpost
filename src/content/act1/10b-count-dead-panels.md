---
id: count-dead-panels
title: Count dead panels
system: Solar array
symbol: equipment
scene: tests
skills: lists, loops
---

## Briefing

Winter storms have cracked some of the solar panels. A dead panel produces nothing at all, and the crew wants a count before they decide how many spares to carry up.

## Objective

Write `count_dead(array)`. `array` is a list of rows, and each row is a list of panel outputs in watts. A panel producing `0` is dead. Return how many dead panels there are.

```python
count_dead([[40, 0, 38], [0, 0, 41]])  # 3
```

## Concept

A list can hold other lists. A grid, like the solar array, is often stored as a **list of rows**:

```python
array = [
    [40, 0, 38],
    [0, 0, 41],
]
array[1]      # [0, 0, 41], the second row
array[1][2]   # 41, the third panel in the second row
len(array)    # 2 rows
```

`array[1][2]` reads in two steps: `array[1]` is a row, and `[2]` picks a panel from that row.

To visit every panel, loop over the rows, and inside that, loop over the panels in each row:

```python
for row in array:
    for panel in row:
        print(panel)
```

Rows don't have to be the same length. Each inner loop just goes through whatever row it's given.

## Hints

1. Start a count at 0 before the loops.
2. `for row in array:`, then inside it `for panel in row:`.
3. Add 1 when `panel == 0`. Return the count after both loops have finished.

## Starter: guided

```python
def count_dead(array):
    dead = 0
    for row in array:
        # Loop over the panels in this row, and count the ones that are 0.
        print(row)
    return dead


print(count_dead([[40, 0, 38], [0, 0, 41]]))
```

## Starter: standard

```python
def count_dead(array):
    # Visit every panel in every row, and count the ones producing 0.
    return 0
```

## Starter: challenge

```python
```

## Checks

```python
expect("count_dead([[40, 0, 38], [0, 0, 41]])", lambda: get("count_dead")([[40, 0, 38], [0, 0, 41]]), 3)
expect("count_dead([[12, 15], [9, 30]])", lambda: get("count_dead")([[12, 15], [9, 30]]), 0)
```

## Hidden checks

```python
expect("count_dead([])", lambda: get("count_dead")([]), 0)
expect("count_dead([[]])", lambda: get("count_dead")([[]]), 0)
expect("count_dead([[0]])", lambda: get("count_dead")([[0]]), 1)
expect("count_dead([[0], [5, 0, 0, 7]])", lambda: get("count_dead")([[0], [5, 0, 0, 7]]), 3)
expect("count_dead([[0, 0], [0, 0], [0, 0]])", lambda: get("count_dead")([[0, 0], [0, 0], [0, 0]]), 6)
```

## Solution

```python
def count_dead(array):
    dead = 0
    for row in array:
        for panel in row:
            if panel == 0:
                dead += 1
    return dead
```

## Restored

Three dead panels. The crew straps three spares to the sled and heads up the ridge.
