---
id: which-branch-runs
kind: predict
title: Which branch runs
system: Power router
symbol: controller
scene: console
skills: conditionals, reading-code
---

## Briefing

The router's cooling logic was written in a hurry, and the crew says the fans behave strangely. Trace it at the current temperature to see which messages it actually prints.

## Objective

Predict exactly what this program prints.

## Concept

In an `if` / `elif` / `else` chain, Python checks the conditions from the top and runs **only the first** block whose condition is true. It doesn't even check the conditions after that, even if they'd also be true.

A new `if` starts a new chain, which is checked no matter what happened in the chain before it.

```python
if speed > 10:
    print("fast")
elif speed > 50:
    print("very fast")  # can never run: anything over 50 is also over 10
```

## Hints

1. The first chain has three branches, and only one of them can run.
2. 85 is greater than 50, so the first branch runs, and `elif temp > 80` is never checked.
3. The two `if` statements after it are separate chains, so each one is checked on its own.

## Program

```python
temp = 85

if temp > 50:
    print("warm")
elif temp > 80:
    print("hot")
else:
    print("cold")

if temp > 80:
    print("fan on")

if temp > 90:
    print("alarm")
else:
    print("no alarm")
```

## Output

```text
warm
fan on
no alarm
```

## Restored

You've found the fault: the "hot" branch could never run, because "warm" always caught it first. The cooling logic now checks the highest temperature first.
