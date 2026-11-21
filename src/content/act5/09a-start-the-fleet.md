---
id: start-the-fleet
title: Start the fleet
system: Fleet control
symbol: controller
scene: tests
skills: classes, encapsulation
---

## Briefing

Every class the workshop needs is ready: drones that guard their batteries and refuse bad flights, cargo drones that know their loads, survey drones with cameras, and name plates, equality, and ordering for all of them. What's missing is the thing the planners actually use: the fleet. Over the next three jobs, you'll build it.

`deliver` is back in `Drone`, rewritten to work from `range_km()`, so a loaded cargo drone uses its battery faster.

## Objective

Write a class `Fleet` that keeps the workshop's drones:

- `Fleet()` makes an empty fleet.
- `add(drone)` adds a drone. A drone that's already in the fleet (one with the same name) is refused with a `ValueError`.
- `find(name)` returns the drone with that name, or `None` if there isn't one.
- `len(fleet)` gives the number of drones in it.

## Concept

This is the same shape as the charging rack: a class that holds a list of objects and works through their methods. Two things are new.

`add` can lean on `__eq__`: `drone in self._drones` uses `==`, which compares names, so a second record of Kite counts as already in the fleet.

`len(fleet)` calls another special method, `__len__`, which returns the number of items:

```python
class Shelf:
    def __len__(self):
        return len(self._crates)
```

Any class that holds a collection of things can define it, and `len()` works on it like on a list.

## Hints

1. Keep the drones in a private list made in `__init__`.
2. In `add`, raise `ValueError` if `drone in self._drones`, and otherwise append it.
3. `find` loops and compares `drone.name == name`, returning `None` after the loop. `__len__` returns `len(self._drones)`.

## Starter: guided

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
        # Refuse a drone that's already in the fleet with a ValueError.
        self._drones.append(drone)

    def find(self, name):
        # Return the drone with this name, or None.
        return None

    # Add __len__.


fleet = Fleet()
fleet.add(Drone("Kite"))
fleet.add(SurveyDrone("Hawk", 50))
print(len(fleet), fleet.find("Hawk"))
```

## Starter: challenge

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


def refuses_duplicate():
    fleet = make_fleet()
    try:
        fleet.add(get("Drone")("Kite", 40, 20))
    except ValueError:
        return len(fleet)
    return "added"


expect("len() of a fleet of four", lambda: len(make_fleet()), 4)
expect('find("Hawk")', lambda: str(make_fleet().find("Hawk")), "Hawk (50 km/h, 90 min)")
expect('find("Lark")', lambda: make_fleet().find("Lark"), None)
expect("Adding a second Kite", refuses_duplicate, 4, "Raise ValueError when the drone is already in the fleet.")
```

## Hidden checks

```python
expect("len(Fleet())", lambda: len(get("Fleet")()), 0)
check("Two fleets keep their own drones", lambda: len(get("Fleet")()) == 0 and len(make_fleet()) == 4 and get("Fleet")().find("Kite") is None)
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


fleet = Fleet()
fleet.add(Drone("Kite"))
fleet.add(SurveyDrone("Hawk", 50))
print(len(fleet), fleet.find("Hawk"))
```

## Restored

The fleet knows its drones by name, won't take the same drone twice, and can say how many it has.
