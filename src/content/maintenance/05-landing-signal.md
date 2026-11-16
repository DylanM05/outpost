---
id: maintenance-landing-signal
title: Set the landing signal
system: Power router
symbol: equipment
scene: tests
skills: conditionals
reviewSkill: conditionals
prerequisite: safety-interlocks
---

## Briefing

The pad signal has to account for weather as well as remaining daylight.

## Objective

Write `landing_signal(wind, daylight)`. If wind is greater than 40, return `"closed"` regardless of daylight. Otherwise return `"open"` when daylight is True and `"lights"` when it is False. Wind is a nonnegative number.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. One condition takes priority over every other condition.
2. Check the high wind case first.
3. When wind is safe, daylight chooses between the two remaining results.

## Starter

```python

```

## Checks

```python
cases = [((50, True), 'closed'), ((20, True), 'open'), ((20, False), 'lights')]
for args, expected in cases:
    expect(f"landing_signal{args!r}", lambda: get("landing_signal")(*args), expected)
```

## Hidden checks

```python
cases = [((40, False), 'lights'), ((41, False), 'closed'), ((0, True), 'open')]
for args, expected in cases:
    expect(f"landing_signal{args!r}", lambda: get("landing_signal")(*args), expected)
```

## Solution

```python
def landing_signal(wind, daylight):
    if wind > 40:
        return "closed"
    if daylight:
        return "open"
    return "lights"
```

## Restored

The pad signal accounts for the weather now. The drone stays grounded in a whiteout, even with daylight left.
