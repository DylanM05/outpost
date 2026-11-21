---
id: ask-for-the-range
title: Ask for the range
system: Blueprint table
symbol: instrument
scene: tests
skills: classes
---

## Briefing

The survey planners keep asking the workshop the same question: how far can this drone fly right now? A drone has everything it needs to answer that itself.

## Objective

Give `Drone` a method `range_km()` that **returns** how far the drone can fly on the battery it has left: `battery * speed / 60`.

```python
kite = Drone()
kite.range_km()  # 60.0
kite.fly(45)
kite.range_km()  # 30.0
```

## Concept

Methods can return values, just as functions can. A method that answers a question about its object reads the object's attributes through `self`, and returns the answer:

```python
class Crate:
    weight = 12

    def is_heavy(self):
        return self.weight > 20
```

`crate.is_heavy()` gives back `True` or `False` for the program to use, the same way `len(items)` does. A method with no `return` gives back `None`, just like a function.

Since the answer comes from the object's current attributes, it's always up to date: fly the drone, and its range shrinks with its battery.

## Hints

1. Define `range_km(self)` inside the class, after `fly`.
2. Use the drone's own values: `self.battery` and `self.speed`.
3. `return self.battery * self.speed / 60`, rather than printing it.

## Starter: guided

```python
class Drone:
    battery = 90
    speed = 40

    def fly(self, minutes):
        self.battery = self.battery - minutes

    def range_km(self):
        # Return this drone's range, rather than printing it.
        print(self.battery * self.speed / 60)


kite = Drone()
print(kite.range_km())
```

## Starter: standard

```python
class Drone:
    battery = 90
    speed = 40

    def fly(self, minutes):
        self.battery = self.battery - minutes

    # Add range_km(self), which returns battery * speed / 60.
```

## Starter: challenge

```python
class Drone:
    battery = 90
    speed = 40

    def fly(self, minutes):
        self.battery = self.battery - minutes
```

## Checks

```python
def range_after(*flights):
    drone = get("Drone")()
    for minutes in flights:
        drone.fly(minutes)
    return drone.range_km()


expect("Drone().range_km()", lambda: range_after(), 60.0)
expect("range_km() after fly(45)", lambda: range_after(45), 30.0)
```

## Hidden checks

```python
def faster():
    drone = get("Drone")()
    drone.speed = 60
    return drone.range_km()


expect("range_km() with speed 60", faster, 90.0, "Use self.speed, so each drone's own speed counts.")
expect("range_km() with an empty battery", lambda: range_after(90), 0.0)
```

## Solution

```python
class Drone:
    battery = 90
    speed = 40

    def fly(self, minutes):
        self.battery = self.battery - minutes

    def range_km(self):
        return self.battery * self.speed / 60


kite = Drone()
print(kite.range_km())
```

## Restored

The planners stop asking the workshop. They ask the drones, which always know their own range.
