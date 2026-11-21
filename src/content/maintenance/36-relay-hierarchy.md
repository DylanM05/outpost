---
id: maintenance-relay-hierarchy
title: Two kinds of beacon
system: Hangar
symbol: equipment
scene: tests
skills: inheritance
reviewSkill: inheritance
prerequisite: heavier-is-slower
---

## Briefing

Both `StrobeBeacon` and `RadioBeacon` share a common `Beacon` base class, keeping the hierarchy wide and shallow instead of chaining unrelated subclasses together.

## Objective

Write three classes:
- `Beacon(code, power)`: stores `self.code` and `self.power`, and `status(self)` returns `f"{self.code}: {self.power}W"`.
- `StrobeBeacon(Beacon)`: `__init__(self, code, power, flashes_per_min)` calls `super().__init__(code, power)`, stores `self.flashes_per_min`, and overrides `status(self)` to return `f"{super().status()} ({self.flashes_per_min}/min)"`.
- `RadioBeacon(Beacon)`: `__init__(self, code, power, freq_mhz)` calls `super().__init__(code, power)`, stores `self.freq_mhz`, and overrides `status(self)` to return `f"{super().status()} ({self.freq_mhz} MHz)"`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Make both `StrobeBeacon` and `RadioBeacon` inherit directly from `Beacon`.
2. Build each subclass's `status(self)` on `super().status()`.

## Starter

```python
```

## Checks

```python
B, SB, RB = get("Beacon"), get("StrobeBeacon"), get("RadioBeacon")
check("both inherit directly from Beacon", lambda: issubclass(SB, B) and issubclass(RB, B) and not issubclass(SB, RB) and not issubclass(RB, SB))
expect("StrobeBeacon status", lambda: SB("N-1", 12, 30).status(), "N-1: 12W (30/min)")
expect("RadioBeacon status", lambda: RB("V-2", 25, 146).status(), "V-2: 25W (146 MHz)")
```

## Hidden checks

```python
expect("base Beacon status", lambda: B("B-0", 5).status(), "B-0: 5W")
```

## Solution

```python
class Beacon:
    def __init__(self, code, power):
        self.code = code
        self.power = power

    def status(self):
        return f"{self.code}: {self.power}W"


class StrobeBeacon(Beacon):
    def __init__(self, code, power, flashes_per_min):
        super().__init__(code, power)
        self.flashes_per_min = flashes_per_min

    def status(self):
        return f"{super().status()} ({self.flashes_per_min}/min)"


class RadioBeacon(Beacon):
    def __init__(self, code, power, freq_mhz):
        super().__init__(code, power)
        self.freq_mhz = freq_mhz

    def status(self):
        return f"{super().status()} ({self.freq_mhz} MHz)"
```

## Restored

Strobe and radio beacons report cleanly through one shallow inheritance tree.
