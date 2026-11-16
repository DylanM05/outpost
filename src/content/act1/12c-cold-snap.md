---
id: cold-snap
title: Cold snap
system: Weather sensors
symbol: instrument
scene: tests
skills: debugging, dictionaries
---

## Briefing

A cold front came over the ridge last week. The report of each day's highest temperature says it reached 0° every day, which can't be right, and it only lists the first day anyway. The function behind the report has two bugs.

## Objective

Fix `daily_highs(days)`. `days` is a dictionary that maps each day to a list of that day's temperatures. Return a dictionary that maps each day to its highest temperature. Every day has at least one reading.

```python
daily_highs({"mon": [-8, -3, -5], "tue": [-12, -10]})  # {"mon": -3, "tue": -10}
```

## Concept

Two common kinds of bug are hiding here.

**A bad starting value.** When you track the largest value seen so far, the starting value has to be one that any real value can beat. `0` works for counts, but not for temperatures below freezing. A safe choice is the list's own first item.

**Wrong indentation.** In Python, indentation decides which lines belong to a loop. A `return` indented one level too far runs during the loop's first pass, and the function ends early.

Debug it the same way as before: pick an input, work out the answer by hand, and add `print()` calls to see where the code goes wrong.

Python also has a built-in `max()`, which returns the largest item in a list. You're welcome to use it, but you'll still need to find the indentation bug.

## Hints

1. With every temperature below zero, `highest = 0` is never beaten. Start from the day's first reading instead: `highest = temps[0]`.
2. Look at how far `return highs` is indented. Which loop is it inside?
3. Move `return highs` left so it lines up with the outer `for`. Then it runs once, after every day has been handled.

## Starter

```python
def daily_highs(days):
    highs = {}
    for day, temps in days.items():
        highest = 0
        for temp in temps:
            if temp > highest:
                highest = temp
        highs[day] = highest
        return highs


print(daily_highs({"mon": [-8, -3, -5], "tue": [-12, -10]}))
```

## Checks

```python
expect(
    'daily_highs({"mon": [-8, -3, -5], "tue": [-12, -10]})',
    lambda: get("daily_highs")({"mon": [-8, -3, -5], "tue": [-12, -10]}),
    {"mon": -3, "tue": -10},
)
expect('daily_highs({"wed": [2, 7, 4]})', lambda: get("daily_highs")({"wed": [2, 7, 4]}), {"wed": 7})
```

## Hidden checks

```python
expect("daily_highs({})", lambda: get("daily_highs")({}), {})
expect('daily_highs({"thu": [-20]})', lambda: get("daily_highs")({"thu": [-20]}), {"thu": -20})
expect(
    'daily_highs({"fri": [-1, -1], "sat": [0, -4], "sun": [5, 9, 1]})',
    lambda: get("daily_highs")({"fri": [-1, -1], "sat": [0, -4], "sun": [5, 9, 1]}),
    {"fri": -1, "sat": 0, "sun": 9},
)
```

## Solution

```python
def daily_highs(days):
    highs = {}
    for day, temps in days.items():
        highest = temps[0]
        for temp in temps:
            if temp > highest:
                highest = temp
        highs[day] = highest
    return highs
```

## Restored

The cold front's real highs go into the log: minus three on Monday, minus ten on Tuesday. The heating schedule is planned around them now, not around a 0° that never happened.
