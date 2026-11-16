---
id: fix-the-slow-report
title: Fix the slow report
system: Survey desk
symbol: controller
scene: work
skills: complexity, loops
---

## Briefing

Every evening the survey desk prints a running total of the day's snowfall readings: the total so far, after each reading. The report is correct, but on a full day of readings it takes so long that the night shift gives up waiting for it.

## Objective

`running_totals(readings)` returns a list where each item is the sum of every reading up to and including that position. Make it read each reading only once, without changing its answers.

```python
running_totals([3, 1, 4])  # [3, 4, 8]
```

The tests count how many readings your code reads. The hidden test uses 2,000 readings and allows 4,000 reads.

## Concept

`readings[:i + 1]` is a slice of every reading from the start up to and including position `i`, and `sum()` adds them up. It looks harmless, but it reads every reading from the start, every time. The 1st total reads 1 item, the 2nd reads 2, and so on: about `n × n ÷ 2` reads in all. That's quadratic.

But each total is just the previous total plus one new reading. Keep the running total in a variable, with the accumulator pattern from the supply line:

```python
total = 0
for reading in readings:
    total += reading
```

Remembering a result instead of working it out again is one of the most common ways to make code faster.

## Hints

1. You don't need slicing or `sum()` at all.
2. Keep `total` outside the loop. Add each reading to it, then append the new total to the list.
3. The loop body is two lines: `total += reading` and `totals.append(total)`.

## Starter: guided

```python
def running_totals(readings):
    totals = []
    total = 0
    for reading in readings:
        # Add this reading to total, then append total to totals.
        totals.append(0)
    return totals


print(running_totals([3, 1, 4]))
```

## Starter: standard

```python
def running_totals(readings):
    totals = []
    for i in range(len(readings)):
        totals.append(sum(readings[:i + 1]))
    return totals
```

## Starter: challenge

```python
def running_totals(readings):
    totals = []
    for i in range(len(readings)):
        totals.append(sum(readings[:i + 1]))
    return totals
```

## Checks

```python
expect("running_totals([3, 1, 4])", lambda: get("running_totals")([3, 1, 4]), [3, 4, 8])
expect("running_totals([])", lambda: get("running_totals")([]), [])
day = tracked([5, 5, 5, 5])
expect_within(
    "running_totals(4 readings)",
    lambda: get("running_totals")(day),
    [5, 10, 15, 20],
    day,
    8,
    "Keep a running total instead of adding everything up again.",
)
```

## Hidden checks

```python
plain = [(i * 7) % 11 for i in range(2000)]
expected = []
total = 0
for reading in plain:
    total += reading
    expected.append(total)
long_day = tracked(plain)
expect_within(
    "running_totals(2,000 readings)",
    lambda: get("running_totals")(long_day),
    expected,
    long_day,
    4000,
    "Keep a running total instead of adding everything up again.",
)
```

## Solution

```python
def running_totals(readings):
    totals = []
    total = 0
    for reading in readings:
        total += reading
        totals.append(total)
    return totals
```

## Restored

The evening report prints in a blink. The night shift goes back to watching the snow instead of the progress bar.
