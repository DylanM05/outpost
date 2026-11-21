---
id: method-or-function
kind: predict
title: Method or function
system: Blueprint table
symbol: instrument
scene: console
skills: classes, reading-code
---

## Briefing

The old program still has its own range function, `range_of`, from before drones had a `range_km` method. Before you delete it, make sure you understand how the two compare, and what Python does when you call a method.

## Objective

Predict exactly what this program prints.

## Concept

A method is a function that lives in a class. These two calls do exactly the same thing:

```python
crate.is_heavy()
Crate.is_heavy(crate)
```

The first is the usual way to write it. Python turns it into the second: it finds `is_heavy` in the object's class, and passes the object as `self`.

So the difference between a function and a method isn't what they can do. It's where they live. A function like `range_of(drone)` sits on its own, and works on whatever it's given. A method sits in the class, next to the data it works on, so everything about drones is in one place.

## Hints

1. `kite.battery = 30` changes Kite's battery only. `Drone()` makes a new drone with the class's battery, 90.
2. The first three lines all work out Kite's range: 30 × 40 / 60.
3. Dividing with `/` always gives a float, so ranges print with `.0`.

## Program

```python
class Drone:
    battery = 90
    speed = 40

    def range_km(self):
        return self.battery * self.speed / 60


def range_of(drone):
    return drone.battery * drone.speed / 60


kite = Drone()
kite.battery = 30
print(range_of(kite))
print(kite.range_km())
print(Drone.range_km(kite))
print(Drone().range_km())
```

## Output

```text
20.0
20.0
20.0
60.0
```

## Restored

Three ways of asking, one answer. The old `range_of` can go: the method does the same job, and lives with the drone.
