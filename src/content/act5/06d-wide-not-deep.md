---
id: wide-not-deep
title: Wide, not deep
system: Hangar
symbol: equipment
scene: tests
skills: inheritance, debugging
---

## Briefing

The valley's survey drone, Hawk, takes photographs, and it's been acting strangely since the last engineer added it. It flies at a cargo drone's 30 km/h instead of 40, it reports a load limit it doesn't have, and the planners keep trying to send it on deliveries. The last engineer made `SurveyDrone` a child of `CargoDrone`, "because it already had a constructor".

## Objective

Make `SurveyDrone` a kind of `Drone`, not a kind of `CargoDrone`. A survey drone flies at 40 km/h unless it's told otherwise, and has nothing to do with loads. `photograph(area)` should keep working: it uses 2 minutes of battery and adds the area to the drone's `photos`.

```python
hawk = SurveyDrone("Hawk")
hawk.speed                  # 40
hawk.photograph("north ridge")
hawk.photos                 # ["north ridge"]
hawk.battery_left()         # 88
```

## Concept

A child inherits *everything* its parent has, including things that make no sense for it. A survey drone isn't a cargo drone, so inheriting from `CargoDrone` gave it a load limit, a slower speed, and `can_lift`, and made it look like something that delivers.

Ask whether the child **is a** kind of the parent. A cargo drone is a drone. A survey drone is a drone. A survey drone is not a cargo drone, even though they share a lot: what they share comes from `Drone`, so that's the parent they should both have.

That gives a hierarchy that's **wide, not deep**: many children of one parent, side by side, rather than a long chain where each class inherits from the last. Deep chains are hard to follow, and a change near the top has effects all the way down that nobody expects.

When one thing *has* another, rather than *is* one, use an attribute instead. A rack has drones, so it keeps a list of them; it doesn't inherit from `Drone`.

## Hints

1. Change `SurveyDrone`'s parent to `Drone`.
2. Its constructor takes `name` and `speed`, with `speed` 40 unless it's given, and passes both to `super().__init__`.
3. Keep `self.photos = []` in the constructor, and leave `photograph` as it is.

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

    def range_km(self):
        return super().range_km() * (1 - self.load / 10)


class SurveyDrone(CargoDrone):
    def __init__(self, name, speed=30, max_load=5):
        super().__init__(name, speed, max_load)
        self.photos = []

    def photograph(self, area):
        self.fly(2)
        self.photos.append(area)


hawk = SurveyDrone("Hawk")
hawk.photograph("north ridge")
print(hawk.speed, hawk.photos, hawk.battery_left())
```

## Checks

```python
def surveyed(*areas):
    hawk = get("SurveyDrone")("Hawk")
    for area in areas:
        hawk.photograph(area)
    return [hawk.photos, hawk.battery_left()]


check("SurveyDrone's parent is Drone", lambda: get("SurveyDrone").__bases__ == (get("Drone"),), "Write class SurveyDrone(Drone):.")
expect('SurveyDrone("Hawk").speed', lambda: get("SurveyDrone")("Hawk").speed, 40)
expect("Hawk photographs two areas", lambda: surveyed("north ridge", "pass"), [["north ridge", "pass"], 86])
check("A survey drone can't lift", lambda: not hasattr(get("SurveyDrone")("Hawk"), "can_lift"))
```

## Hidden checks

```python
expect('SurveyDrone("Hawk", 50).range_km()', lambda: get("SurveyDrone")("Hawk", 50).range_km(), 75.0)
expect('CargoDrone("Mule").speed', lambda: get("CargoDrone")("Mule").speed, 30, "Leave CargoDrone as it was.")
check("Two survey drones keep their own photos", lambda: surveyed("a") == [["a"], 88] and get("SurveyDrone")("Kite").photos == [])
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


class SurveyDrone(Drone):
    def __init__(self, name, speed=40):
        super().__init__(name, speed)
        self.photos = []

    def photograph(self, area):
        self.fly(2)
        self.photos.append(area)


hawk = SurveyDrone("Hawk")
hawk.photograph("north ridge")
print(hawk.speed, hawk.photos, hawk.battery_left())
```

## Restored

Hawk flies at 40 again, takes its photographs, and nobody tries to hang a crate off it. The hangar's family tree is two children of one parent, side by side.
