---
id: convert-the-readings
title: Convert the readings
system: Gauges
symbol: instrument
scene: console
skills: variables
---

## Briefing

The generator's run counter only counts minutes, and the crew wants hours and minutes. Nobody can picture 200 minutes, but everybody knows what 3 hours and 20 minutes feels like.

## Objective

`minutes` holds the generator's total run time. Create two variables:

- `hours`: the number of whole hours
- `leftover`: the minutes left over after those hours

Then print them in this format:

```text
Runtime: 3h 20m
```

## Concept

Python has two more division operators:

- `//` is **floor division**. It divides and drops the remainder, giving a whole number: `17 // 5` is `3`.
- `%` is **modulo**. It gives just the remainder: `17 % 5` is `2`.

Together they split a quantity into units. 17 days is `17 // 7` weeks and `17 % 7` days.

Whole numbers like `3` are **integers**, and numbers with a decimal point like `3.0` are **floats**. `/` always gives a float. `//` and `%` give integers when both numbers are integers.

## Hints

1. There are 60 minutes in an hour, so divide by 60.
2. `hours = minutes // 60`, and `leftover = minutes % 60`.
3. Print with an f-string: `f"Runtime: {hours}h {leftover}m"`.

## Starter: guided

```python
minutes = 200  # total generator run time

# Whole hours: floor-divide minutes by 60.
hours = 0

# The minutes left over: the remainder after dividing by 60.
leftover = 0

print(f"Runtime: {hours}h {leftover}m")
```

## Starter: standard

```python
minutes = 200  # total generator run time

# Work out hours and leftover, then print:
# Runtime: <hours>h <leftover>m
```

## Starter: challenge

```python
minutes = 200
```

## Checks

```python
check("hours is the number of whole hours", lambda: get("hours") == 3, "Divide minutes by 60 with //.")
check(
    "hours is a whole number",
    lambda: isinstance(get("hours"), int),
    "Use // rather than /, so the result has no decimal part.",
)
check("leftover is the remaining minutes", lambda: get("leftover") == 20, "Use % to get the remainder after dividing by 60.")
check("Prints Runtime: 3h 20m", lambda: "Runtime: 3h 20m" in lines, "Check the spacing and letters: Runtime: 3h 20m")
```

## Solution

```python
minutes = 200

hours = minutes // 60
leftover = minutes % 60
print(f"Runtime: {hours}h {leftover}m")
```

## Restored

The generator panel reads 3h 20m. The crew schedules a maintenance check every four hours of runtime.
