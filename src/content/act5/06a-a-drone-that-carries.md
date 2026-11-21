---
id: a-drone-that-carries
title: A drone that carries
system: Hangar
symbol: equipment
scene: tests
skills: inheritance
---

## Briefing

Mule is a cargo drone. It flies, charges, and reports its range exactly like every other drone, and it also carries loads, up to 5 kg. Copying the whole `Drone` class to make a `CargoDrone` would mean every fix to drones has to be made twice. Build the cargo drone on top of the drone instead.

## Objective

Make `CargoDrone` a kind of `Drone`, so it has everything a drone has, and give it one extra method, `can_lift(kg)`, that returns whether it can carry that weight: anything up to and including 5 kg.

```python
mule = CargoDrone("Mule", 30)
mule.range_km()   # 45.0, like any drone
mule.can_lift(4)  # True
mule.can_lift(6)  # False
```

## Concept

**Inheritance** builds a new class on an existing one. Put the existing class in brackets after the new class's name:

```python
class Crate:
    def __init__(self, label):
        self.label = label

    def describe(self):
        return f"crate of {self.label}"


class ColdCrate(Crate):
    def temperature(self):
        return -18
```

`ColdCrate` is the **child** class, and `Crate` is its **parent**. A child **inherits** everything the parent has: `ColdCrate("fish")` uses `Crate`'s constructor, and has `describe()` as well as its own `temperature()`. The parent doesn't get the child's methods: a plain `Crate` has no `temperature`.

When Python looks for a method on an object, it looks in the object's own class first, then in its parent. That's how a cargo drone can use `fly`, which only `Drone` defines.

Inherit when the child really is a kind of the parent, and should be able to do everything the parent does. A cargo drone *is* a drone.

## Hints

1. Change the first line to `class CargoDrone(Drone):`.
2. Don't copy any of `Drone`'s methods: `CargoDrone` gets them all by inheriting.
3. `can_lift` returns `kg <= 5`.

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


class CargoDrone:
    # A cargo drone should be a kind of Drone, with everything a Drone has.
    def can_lift(self, kg):
        return kg <= 5


mule = CargoDrone("Mule", 30)
print(mule.range_km(), mule.can_lift(4))
```

## Checks

```python
expect('CargoDrone("Mule", 30).range_km()', lambda: get("CargoDrone")("Mule", 30).range_km(), 45.0)
expect('CargoDrone("Mule", 30).can_lift(4)', lambda: get("CargoDrone")("Mule", 30).can_lift(4), True)
expect('CargoDrone("Mule", 30).can_lift(6)', lambda: get("CargoDrone")("Mule", 30).can_lift(6), False)
check("CargoDrone is a kind of Drone", lambda: issubclass(get("CargoDrone"), get("Drone")), "Put Drone in brackets after CargoDrone.")
```

## Hidden checks

```python
def flown():
    mule = get("CargoDrone")("Mule", 30)
    mule.fly(30)
    return mule.battery_left()


expect("A cargo drone flies like any drone", flown, 60)
expect('CargoDrone("Mule", 30).can_lift(5)', lambda: get("CargoDrone")("Mule", 30).can_lift(5), True)
check("A plain Drone can't lift", lambda: not hasattr(get("Drone")("Kite"), "can_lift"), "Put can_lift in CargoDrone, not Drone.")
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


class CargoDrone(Drone):
    def can_lift(self, kg):
        return kg <= 5


mule = CargoDrone("Mule", 30)
print(mule.range_km(), mule.can_lift(4))
```

## Restored

Mule is a drone that carries. Every fix to `Drone` from now on reaches Mule too, without anyone touching `CargoDrone`.
