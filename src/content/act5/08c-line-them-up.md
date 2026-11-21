---
id: line-them-up
title: Line them up
system: Name plates
symbol: controller
scene: tests
skills: polymorphism, sorting
---

## Briefing

Before every survey, the drones are lined up on the pad from the shortest range to the longest, so the short hops go first. Sorting them fails with `TypeError: '<' not supported between instances of 'Drone' and 'Drone'`: Python has no idea what makes one drone come before another.

## Objective

Make drones compare by their range, so `sorted()`, `min()`, and `max()` work on a list of drones, and a loaded cargo drone sorts by its reduced range.

```python
pad = [Drone("Kite"), Drone("Wren", 50, 30), CargoDrone("Mule")]
for drone in sorted(pad):
    print(drone)
# Wren (50 km/h, 30 min)    range 25.0
# Mule (30 km/h, 90 min)    range 45.0
# Kite (40 km/h, 90 min)    range 60.0
```

## Concept

`<` calls the special method `__lt__` ("less than"): `a < b` runs `a.__lt__(b)`.

```python
class Crate:
    def __lt__(self, other):
        return self.weight < other.weight
```

`sorted()`, `min()`, and `max()` compare items with `<`, so once a class has `__lt__`, they work on lists of its objects. The survey office sorted crates with `key=`, which also works; `__lt__` makes the order part of the class itself, so every sort uses it without being told.

Compare with `range_km()`, not the battery, and polymorphism takes care of the rest: a cargo drone's own `range_km()` counts its load.

## Hints

1. Define `__lt__(self, other)` in `Drone`.
2. Return whether this drone's range is less than the other's: `self.range_km() < other.range_km()`.
3. `sorted(pad)` then works, and so does `max(pad)` for the drone with the longest range.

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


def take_off_order(drones):
    # Names of the drones, from the shortest range to the longest.
    names = []
    for drone in sorted(drones):
        names.append(drone.name)
    return names


pad = [Drone("Kite"), Drone("Wren", 50, 30), CargoDrone("Mule")]
print(take_off_order(pad))
```

## Checks

```python
def pad():
    mule = get("CargoDrone")("Mule")
    return [get("Drone")("Kite"), get("Drone")("Wren", 50, 30), mule]


def loaded_pad():
    drones = pad()
    drones[2].load_up(5)
    return drones


expect("take_off_order(pad)", lambda: get("take_off_order")(pad()), ["Wren", "Mule", "Kite"])
expect("max(pad).name", lambda: max(pad()).name, "Kite")
expect("take_off_order with Mule carrying 5 kg", lambda: get("take_off_order")(loaded_pad()), ["Mule", "Wren", "Kite"], "Compare range_km(), so a loaded cargo drone uses its reduced range.")
```

## Hidden checks

```python
expect('Drone("Kite") < Drone("Mule", 30)', lambda: get("Drone")("Kite") < get("Drone")("Mule", 30), False)
expect('min(pad).name', lambda: min(pad()).name, "Wren")
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

    def __lt__(self, other):
        return self.range_km() < other.range_km()


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


def take_off_order(drones):
    names = []
    for drone in sorted(drones):
        names.append(drone.name)
    return names


pad = [Drone("Kite"), Drone("Wren", 50, 30), CargoDrone("Mule")]
print(take_off_order(pad))
```

## Restored

The drones line up on the pad by range, shortest first, and a loaded Mule knows its place in the line.
