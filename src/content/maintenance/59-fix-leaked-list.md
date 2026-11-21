---
id: maintenance-fix-leaked-list
title: Seal the leaked roster
system: Battery locker
symbol: equipment
scene: tests
skills: encapsulation
reviewSkill: encapsulation
prerequisite: refuse-bad-orders
---

## Briefing

`CrewRoster` below leaks its internal list when callers inspect `roster.members()`, letting outside code mutate the roster and bypass validation. Fix it.

## Objective

Modify `CrewRoster` so that:

1. `add(self, name)` strips whitespace, raises `ValueError` if the result is empty, and ignores duplicates (preserving insertion order).
2. `members(self)` returns a **copy** of the internal list so mutating the returned list never changes the roster.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Return `list(self._members)` from `members()` instead of `self._members`.
2. In `add()`, clean `name = name.strip()`, reject empty strings with `ValueError`, and check `if name not in self._members:`.

## Starter

```python
class CrewRoster:
    def __init__(self):
        self._members = []

    def add(self, name):
        self._members.append(name)

    def members(self):
        return self._members
```

## Checks

```python
CrewRoster = get("CrewRoster")
def keeps_internal_safe():
    r = CrewRoster()
    r.add("  Ines ")
    r.add("Ines")
    r.add("Mara")
    snap = r.members()
    snap.append("Intruder")
    return r.members()
expect("mutating returned list does not affect roster", keeps_internal_safe, ["Ines", "Mara"])
```

## Hidden checks

```python
CrewRoster = get("CrewRoster")
def rejects_blank():
    r = CrewRoster()
    try:
        r.add("   ")
        return False
    except ValueError:
        return r.members() == []
check("blank name raises ValueError", rejects_blank)
```

## Solution

```python
class CrewRoster:
    def __init__(self):
        self._members = []

    def add(self, name):
        cleaned = name.strip()
        if not cleaned:
            raise ValueError("name cannot be blank")
        if cleaned not in self._members:
            self._members.append(cleaned)

    def members(self):
        return list(self._members)
```

## Restored

Outside callers can read the crew list freely without ever corrupting the internal roster.
