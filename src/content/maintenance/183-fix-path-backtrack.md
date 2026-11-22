---
id: maintenance-fix-path-backtrack
title: Fix A* path reconstruction returning the route backward
system: Navigation core
symbol: controller
scene: tests
skills: simulation-pathfinding
reviewSkill: simulation-pathfinding
prerequisite: steering-avoidance
---

## Briefing

The pathfinder's `came_from` backtracking helper walks from `goal` back to `start` — and forgot to reverse the result or detect broken chains where `goal` never reaches `start`!

## Objective

Fix `reconstruct_path(came_from, start, goal)` so it returns `[start, ..., goal]` in forward order, or `None` if `goal != start` and walking `came_from` does not reach `start` (without looping forever on a cycle!).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Track a `seen` set while walking `cur = came_from[cur]` so any cycle returns `None`, verify `cur == start`, and call `path.reverse()` before returning!

## Starter

```python
def reconstruct_path(came_from, start, goal):
    path = [goal]
    cur = goal
    while cur in came_from:
        cur = came_from[cur]
        path.append(cur)
        if cur == start:
            break
    return path
```

## Checks

```python
expect("returns forward start-to-goal path", lambda: get("reconstruct_path")({(0, 1): (0, 0), (1, 1): (0, 1)}, (0, 0), (1, 1)), [(0, 0), (0, 1), (1, 1)])
expect("returns None when goal is unreachable", lambda: get("reconstruct_path")({(0, 1): (0, 0)}, (0, 0), (2, 2)), None)
```

## Hidden checks

```python
expect("start == goal returns [start]", lambda: get("reconstruct_path")({}, (1, 1), (1, 1)), [(1, 1)])
expect("disconnected chain returns None", lambda: get("reconstruct_path")({(2, 2): (2, 1)}, (0, 0), (2, 2)), None)
```

## Solution

```python
def reconstruct_path(came_from, start, goal):
    path = [goal]
    cur = goal
    seen = {goal}
    while cur != start:
        if cur not in came_from:
            return None
        cur = came_from[cur]
        if cur in seen:
            return None
        seen.add(cur)
        path.append(cur)
    path.reverse()
    return path
```

## Restored

Path reconstruction now emits clean forward waypoints and rejects broken or cyclic parent chains.
