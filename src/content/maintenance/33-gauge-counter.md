---
id: maintenance-gauge-counter
title: Track the fleet count
system: Blueprint table
symbol: equipment
scene: tests
skills: classes
reviewSkill: classes
prerequisite: build-to-order
---

## Briefing

The hangar tracks both each radio's individual channel and a class-wide count of how many radios have been built.

## Objective

Write a `Radio(callsign, channel=1)` class:
- Keeps a class attribute `Radio.total_built = 0` that increments by `1` every time a `Radio` is constructed.
- Stores `self.callsign = callsign` and `self.channel = channel`.
- `tune(self, channel)`: updates `self.channel` only if `1 <= channel <= 16` (raising `ValueError` otherwise).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Increment `Radio.total_built += 1` (on the class, not `self.total_built += 1`) inside `__init__`.
2. In `tune(self, channel)`, raise `ValueError` when `not (1 <= channel <= 16)`.

## Starter

```python
```

## Checks

```python
R = get("Radio")
start = R.total_built
r1 = R("Kestrel-1")
r2 = R("Valley-2", 5)
expect("total_built increments per instance", lambda: R.total_built - start, 2)
expect("default and explicit channels", lambda: (r1.channel, r2.channel), (1, 5))
r1.tune(12)
expect("tune updates valid channel", lambda: r1.channel, 12)
```

## Hidden checks

```python
def _bad_channel():
    try:
        r1.tune(17)
        return False
    except ValueError:
        return True

check("tune rejects channel 17 with ValueError", _bad_channel)
check("channel stays 12 after failed tune", lambda: r1.channel == 12)
```

## Solution

```python
class Radio:
    total_built = 0

    def __init__(self, callsign, channel=1):
        self.callsign = callsign
        self.channel = channel
        Radio.total_built += 1

    def tune(self, channel):
        if not (1 <= channel <= 16):
            raise ValueError("channel out of range")
        self.channel = channel
```

## Restored

Every radio tracks its own frequency while the hangar keeps an exact build tally.
