---
id: print-a-drone
title: Print a drone
system: Name plates
symbol: controller
scene: tests
skills: polymorphism, classes
---

## Briefing

When the planners print a drone, they get `<__main__.Drone object at 0x10a2c3f50>`, which tells them nothing they want to know. A drone should print as its name plate: its name, speed, and battery.

## Objective

Make a drone turn into text as its name plate, wherever Python needs it as text: in `print`, `str()`, and f-strings.

```python
kite = Drone("Kite")
print(kite)        # Kite (40 km/h, 90 min)
str(CargoDrone("Mule"))  # "Mule (30 km/h, 90 min)"
```

## Concept

Python has a set of method names it calls for you, at particular moments. They start and end with two underscores, like `__init__`, and they're called **special methods**, or **dunder methods**. Defining one lets your objects work with Python's own features.

`__str__` is called whenever Python needs an object as text: `print(kite)`, `str(kite)`, and `f"{kite}"` all call `kite.__str__()`. It returns the string:

```python
class Crate:
    def __str__(self):
        return f"crate of {self.label}"
```

Without one, Python uses a default that shows the class's name and where the object is in memory, which is only useful for telling objects apart.

A list of drones prints each one with a different special method, `__repr__`, meant for programmers rather than name plates. Define `__repr__` too if you want lists of drones to print nicely.

Special methods are inherited like any other, so every kind of drone gets the name plate.

## Hints

1. The starter's `plate()` method already builds the text. Python never calls a method by that name.
2. Rename `plate` to `__str__`, two underscores on each side.
3. `print(kite)` should now show the plate.

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

    def plate(self):
        return f"{self.name} ({self.speed} km/h, {self._battery} min)"


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


kite = Drone("Kite")
print(kite)
```

## Checks

```python
expect('str(Drone("Kite"))', lambda: str(get("Drone")("Kite")), "Kite (40 km/h, 90 min)")
expect('str(CargoDrone("Mule"))', lambda: str(get("CargoDrone")("Mule")), "Mule (30 km/h, 90 min)")
expect('f"Next out: {wren}"', lambda: f"Next out: {get('Drone')('Wren', 50, 30)}", "Next out: Wren (50 km/h, 30 min)")
```

## Hidden checks

```python
def flown():
    kite = get("Drone")("Kite")
    kite.fly(25)
    return str(kite)


expect("A drone's plate after flying", flown, "Kite (40 km/h, 65 min)")
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

    def __str__(self):
        return f"{self.name} ({self.speed} km/h, {self._battery} min)"


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


kite = Drone("Kite")
print(kite)
```

## Restored

`print(kite)` shows `Kite (40 km/h, 90 min)`. The planners read the hangar at a glance.
