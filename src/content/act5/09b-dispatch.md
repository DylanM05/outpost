---
id: dispatch
title: Dispatch
system: Fleet control
symbol: controller
scene: tests
skills: classes, polymorphism
---

## Briefing

A delivery request comes in: a distance, and nothing else. The planners want the fleet to choose the drone itself, send it, and say which one went.

## Objective

Give `Fleet` a method `dispatch(distance)`:

1. Of the drones whose range covers the round trip, `distance * 2`, choose the one with the longest range.
2. Send it with its `deliver(distance)` method, and return it.
3. If no drone can make the trip, return `None`.

## Concept

Everything this needs is already in the classes:

- `range_km()` gives each drone's range, and a cargo drone's own version counts its load. `dispatch` doesn't need to know which drones are cargo drones.
- `__lt__` compares drones by range, so `max()` of a list of drones is the one with the longest range.
- `deliver` flies the drone and uses its battery.

`dispatch` decides *which* drone to send. How each drone flies stays the drone's business. Good object-oriented code keeps each decision in the class that owns it.

## Hints

1. Loop over the fleet's drones, and collect the ones whose `range_km()` is at least `distance * 2`.
2. If the list is empty, return `None`. Otherwise `max(able)` is the drone with the longest range.
3. Call `deliver(distance)` on that drone, then return it.

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
        # Send the drone with the longest range that can make the round trip.
        return None


fleet = Fleet()
fleet.add(Drone("Kite"))
fleet.add(SurveyDrone("Hawk", 50))
print(fleet.dispatch(20))
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


def sent(*distances):
    fleet = make_fleet()
    names = []
    for distance in distances:
        drone = fleet.dispatch(distance)
        names.append(drone.name if drone is not None else None)
    return [names, [str(fleet.find(name)) for name in ["Kite", "Mule", "Hawk"]]]


expect("dispatch(20)", lambda: sent(20)[0], ["Hawk"], "Choose the drone with the longest range that can make the round trip.")
expect("dispatch(20) three times", lambda: sent(20, 20, 20)[0], ["Hawk", "Kite", None])
expect(
    "The drones' batteries after two trips of 20 km",
    lambda: sent(20, 20)[1],
    ["Kite (40 km/h, 30 min)", "Mule (30 km/h, 90 min)", "Hawk (50 km/h, 42 min)"],
    "Send the chosen drone with its deliver method.",
)
```

## Hidden checks

```python
expect(
    "dispatch(20), dispatch(20), then dispatch(15)",
    lambda: sent(20, 20, 15),
    [["Hawk", "Kite", "Mule"], ["Kite (40 km/h, 30 min)", "Mule (30 km/h, 15 min)", "Hawk (50 km/h, 42 min)"]],
    "A loaded cargo drone's range counts its load.",
)
expect("dispatch(1) on an empty fleet", lambda: get("Fleet")().dispatch(1), None)
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


fleet = Fleet()
fleet.add(Drone("Kite"))
fleet.add(SurveyDrone("Hawk", 50))
print(fleet.dispatch(20))
```

## Restored

A request comes in, and the fleet sends Hawk, the drone that can go furthest. When nothing can make it, the fleet says so before anything leaves the pad.
