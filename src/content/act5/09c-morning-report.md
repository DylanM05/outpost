---
id: morning-report
title: Morning report
system: Fleet control
symbol: controller
scene: tests
skills: classes, polymorphism
---

## Briefing

The last piece of fleet control is the morning report the planners read before the day starts: every drone's name plate, from the one that can fly furthest to the one that can fly least.

## Objective

Give `Fleet` a method `report()` that returns a list of every drone's name plate (as `print` would show it), ordered from the longest range to the shortest.

```python
fleet.report()
# ["Hawk (50 km/h, 90 min)", "Kite (40 km/h, 90 min)",
#  "Mule (30 km/h, 90 min)", "Wren (50 km/h, 30 min)"]
```

## Concept

Two special methods do the work here. `sorted()` uses `__lt__` to put the drones in order of range, and `str()` uses `__str__` for each name plate.

`sorted()` puts the smallest first. `reverse=True`, from the survey office, turns the order round, longest range first:

```python
sorted(self._drones, reverse=True)
```

`sorted` returns a new list, so the fleet's own list stays in the order the drones were added.

## Hints

1. Sort the fleet's drones with `sorted(self._drones, reverse=True)`.
2. Loop over the sorted drones, and append `str(drone)` to a list.
3. Return the list.

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

    def deliver(self, distance):
        # A round trip, using the battery in proportion to the range it needs.
        # round() gives the nearest whole number of minutes.
        if self.range_km() == 0 or distance * 2 > self.range_km():
            return False
        self.fly(round(self._battery * distance * 2 / self.range_km()))
        return True

    def __str__(self):
        return f"{self.name} ({self.speed} km/h, {self._battery} min)"

    def __eq__(self, other):
        return self.name == other.name

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


class SurveyDrone(Drone):
    def __init__(self, name, speed=40):
        super().__init__(name, speed)
        self.photos = []

    def photograph(self, area):
        self.fly(2)
        self.photos.append(area)


class Fleet:
    def __init__(self):
        self._drones = []

    def add(self, drone):
        if drone in self._drones:
            raise ValueError(f"{drone.name} is already in the fleet")
        self._drones.append(drone)

    def find(self, name):
        for drone in self._drones:
            if drone.name == name:
                return drone
        return None

    def __len__(self):
        return len(self._drones)

    def dispatch(self, distance):
        able = []
        for drone in self._drones:
            if drone.range_km() >= distance * 2:
                able.append(drone)
        if not able:
            return None
        best = max(able)
        best.deliver(distance)
        return best

    def report(self):
        # Every drone's name plate, longest range first.
        return []


fleet = Fleet()
fleet.add(Drone("Kite"))
fleet.add(SurveyDrone("Hawk", 50))
print(fleet.report())
```

## Checks

```python
def make_fleet():
    Drone, CargoDrone, SurveyDrone = get("Drone"), get("CargoDrone"), get("SurveyDrone")
    fleet = get("Fleet")()
    mule = CargoDrone("Mule")
    mule.load_up(2)
    for drone in [Drone("Kite"), mule, SurveyDrone("Hawk", 50), Drone("Wren", 50, 30)]:
        fleet.add(drone)
    return fleet


expect(
    "report() for a fresh fleet",
    lambda: make_fleet().report(),
    ["Hawk (50 km/h, 90 min)", "Kite (40 km/h, 90 min)", "Mule (30 km/h, 90 min)", "Wren (50 km/h, 30 min)"],
    "Sort the drones longest range first, and use str() for each one.",
)


def after_a_trip():
    fleet = make_fleet()
    fleet.dispatch(20)
    return fleet.report()


expect(
    "report() after dispatch(20)",
    after_a_trip,
    ["Kite (40 km/h, 90 min)", "Mule (30 km/h, 90 min)", "Hawk (50 km/h, 42 min)", "Wren (50 km/h, 30 min)"],
)
```

## Hidden checks

```python
def order_kept():
    fleet = make_fleet()
    fleet.report()
    return fleet.dispatch(20).name


expect("The fleet still dispatches after a report", order_kept, "Hawk")
expect("report() for an empty fleet", lambda: get("Fleet")().report(), [])
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
        # A round trip, using the battery in proportion to the range it needs.
        # round() gives the nearest whole number of minutes.
        if self.range_km() == 0 or distance * 2 > self.range_km():
            return False
        self.fly(round(self._battery * distance * 2 / self.range_km()))
        return True

    def __str__(self):
        return f"{self.name} ({self.speed} km/h, {self._battery} min)"

    def __eq__(self, other):
        return self.name == other.name

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


class SurveyDrone(Drone):
    def __init__(self, name, speed=40):
        super().__init__(name, speed)
        self.photos = []

    def photograph(self, area):
        self.fly(2)
        self.photos.append(area)


class Fleet:
    def __init__(self):
        self._drones = []

    def add(self, drone):
        if drone in self._drones:
            raise ValueError(f"{drone.name} is already in the fleet")
        self._drones.append(drone)

    def find(self, name):
        for drone in self._drones:
            if drone.name == name:
                return drone
        return None

    def __len__(self):
        return len(self._drones)

    def dispatch(self, distance):
        able = []
        for drone in self._drones:
            if drone.range_km() >= distance * 2:
                able.append(drone)
        if not able:
            return None
        best = max(able)
        best.deliver(distance)
        return best

    def report(self):
        plates = []
        for drone in sorted(self._drones, reverse=True):
            plates.append(str(drone))
        return plates


fleet = Fleet()
fleet.add(Drone("Kite"))
fleet.add(SurveyDrone("Hawk", 50))
print(fleet.report())
```

## Restored

Fleet control is finished. The planners read the morning report, send deliveries with one call, and never touch a battery by hand. Every class in it does one job, and they do it together.
