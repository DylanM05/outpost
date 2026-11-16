---
id: maintenance-airlock
title: Clear the airlock
system: Power router
symbol: equipment
scene: tests
skills: conditionals
reviewSkill: conditionals
prerequisite: safety-interlocks
---

## Briefing

The airlock must decide whether a crew can safely enter during a pressure fault.

## Objective

Write `airlock(pressure, suited)`. Return `"enter"` if pressure is between 90 and 110 inclusive OR suited is True. Otherwise return `"wait"`. Pressure is a number and suited is a boolean.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. There are two separate ways entry can be safe.
2. Both pressure limits are inclusive.
3. Combine the safe-pressure test with suited using or.

## Starter

```python

```

## Checks

```python
cases = [((100, False), 'enter'), ((80, False), 'wait'), ((80, True), 'enter')]
for args, expected in cases:
    expect(f"airlock{args!r}", lambda: get("airlock")(*args), expected)
```

## Hidden checks

```python
cases = [((90, False), 'enter'), ((110, False), 'enter'), ((111, False), 'wait'), ((89, False), 'wait')]
for args, expected in cases:
    expect(f"airlock{args!r}", lambda: get("airlock")(*args), expected)
```

## Solution

```python
def airlock(pressure, suited):
    if (90 <= pressure <= 110) or suited:
        return "enter"
    return "wait"
```

## Restored

The airlock lets the crew in during the pressure fault, but only when it's safe to.
