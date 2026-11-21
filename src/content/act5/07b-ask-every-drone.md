---
id: ask-every-drone
title: Ask every drone
system: Mixed fleet
symbol: instrument
scene: tests
skills: polymorphism, inheritance
---

## Briefing

The morning status board lists every drone in the hangar with a line about it. Every drone has a battery to report. A cargo drone should also say what it's carrying, and a survey drone how many photographs it's taken. The board itself shouldn't care which is which: it asks every drone the same question.

## Objective

1. `Drone` has a `status()` method. Override it in `CargoDrone` to add the load, and in `SurveyDrone` to add the number of photos:

```text
Kite: 90 min
Mule: 90 min, carrying 2 kg
Hawk: 88 min, photos: 1
```

2. Write a function `fleet_status(drones)` that returns a list with every drone's status, in order.

`fleet_status` must work for any kind of drone, including kinds that don't exist yet.

## Concept

Because every drone has a `status()` method, code that uses drones can call it without knowing which kind of drone it has:

```python
for drone in drones:
    print(drone.status())
```

Each drone answers in its own way. That's polymorphism at work: the same call, a different answer for each class.

The alternative is to ask each object what it is, and branch: "if it's a cargo drone, add the load; if it's a survey drone, add the photos". Every new kind of drone would then mean finding every one of those branches and adding to it. With polymorphism, a new kind of drone brings its own `status()`, and `fleet_status` works with it unchanged.

## Hints

1. In `CargoDrone`, `status` returns `super().status()` followed by `, carrying` and `self.load`.
2. In `SurveyDrone`, use `len(self.photos)` for the number of photos.
3. `fleet_status` loops over the drones and appends `drone.status()` to a list.

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

    def status(self):
        return f"{self.name}: {self._battery} min"


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


class SurveyDrone(Drone):
    def __init__(self, name, speed=40):
        super().__init__(name, speed)
        self.photos = []

    def photograph(self, area):
        self.fly(2)
        self.photos.append(area)


def fleet_status(drones):
    # Return a list of every drone's status.
    return []


mule = CargoDrone("Mule")
mule.load_up(2)
hawk = SurveyDrone("Hawk")
hawk.photograph("north ridge")
print(fleet_status([Drone("Kite"), mule, hawk]))
```

## Checks

```python
def hangar():
    mule = get("CargoDrone")("Mule")
    mule.load_up(2)
    hawk = get("SurveyDrone")("Hawk")
    hawk.photograph("north ridge")
    return [get("Drone")("Kite"), mule, hawk]


expect(
    "fleet_status for Kite, Mule, and Hawk",
    lambda: get("fleet_status")(hangar()),
    ["Kite: 90 min", "Mule: 90 min, carrying 2 kg", "Hawk: 88 min, photos: 1"],
)
expect("fleet_status([])", lambda: get("fleet_status")([]), [])
```

## Hidden checks

```python
def with_a_new_kind():
    class RescueDrone(get("Drone")):
        def status(self):
            return f"{self.name}: standing by"

    return get("fleet_status")([RescueDrone("Lark"), get("CargoDrone")("Ox", 25, 8)])


expect(
    "fleet_status with a kind of drone it's never seen",
    with_a_new_kind,
    ["Lark: standing by", "Ox: 90 min, carrying 0 kg"],
    "Call each drone's own status(), rather than checking what kind of drone it is.",
)
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

    def status(self):
        return f"{self.name}: {self._battery} min"


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

    def status(self):
        return f"{super().status()}, carrying {self.load} kg"


class SurveyDrone(Drone):
    def __init__(self, name, speed=40):
        super().__init__(name, speed)
        self.photos = []

    def photograph(self, area):
        self.fly(2)
        self.photos.append(area)

    def status(self):
        return f"{super().status()}, photos: {len(self.photos)}"


def fleet_status(drones):
    lines = []
    for drone in drones:
        lines.append(drone.status())
    return lines


mule = CargoDrone("Mule")
mule.load_up(2)
hawk = SurveyDrone("Hawk")
hawk.photograph("north ridge")
print(fleet_status([Drone("Kite"), mule, hawk]))
```

## Restored

The status board asks every drone the same question, and gets three kinds of answer. When the valley's rescue drones arrive, the board won't need changing.
