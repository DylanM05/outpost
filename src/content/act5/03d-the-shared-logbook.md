---
id: the-shared-logbook
title: The shared logbook
system: Assembly line
symbol: equipment
scene: tests
skills: classes, debugging
---

## Briefing

Every drone keeps a log of its flights, so the workshop knows when each one is due a service. Except the logs are wrong: Kite's log lists Mule's flights, Mule's lists Kite's, and every new drone arrives with a log already full of flights it never made.

## Objective

1. Fix `Drone` so each drone has a log of its own flights, and a new drone's log starts empty.
2. Keep the full battery, `90`, in a class attribute named `MAX_BATTERY`, and use it as `battery`'s default, so the number is written in one place.

## Concept

Attributes set in the class body are **class attributes**. There's only one of each, and it belongs to the class, so every object shares it. Attributes set on `self`, usually in `__init__`, are **instance attributes**: each object has its own.

```python
class Crate:
    MAX_WEIGHT = 25          # one value, shared by every crate

    def __init__(self, label):
        self.label = label   # each crate's own
        self.items = []      # each crate's own, empty list
```

A class attribute is right for something every object really does share, like a limit that's the same for all of them. Inside a method, read it with the class's name, `Crate.MAX_WEIGHT`. In the class body itself, below where it's set, its name works on its own, like any variable, so it can be a default value: `def __init__(self, label, limit=MAX_WEIGHT):`.

It goes wrong with a value that changes in place, like a list. `log = []` in the class body makes one list, shared by every drone, so `self.log.append(...)` adds to the same list whichever drone flew. Make the list in `__init__`, and every drone gets a new one.

## Hints

1. Move `log = []` into `__init__`, as `self.log = []`.
2. Add `MAX_BATTERY = 90` to the class body, above `__init__`.
3. Use it as the default: `def __init__(self, name, speed=40, battery=MAX_BATTERY):`.

## Starter

```python
class Drone:
    # Every drone keeps a log of its flights.
    log = []

    def __init__(self, name, speed=40, battery=90):
        self.name = name
        self.speed = speed
        self.battery = battery

    def fly(self, minutes):
        self.battery = self.battery - minutes
        self.log.append(minutes)

    def range_km(self):
        return self.battery * self.speed / 60


kite = Drone("Kite")
mule = Drone("Mule", 30)
kite.fly(20)
mule.fly(15)
print(kite.log)
print(mule.log)
```

## Checks

```python
def logs():
    kite = get("Drone")("Kite")
    mule = get("Drone")("Mule", 30)
    kite.fly(20)
    mule.fly(15)
    kite.fly(5)
    return [kite.log, mule.log]


expect("Kite's and Mule's logs", logs, [[20, 5], [15]], "Make each drone's list in __init__.")
expect("Drone.MAX_BATTERY", lambda: get("Drone").MAX_BATTERY, 90)
expect('Drone("Kite").battery', lambda: get("Drone")("Kite").battery, 90)
```

## Hidden checks

```python
def fresh_log():
    get("Drone")("Hawk").fly(10)
    return get("Drone")("Wren", 50).log


expect("A new drone's log starts empty", fresh_log, [])
expect('Drone("Mule", battery=45).battery', lambda: get("Drone")("Mule", battery=45).battery, 45)
check("90 is written once", lambda: source.count("90") == 1, "Use MAX_BATTERY as battery's default instead of writing 90 again.")
```

## Solution

```python
class Drone:
    MAX_BATTERY = 90

    def __init__(self, name, speed=40, battery=MAX_BATTERY):
        self.name = name
        self.speed = speed
        self.battery = battery
        self.log = []

    def fly(self, minutes):
        self.battery = self.battery - minutes
        self.log.append(minutes)

    def range_km(self):
        return self.battery * self.speed / 60


kite = Drone("Kite")
mule = Drone("Mule", 30)
kite.fly(20)
mule.fly(15)
print(kite.log)
print(mule.log)
```

## Restored

Kite's log says 20, Mule's says 15, and a new drone's log is blank. The service schedule finally matches what each drone has flown.
