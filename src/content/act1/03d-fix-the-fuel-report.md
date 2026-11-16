---
id: fix-the-fuel-report
title: Fix the fuel report
system: Gauges
symbol: instrument
scene: console
skills: types, debugging
---

## Briefing

The fuel sensors send their readings as text, and the report that adds them up has been wrong every morning, when it doesn't crash outright. The numbers look fine. The problem is what kind of value they are.

## Objective

Fix the program so it prints:

```text
Tank A: 38 liters
Tank B: 45 liters
Total: 83 liters
With reserve: 93 liters
```

The sensors really do send text, so leave `tank_a` and `tank_b` as they are.

## Concept

Every value in Python has a **type**:

| Value | Type |
|---|---|
| `38` | `int`, a whole number |
| `38.5` | `float`, a decimal number |
| `"38"` | `str`, a string of text |

The quotes matter. `"38"` is text that happens to contain digits. `"38" + "45"` gives `"3845"`, because adding strings joins them together. And `"38" + 7` raises a `TypeError`, because Python won't guess whether you meant text or arithmetic.

Convert between types with functions named after them:

```python
int("38")     # 38
float("2.5")  # 2.5
str(38)       # "38"
```

`type(value)` tells you a value's type, which helps while debugging.

## Hints

1. Run the program. Look at the total it prints before it crashes. What has happened to the two readings?
2. `tank_a` and `tank_b` are strings, because they're in quotes. Convert them with `int()` before adding them.
3. `total = int(tank_a) + int(tank_b)`. The rest of the program can stay as it is.

## Starter

```python
# Readings arrive from the sensors as text.
tank_a = "38"
tank_b = "45"

print(f"Tank A: {tank_a} liters")
print(f"Tank B: {tank_b} liters")

total = tank_a + tank_b
print(f"Total: {total} liters")

reserve = 10
print(f"With reserve: {total + reserve} liters")
```

## Checks

```python
check(
    "The readings stay as text from the sensors",
    lambda: get("tank_a") == "38" and get("tank_b") == "45",
    "Leave tank_a and tank_b as strings, and convert them where you add them.",
)
check("total is a number", lambda: isinstance(get("total"), int), "Convert each reading with int() before adding.")
check("Prints Total: 83 liters", lambda: "Total: 83 liters" in lines, "38 plus 45 is 83. If you see 3845, the readings are still text.")
check("Prints With reserve: 93 liters", lambda: "With reserve: 93 liters" in lines)
```

## Solution

```python
tank_a = "38"
tank_b = "45"

print(f"Tank A: {tank_a} liters")
print(f"Tank B: {tank_b} liters")

total = int(tank_a) + int(tank_b)
print(f"Total: {total} liters")

reserve = 10
print(f"With reserve: {total + reserve} liters")
```

## Restored

The fuel report adds up: 83 liters, plus 10 in reserve. The morning crash is gone, and so is the 3845-liter fuel tank that never existed.
