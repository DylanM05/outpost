---
id: maintenance-frost-alarm
title: Repair the frost alarm
system: Power router
symbol: equipment
scene: tests
skills: conditionals
reviewSkill: conditionals
prerequisite: safety-interlocks
---

## Briefing

A boundary bug stops the alarm at exactly freezing. Repair it without changing the warning range.

## Objective

Fix `frost_alarm(temp)`. Return `"freeze"` at 0 or below, `"warning"` above 0 but below 5, and `"clear"` at 5 or above.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Trace what happens at exactly zero.
2. The first comparison must include zero.
3. Use <= for the first boundary; keep the second boundary exclusive.

## Starter

```python
def frost_alarm(temp):
    if temp < 0:
        return "freeze"
    if temp < 5:
        return "warning"
    return "clear"
```

## Checks

```python
cases = [((0,), 'freeze'), ((3,), 'warning'), ((8,), 'clear')]
for args, expected in cases:
    expect(f"frost_alarm{args!r}", lambda: get("frost_alarm")(*args), expected)
```

## Hidden checks

```python
cases = [((-2,), 'freeze'), ((5,), 'clear'), ((0.5,), 'warning')]
for args, expected in cases:
    expect(f"frost_alarm{args!r}", lambda: get("frost_alarm")(*args), expected)
```

## Solution

```python
def frost_alarm(temp):
    if temp <= 0:
        return "freeze"
    if temp < 5:
        return "warning"
    return "clear"
```

## Restored

The frost alarm trips at exactly zero degrees, and the warning range is unchanged.
