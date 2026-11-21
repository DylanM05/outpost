---
id: same-question
kind: predict
title: Same question, different answers
system: Mixed fleet
symbol: instrument
scene: console
skills: polymorphism, reading-code
---

## Briefing

The fleet board calls `report()` on every drone in the hangar, one after another. `report` is only written once, in `Drone`, and yet the board shows something different for each kind of drone. Work out what it shows.

## Objective

Predict exactly what this program prints.

## Concept

When a method is called on an object, Python always starts looking for it in **the object's own class**, then its parent, and so on. That's true even when the call comes from inside a parent's method.

So when `Drone.report` calls `self.describe()`, and `self` is a cargo drone, Python looks in `CargoDrone` first, and uses its `describe` if it has one. The parent's code calls the child's method without knowing the child exists.

This is **polymorphism**: one call, `drone.report()`, that does the right thing for each kind of object. Code that loops over a mixed list of drones doesn't need to ask what kind each one is.

## Hints

1. `report` is in `Drone` only, so every drone uses it. It prints whatever `self.describe()` returns.
2. Kite is a plain `Drone`, and Mule's class has its own `describe`.
3. Hawk's `describe` starts from the parent's answer, `super().describe()`, and adds to it.

## Program

```python
class Drone:
    def __init__(self, name):
        self.name = name

    def describe(self):
        return f"{self.name}: drone"

    def report(self):
        print(self.describe())


class CargoDrone(Drone):
    def describe(self):
        return f"{self.name}: cargo drone"


class SurveyDrone(Drone):
    def describe(self):
        return super().describe() + ", with camera"


fleet = [Drone("Kite"), CargoDrone("Mule"), SurveyDrone("Hawk")]
for drone in fleet:
    drone.report()
print(len(fleet))
```

## Output

```text
Kite: drone
Mule: cargo drone
Hawk: drone, with camera
3
```

## Restored

One loop, three kinds of drone, and each one describes itself. The fleet board never has to know which is which.
