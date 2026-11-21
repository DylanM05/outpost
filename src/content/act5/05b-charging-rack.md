---
id: charging-rack
title: Charging rack
system: Flight planner
symbol: instrument
scene: tests
skills: classes, encapsulation
---

## Briefing

The workshop's charging rack has a few bays. Right now, charging means walking along the rack and charging each drone by hand. The rack should look after its own drones: take one if there's a bay free, and charge everything in it at once.

## Objective

Write a class `Rack` that holds drones:

- `Rack(bays)` makes an empty rack with that many bays.
- `dock(drone)` puts the drone in the rack and returns `True`, or returns `False` if every bay is full.
- `charge_all(minutes)` charges every docked drone by that many minutes.
- `docked()` returns the names of the docked drones, in the order they were docked.

```python
rack = Rack(2)
rack.dock(kite)      # True
rack.dock(mule)      # True
rack.dock(wren)      # False: no bay free
rack.docked()        # ["Kite", "Mule"]
rack.charge_all(30)  # charges Kite and Mule
```

## Concept

Objects can hold other objects. A rack *has* drones, so a `Rack` keeps a list of the `Drone` objects docked in it:

```python
class Shelf:
    def __init__(self, slots):
        self.slots = slots
        self._crates = []
```

Its methods work through those objects' own methods: to charge a drone, the rack calls the drone's `charge`, rather than changing its battery itself. Each class does its own job: the drone keeps its battery's rules, and the rack only decides which drones to charge.

This is how object-oriented programs are designed. Look at the problem for its things (a drone, a rack), give each one a class, and decide which class is responsible for which job. Objects then work together by calling each other's methods.

## Hints

1. In `__init__`, keep `bays` and an empty list for the docked drones.
2. `dock` compares the list's length with the number of bays before appending.
3. `charge_all` loops over the docked drones and calls `drone.charge(minutes)`. `docked` loops over them too, appending each `drone.name` to a new list.

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


class Rack:
    def __init__(self, bays):
        self.bays = bays
        self._drones = []

    def dock(self, drone):
        # Return False if every bay is full. Otherwise dock the drone and return True.
        return False

    def charge_all(self, minutes):
        # Charge every docked drone, using its own charge method.
        return

    def docked(self):
        # Return a list of the docked drones' names.
        return []


rack = Rack(2)
print(rack.dock(Drone("Kite", battery=20)))
print(rack.docked())
```

## Starter: standard

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


# Write the Rack class: Rack(bays), dock(drone), charge_all(minutes), docked().
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
```

## Checks

```python
def scenario():
    Drone, Rack = get("Drone"), get("Rack")
    kite, mule, wren = Drone("Kite", battery=20), Drone("Mule", 30, 70), Drone("Wren", 50, 10)
    rack = Rack(2)
    docks = [rack.dock(kite), rack.dock(mule), rack.dock(wren)]
    rack.charge_all(30)
    return {"docks": docks, "docked": rack.docked(), "batteries": [kite.battery_left(), mule.battery_left(), wren.battery_left()]}


expect("Docking three drones in two bays", lambda: scenario()["docks"], [True, True, False])
expect("docked()", lambda: scenario()["docked"], ["Kite", "Mule"])
expect(
    "Batteries after charge_all(30): Kite, Mule, and Wren (not docked)",
    lambda: scenario()["batteries"],
    [50, 90, 10],
    "Charge each docked drone through its own charge method, so it stops at 90.",
)
```

## Hidden checks

```python
expect("An empty rack's docked()", lambda: get("Rack")(3).docked(), [])


def two_racks():
    Drone, Rack = get("Drone"), get("Rack")
    first, second = Rack(1), Rack(1)
    first.dock(Drone("Kite"))
    return [second.dock(Drone("Mule")), second.docked()]


expect("Two racks keep their own drones", two_racks, [True, ["Mule"]], "Make each rack's list in __init__.")
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


class Rack:
    def __init__(self, bays):
        self.bays = bays
        self._drones = []

    def dock(self, drone):
        if len(self._drones) >= self.bays:
            return False
        self._drones.append(drone)
        return True

    def charge_all(self, minutes):
        for drone in self._drones:
            drone.charge(minutes)

    def docked(self):
        names = []
        for drone in self._drones:
            names.append(drone.name)
        return names


rack = Rack(2)
print(rack.dock(Drone("Kite", battery=20)))
print(rack.docked())
```

## Restored

The rack takes two drones, refuses a third, and charges what it holds in one go, stopping each one at full.
