---
id: read-gauges
title: Read the gauges
system: Gauges
symbol: instrument
scene: console
skills: variables
---

## Briefing

One gauge shows how much charge is left in the battery bank. Another shows how fast the outpost is using it. Nobody has worked out how long the reserve will last. Store the readings in variables so the terminal can do the arithmetic.

## Objective

- Create a variable named `hours_left` that holds `charge` divided by `draw`.
- Print it in this line: `Reserve: 24.0 hours`

## Concept

A **variable** is a name for a value. You create one with `=`:

```python
crew = 4
rations = 36
per_person = rations / crew
```

Python works out the right-hand side first, then stores the result under the name on the left. `/` divides, `*` multiplies, and `+` and `-` add and subtract. Dividing with `/` always gives a decimal number, so `36 / 4` is `9.0`.

To put a variable's value inside text, use an **f-string**: write `f` before the opening quote, and put the variable name in curly braces.

```python
print(f"Each person gets {per_person} rations")
```

## Hints

1. Division uses `/`: `hours_left = charge / draw`.
2. Put `f` before the quotes so `{hours_left}` is replaced with its value.
3. The finished line is `print(f"Reserve: {hours_left} hours")`.

## Starter: guided

```python
charge = 840  # kilowatt-hours left in the batteries
draw = 35     # kilowatts the outpost uses each hour

# Replace the 0 with charge divided by draw:
hours_left = 0

# This f-string puts the value of hours_left into the text:
print(f"Reserve: {hours_left} hours")
```

## Starter: standard

```python
charge = 840  # kilowatt-hours left in the batteries
draw = 35     # kilowatts the outpost uses each hour

# Store charge divided by draw in hours_left, then print:
# Reserve: <hours_left> hours
```

## Starter: challenge

```python
charge = 840
draw = 35
```

## Checks

```python
check("hours_left exists", lambda: "hours_left" in namespace, "Create a variable named exactly hours_left.")
check(
    "hours_left is charge divided by draw",
    lambda: abs(get("hours_left") - 24.0) < 1e-9,
    "Divide charge by draw with /.",
)
check(
    "Prints Reserve: 24.0 hours",
    lambda: "Reserve: 24.0 hours" in lines,
    "Use an f-string so the value of hours_left appears in the line.",
)
```

## Solution

```python
charge = 840
draw = 35

hours_left = charge / draw
print(f"Reserve: {hours_left} hours")
```

## Restored

Both gauges agree: 24 hours of reserve power. That's enough to start bringing the outpost back, as long as nothing is wasted.
