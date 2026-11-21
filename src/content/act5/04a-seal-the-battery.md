---
id: seal-the-battery
title: Seal the battery
system: Battery locker
symbol: controller
scene: tests
skills: encapsulation, classes
---

## Briefing

Last night Kite's range report said it could fly 333 km. It can't: someone on the night shift "charged" it by typing `kite.battery = 500`, and the program believed them. A battery holds 90 minutes, and nothing should be able to say otherwise.

## Objective

Make `Drone` the only thing that can change a drone's battery:

1. Rename the attribute to `_battery`, to mark it as private to the class.
2. Add `battery_left()`, which returns the minutes left.
3. Add `charge(minutes)`, which adds that many minutes, but never takes the battery above `MAX_BATTERY`.

Code outside the class should use these methods, so a drone has no `battery` attribute any more.

```python
kite = Drone("Kite")
kite.fly(50)
kite.charge(20)
kite.battery_left()  # 60
kite.charge(100)
kite.battery_left()  # 90
```

## Concept

**Encapsulation** means keeping an object's data inside it, and letting the outside world change it only through the object's methods. The methods can then guarantee the rules: a battery is never above its maximum, and every flight is logged. Nobody has to remember the rules, because nobody can get round them by accident.

Python marks an attribute as private with a name that starts with an underscore:

```python
class Crate:
    MAX_WEIGHT = 25

    def __init__(self, label):
        self.label = label
        self._weight = 0

    def weight(self):
        return self._weight
```

`_weight` tells everyone reading the code: this belongs to the class, so use its methods instead. Methods inside the class use `self._weight` freely. Code outside it, like `crate._weight = 500`, would still run, but it breaks the agreement, and code reviews catch it.

The methods that change the data are where the rules live. Here, `charge` is the one place that has to make sure the battery stops at its maximum.

## Hints

1. Rename every `self.battery` inside the class to `self._battery`, and fix the line at the bottom of the program, which reached into the drone.
2. `battery_left` returns `self._battery`. `charge` adds the minutes, then brings the total back down to `Drone.MAX_BATTERY` if it went over.
3. `if self._battery > Drone.MAX_BATTERY:` then `self._battery = Drone.MAX_BATTERY`. Or, in one line, `min(self._battery + minutes, Drone.MAX_BATTERY)`: `min()` returns the smaller of its arguments.

## Starter

```python
class Drone:
    MAX_BATTERY = 90

    def __init__(self, name, speed=40, battery=MAX_BATTERY):
        self.name = name
        self.speed = speed
        self.battery = battery

    def fly(self, minutes):
        self.battery = self.battery - minutes

    def range_km(self):
        return self.battery * self.speed / 60


kite = Drone("Kite")
kite.battery = 500  # How the night shift "charged" Kite.
print(kite.range_km())
```

## Checks

```python
def drone_after(*steps):
    drone = get("Drone")("Kite")
    for method, minutes in steps:
        getattr(drone, method)(minutes)
    return drone


check(
    "A drone has no public battery attribute",
    lambda: not hasattr(get("Drone")("Kite"), "battery"),
    "Rename the attribute to _battery, inside the class and out.",
)
expect('Drone("Kite").battery_left()', lambda: get("Drone")("Kite").battery_left(), 90)
expect("After fly(50) and charge(20)", lambda: drone_after(("fly", 50), ("charge", 20)).battery_left(), 60)
expect("After fly(50) and charge(100)", lambda: drone_after(("fly", 50), ("charge", 100)).battery_left(), 90, "charge must stop at MAX_BATTERY.")
```

## Hidden checks

```python
expect('Drone("Kite").range_km()', lambda: get("Drone")("Kite").range_km(), 60.0)
expect("After charge(10) on a full battery", lambda: drone_after(("charge", 10)).battery_left(), 90)
expect('Drone("Mule", 30, 45).battery_left()', lambda: get("Drone")("Mule", 30, 45).battery_left(), 45)
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
        self._battery = self._battery - minutes

    def range_km(self):
        return self._battery * self.speed / 60


kite = Drone("Kite")
kite.fly(50)
kite.charge(500)
print(kite.range_km())
```

## Restored

Charge Kite as much as you like: it stops at 90 minutes, and its range report says 60 km, which is true.
