---
id: heavier-is-slower
title: Heavier is slower
system: Hangar
symbol: equipment
scene: tests
skills: inheritance
---

## Briefing

A cargo drone with a load doesn't get as far: every kilogram it carries takes 10% off its range. The planners have been working that out by hand, and when they forget, a loaded Mule runs out of battery short of the drop. A cargo drone's range report should take its load into account.

## Objective

Give `CargoDrone` its own `range_km()`, which returns the range a plain drone would have, reduced by 10% for every kilogram of `load` it's carrying.

```python
mule = CargoDrone("Mule")  # 30 km/h, 90 minutes
mule.range_km()            # 45.0
mule.load_up(2)
mule.range_km()            # 36.0: 45 minus 20%
```

A plain `Drone`'s range doesn't change.

## Concept

A child class can **override** a parent's method by defining one with the same name. Python looks in the object's own class first, so a cargo drone uses `CargoDrone.range_km`, and a plain drone still uses `Drone.range_km`.

An override doesn't have to start from nothing. `super().range_km()` calls the parent's version, so the child can build on its answer:

```python
class ColdCrate(Crate):
    def describe(self):
        return super().describe() + ", keep frozen"
```

This keeps the parent's rule in one place: if `Drone` ever changes how range is worked out, a cargo drone picks up the change and still applies its load on top.

## Hints

1. Define `range_km(self)` inside `CargoDrone`.
2. Start from `super().range_km()`, the plain drone's range.
3. Each kilogram takes off 10%, so multiply by `(1 - self.load / 10)`.

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
        super().__init__(name, speed)
        self.max_load = max_load
        self.load = 0

    def can_lift(self, kg):
        return kg <= self.max_load

    def load_up(self, kg):
        if not self.can_lift(kg):
            raise ValueError("too heavy")
        self.load = kg


mule = CargoDrone("Mule")
mule.load_up(2)
print(mule.range_km())
```

## Checks

```python
def loaded(kg, *args):
    drone = get("CargoDrone")("Mule", *args)
    drone.load_up(kg)
    return drone.range_km()


expect('CargoDrone("Mule") with no load', lambda: loaded(0), 45.0)
expect('CargoDrone("Mule") carrying 2 kg', lambda: loaded(2), 36.0, "Take 10% off for every kilogram of self.load.")
expect('Drone("Kite").range_km()', lambda: get("Drone")("Kite").range_km(), 60.0)
```

## Hidden checks

```python
def flown_and_loaded():
    drone = get("CargoDrone")("Ox", 40, 8)
    drone.fly(30)
    drone.load_up(5)
    return drone.range_km()


expect("Ox at 40 km/h, flown 30 minutes, carrying 5 kg", flown_and_loaded, 20.0, "Build on super().range_km(), so the battery left still counts.")
expect('CargoDrone("Mule") carrying 5 kg', lambda: loaded(5), 22.5)
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
        self.load = 0

    def can_lift(self, kg):
        return kg <= self.max_load

    def load_up(self, kg):
        if not self.can_lift(kg):
            raise ValueError("too heavy")
        self.load = kg

    def range_km(self):
        return super().range_km() * (1 - self.load / 10)


mule = CargoDrone("Mule")
mule.load_up(2)
print(mule.range_km())
```

## Restored

Load Mule with 2 kg, and its range report drops to 36 km before it leaves the pad. Nobody has to remember the 10% any more.
