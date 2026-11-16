---
id: locate-weak-panels
title: Locate weak panels
system: Solar array
symbol: equipment
scene: tests
skills: lists, loops
---

## Briefing

The spares are fitted, but some panels still produce far less than they should. Frost has crept under their covers. The repair crew needs the exact row and column of each one, so they can walk straight to it.

## Objective

Write `weak_panels(array, minimum)`. Return a list of `(row, column)` tuples, one for every panel producing **less than** `minimum` watts, in the order you'd scan them: row by row, left to right.

```python
weak_panels([[40, 12, 38], [9, 41, 40]], 20)  # [(0, 1), (1, 0)]
```

## Concept

To know **where** each panel is, loop over positions instead of items, once for the rows and once for the columns:

```python
for r in range(len(array)):
    for c in range(len(array[r])):
        print(r, c, array[r][c])
```

`len(array)` counts the rows. `len(array[r])` counts the panels in row `r`, so rows of different lengths still work. Grid code usually names the positions `r` and `c`, for row and column.

A tuple holds the two positions together, as the drone's positions did: `(r, c)`.

## Hints

1. Start with an empty list, then loop `for r in range(len(array)):` and, inside it, `for c in range(len(array[r])):`.
2. The panel at that position is `array[r][c]`.
3. When it's less than `minimum`, append the tuple `(r, c)`.

## Starter: guided

```python
def weak_panels(array, minimum):
    weak = []
    for r in range(len(array)):
        for c in range(len(array[r])):
            # If the panel at row r, column c is below minimum,
            # append its position as a tuple.
            print(r, c, array[r][c])
    return weak


print(weak_panels([[40, 12, 38], [9, 41, 40]], 20))
```

## Starter: standard

```python
def weak_panels(array, minimum):
    # Loop over every row position and column position, and collect
    # (row, column) for each panel below minimum.
    return []
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "weak_panels([[40, 12, 38], [9, 41, 40]], 20)",
    lambda: get("weak_panels")([[40, 12, 38], [9, 41, 40]], 20),
    [(0, 1), (1, 0)],
)
expect("weak_panels([[30, 31]], 20)", lambda: get("weak_panels")([[30, 31]], 20), [])
```

## Hidden checks

```python
expect("weak_panels([], 20)", lambda: get("weak_panels")([], 20), [])
expect("weak_panels([[5]], 10)", lambda: get("weak_panels")([[5]], 10), [(0, 0)])
expect("weak_panels([[20, 19]], 20)", lambda: get("weak_panels")([[20, 19]], 20), [(0, 1)])
expect("weak_panels([[50], [1, 50, 2]], 10)", lambda: get("weak_panels")([[50], [1, 50, 2]], 10), [(1, 0), (1, 2)])
expect(
    "weak_panels([[3, 3], [3, 3]], 4)",
    lambda: get("weak_panels")([[3, 3], [3, 3]], 4),
    [(0, 0), (0, 1), (1, 0), (1, 1)],
)
```

## Solution

```python
def weak_panels(array, minimum):
    weak = []
    for r in range(len(array)):
        for c in range(len(array[r])):
            if array[r][c] < minimum:
                weak.append((r, c))
    return weak
```

## Restored

The crew walks straight to row 0, column 1, then row 1, column 0, and scrapes the frost out from under both covers. The array is back to full power.
