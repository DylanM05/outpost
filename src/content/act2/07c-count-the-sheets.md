---
id: count-the-sheets
title: Count the sheets
system: Ridge map
symbol: controller
scene: grid
skills: graphs, hashing
---

## Briefing

The thin ice on the ridge forms separate sheets, and each one needs its own warning beacon. The planners want to know how many beacons to carry. Their counting program floods each sheet over and over, once for every square in it.

## Objective

`count_sheets(grid)` returns how many separate sheets of `~` the map has. Two `~` squares are in the same sheet if you can step from one to the other, up, down, left, or right, without leaving thin ice. Make it read each square only a few times, without changing its answers.

```python
count_sheets([
    "~~.~",
    "...~",
    "~..~",
])  # 3
```

The hidden test uses a 40 by 40 map and allows 6 cell reads per square.

## Concept

Counting sheets is flood fill, repeated. Scan every square on the map. When you reach a thin-ice square that no flood has found yet, it must belong to a new sheet: count it, then flood fill from it so the rest of that sheet is marked as found.

The trick is to share **one** `found` set across every flood. Once a sheet has been flooded, all its squares are in the set, so the scan skips them, and each sheet is flooded exactly once.

The current program floods from every single square, with a fresh set each time, so a sheet of 500 squares gets flooded 500 times. In the language of graphs, each sheet is a **connected component**, and counting components this way is linear in the size of the map.

## Hints

1. Make `found = set()` once, before scanning, and pass it to every flood.
2. Scan with `for r in range(len(grid)):` and `for c in range(len(grid[r])):`. When `grid[r][c] == "~"` and `(r, c)` isn't in `found`, add 1 to the count and flood from there.
3. The flood adds every square it reaches to the shared `found`, so later squares of the same sheet are skipped.

## Starter: guided

```python
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def flood(grid, r, c, found):
    found.add((r, c))
    to_explore = [(r, c)]
    while to_explore:
        r, c = to_explore.pop()
        for dr, dc in STEPS:
            nr = r + dr
            nc = c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                if grid[nr][nc] == "~" and (nr, nc) not in found:
                    found.add((nr, nc))
                    to_explore.append((nr, nc))


def count_sheets(grid):
    found = set()
    sheets = 0
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            # If this square is thin ice that no flood has found yet,
            # it starts a new sheet: count it, and flood from it.
            print(r, c)
    return sheets


print(count_sheets(["~~.~", "...~", "~..~"]))
```

## Starter: standard

```python
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def flood(grid, r, c, found):
    found.add((r, c))
    to_explore = [(r, c)]
    while to_explore:
        r, c = to_explore.pop()
        for dr, dc in STEPS:
            nr = r + dr
            nc = c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                if grid[nr][nc] == "~" and (nr, nc) not in found:
                    found.add((nr, nc))
                    to_explore.append((nr, nc))


def count_sheets(grid):
    # Correct, but it floods every sheet once per square in it. Share one
    # found set instead, and only flood from squares it doesn't have yet.
    sheets = 0
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            if grid[r][c] == "~":
                sheet = set()
                flood(grid, r, c, sheet)
                if min(sheet) == (r, c):
                    sheets += 1
    return sheets
```

## Starter: challenge

```python
```

## Checks

```python
small = tracked_grid(["~~.~", "...~", "~..~"])
expect_grid("count_sheets(3 by 4 map)", lambda: get("count_sheets")(small), 3, small)
ridge = tracked_grid([
    "~~..~~~.",
    "~...~.~.",
    "..#.~~~.",
    "~~#.....",
    "~~#~~.~~",
    "...~~.~.",
])
expect_grid("count_sheets(6 by 8 map)", lambda: get("count_sheets")(ridge), 5, ridge, budget=6 * 48)
```

## Hidden checks

```python
dry = tracked_grid(["..", ".."])
expect_grid("count_sheets(no ice)", lambda: get("count_sheets")(dry), 0, dry)
frozen = tracked_grid(["~~", "~~"])
expect_grid("count_sheets(all ice)", lambda: get("count_sheets")(frozen), 1, frozen)
checker = tracked_grid(["~.~", ".~.", "~.~"])
expect_grid("count_sheets(checkerboard)", lambda: get("count_sheets")(checker), 5, checker)
rows = []
for r in range(40):
    rows.append("".join("~" if (r // 5 + c // 5) % 2 == 0 or (r % 5 == 2 and c % 5 == 2) else "." for c in range(40)))
def reference(rows):
    seen = set()
    count = 0
    for r in range(len(rows)):
        for c in range(len(rows[r])):
            if rows[r][c] == "~" and (r, c) not in seen:
                count += 1
                stack = [(r, c)]
                seen.add((r, c))
                while stack:
                    a, b = stack.pop()
                    for da, db in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                        na, nb = a + da, b + db
                        if 0 <= na < len(rows) and 0 <= nb < len(rows[na]) and rows[na][nb] == "~" and (na, nb) not in seen:
                            seen.add((na, nb))
                            stack.append((na, nb))
    return count
big = tracked_grid(rows)
expect_grid(
    "count_sheets(40 by 40 map)",
    lambda: get("count_sheets")(big),
    reference(rows),
    big,
    budget=6 * 1600,
    hint="Share one found set, and flood each sheet only once.",
)
```

## Solution

```python
STEPS = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def flood(grid, r, c, found):
    found.add((r, c))
    to_explore = [(r, c)]
    while to_explore:
        r, c = to_explore.pop()
        for dr, dc in STEPS:
            nr = r + dr
            nc = c + dc
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]):
                if grid[nr][nc] == "~" and (nr, nc) not in found:
                    found.add((nr, nc))
                    to_explore.append((nr, nc))


def count_sheets(grid):
    found = set()
    sheets = 0
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            if grid[r][c] == "~" and (r, c) not in found:
                sheets += 1
                flood(grid, r, c, found)
    return sheets
```

## Restored

Five beacons for five sheets, and the count comes back before the planners have finished their coffee.
