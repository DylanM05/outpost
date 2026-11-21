---
id: teach-it-to-fly
title: Teach it to fly
system: Blueprint table
symbol: instrument
scene: tests
skills: classes
---

## Briefing

A drone that knows its battery is a start. A drone that can fly, and keep its own battery up to date while it does, is a drone the workshop can use.

## Objective

Give `Drone` a method `fly(minutes)` that takes that many minutes off the drone's battery.

```python
kite = Drone()
kite.fly(30)
kite.battery  # 60
```

## Concept

A class can hold functions as well as values. A function defined inside a class is a **method**, and you call it on an object with a dot:

```python
class Crate:
    weight = 12

    def add(self, kg):
        self.weight = self.weight + kg


crate = Crate()
crate.add(5)
print(crate.weight)  # 17
```

Every method's first parameter is `self`: the object the method was called on. `crate.add(5)` runs `add` with `self` as `crate` and `kg` as `5`, so `self.weight` means *this* crate's weight. You don't pass `self` yourself; Python does it for you.

That's what makes methods useful: the same `add` works on any crate, and changes only the crate it's called on.

## Hints

1. Define `fly` inside the class, indented under `class Drone:`, with the parameters `self` and `minutes`.
2. Inside it, change `self.battery`, not a variable called `battery`.
3. `self.battery = self.battery - minutes`.

## Starter: guided

```python
class Drone:
    battery = 90
    speed = 40

    def fly(self, minutes):
        # Take minutes off this drone's battery, using self.battery.
        print("flying for", minutes, "minutes")


kite = Drone()
kite.fly(30)
print(kite.battery)
```

## Starter: standard

```python
class Drone:
    battery = 90
    speed = 40

    # Add a method fly(self, minutes) that takes minutes off the battery.
```

## Starter: challenge

```python
class Drone:
    battery = 90
    speed = 40
```

## Checks

```python
def flown(*flights):
    drone = get("Drone")()
    for minutes in flights:
        drone.fly(minutes)
    return drone.battery


expect("A drone after fly(30)", lambda: flown(30), 60)
expect("A drone after fly(30), then fly(15)", lambda: flown(30, 15), 45)
```

## Hidden checks

```python
def two_drones():
    kite = get("Drone")()
    mule = get("Drone")()
    kite.fly(50)
    return mule.battery


expect("Flying one drone leaves another's battery alone", two_drones, 90, "Change self.battery, the battery of the drone fly was called on.")
expect("A drone after fly(0)", lambda: flown(0), 90)
```

## Solution

```python
class Drone:
    battery = 90
    speed = 40

    def fly(self, minutes):
        self.battery = self.battery - minutes


kite = Drone()
kite.fly(30)
print(kite.battery)
```

## Restored

`kite.fly(30)`, and Kite's own battery drops to 60. Every drone looks after its own battery now.
