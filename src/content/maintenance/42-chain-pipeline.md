---
id: maintenance-chain-pipeline
title: Chain transforms
system: Memo desk
symbol: instrument
scene: tests
skills: functional
reviewSkill: functional
prerequisite: cache-the-readings
---

## Briefing

Signal processing applies a variable-length list of small pure functions in sequence. Write a general `pipeline(steps)` builder that chains any number of single-argument functions into one function.

## Objective

Write `pipeline(steps)`. `steps` is a list of single-argument functions `[f1, f2, ...]`. Return a function `run(x)` that passes `x` through `f1`, then its result through `f2`, and so on, returning the final value (if `steps` is empty, `run(x)` returns `x`).

```python
clean = pipeline([str.strip, str.lower, lambda s: s.replace(" ", "-")])
clean("  Kestrel Ridge ")  # "kestrel-ridge"
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Freeze `chain = list(steps)` inside `pipeline` so mutating the caller's list later can't alter the pipeline.
2. Inside `def run(x):`, loop `for fn in chain: x = fn(x)` and `return x`.

## Starter

```python
```

## Checks

```python
clean = get("pipeline")([str.strip, str.lower, lambda s: s.replace(" ", "-")])
expect("chains three string transforms", lambda: clean("  Kestrel Ridge "), "kestrel-ridge")
math_pipe = get("pipeline")([lambda x: x + 2, lambda x: x * 3])
expect("applies in order: (4 + 2) * 3 = 18", lambda: math_pipe(4), 18)
```

## Hidden checks

```python
expect("empty pipeline returns input unchanged", lambda: get("pipeline")([])(42), 42)
steps = [lambda x: x + 1]
p = get("pipeline")(steps)
steps.append(lambda x: x * 100)
expect("mutating steps list after creation does not alter pipeline", lambda: p(5), 6, "Copy steps inside pipeline().")
```

## Solution

```python
def pipeline(steps):
    chain = list(steps)

    def run(value):
        for fn in chain:
            value = fn(value)
        return value

    return run
```

## Restored

Any sequence of pure filters now snaps into a single reusable pipeline function.
