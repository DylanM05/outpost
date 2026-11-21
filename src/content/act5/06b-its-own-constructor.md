---
id: its-own-constructor
title: Its own constructor
system: Hangar
symbol: equipment
scene: tests
skills: inheritance
---

## Briefing

Cargo drones aren't all the same: Mule carries 5 kg, and the valley's new Ox carries 8. They're slower than other drones too, flying at 30 km/h unless they're told otherwise. Someone gave `CargoDrone` its own constructor to store each one's load limit, and now Mule has no battery at all.

## Objective

Fix `CargoDrone`'s constructor. It takes `name`, `speed` (30 unless it's given), and `max_load` (5 unless it's given). The drone must still be set up the way every drone is, with its name, speed, and a full battery, and `can_lift` uses its own `max_load`.

```python
mule = CargoDrone("Mule")
mule.speed          # 30
mule.battery_left() # 90
ox = CargoDrone("Ox", 25, 8)
ox.can_lift(7)      # True
```

## Concept

When a child class defines `__init__`, it **replaces** the parent's. Python finds the child's constructor first and never runs the parent's, so nothing the parent's constructor sets up exists, and the drone has no `_battery`.

`super()` reaches the parent class from inside the child. Call the parent's constructor through it, and then set up what's new:

```python
class ColdCrate(Crate):
    def __init__(self, label, temperature=-18):
        super().__init__(label)
        self.temperature = temperature
```

`super().__init__(label)` runs `Crate`'s constructor on this same object, so the label is stored exactly as it is for any crate. The parent stays in charge of its own attributes, and the child only adds its own.

## Hints

1. Read the error: `battery_left` fails because `_battery` was never set.
2. Add `super().__init__(name, speed)` as the first line of `CargoDrone.__init__`.
3. Set `self.max_load` from the parameter, and use it in `can_lift` instead of `5`.

## Starter

```python
class Drone:
    MAX_BATTERY = 90

    def __init__(self, name, speed=40, battery=MAX_BATTERY):
        self.name = name
        self.speed = speed
        self._battery = battery

    def battery_left(self):
        return self._battery

    def charge(self, minutes):
        self._battery = min(self._battery + minutes, Drone.MAX_BATTERY)

    def fly(self, minutes):
        if minutes > self._battery:
            raise ValueError("not enough battery")
        self._battery = self._battery - minutes

    def range_km(self):
        return self._battery * self.speed / 60


class CargoDrone(Drone):
    def __init__(self, name, speed=30, max_load=5):
        self.max_load = max_load

    def can_lift(self, kg):
        return kg <= 5


mule = CargoDrone("Mule")
print(mule.battery_left())
```

## Checks

```python
expect('CargoDrone("Mule").speed', lambda: get("CargoDrone")("Mule").speed, 30)
expect('CargoDrone("Mule").battery_left()', lambda: get("CargoDrone")("Mule").battery_left(), 90, "Call the parent's constructor with super().__init__.")
expect('CargoDrone("Ox", 25, 8).can_lift(7)', lambda: get("CargoDrone")("Ox", 25, 8).can_lift(7), True)
expect('CargoDrone("Mule").can_lift(6)', lambda: get("CargoDrone")("Mule").can_lift(6), False)
```

## Hidden checks

```python
expect('CargoDrone("Ox", 25, 8).name', lambda: get("CargoDrone")("Ox", 25, 8).name, "Ox")
expect('CargoDrone("Ox", 25, 8).range_km()', lambda: get("CargoDrone")("Ox", 25, 8).range_km(), 37.5)
expect('CargoDrone("Ox", 25, 8).can_lift(9)', lambda: get("CargoDrone")("Ox", 25, 8).can_lift(9), False)
```

## Solution

```python
class Drone:
    MAX_BATTERY = 90

    def __init__(self, name, speed=40, battery=MAX_BATTERY):
        self.name = name
        self.speed = speed
        self._battery = battery

    def battery_left(self):
        return self._battery

    def charge(self, minutes):
        self._battery = min(self._battery + minutes, Drone.MAX_BATTERY)

    def fly(self, minutes):
        if minutes > self._battery:
            raise ValueError("not enough battery")
        self._battery = self._battery - minutes

    def range_km(self):
        return self._battery * self.speed / 60


class CargoDrone(Drone):
    def __init__(self, name, speed=30, max_load=5):
        super().__init__(name, speed)
        self.max_load = max_load

    def can_lift(self, kg):
        return kg <= self.max_load


mule = CargoDrone("Mule")
print(mule.battery_left())
```

## Restored

Mule has its battery back, and Ox can carry its 8 kg. Each cargo drone is set up as a drone first, then as a cargo drone.
