---
id: dispatch-drone
title: Dispatch the drone
system: Drone pad
symbol: equipment
scene: drone
skills: loops, conditionals
---

## Briefing

The inspection drone flies a list of compass moves, one grid square at a time. Its navigation module was wiped, so it no longer knows where it ends up. Work out its final position so the crew knows where to collect it.

## Objective

Write `final_position(moves)`. The drone starts at `(0, 0)`, and each move is `"N"`, `"S"`, `"E"`, or `"W"`:

- `"N"` adds 1 to y, and `"S"` subtracts 1 from y.
- `"E"` adds 1 to x, and `"W"` subtracts 1 from x.

Return the final position as a tuple `(x, y)`.

```python
final_position(["N", "N", "E"])  # (1, 2)
```

## Concept

Some loops need to keep track of more than one thing. Here, the drone's position is two numbers, and each move changes one of them:

```python
x = 0
y = 0
for move in moves:
    if move == "N":
        y = y + 1
    elif move == "S":
        y = y - 1
```

`y += 1` is shorthand for `y = y + 1`, and `y -= 1` for `y = y - 1`.

To return two values together, put them in a **tuple**: values in parentheses, separated by commas. `return (x, y)` gives back both numbers, in that order.

## Hints

1. Create `x` and `y`, both 0, before the loop.
2. Inside the loop, use `if` and `elif` to handle each of the four directions.
3. After the loop, `return (x, y)`.

## Starter: guided

```python
def final_position(moves):
    x = 0
    y = 0
    for move in moves:
        if move == "N":
            y += 1
        # Handle "S", "E", and "W" the same way.
    return (x, y)


print(final_position(["N", "N", "E"]))
```

## Starter: standard

```python
def final_position(moves):
    # Start at (0, 0), apply each move, and return (x, y).
    return (0, 0)
```

## Starter: challenge

```python
```

## Checks

```python
routes = [
    (["N", "N", "E"], (1, 2)),
    (["E", "E", "S", "W"], (1, -1)),
]
for moves, end in routes:
    expect(f"final_position({moves!r})", lambda: get("final_position")(moves), end, moves=moves)
```

## Hidden checks

```python
routes = [
    ([], (0, 0)),
    (["W", "W", "W"], (-3, 0)),
    (["N", "S", "E", "W"], (0, 0)),
    (["S", "S", "E", "N", "E", "E"], (3, -1)),
]
for moves, end in routes:
    expect(f"final_position({moves!r})", lambda: get("final_position")(moves), end, moves=moves)
```

## Solution

```python
def final_position(moves):
    x = 0
    y = 0
    for move in moves:
        if move == "N":
            y += 1
        elif move == "S":
            y -= 1
        elif move == "E":
            x += 1
        elif move == "W":
            x -= 1
    return (x, y)
```

## Restored

The drone lands exactly where the terminal said it would. It can now be sent out to inspect the ridge.
