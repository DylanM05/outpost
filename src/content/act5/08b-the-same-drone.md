---
id: the-same-drone
title: The same drone
system: Name plates
symbol: controller
scene: tests
skills: polymorphism, classes
---

## Briefing

The valley sends the workshop its own list of drones, and the workshop checks it against the hangar's. Every check says the lists have nothing in common, though half the drones are on both. A drone on the valley's list is a different object from the one in the hangar, even when it's the same drone, and Python only calls two objects equal if they're the same object.

## Objective

Make two drones equal when they have the same name, since every drone's name is unique in the fleet.

```python
Drone("Kite") == Drone("Kite")       # True
Drone("Kite") == Drone("Mule")       # False
Drone("Kite") in [Drone("Mule"), Drone("Kite")]  # True
```

## Concept

`==` calls the special method `__eq__`: `a == b` runs `a.__eq__(b)`, and its result is the answer.

```python
class Crate:
    def __eq__(self, other):
        return self.label == other.label
```

Without one, objects are only equal to themselves: two separately made drones are never `==`, even with the same name. Defining `__eq__` lets your class decide what "the same" means for it. Here, two records with the same name are the same drone.

Anything built on `==` follows: `in`, a list's `count()` and `remove()`, and `!=`, which Python works out as the opposite of `__eq__`.

One side effect: a class that defines `__eq__` can no longer be put in a set or used as a dictionary key, unless it also defines another special method, `__hash__`. Keep drones in lists.

## Hints

1. Define `__eq__(self, other)` in `Drone`.
2. Compare the two drones' names: `self.name == other.name`.
3. Return the result of the comparison.

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

    def __str__(self):
        return f"{self.name} ({self.speed} km/h, {self._battery} min)"


def in_both(hangar, valley):
    # The names of drones on both lists.
    names = []
    for drone in hangar:
        if drone in valley:
            names.append(drone.name)
    return names


hangar = [Drone("Kite"), Drone("Mule", 30), Drone("Wren", 50)]
valley = [Drone("Wren", 50), Drone("Hawk"), Drone("Kite")]
print(in_both(hangar, valley))
```

## Checks

```python
expect('Drone("Kite") == Drone("Kite")', lambda: get("Drone")("Kite") == get("Drone")("Kite"), True)
expect('Drone("Kite") == Drone("Mule")', lambda: get("Drone")("Kite") == get("Drone")("Mule"), False)
expect(
    "in_both(hangar, valley)",
    lambda: get("in_both")([get("Drone")("Kite"), get("Drone")("Mule", 30), get("Drone")("Wren", 50)], [get("Drone")("Wren", 50), get("Drone")("Hawk"), get("Drone")("Kite")]),
    ["Kite", "Wren"],
)
```

## Hidden checks

```python
expect("The same drone, recorded with a different battery", lambda: get("Drone")("Kite", 40, 30) == get("Drone")("Kite"), True)
expect('Drone("Kite") != Drone("Mule")', lambda: get("Drone")("Kite") != get("Drone")("Mule"), True)
expect("count() on a list with Kite twice", lambda: [get("Drone")("Kite"), get("Drone")("Mule"), get("Drone")("Kite")].count(get("Drone")("Kite")), 2)
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

    def __eq__(self, other):
        return self.name == other.name


def in_both(hangar, valley):
    names = []
    for drone in hangar:
        if drone in valley:
            names.append(drone.name)
    return names


hangar = [Drone("Kite"), Drone("Mule", 30), Drone("Wren", 50)]
valley = [Drone("Wren", 50), Drone("Hawk"), Drone("Kite")]
print(in_both(hangar, valley))
```

## Restored

Kite and Wren are on both lists. The valley and the workshop finally agree on which drones they share.
