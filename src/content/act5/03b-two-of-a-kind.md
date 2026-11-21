---
id: two-of-a-kind
kind: predict
title: Two of a kind
system: Assembly line
symbol: equipment
scene: console
skills: classes, reading-code
---

## Briefing

The night shift swears that flying the spare drone drained Mule's battery, even though Mule never left the hangar. Read their program and find out whether they're right.

## Objective

Predict exactly what this program prints.

## Concept

Every object made from a class is separate, with its own attributes. Flying one drone changes that drone and no other.

A variable doesn't hold an object, though. It **refers** to one, like a label tied to it. Assigning one variable to another ties a second label to the same object; it doesn't make a copy:

```python
spare = mule
```

Now `spare` and `mule` are two names for one drone. Change it through either name, and the other name sees the change, just as with two names for one list in the calibration lab.

To get a second drone, make one: `Drone("Spare", 30)`.

## Hints

1. Kite and Mule are two different drones. `kite.fly(20)` changes only Kite.
2. `spare = mule` doesn't build a drone. `spare` is another name for Mule.
3. So `spare.fly(50)` flies Mule, and `spare.name` is Mule's name.

## Program

```python
class Drone:
    def __init__(self, name, speed):
        self.name = name
        self.speed = speed
        self.battery = 90

    def fly(self, minutes):
        self.battery = self.battery - minutes


kite = Drone("Kite", 40)
mule = Drone("Mule", 30)
kite.fly(20)
print(kite.name, kite.battery)
print(mule.name, mule.battery)

spare = mule
spare.fly(50)
print(mule.battery)
print(spare.name)
```

## Output

```text
Kite 70
Mule 90
40
Mule
```

## Restored

The night shift was right, and so was the program: there was no spare drone, only a second name for Mule. The workshop builds a real spare.
