---
id: maintenance-arctic-sensor
title: Extend the sensor
system: Hangar
symbol: equipment
scene: tests
skills: inheritance
reviewSkill: inheritance
prerequisite: heavier-is-slower
---

## Briefing

Standard `Sensor` units report raw Celsius readings. Outdoor `HeatedSensor` units inherit from `Sensor`, store a `heater_offset`, and adjust their reading by subtracting the offset.

## Objective

Write `Sensor(name, reading)` with `value(self)` returning `self.reading`, and a subclass `HeatedSensor(name, reading, offset=2)` that calls `super().__init__(name, reading)`, stores `self.offset = offset`, and overrides `value(self)` to return `super().value() - self.offset`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Declare `class HeatedSensor(Sensor):` and call `super().__init__(name, reading)`.
2. Override `value(self)` to return `super().value() - self.offset`.

## Starter

```python
```

## Checks

```python
S = get("Sensor")
HS = get("HeatedSensor")
check("HeatedSensor subclasses Sensor", lambda: issubclass(HS, S))
expect("Sensor.value()", lambda: S("Indoor", 18).value(), 18)
expect("HeatedSensor default offset=2", lambda: HS("Mast", -4).value(), -6)
expect("HeatedSensor custom offset", lambda: HS("Peak", 5, 3).value(), 2)
```

## Hidden checks

```python
h = HS("Col", 0, 4)
expect("name attribute inherited via super()", lambda: (h.name, h.offset, h.value()), ("Col", 4, -4))
```

## Solution

```python
class Sensor:
    def __init__(self, name, reading):
        self.name = name
        self.reading = reading

    def value(self):
        return self.reading


class HeatedSensor(Sensor):
    def __init__(self, name, reading, offset=2):
        super().__init__(name, reading)
        self.offset = offset

    def value(self):
        return super().value() - self.offset
```

## Restored

Heated outdoor sensors now compensate for their own enclosure warmth automatically.
