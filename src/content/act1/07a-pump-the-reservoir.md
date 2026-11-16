---
id: pump-the-reservoir
title: Pump the reservoir
system: Reservoir
symbol: equipment
scene: tests
skills: loops
---

## Briefing

Meltwater is pumped up from a well into the reservoir, one pump cycle at a time. The pump wears a little with every cycle, so before switching it on, the crew wants to know how many cycles it will take to fill the tank.

## Objective

Write `pump_cycles(level, target, per_cycle)`. The tank starts at `level` liters, and each cycle adds `per_cycle` liters. Return how many cycles it takes until the level **reaches or passes** `target`. If it's already there, return `0`.

```python
pump_cycles(10, 40, 12)  # 3, because 10 becomes 22, then 34, then 46
```

## Concept

A `for` loop runs once for each item. When you don't know in advance how many times something has to happen, use a `while` loop instead. It keeps going for as long as its condition is true:

```python
countdown = 3
while countdown > 0:
    print(countdown)
    countdown -= 1
print("Launch")
```

Python checks the condition before every pass. Something inside the loop has to make it false eventually, or the loop never ends. If that happens here, the terminal stops your program after 5 seconds.

## Hints

1. Track two things: the current level, and a count of cycles that starts at 0.
2. `while level < target:` add `per_cycle` to `level`, and add 1 to the count.
3. Return the count after the loop. If the tank starts full, the loop never runs and the count is still 0.

## Starter: guided

```python
def pump_cycles(level, target, per_cycle):
    cycles = 0
    while level < target:
        level += per_cycle
        # Count this cycle.
    return cycles


print(pump_cycles(10, 40, 12))
```

## Starter: standard

```python
def pump_cycles(level, target, per_cycle):
    # Use a while loop, and return the number of cycles.
    return 0
```

## Starter: challenge

```python
```

## Checks

```python
expect("pump_cycles(10, 40, 12)", lambda: get("pump_cycles")(10, 40, 12), 3)
expect("pump_cycles(0, 100, 25)", lambda: get("pump_cycles")(0, 100, 25), 4)
```

## Hidden checks

```python
expect("pump_cycles(50, 40, 10)", lambda: get("pump_cycles")(50, 40, 10), 0)
expect("pump_cycles(40, 40, 10)", lambda: get("pump_cycles")(40, 40, 10), 0)
expect("pump_cycles(39, 40, 10)", lambda: get("pump_cycles")(39, 40, 10), 1)
expect("pump_cycles(0, 1000, 7)", lambda: get("pump_cycles")(0, 1000, 7), 143)
```

## Solution

```python
def pump_cycles(level, target, per_cycle):
    cycles = 0
    while level < target:
        level += per_cycle
        cycles += 1
    return cycles
```

## Restored

Three cycles fill the tank. The pump runs only as long as it has to, and the reservoir holds a week of water.
