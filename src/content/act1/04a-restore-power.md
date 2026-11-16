---
id: restore-power
title: Restore power
system: Battery bank
symbol: equipment
scene: tests
skills: functions
---

## Briefing

The outpost has three battery banks, and their readings change all day. Instead of redoing the arithmetic every time, build it once as a **function** that the terminal can call whenever it needs an answer.

From here on, missions are checked with tests. **Run** tries your function on the examples below. **Submit** also tries cases you haven't seen, the way real software meets real data.

## Objective

Write a function `reserve_hours(charge, draw)` that **returns** how many hours the charge will last.

```python
reserve_hours(840, 35)  # 24.0
reserve_hours(90, 60)   # 1.5
```

## Concept

A **function** packages instructions under a name so you can run them whenever you need them:

```python
def rations_each(rations, crew):
    return rations / crew
```

- `def` starts the definition. Then comes the name, and the **parameters** in parentheses.
- The indented lines are the function's **body**. Python uses indentation (four spaces) to know which lines belong to it.
- `return` hands a value back to the code that called the function.

Defining a function doesn't run it. Calling it does, and each call can use different values:

```python
print(rations_each(36, 4))  # 9.0
print(rations_each(10, 4))  # 2.5
```

`print` shows a value to a person. `return` gives a value back to the program. The tests can only see what your function returns.

## Hints

1. Start with `def reserve_hours(charge, draw):` and indent the next line.
2. The body is the same arithmetic as the last mission, using the two parameters.
3. Use `return charge / draw`, not `print`.

## Starter: guided

```python
# A function the terminal can call with any readings.
# The indented line is its body. Replace the 0 with the arithmetic.
def reserve_hours(charge, draw):
    return 0


# Calling the function runs it. Try changing these numbers:
print(reserve_hours(840, 35))
```

## Starter: standard

```python
# Define reserve_hours(charge, draw).
# It should return charge divided by draw.
```

## Starter: challenge

```python
```

## Checks

```python
for charge, draw, hours in [(840, 35, 24.0), (90, 60, 1.5)]:
    expect(f"reserve_hours({charge}, {draw})", lambda: get("reserve_hours")(charge, draw), hours)
```

## Hidden checks

```python
for charge, draw, hours in [(100, 8, 12.5), (0, 40, 0.0), (5, 2, 2.5)]:
    expect(f"reserve_hours({charge}, {draw})", lambda: get("reserve_hours")(charge, draw), hours)
```

## Solution

```python
def reserve_hours(charge, draw):
    return charge / draw
```

## Restored

Each battery bank now reports its own reserve, and the terminal can plan around all three.
