---
id: maintenance-calibrate
title: Calibrate the relay
system: Battery bank
symbol: equipment
scene: tests
skills: functions
reviewSkill: functions
prerequisite: restore-power
---

## Briefing

A replacement relay reports raw readings. Its callers need a corrected value back.

## Objective

Write `calibrate(raw, offset, scale)`. First add offset to raw, then multiply by scale, and return the result. Inputs are numbers; offsets and scales may be zero or negative.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. The order of the two operations matters.
2. Parentheses can group the addition before multiplication.
3. The caller needs a returned value, not printed output.

## Starter

```python

```

## Checks

```python
cases = [((5, 2, 3), 21), ((8, -2, 2), 12)]
for args, expected in cases:
    expect(f"calibrate{args!r}", lambda: get("calibrate")(*args), expected)
```

## Hidden checks

```python
cases = [((0, 0, 4), 0), ((4, 2, 0), 0), ((3, 1, -2), -8)]
for args, expected in cases:
    expect(f"calibrate{args!r}", lambda: get("calibrate")(*args), expected)
```

## Solution

```python
def calibrate(raw, offset, scale):
    return (raw + offset) * scale
```

## Restored

The new relay's readings match the old gauges to the decimal. Nobody has to correct them by hand anymore.
