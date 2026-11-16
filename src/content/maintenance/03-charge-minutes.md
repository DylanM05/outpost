---
id: maintenance-charge-minutes
title: Extend the charging contract
system: Battery bank
symbol: equipment
scene: tests
skills: functions
reviewSkill: functions
prerequisite: restore-power
---

## Briefing

The crew changed its charging policy. Update the working calculator to include a mandatory cooldown.

## Objective

Modify `charge_minutes(cells, minutes_each, cooldown)` so it returns charging time plus cooldown. All inputs are nonnegative integers. Even with zero cells, include cooldown.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. The current calculation ignores one parameter.
2. Calculate total charging time, then add the cooldown.
3. Keep the return statement and include all three parameters.

## Starter

```python
def charge_minutes(cells, minutes_each, cooldown):
    return cells * minutes_each
```

## Checks

```python
cases = [((3, 5, 2), 17), ((2, 4, 3), 11)]
for args, expected in cases:
    expect(f"charge_minutes{args!r}", lambda: get("charge_minutes")(*args), expected)
```

## Hidden checks

```python
cases = [((0, 5, 7), 7), ((4, 0, 2), 2), ((1, 6, 0), 6)]
for args, expected in cases:
    expect(f"charge_minutes{args!r}", lambda: get("charge_minutes")(*args), expected)
```

## Solution

```python
def charge_minutes(cells, minutes_each, cooldown):
    return cells * minutes_each + cooldown
```

## Restored

The charger schedule now includes every cooldown, and no cell is pulled off the charger before it's ready.
