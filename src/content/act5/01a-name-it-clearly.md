---
id: name-it-clearly
title: Name it clearly
system: Workbench
symbol: equipment
scene: tests
skills: functions, reading-code
---

## Briefing

With the relay line up and the archive keeping the ridge's history, the valley is sending its drones up to the ridge's workshop for the winter survey. The workshop's software is older than anything you've fixed so far. The last engineer wrote it fast and never came back to tidy it, and the first function in it already makes you squint.

Before you build anything new on it, make the code say what it means.

## Objective

The function `chk` decides whether a drone can reach a place and keep 20% of its range in reserve. It gives the right answers. Make it readable, without changing what it returns:

1. Rename it `can_reach`, with the parameters `distance` (in km), `battery` (minutes of flight left), and `speed` (in km/h).
2. Give every variable inside it a name that says what it holds.
3. Replace the unexplained `0.8` with a constant named `RESERVE`, set to `0.2`, the share of the range kept back.

```python
can_reach(20, 45, 40)  # True: 30 km of range, 24 km usable
can_reach(30, 45, 40)  # False
```

## Concept

Code is read far more often than it's written, by other people and by you, months later. **Clean code** is code that's easy to read and change, and it starts with names.

- A function's name says what it does or answers: `can_reach`, not `chk`.
- A variable's name says what it holds: `range_km`, not `x`. Single letters only make sense where the meaning is obvious, like `x` and `y` for a position.
- A number with no explanation, like `0.8`, is a **magic number**. Give it a name. By convention, a value that never changes is a **constant**, written in capitals near the top of the file:

```python
RESERVE = 0.2
```

Changing names doesn't change what a program does. That's what makes it safe to do first: run the program before and after, and the answers should match.

## Hints

1. Change the `def` line first: `def can_reach(distance, battery, speed):`, then rename each use of `d`, `b`, and `s` inside.
2. `x` is the drone's full range, so `range_km` says what it is. Using `RESERVE`, the usable part is `range_km * (1 - RESERVE)`.
3. Put `RESERVE = 0.2` above the function, and change the `print` calls to use `can_reach`.

## Starter

```python
# The last engineer's range check. It works, but nobody can read it.
def chk(d, b, s):
    x = b * s / 60
    return x * 0.8 >= d


print(chk(20, 45, 40))
print(chk(30, 45, 40))
```

## Checks

```python
import inspect

expect("can_reach(20, 45, 40)", lambda: get("can_reach")(20, 45, 40), True)
expect("can_reach(30, 45, 40)", lambda: get("can_reach")(30, 45, 40), False)
expect(
    "Its parameters are distance, battery, and speed",
    lambda: list(inspect.signature(get("can_reach")).parameters),
    ["distance", "battery", "speed"],
)
expect("RESERVE is 0.2", lambda: get("RESERVE"), 0.2, "Add RESERVE = 0.2 above the function.")
check("The magic number is gone", lambda: "0.8" not in source, "Work out the usable range from RESERVE instead of writing 0.8.")
check("The old one-letter names are gone", lambda: not uses("chk", "d", "b", "s", "x"), "Rename chk, and every one-letter name inside it.")
```

## Hidden checks

```python
expect("can_reach(24, 45, 40), exactly the usable range", lambda: get("can_reach")(24, 45, 40), True)
expect("can_reach(1, 0, 40), with an empty battery", lambda: get("can_reach")(1, 0, 40), False)
expect("can_reach(50, 90, 50)", lambda: get("can_reach")(50, 90, 50), True)
```

## Solution

```python
RESERVE = 0.2


def can_reach(distance, battery, speed):
    range_km = battery * speed / 60
    return range_km * (1 - RESERVE) >= distance


print(can_reach(20, 45, 40))
print(can_reach(30, 45, 40))
```

## Restored

`can_reach(distance, battery, speed)`. The next person to open the workshop's code will know what it does before they've read its body.
