---
id: maintenance-mixed-power
title: Total power draw
system: Name plates
symbol: controller
scene: tests
skills: polymorphism
reviewSkill: polymorphism
prerequisite: line-them-up
---

## Briefing

Heaters, lamps, and radios compute their wattage differently, yet the breaker panel just needs to ask every device `.watts()` and sum the load.

## Objective

Write two classes and a function:
- `Heater(level)`: `watts(self)` returns `level * 250`.
- `Lamp(bulbs, watts_each=15)`: `watts(self)` returns `bulbs * watts_each`.
- `total_draw(devices)`: takes any list of objects that implement `.watts()` and returns the sum of `device.watts()` (without checking `isinstance`!).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Give both `Heater` and `Lamp` a `watts(self)` method.
2. In `total_draw(devices)`, simply call `device.watts()` on each item — duck typing lets any future device work automatically.

## Starter

```python
```

## Checks

```python
H, L = get("Heater"), get("Lamp")
expect("total_draw on mixed devices", lambda: get("total_draw")([H(2), L(4), L(2, 20)]), 600)
```

## Hidden checks

```python
class _CustomRadio:
    def watts(self):
        return 35

expect("total_draw works on unseen class with watts()", lambda: get("total_draw")([H(1), _CustomRadio()]), 285, "Call device.watts() polymorphically without checking types.")
expect("total_draw([]) is 0", lambda: get("total_draw")([]), 0)
```

## Solution

```python
class Heater:
    def __init__(self, level):
        self.level = level

    def watts(self):
        return self.level * 250


class Lamp:
    def __init__(self, bulbs, watts_each=15):
        self.bulbs = bulbs
        self.watts_each = watts_each

    def watts(self):
        return self.bulbs * self.watts_each


def total_draw(devices):
    return sum(device.watts() for device in devices)
```

## Restored

The breaker panel totals any mix of equipment through one shared `.watts()` interface.
