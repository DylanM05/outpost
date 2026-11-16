---
id: plan-the-survey
title: Plan the survey
system: Survey core
symbol: controller
scene: grid
skills: graphs, hashing, complexity
assessment: true
---

## Briefing

The survey core plans each day's flight: the drone takes off from its pad, marked `S`, and visits numbered survey markers in order, 1 first, then 2, then 3, and so on. The core won't come online until it can plan a full survey, quickly, on a map it's never seen.

This is an independent mission. There's no starter code, and hints unlock after your second submission. Use what you've learned in the survey office, and look things up in the Python documentation if you need to.

## Objective

Write `plan_survey(grid)`. `grid` is a list of strings. `#` is a crevasse, and every other square is open. The pad is marked `S`, and the markers are the digits `1` to `9`, numbered without gaps from 1. Return the total number of moves for the drone to fly from the pad to marker 1, then to marker 2, and so on to the last marker, taking a shortest route each time and moving up, down, left, or right. If any marker can't be reached, return `-1`.

```python
plan_survey([
    "S..#2",
    ".#...",
    "1..#3",
])  # 10: 2 moves to marker 1, 6 to marker 2, and 2 to marker 3
```

The hidden tests include a 40 by 40 map with 9 markers. The budget there is 5 cell reads per square for each leg of the flight, plus one read per square to find the markers.

## Concept

A few reminders and one new tool:

- `from collections import deque` gives a queue with `popleft()`.
- `"7".isdigit()` is `True`, and `int("7")` is `7`.
- A dictionary can map each marker number to its position, and `sorted()` on its keys gives the numbers in order.

## Hints

1. Scan the grid once to find the pad and every marker's position. Store the markers in a dictionary by number.
2. Write a helper that returns the shortest number of moves between two squares with breadth-first search, or -1.
3. Fly the legs in order, adding up the moves. Return -1 as soon as a leg can't be flown.

## Starter

```python
```

## Checks

```python
example_rows = ["S..#2", ".#...", "1..#3"]
example = tracked_grid(example_rows)
expect_grid("plan_survey(the example map)", lambda: get("plan_survey")(example), 10, example)
second_rows = [
    "3....#....",
    ".##..#.##.",
    ".#...#..#.",
    ".#.###..#1",
    "...#S..#..",
    "##.#..##.#",
    "2.....#...",
]
second = tracked_grid(second_rows)
expect_grid("plan_survey(10 by 7 map, 3 markers)", lambda: get("plan_survey")(second), 40, second)
```

## Hidden checks

```python
from collections import deque as _line

def _leg(rows, start, goal):
    distance = {start: 0}
    todo = _line([start])
    while todo:
        r, c = todo.popleft()
        if (r, c) == goal:
            return distance[(r, c)]
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < len(rows) and 0 <= nc < len(rows[nr]) and rows[nr][nc] != "#" and (nr, nc) not in distance:
                distance[(nr, nc)] = distance[(r, c)] + 1
                todo.append((nr, nc))
    return -1

def _plan(rows):
    start = None
    markers = {}
    for r in range(len(rows)):
        for c in range(len(rows[r])):
            if rows[r][c] == "S":
                start = (r, c)
            elif rows[r][c].isdigit():
                markers[int(rows[r][c])] = (r, c)
    total = 0
    here = start
    for number in sorted(markers):
        moves = _leg(rows, here, markers[number])
        if moves == -1:
            return -1
        total += moves
        here = markers[number]
    return total

solo = tracked_grid(["S1"])
expect_grid("plan_survey(one marker next to the pad)", lambda: get("plan_survey")(solo), 1, solo)
cut_rows = ["S.#3", "1.#.", "..#2"]
cut = tracked_grid(cut_rows)
expect_grid("plan_survey(marker 2 cut off)", lambda: get("plan_survey")(cut), -1, cut)
order_rows = ["2...S...1"]
order = tracked_grid(order_rows)
expect_grid("plan_survey(markers out of reading order)", lambda: get("plan_survey")(order), 12, order)

big_rows = []
for r in range(40):
    row = []
    for c in range(40):
        wall = (r % 6 == 3 and c % 13 != 5) or (c % 8 == 6 and r % 11 not in (2, 7))
        row.append("#" if wall else ".")
    big_rows.append(row)
spots = [(0, 0), (39, 39), (0, 39), (39, 0), (20, 20), (10, 30), (30, 10), (2, 18), (37, 25), (19, 1)]
big_rows[spots[0][0]][spots[0][1]] = "S"
for number, (r, c) in enumerate(spots[1:], start=1):
    big_rows[r][c] = str(number)
big_rows = ["".join(row) for row in big_rows]
big = tracked_grid(big_rows)
expect_grid(
    "plan_survey(40 by 40 map, 9 markers)",
    lambda: get("plan_survey")(big),
    _plan(big_rows),
    big,
    budget=9 * 5 * 1600 + 1600,
    hint="Use breadth-first search for each leg, and find the markers in one scan.",
)
```

## Solution

```python
from collections import deque

STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def leg(grid, start, goal):
    distance = {start: 0}
    queue = deque([start])
    while queue:
        r, c = queue.popleft()
        if (r, c) == goal:
            return distance[(r, c)]
        for dr, dc in STEPS:
            nr = r + dr
            nc = c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                if grid[nr][nc] != "#" and (nr, nc) not in distance:
                    distance[(nr, nc)] = distance[(r, c)] + 1
                    queue.append((nr, nc))
    return -1


def plan_survey(grid):
    start = None
    markers = {}
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            square = grid[r][c]
            if square == "S":
                start = (r, c)
            elif square.isdigit():
                markers[int(square)] = (r, c)
    total = 0
    here = start
    for number in sorted(markers):
        moves = leg(grid, here, markers[number])
        if moves == -1:
            return -1
        total += moves
        here = markers[number]
    return total
```

## Restored

The survey core plans the whole day's flight in a moment, marker by marker. The survey office is fully online, and the drones map the ridge from end to end.
