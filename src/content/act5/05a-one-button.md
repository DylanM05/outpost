---
id: one-button
title: One button
system: Flight planner
symbol: instrument
scene: tests
skills: encapsulation, classes
---

## Briefing

Sending a drone on a delivery takes the planners four steps: work out the round trip, turn it into minutes at the drone's speed, compare that with the battery, and fly. They get one of them wrong about once a week. They'd like one button: "deliver this far", with the drone working out the rest.

## Objective

Give `Drone` a method `deliver(distance)`. A delivery flies `distance` km out and the same distance back. If the drone has enough battery for the whole round trip, it flies it and `deliver` returns `True`. If not, it doesn't fly, and returns `False`.

Keep the steps in private helper methods, whose names start with `_`, so `deliver` is the only new method the planners see.

```python
kite = Drone("Kite")   # 40 km/h, 90 minutes
kite.deliver(10)       # True: 20 km takes 30 minutes
kite.battery_left()    # 60
kite.deliver(30)       # False: 60 km takes 90 minutes
```

## Concept

**Abstraction** means giving people a simple way to use something complicated, and hiding the details they don't need. A planner wants to say "deliver 10 km". They don't want to think about round trips and minutes, and they shouldn't have to.

Encapsulation and abstraction work together, but they aren't the same thing. Encapsulation protects an object's *data*, so it can't get into a bad state. Abstraction hides *how* the object does its job, so the people using it only need to know *what* it does.

Methods can be private too. A helper method whose name starts with `_` is for the class's own use, as a step inside its public methods:

```python
class Crate:
    def ship(self, km):
        cost = self._postage(km)
        ...

    def _postage(self, km):
        return 2 + km * 0.1
```

A class's public methods are its **interface**: the things it promises to do. Keep the interface small, and the class can change how it works inside without breaking anyone who uses it.

## Hints

1. A helper `_minutes_for(km)` can turn a distance into minutes: `km / self.speed * 60`.
2. In `deliver`, work out the minutes for `distance * 2`, and return `False` if that's more than `self._battery`.
3. Otherwise call `self.fly(minutes)` and return `True`.

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

    # Add deliver(distance), and keep its steps in private helpers.


kite = Drone("Kite")
```

## Checks

```python
def delivery(distance, battery=90, speed=40):
    drone = get("Drone")("Kite", speed, battery)
    return (drone.deliver(distance), drone.battery_left())


expect("Kite delivers 10 km", lambda: delivery(10), (True, 60.0))
expect("Kite delivers 30 km", lambda: delivery(30), (True, 0.0))
expect("Kite tries 31 km", lambda: delivery(31), (False, 90), "Don't fly when the round trip needs more battery than the drone has.")
expect(
    "The only new public method is deliver",
    lambda: sorted(name for name in vars(get("Drone")) if not name.startswith("_")),
    ["MAX_BATTERY", "battery_left", "charge", "deliver", "fly", "range_km"],
    "Start helper methods' names with _, so they're private.",
)
```

## Hidden checks

```python
expect("Mule (30 km/h, 45 minutes) delivers 10 km", lambda: delivery(10, 45, 30), (True, 5.0))
expect("Mule (30 km/h, 45 minutes) tries 12 km", lambda: delivery(12, 45, 30), (False, 45))
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

    def deliver(self, distance):
        minutes = self._minutes_for(distance * 2)
        if minutes > self._battery:
            return False
        self.fly(minutes)
        return True

    def _minutes_for(self, km):
        return km / self.speed * 60


kite = Drone("Kite")
print(kite.deliver(10), kite.battery_left())
```

## Restored

The planners press one button now. The drone works out the round trip, and if it can't make it, it says so before it leaves the pad.
