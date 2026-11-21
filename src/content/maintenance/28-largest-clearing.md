---
id: maintenance-largest-clearing
title: Largest open clearing
system: Drone routes
symbol: equipment
scene: grid
skills: graphs
reviewSkill: graphs
prerequisite: trace-the-route
---

## Briefing

Survey drones need the biggest continuous patch of open ground (`.`) on a snowfield to set up a temporary relay pad. `#` marks crevasses.

## Objective

Write `largest_clearing(grid)`. `grid` is a list of strings made of `.` (open) and `#` (crevasse). Connected open squares share an edge up, down, left, or right. Return the number of squares in the largest connected clearing (`0` if there are none).

```python
largest_clearing([
    "..#.",
    "..##",
    "##..",
])  # 4
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Keep one `seen = set()` across the whole grid so no open square is flood-filled twice.
2. Whenever you hit an unseen `.`, flood-fill its component with a stack or deque, count its size, and update `best`.

## Starter

```python
```

## Checks

```python
g1 = tracked_grid(["..#.", "..##", "##.."])
expect_grid("largest_clearing example", lambda: get("largest_clearing")(g1), 4, g1)
```

## Hidden checks

```python
g_none = tracked_grid(["###", "###"])
expect_grid("all crevasses returns 0", lambda: get("largest_clearing")(g_none), 0, g_none)
g_one = tracked_grid(["#.#", "###", ".#."])
expect_grid("single isolated squares return 1", lambda: get("largest_clearing")(g_one), 1, g_one)
big = tracked_grid(["." * 30 if r != 15 else "#" * 30 for r in range(30)])
expect_grid("30x30 split map", lambda: get("largest_clearing")(big), 15 * 30, big, budget=6 * 900)
```

## Solution

```python
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def largest_clearing(grid):
    seen = set()
    best = 0
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            if (r, c) in seen or grid[r][c] == "#":
                continue
            stack = [(r, c)]
            seen.add((r, c))
            size = 0
            while stack:
                cr, cc = stack.pop()
                size += 1
                for dr, dc in STEPS:
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                        if (nr, nc) not in seen and grid[nr][nc] != "#":
                            seen.add((nr, nc))
                            stack.append((nr, nc))
            if size > best:
                best = size
    return best
```

## Restored

The survey planner picks the widest safe clearing on the first scan.
