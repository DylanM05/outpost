---
id: bring-it-home
title: Bring it home
system: Drone pad
symbol: equipment
scene: drone
skills: loops, lists, conditionals
---

## Briefing

The drone has finished its inspection and is hovering out on the ridge with its battery running low. It needs a route back to the pad, and the shorter the better.

## Objective

Write `route_home(x, y)`. The drone is at `(x, y)`, and the pad is at `(0, 0)`. Return a list of moves (`"N"`, `"S"`, `"E"`, `"W"`) that brings it back to the pad in as few moves as possible.

```python
route_home(2, -1)  # ["W", "W", "N"], or any other shortest route
```

More than one answer is correct. The tests fly your route, then check where it lands and how many moves it took.

## Concept

`range(n)` is also the way to repeat something a set number of times. When you don't need the loop variable, `_` is the usual name for it:

```python
for _ in range(3):
    print("beep")
```

`abs()` gives a number's distance from zero, ignoring its sign: `abs(-4)` is `4`.

The shortest route needs exactly `abs(x)` east or west moves and `abs(y)` north or south moves. The sign tells you the direction: if the drone is east of the pad (`x > 0`), it has to fly west.

When a problem has several correct answers, tests check the properties every correct answer must have, instead of comparing with one fixed answer.

## Hints

1. Start with `moves = []`.
2. If `x > 0`, append `"W"` `x` times. If `x < 0`, append `"E"` `abs(x)` times.
3. Do the same for `y` with `"S"` and `"N"`, then return the list.

## Starter: guided

```python
def route_home(x, y):
    moves = []
    if x > 0:
        for _ in range(x):
            moves.append("W")
    elif x < 0:
        for _ in range(abs(x)):
            moves.append("E")
    # Now do the same for y, using "S" and "N".
    return moves


print(route_home(2, -1))
```

## Starter: standard

```python
def route_home(x, y):
    # Return a list of moves that brings the drone to (0, 0).
    return []
```

## Starter: challenge

```python
```

## Checks

```python
STEP = {"N": (0, 1), "S": (0, -1), "E": (1, 0), "W": (-1, 0)}


def fly(start, moves):
    x, y = start
    for move in moves:
        dx, dy = STEP[move]
        x, y = x + dx, y + dy
    return (x, y)


def check_route(start):
    label = f"route_home({start[0]}, {start[1]})"
    outcome = safe(lambda: get("route_home")(*start))
    moves = outcome.value
    valid = isinstance(moves, list) and all(move in STEP for move in moves)
    shortest = abs(start[0]) + abs(start[1])
    if outcome.error:
        problem = outcome.error
    elif not isinstance(moves, list):
        problem = f"Expected a list of moves, got {moves!r}."
    elif not valid:
        problem = 'Every move must be "N", "S", "E", or "W".'
    elif fly(start, moves) != (0, 0):
        problem = f"That route lands at {fly(start, moves)}, not (0, 0)."
    elif len(moves) != shortest:
        problem = f"That route takes {len(moves)} moves. The shortest takes {shortest}."
    else:
        problem = ""
    emit(
        "reading",
        label=label,
        start=list(start),
        moves=moves if valid else [],
        got=list(fly(start, moves)) if valid else None,
        expected=[0, 0],
        passed=not problem,
        error=outcome.error,
    )
    check(label, lambda: not problem, problem)


for start in [(2, -1), (-1, 3)]:
    check_route(start)
```

## Hidden checks

```python
for start in [(0, 0), (-3, 0), (4, 4), (0, -2)]:
    check_route(start)
```

## Solution

```python
def route_home(x, y):
    moves = []
    if x > 0:
        for _ in range(x):
            moves.append("W")
    elif x < 0:
        for _ in range(abs(x)):
            moves.append("E")
    if y > 0:
        for _ in range(y):
            moves.append("S")
    elif y < 0:
        for _ in range(abs(y)):
            moves.append("N")
    return moves
```

## Restored

The drone flies straight home and lands with charge to spare. Now it can be sent on longer inspections.
