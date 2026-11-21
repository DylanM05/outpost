---
id: maintenance-battery-pack
title: Build a battery pack
system: Blueprint table
symbol: equipment
scene: tests
skills: classes
reviewSkill: classes
prerequisite: build-to-order
---

## Briefing

Every portable heater carries a rechargeable battery pack that drains as it runs and recharges up to its capacity. Model it as a clean class.

## Objective

Write a `BatteryPack(capacity, level=None)` class:
- `self.capacity = capacity`, and `self.level = capacity if level is None else level`.
- `use(self, amount)`: if `amount > self.level`, return `False` without changing `self.level`; otherwise subtract `amount` and return `True`.
- `recharge(self, amount)`: adds `amount` to `self.level`, capping at `self.capacity`.
- `percent(self)`: returns `round(100 * self.level / self.capacity)`.

```python
pack = BatteryPack(80)
pack.use(20)      # True (level 60)
pack.percent()    # 75
pack.recharge(50) # level caps at 80
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. In `__init__`, handle `level is None` so `BatteryPack(80)` starts full while `BatteryPack(80, 0)` starts empty.
2. Use `min(self.capacity, self.level + amount)` in `recharge`.

## Starter

```python
```

## Checks

```python
p = get("BatteryPack")(80)
expect("starts full", lambda: (p.level, p.percent()), (80, 100))
expect("use(20) succeeds", lambda: (p.use(20), p.level, p.percent()), (True, 60, 75))
expect("use(70) refused", lambda: (p.use(70), p.level), (False, 60))
p.recharge(50)
expect("recharge caps at capacity", lambda: p.level, 80)
```

## Hidden checks

```python
empty = get("BatteryPack")(50, 0)
expect("explicit 0 level starts empty", lambda: (empty.level, empty.percent()), (0, 0))
expect("two packs have independent levels", lambda: (get("BatteryPack")(100, 10).level, p.level), (10, 80))
```

## Solution

```python
class BatteryPack:
    def __init__(self, capacity, level=None):
        self.capacity = capacity
        self.level = capacity if level is None else level

    def use(self, amount):
        if amount > self.level:
            return False
        self.level -= amount
        return True

    def recharge(self, amount):
        self.level = min(self.capacity, self.level + amount)

    def percent(self):
        return round(100 * self.level / self.capacity)
```

## Restored

Each heater pack tracks its own charge cleanly and refuses to overdraw.
