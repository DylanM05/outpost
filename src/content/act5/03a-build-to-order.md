---
id: build-to-order
title: Build to order
system: Assembly line
symbol: equipment
scene: tests
skills: classes
---

## Briefing

Every drone the class makes comes out the same: battery 90, speed 40, and no name. The valley's fleet isn't like that. Kite flies at 40, Mule at 30, Wren at 50, and the survey planners need to know which drone is which. Each drone should be built to order.

## Objective

Give `Drone` a constructor that takes a `name` and a `speed`, and stores them on the new drone. Every new drone's `battery` starts at `90`. Keep `fly` and `range_km` working.

```python
mule = Drone("Mule", 30)
mule.name        # "Mule"
mule.speed       # 30
mule.range_km()  # 45.0
```

## Concept

A **constructor** sets up each new object as it's made. In Python, it's a method with a special name, `__init__` (two underscores on each side, said "dunder init"):

```python
class Crate:
    def __init__(self, label, weight):
        self.label = label
        self.weight = weight
        self.opened = False
```

Python calls `__init__` for you every time you make an object, and passes it the arguments you gave the class, after `self`:

```python
spares = Crate("spares", 12)
spares.label   # "spares"
spares.opened  # False
```

`self.label = label` copies the argument onto the object, as one of its **instance attributes**: values that belong to this one object. That's why each crate can have its own label. Values that don't come from an argument, like `opened`, can be set too, so every new object starts in a known state.

`__init__` doesn't return anything. Its job is to fill in the object Python just made.

## Hints

1. Add `def __init__(self, name, speed):` to the class, before `fly`.
2. Store each argument on `self`: `self.name = name`, and the same for `speed`. Then `self.battery = 90`.
3. The class attributes `battery = 90` and `speed = 40` aren't needed any more: the constructor sets both.

## Starter: guided

```python
class Drone:
    def __init__(self, name, speed):
        # Store name and speed on the new drone. Its battery starts at 90.
        self.battery = 90

    def fly(self, minutes):
        self.battery = self.battery - minutes

    def range_km(self):
        return self.battery * self.speed / 60


mule = Drone("Mule", 30)
print(mule.name, mule.range_km())
```

## Starter: standard

```python
class Drone:
    # Add __init__(self, name, speed). It stores both, and sets battery to 90.

    def fly(self, minutes):
        self.battery = self.battery - minutes

    def range_km(self):
        return self.battery * self.speed / 60
```

## Starter: challenge

```python
class Drone:
    battery = 90
    speed = 40

    def fly(self, minutes):
        self.battery = self.battery - minutes

    def range_km(self):
        return self.battery * self.speed / 60
```

## Checks

```python
expect('Drone("Mule", 30).name', lambda: get("Drone")("Mule", 30).name, "Mule")
expect('Drone("Mule", 30).speed', lambda: get("Drone")("Mule", 30).speed, 30)
expect('Drone("Mule", 30).battery', lambda: get("Drone")("Mule", 30).battery, 90)
expect('Drone("Mule", 30).range_km()', lambda: get("Drone")("Mule", 30).range_km(), 45.0)
```

## Hidden checks

```python
def two_drones():
    wren = get("Drone")("Wren", 50)
    kite = get("Drone")("Kite", 40)
    wren.fly(30)
    return [wren.name, wren.range_km(), kite.name, kite.range_km()]


expect("Two drones, one flown", two_drones, ["Wren", 50.0, "Kite", 60.0])
```

## Solution

```python
class Drone:
    def __init__(self, name, speed):
        self.name = name
        self.speed = speed
        self.battery = 90

    def fly(self, minutes):
        self.battery = self.battery - minutes

    def range_km(self):
        return self.battery * self.speed / 60


mule = Drone("Mule", 30)
print(mule.name, mule.range_km())
```

## Restored

Kite, Mule, and Wren each roll off the line with their own name and speed. The planners can tell them apart at last.
