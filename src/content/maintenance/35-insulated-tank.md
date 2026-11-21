---
id: maintenance-insulated-tank
title: Insulated fuel tank
system: Hangar
symbol: equipment
scene: tests
skills: inheritance
reviewSkill: inheritance
prerequisite: heavier-is-slower
---

## Briefing

Plain `Tank` objects lose 10% of their stored heat per hour. An `InsulatedTank` inherits from `Tank` and cuts that loss rate in half (5% per hour).

## Objective

Given `Tank` in the starter, write `InsulatedTank(Tank)` that overrides `loss_per_hour(self)` to return half of `super().loss_per_hour()` without duplicating `after_hours(self, hours)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Subclass `Tank`: `class InsulatedTank(Tank):`.
2. Override only `loss_per_hour(self)` to return `super().loss_per_hour() / 2`; `after_hours` automatically calls the overridden method!

## Starter

```python
class Tank:
    def __init__(self, heat):
        self.heat = heat

    def loss_per_hour(self):
        return 10

    def after_hours(self, hours):
        return max(0, self.heat - self.loss_per_hour() * hours)
```

## Checks

```python
T = get("Tank")
IT = get("InsulatedTank")
check("InsulatedTank subclasses Tank", lambda: issubclass(IT, T))
expect("Tank after 3 hours", lambda: T(100).after_hours(3), 70)
expect("InsulatedTank after 3 hours", lambda: IT(100).after_hours(3), 85)
```

## Hidden checks

```python
expect("InsulatedTank clamps at 0", lambda: IT(10).after_hours(5), 0)
expect("InsulatedTank.loss_per_hour() is 5", lambda: IT(100).loss_per_hour(), 5)
```

## Solution

```python
class Tank:
    def __init__(self, heat):
        self.heat = heat

    def loss_per_hour(self):
        return 10

    def after_hours(self, hours):
        return max(0, self.heat - self.loss_per_hour() * hours)


class InsulatedTank(Tank):
    def loss_per_hour(self):
        return super().loss_per_hour() / 2
```

## Restored

Insulated tanks reuse `after_hours` directly while cutting hourly heat loss in half.
