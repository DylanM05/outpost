---
id: maintenance-guarded-tank
title: Guarded fuel tank
system: Battery locker
symbol: equipment
scene: tests
skills: encapsulation
reviewSkill: encapsulation
prerequisite: refuse-bad-orders
---

## Briefing

Direct edits to a fuel tank's level have let callers set negative fuel or overfill past capacity. Wrap the tank state behind validated methods.

## Objective

Write a class `FuelTank`:

- `__init__(self, capacity)` stores the capacity (raise `ValueError` if `capacity <= 0`) and starts `_level` at `0`.
- `@property def level(self)` returns the current fuel level.
- `refill(self, amount)` raises `ValueError` if `amount <= 0` or `self._level + amount > self.capacity`; otherwise adds `amount`.
- `drain(self, amount)` raises `ValueError` if `amount <= 0` or `amount > self._level`; otherwise subtracts `amount`.

```python
t = FuelTank(100)
t.refill(40)
t.drain(15)
t.level  # 25
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate every precondition *before* mutating `self._level`, so a rejected call leaves the tank unchanged.
2. Expose `level` with `@property` so callers can read `t.level` without being able to overwrite `t.level = -99`.

## Starter

```python
```

## Checks

```python
FuelTank = get("FuelTank")
def flow():
    t = FuelTank(100)
    t.refill(60)
    t.drain(25)
    return t.level
expect("refill and drain", flow, 35)
def rejects_overfill():
    t = FuelTank(50)
    t.refill(30)
    try:
        t.refill(25)
        return False
    except ValueError:
        return t.level == 30
check("overfill raises ValueError and keeps level unchanged", rejects_overfill)
```

## Hidden checks

```python
FuelTank = get("FuelTank")
def rejects_bad_init():
    try:
        FuelTank(0)
        return False
    except ValueError:
        return True
check("non-positive capacity raises ValueError", rejects_bad_init)
def rejects_overdrain():
    t = FuelTank(50)
    t.refill(10)
    try:
        t.drain(15)
        return False
    except ValueError:
        return t.level == 10
check("overdrain raises ValueError and keeps level unchanged", rejects_overdrain)
def readonly_level():
    t = FuelTank(50)
    try:
        t.level = 10
        return False
    except AttributeError:
        return True
check("level property is read-only", readonly_level)
```

## Solution

```python
class FuelTank:
    def __init__(self, capacity):
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self.capacity = capacity
        self._level = 0

    @property
    def level(self):
        return self._level

    def refill(self, amount):
        if amount <= 0 or self._level + amount > self.capacity:
            raise ValueError("invalid refill amount")
        self._level += amount

    def drain(self, amount):
        if amount <= 0 or amount > self._level:
            raise ValueError("invalid drain amount")
        self._level -= amount
```

## Restored

Fuel levels can't go negative or overflow anymore, and bad orders bounce cleanly without corrupting state.
