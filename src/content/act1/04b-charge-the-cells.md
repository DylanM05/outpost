---
id: charge-the-cells
title: Charge the cells
system: Battery bank
symbol: equipment
scene: tests
skills: functions
---

## Briefing

Each battery cell reports its capacity and its current charge, and the charger delivers a fixed amount per hour. The crew wants to know how long each cell will take to fill. Part of the answer is one subtraction, and the rest builds on it.

## Objective

Write two functions:

- `missing_charge(capacity, charge)` returns how much charge the cell still needs.
- `hours_to_full(capacity, charge, rate)` returns how many hours the charger needs to fill the cell. It must call `missing_charge` instead of repeating the subtraction.

```python
missing_charge(100, 40)     # 60
hours_to_full(100, 40, 20)  # 3.0
```

## Concept

Functions can call other functions. That lets you build bigger answers out of small pieces that you've already tested:

```python
def meals_per_day(crew):
    return crew * 3

def rations_for(crew, days):
    return meals_per_day(crew) * days
```

`rations_for` doesn't need to know how meals are counted. If that rule ever changes, you only fix `meals_per_day`.

When one function calls another, the values are matched by **position**, not by name. `rations_for` passes its `crew` along as the first argument, and `meals_per_day` receives it as its own first parameter, whatever it's called.

## Hints

1. `missing_charge` is a subtraction: `capacity - charge`.
2. In `hours_to_full`, store `missing_charge(capacity, charge)` in a variable, then divide it by `rate`.
3. Both functions need `return`. The second can be a single line: `return missing_charge(capacity, charge) / rate`.

## Starter: guided

```python
def missing_charge(capacity, charge):
    # Return how much charge the cell still needs.
    return 0


def hours_to_full(capacity, charge, rate):
    missing = missing_charge(capacity, charge)
    # Return how long the missing charge takes at this rate.
    return 0


print(missing_charge(100, 40))
print(hours_to_full(100, 40, 20))
```

## Starter: standard

```python
def missing_charge(capacity, charge):
    return 0


def hours_to_full(capacity, charge, rate):
    return 0
```

## Starter: challenge

```python
```

## Checks

```python
expect("missing_charge(100, 40)", lambda: get("missing_charge")(100, 40), 60)
expect("hours_to_full(100, 40, 20)", lambda: get("hours_to_full")(100, 40, 20), 3.0)
check(
    "hours_to_full calls missing_charge",
    lambda: "missing_charge" in get("hours_to_full").__code__.co_names,
    "Call missing_charge inside hours_to_full instead of repeating the subtraction.",
)
```

## Hidden checks

```python
expect("missing_charge(80, 80)", lambda: get("missing_charge")(80, 80), 0)
expect("hours_to_full(50, 0, 10)", lambda: get("hours_to_full")(50, 0, 10), 5.0)
expect("hours_to_full(120, 90, 12)", lambda: get("hours_to_full")(120, 90, 12), 2.5)
```

## Solution

```python
def missing_charge(capacity, charge):
    return capacity - charge


def hours_to_full(capacity, charge, rate):
    return missing_charge(capacity, charge) / rate
```

## Restored

The charger shows a countdown for each cell. The first one will be full in three hours.
