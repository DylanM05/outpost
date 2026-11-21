---
id: draw-up-a-class
title: Draw up a class
system: Blueprint table
symbol: instrument
scene: tests
skills: classes
---

## Briefing

The workshop's program keeps each drone as a pile of loose variables: `kite_battery`, `kite_speed`, `mule_battery`, `mule_speed`, and so on for every drone in the valley's fleet. Every new drone means a new set of names, and every function needs all of them passed in.

Python has a better way to keep things that belong together, together. Start with a blueprint for a drone.

## Objective

1. Define a class named `Drone`. Every drone starts with `battery` set to `90` (minutes of flight) and `speed` set to `40` (km/h).
2. Write a function `make_scout()` that makes a new `Drone`, changes that drone's `speed` to `60`, and returns it.

```python
kite = Drone()
kite.battery         # 90
make_scout().speed   # 60
```

## Concept

A **class** is a blueprint for a kind of thing. It says what every thing of that kind has:

```python
class Crate:
    weight = 12
    label = "spares"
```

Calling the class, like a function, makes a new **object** from the blueprint. An object made from a class is also called an **instance** of it:

```python
crate = Crate()
print(crate.weight)  # 12
```

The values an object holds are its **attributes**, and you reach them with a dot: `crate.weight`. Assigning to an attribute changes that one object, and every other object made from the class keeps its own value:

```python
crate.weight = 20
print(crate.weight)    # 20
print(Crate().weight)  # 12
```

By convention, class names start with a capital letter and use capitals for each word, like `Drone` or `CargoDrone`. Variables and functions stay lowercase.

## Hints

1. Start with `class Drone:`, and indent `battery = 90` and `speed = 40` under it.
2. In `make_scout`, `scout = Drone()` makes a new drone. Then `scout.speed = 60`.
3. Return `scout`. Change only the scout's speed, not the class's.

## Starter: guided

```python
# A class is a blueprint. Every Drone made from it starts with these values.
class Drone:
    battery = 90
    speed = 40


def make_scout():
    scout = Drone()
    # Change this scout's speed to 60 before returning it.
    return scout


kite = Drone()
print(kite.battery, kite.speed)
```

## Starter: standard

```python
# Define the Drone class: battery 90 and speed 40.


def make_scout():
    # Make a Drone, change its speed to 60, and return it.
    return None
```

## Starter: challenge

```python
```

## Checks

```python
expect("Drone().battery", lambda: get("Drone")().battery, 90)
expect("Drone().speed", lambda: get("Drone")().speed, 40)
check(
    "make_scout() returns a Drone",
    lambda: type(get("make_scout")()) is get("Drone"),
    "Make the scout with Drone(), and return it.",
)
expect("make_scout().speed", lambda: get("make_scout")().speed, 60)
```

## Hidden checks

```python
def other_drone_after_scout():
    get("make_scout")()
    return get("Drone")().speed


expect(
    "A new Drone made after a scout still has speed 40",
    other_drone_after_scout,
    40,
    "Change the scout object's speed, not the Drone class's.",
)
expect("make_scout().battery", lambda: get("make_scout")().battery, 90)
```

## Solution

```python
class Drone:
    battery = 90
    speed = 40


def make_scout():
    scout = Drone()
    scout.speed = 60
    return scout


kite = Drone()
print(kite.battery, kite.speed)
print(make_scout().speed)
```

## Restored

The workshop has a blueprint. One line makes a drone with everything a drone should have, and a scout is just a drone with one setting changed.
