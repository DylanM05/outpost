---
id: optional-parts
title: Optional parts
system: Assembly line
symbol: equipment
scene: tests
skills: classes, functions
---

## Briefing

Almost every drone in the valley flies at 40 km/h, and almost every one leaves the line fully charged. Having to type `40` every time is tedious, but the workshop still needs to build the odd fast drone, and sometimes to register a drone that arrives half charged.

## Objective

Change `Drone`'s constructor to take `name`, `speed`, and `battery`, where `speed` is `40` and `battery` is `90` unless they're given.

```python
Drone("Kite").speed                # 40
Drone("Wren", 50).speed            # 50
Drone("Mule", battery=45).battery  # 45
```

## Concept

A parameter can have a **default value**, which it takes when the caller leaves it out:

```python
def label(text, size=12):
    return f"{text} ({size}pt)"


label("Spares")      # "Spares (12pt)"
label("Spares", 20)  # "Spares (20pt)"
```

Parameters with defaults have to come after the ones without, so Python can tell which argument is which.

A caller can also name the parameter they're giving, as a **keyword argument**:

```python
label("Spares", size=20)
```

Keyword arguments make a call easier to read, and let the caller skip an earlier default: `Drone("Mule", battery=45)` gives a battery and leaves `speed` at its default.

Defaults work the same way in `__init__` as in any function.

## Hints

1. Put the defaults in the `def` line: `def __init__(self, name, speed=40, battery=90):`.
2. Store `battery` from the parameter, the way you store `speed`, rather than always setting `90`.
3. `name` has no default, so it stays first.

## Starter: guided

```python
class Drone:
    # Give speed a default of 40, and add a battery parameter with a default of 90.
    def __init__(self, name, speed):
        self.name = name
        self.speed = speed
        self.battery = 90

    def fly(self, minutes):
        self.battery = self.battery - minutes

    def range_km(self):
        return self.battery * self.speed / 60


print(Drone("Kite").speed)
```

## Starter: challenge

```python
class Drone:
    def __init__(self, name, speed):
        self.name = name
        self.speed = speed
        self.battery = 90

    def fly(self, minutes):
        self.battery = self.battery - minutes

    def range_km(self):
        return self.battery * self.speed / 60
```

## Checks

```python
expect('Drone("Kite").speed', lambda: get("Drone")("Kite").speed, 40)
expect('Drone("Kite").battery', lambda: get("Drone")("Kite").battery, 90)
expect('Drone("Wren", 50).speed', lambda: get("Drone")("Wren", 50).speed, 50)
expect('Drone("Mule", battery=45).battery', lambda: get("Drone")("Mule", battery=45).battery, 45)
```

## Hidden checks

```python
expect('Drone("Mule", battery=45).speed', lambda: get("Drone")("Mule", battery=45).speed, 40)
expect('Drone("Hawk", 60, 30).range_km()', lambda: get("Drone")("Hawk", 60, 30).range_km(), 30.0)
```

## Solution

```python
class Drone:
    def __init__(self, name, speed=40, battery=90):
        self.name = name
        self.speed = speed
        self.battery = battery

    def fly(self, minutes):
        self.battery = self.battery - minutes

    def range_km(self):
        return self.battery * self.speed / 60


print(Drone("Kite").speed)
print(Drone("Mule", battery=45).battery)
```

## Restored

`Drone("Kite")` builds a standard drone, and the odd one out says only what's different about it.
