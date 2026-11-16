---
id: down-and-back
kind: predict
title: Down and back
system: Cave survey
symbol: controller
scene: console
skills: recursion, reading-code
---

## Briefing

Under the ridge is an ice cave, mapped level by level. The survey office's cave program is short, but the surveyors say it reads like a riddle: a function that uses itself. Trace a descent before anyone trusts it with a rope.

## Objective

Predict exactly what this program prints.

## Concept

A function can call itself. That's called **recursion**, and every recursive function has two parts:

- A **base case**, which answers without calling the function again. It's what stops the recursion.
- A **recursive case**, which calls the function on a smaller version of the problem, a step closer to the base case.

Every call gets its own copy of its parameters, so `level` can be 3 in one call and 2 in the call it makes. A call that calls the function **waits** at that line until the inner call returns, then carries on from where it stopped.

So lines before the recursive call run on the way down, and lines after it run on the way back up, in reverse order, as each waiting call finishes. Python keeps track of the waiting calls on the **call stack**.

Return values work the same way. `rope(3)` can't finish its `return` until `rope(2)` has answered, which waits for `rope(1)`, which waits for `rope(0)`. The answers then come back up one call at a time.

## Hints

1. `descend(3)` prints, then calls `descend(2)` and waits. Its "back up" line runs only after everything below it has finished.
2. The deepest call, `descend(0)`, prints `cave floor` and returns. Then `descend(1)` carries on, then `descend(2)`, then `descend(3)`.
3. `rope(3)` is `10 + rope(2)`, which is `10 + 10 + rope(1)`, and `rope(0)` is 0.

## Program

```python
def descend(level):
    if level == 0:
        print("cave floor")
        return
    print(f"down to {level}")
    descend(level - 1)
    print(f"back up from {level}")


def rope(level):
    if level == 0:
        return 0
    return 10 + rope(level - 1)


descend(3)
print(f"rope needed: {rope(3)}")
```

## Output

```text
down to 3
down to 2
down to 1
cave floor
back up from 1
back up from 2
back up from 3
rope needed: 30
```

## Restored

Down three levels and back up three, in reverse order, exactly as traced. The surveyors clip on and take thirty meters of rope.
