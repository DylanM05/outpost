---
id: maintenance-thermostat-band
title: Clamped thermostat band
system: Battery locker
symbol: equipment
scene: tests
skills: encapsulation
reviewSkill: encapsulation
prerequisite: refuse-bad-orders
---

## Briefing

The greenhouse thermostat must stay strictly inside its safe `[low, high]` band. Build a class that enforces its invariants at construction and on every update.

## Objective

Write a class `Thermostat`:

- `__init__(self, low, high, target)` raises `ValueError` if `low >= high` or if `target` is outside `[low, high]`.
- `@property def target(self)` returns the current target temperature.
- `set_target(self, temp)` raises `ValueError` if `temp < low` or `temp > high`; otherwise updates the target.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `low < high` first, store `self._low` and `self._high`, and call `self.set_target(target)` right from `__init__` so the range check lives in one place.

## Starter

```python
```

## Checks

```python
Thermostat = get("Thermostat")
def normal():
    t = Thermostat(10, 25, 18)
    t.set_target(22)
    return t.target
expect("valid target update", normal, 22)
def rejects_out_of_band():
    t = Thermostat(10, 25, 18)
    try:
        t.set_target(30)
        return False
    except ValueError:
        return t.target == 18
check("out-of-band target raises ValueError and preserves old value", rejects_out_of_band)
```

## Hidden checks

```python
Thermostat = get("Thermostat")
def bad_band():
    try:
        Thermostat(20, 20, 20)
        return False
    except ValueError:
        return True
check("low >= high raises ValueError", bad_band)
def boundary_ok():
    t = Thermostat(10, 25, 10)
    t.set_target(25)
    return t.target
expect("exact band boundaries are allowed", boundary_ok, 25)
```

## Solution

```python
class Thermostat:
    def __init__(self, low, high, target):
        if low >= high:
            raise ValueError("low must be less than high")
        self._low = low
        self._high = high
        self._target = None
        self.set_target(target)

    @property
    def target(self):
        return self._target

    def set_target(self, temp):
        if temp < self._low or temp > self._high:
            raise ValueError("target out of band")
        self._target = temp
```

## Restored

The greenhouse thermostat refuses unsafe setpoints before they ever reach the heater relay.
