---
id: priority-inheritance
title: Prevent priority inversion with priority inheritance
system: Deadlock bench
symbol: controller
scene: tests
skills: cpu-scheduling
---

## Briefing

In 1997, the Mars Pathfinder rover kept rebooting from **priority inversion**: a high-priority task blocked on a mutex held by a low-priority task, while medium-priority tasks kept preempting the low-priority holder! **Priority Inheritance** temporarily boosts a mutex holder's effective priority to the highest priority of any task waiting on it (transitively through chains of locks!).

## Concept

Given:
- `base_priority`: dict `task -> int` (higher integer = higher priority!)
- `holds`: dict `mutex -> holder_task` (which task currently owns each mutex)
- `waiting_on`: dict `task -> mutex` (which mutex, if any, each blocked task is waiting to acquire)

Compute each task's **effective priority**:
- Start with `eff = dict(base_priority)`.
- Whenever task `T` is waiting on mutex `M` held by `H`, `H` inherits `eff[H] = max(eff[H], eff[T])`!
- Repeat to fixpoint (so if high-priority `A` waits on `B`, and `B` waits on `C`, `C` inherits `A`'s priority too — stopping safely even if there is a wait cycle!).

## Objective

Write `effective_priorities(base_priority, holds, waiting_on)` returning a dict `{task: effective_int}` for every task in `base_priority`.

## Hints

1. Iterate `changed = True` while any `task, mutex` in `waiting_on.items()` increases `eff[holder]` (strictly `>` prevents infinite looping even on a deadlock cycle!).
2. Ignore any mutex in `waiting_on` that has no holder in `holds`.

## Starter: guided

```python
def effective_priorities(base_priority, holds, waiting_on):
    eff = dict(base_priority)
    changed = True
    while changed:
        changed = False
        for task, mutex in waiting_on.items():
            holder = holds.get(mutex)
            # If holder exists and eff[task] > eff[holder], boost eff[holder] and set changed = True
            pass
    return eff
```

## Starter: standard

```python
def effective_priorities(base_priority, holds, waiting_on):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "boosts low-priority holder transitively through lock chain",
    lambda: get("effective_priorities")(
        {"high": 100, "med": 50, "low": 10, "idle": 1},
        {"m1": "med", "m2": "low"},
        {"high": "m1", "med": "m2"},
    ),
    {"high": 100, "med": 100, "low": 100, "idle": 1},
)
expect(
    "does not lower a high-priority holder when low-priority waits on it",
    lambda: get("effective_priorities")({"high": 90, "low": 10}, {"m1": "high"}, {"low": "m1"}),
    {"high": 90, "low": 10},
)
```

## Hidden checks

```python
expect(
    "terminates cleanly even on a deadlock wait cycle",
    lambda: get("effective_priorities")({"a": 10, "b": 80}, {"m1": "a", "m2": "b"}, {"b": "m1", "a": "m2"}),
    {"a": 80, "b": 80},
)
```

## Solution

```python
def effective_priorities(base_priority, holds, waiting_on):
    eff = dict(base_priority)
    changed = True
    while changed:
        changed = False
        for task, mutex in waiting_on.items():
            holder = holds.get(mutex)
            if holder in eff and task in eff and eff[task] > eff[holder]:
                eff[holder] = eff[task]
                changed = True
    return eff
```

## Restored

Transitive priority inheritance elevates blocked lock holders so medium-priority work can't starve critical tasks.
