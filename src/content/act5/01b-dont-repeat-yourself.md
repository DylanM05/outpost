---
id: dont-repeat-yourself
title: Don't repeat yourself
system: Workbench
symbol: equipment
scene: tests
skills: functions, debugging
---

## Briefing

The workshop prints a range report for its three drones every morning. Wren's number has looked low all week, and the drone flies further than the report says it can. The report's code is the same calculation pasted three times, and someone changed one copy.

## Objective

Write `usable_range(battery, speed)`, which returns how far a drone can fly while keeping 20% of its range in reserve: its full range, `battery * speed / 60`, times `0.8`. Then use it for all three reports, so the calculation is written only once.

```text
Kite can fly 48.0 km
Mule can fly 24.0 km
Wren can fly 50.0 km
```

## Concept

**DRY** stands for **don't repeat yourself**. When the same calculation is pasted in several places, every copy has to be changed whenever the rule changes, and sooner or later one copy gets missed. That's what happened to Wren's report.

Put the calculation in a function, and call the function everywhere it's needed. The rule then lives in exactly one place: fix it there, and every report is fixed.

Repetition is a hint, not a law. Two lines that happen to look alike today, but mean different things, can stay separate. When the copies are the *same rule*, as these are, they belong in one function.

## Hints

1. Define `usable_range(battery, speed)` and return `battery * speed / 60 * 0.8`.
2. Each report becomes one line: `print(f"Kite can fly {usable_range(90, 40)} km")`.
3. Wren's copy used `0.6`. The function uses `0.8` for every drone.

## Starter

```python
# Range reports for the three workshop drones.
kite_range = 90 * 40 / 60 * 0.8
print(f"Kite can fly {kite_range} km")

mule_range = 60 * 30 / 60 * 0.8
print(f"Mule can fly {mule_range} km")

wren_range = 75 * 50 / 60 * 0.6
print(f"Wren can fly {wren_range} km")
```

## Checks

```python
expect("usable_range(90, 40)", lambda: get("usable_range")(90, 40), 48.0)
expect(
    "The three reports",
    lambda: lines,
    ["Kite can fly 48.0 km", "Mule can fly 24.0 km", "Wren can fly 50.0 km"],
)
check(
    "The calculation is written once",
    lambda: source.count("0.8") + source.count("0.6") <= 1 and source.count("/ 60") + source.count("/60") <= 1,
    "Every report should call usable_range instead of repeating the arithmetic.",
)
```

## Hidden checks

```python
expect("usable_range(0, 40)", lambda: get("usable_range")(0, 40), 0.0)
expect("usable_range(30, 60)", lambda: get("usable_range")(30, 60), 24.0)
```

## Solution

```python
def usable_range(battery, speed):
    return battery * speed / 60 * 0.8


print(f"Kite can fly {usable_range(90, 40)} km")
print(f"Mule can fly {usable_range(60, 30)} km")
print(f"Wren can fly {usable_range(75, 50)} km")
```

## Restored

Wren's report says 50 km, which matches what it actually flies. The rule is in one place now, so the next change reaches every drone at once.
