---
id: maintenance-fix-shared-log
title: Fix the shared logbook
system: Blueprint table
symbol: equipment
scene: tests
skills: classes
reviewSkill: classes
prerequisite: build-to-order
---

## Briefing

Two weather stations are somehow recording each other's temperature logs! Someone put a mutable list on the class body instead of giving each station instance its own list. Fix `StationLog`.

## Objective

Fix `StationLog(name, entries=None)` so:
- Each instance keeps its own independent `self.entries` list (copying `entries` if provided, or starting with a fresh `[]`).
- `record(self, value)` appends `value` to `self.entries`.
- `latest(self)` returns the most recently recorded entry, or `None` if empty.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Remove `entries = []` from the class body and initialize `self.entries = [] if entries is None else list(entries)` inside `__init__`.
2. In `latest(self)`, return `None` when `not self.entries`, else `self.entries[-1]`.

## Starter

```python
class StationLog:
    entries = []

    def __init__(self, name, entries=[]):
        self.name = name
        if entries:
            self.entries = entries

    def record(self, value):
        self.entries.append(value)

    def latest(self):
        return self.entries[-1] if self.entries else None
```

## Checks

```python
a = get("StationLog")("North")
b = get("StationLog")("South")
a.record(-12)
expect("North has [-12] and South stays []", lambda: (a.entries, b.entries, b.latest()), ([-12], [], None))
```

## Hidden checks

```python
seed = [1, 2]
c = get("StationLog")("Pass", seed)
c.record(3)
expect("does not mutate caller's seed list", lambda: (seed, c.entries, c.latest()), ([1, 2], [1, 2, 3], 3))
```

## Solution

```python
class StationLog:
    def __init__(self, name, entries=None):
        self.name = name
        self.entries = [] if entries is None else list(entries)

    def record(self, value):
        self.entries.append(value)

    def latest(self):
        return self.entries[-1] if self.entries else None
```

## Restored

Every station writes into its own logbook again, with zero cross-talk.
