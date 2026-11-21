---
id: refuse-bad-orders
title: Refuse bad orders
system: Battery locker
symbol: controller
scene: tests
skills: encapsulation, errors
---

## Briefing

A planner sent Mule on an 80-minute flight with 45 minutes in its battery. The program didn't object: Mule's battery went to -35 and its range report went negative, and Mule came down in a snowfield. A drone should refuse an order it can't carry out, loudly enough that nobody can miss it.

## Objective

1. Change `fly(minutes)` so that when `minutes` is more than the battery has left, it raises a `ValueError` and leaves the battery as it was.
2. Write a function `try_flight(drone, minutes)` that flies the drone and returns `True`, or returns `False` if the drone refuses.

```python
mule = Drone("Mule", 30, 45)
mule.fly(80)              # ValueError: not enough battery
try_flight(mule, 80)      # False
try_flight(mule, 20)      # True
mule.battery_left()       # 25
```

## Concept

You've caught exceptions with `try` and `except`. You can also **raise** them, to say that something can't be done:

```python
def take(self, kg):
    if kg > self._weight:
        raise ValueError(f"only {self._weight} kg in the crate")
    self._weight = self._weight - kg
```

`raise` stops the method at once: the lines after it don't run, so the crate is left as it was. The exception travels back to whoever called the method. If they catch it, they decide what to do. If they don't, the program stops with the message.

Returning `False` instead would be easy to ignore: a caller that never checks the result carries on as if the flight happened. An exception can't be ignored by accident, which is why methods that guard an object's rules raise one when the rules would be broken.

`ValueError` is the usual choice when an argument has the right type but a value that can't be used. Give it a message that says what went wrong.

## Hints

1. At the start of `fly`, compare `minutes` with `self._battery`, and `raise ValueError("not enough battery")` if it's more.
2. In `try_flight`, put `drone.fly(minutes)` and `return True` inside `try:`, and `return False` under `except ValueError:`.
3. A flight that uses exactly the battery that's left is allowed: only raise when `minutes` is greater.

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
        self._battery = self._battery - minutes

    def range_km(self):
        return self._battery * self.speed / 60


def try_flight(drone, minutes):
    # Fly the drone and return True, or return False if it refuses.
    drone.fly(minutes)
    return True


mule = Drone("Mule", 30, 45)
print(try_flight(mule, 80))
print(mule.battery_left())
```

## Checks

```python
def refusal(battery, minutes):
    drone = get("Drone")("Mule", 30, battery)
    try:
        drone.fly(minutes)
    except ValueError:
        return ("refused", drone.battery_left())
    return ("flew", drone.battery_left())


expect("Mule with 45 minutes, told to fly 80", lambda: refusal(45, 80), ("refused", 45), "Raise ValueError before changing the battery.")
expect("Mule with 45 minutes, told to fly 20", lambda: refusal(45, 20), ("flew", 25))
expect("try_flight(mule, 80)", lambda: get("try_flight")(get("Drone")("Mule", 30, 45), 80), False)
expect("try_flight(mule, 20)", lambda: get("try_flight")(get("Drone")("Mule", 30, 45), 20), True)
```

## Hidden checks

```python
expect("Exactly the battery that's left", lambda: refusal(45, 45), ("flew", 0))
expect("One minute too many", lambda: refusal(45, 46), ("refused", 45))
check("fly raises the error itself", lambda: uses("raise"), "fly should raise ValueError, so every caller is protected, not just try_flight.")
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


def try_flight(drone, minutes):
    try:
        drone.fly(minutes)
        return True
    except ValueError:
        return False


mule = Drone("Mule", 30, 45)
print(try_flight(mule, 80))
print(mule.battery_left())
```

## Restored

Mule refuses the 80-minute flight with "not enough battery", and the planner sends Wren instead. No more drones in the snow.
