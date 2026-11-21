---
id: filter-and-transform
title: Filter and transform
system: Signal filters
symbol: instrument
scene: tests
skills: functional, lists
---

## Briefing

The outer weather buoys report wind gusts every minute, mixed in with dead-sensor zeros and out-of-range spikes. Writing a separate loop for every cleaning rule fills the filter rack with near-identical functions. Give the rack one clean pipeline driven by small functions and comprehensions.

## Objective

Write two functions:

1. `process_readings(readings, keep, convert)`: returns a new list containing `convert(value)` for every `value` in `readings` where `keep(value)` is truthy, in the same order.
2. `clean_gusts(readings)`: uses `process_readings` with `lambda` functions (or a comprehension) to keep only readings strictly between `0` and `150` (`0 < x < 150`), and convert each kept reading from km/h to m/s rounded to 1 decimal place (`round(x / 3.6, 1)`).

```python
process_readings([1, 2, 3, 4], lambda x: x % 2 == 0, lambda x: x * 10)  # [20, 40]
clean_gusts([0, 36, 180, 72, -5])                                       # [10.0, 20.0]
```

## Concept

When a helper function is only one short expression and you only need it once, a **`lambda`** writes it inline without a `def` block:

```python
is_valid = lambda x: 0 < x < 150
```

Python also has **list comprehensions**, which build a transformed, filtered list in one readable expression:

```python
[convert(x) for x in readings if keep(x)]
```

Comprehensions do the same job as `map` and `filter` together, and in Python they are usually clearer to read. Both styles describe *what* the new list contains instead of mutating an empty list step by step.

## Hints

1. In `process_readings`, `[convert(x) for x in readings if keep(x)]` filters and transforms in one step.
2. In `clean_gusts`, pass `lambda x: 0 < x < 150` as `keep` and `lambda x: round(x / 3.6, 1)` as `convert`.
3. `0` and `150` are excluded: use `<`, not `<=`.

## Starter: guided

```python
def process_readings(readings, keep, convert):
    # Return a new list of convert(x) for each x in readings where keep(x) is True.
    return []


def clean_gusts(readings):
    return process_readings(
        readings,
        lambda x: True,     # keep only 0 < x < 150
        lambda x: x,        # convert km/h to m/s: round(x / 3.6, 1)
    )


print(clean_gusts([0, 36, 180, 72, -5]))
```

## Starter: standard

```python
def process_readings(readings, keep, convert):
    return []


def clean_gusts(readings):
    return []
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "process_readings([1, 2, 3, 4], even, *10)",
    lambda: get("process_readings")([1, 2, 3, 4], lambda x: x % 2 == 0, lambda x: x * 10),
    [20, 40],
)
expect("clean_gusts([0, 36, 180, 72, -5])", lambda: get("clean_gusts")([0, 36, 180, 72, -5]), [10.0, 20.0])
expect("clean_gusts([])", lambda: get("clean_gusts")([]), [])
```

## Hidden checks

```python
expect("clean_gusts excludes 0 and 150", lambda: get("clean_gusts")([0, 1, 149, 150]), [0.3, 41.4])
expect(
    "process_readings with strings",
    lambda: get("process_readings")(["a", "skip", "bc"], lambda s: len(s) <= 2, lambda s: s.upper()),
    ["A", "BC"],
)
orig = [36, 72]
check(
    "Leaves input list unchanged",
    lambda: (get("clean_gusts")(orig), orig)[1] == [36, 72],
    "Return a new list without modifying readings.",
)
```

## Solution

```python
def process_readings(readings, keep, convert):
    return [convert(value) for value in readings if keep(value)]


def clean_gusts(readings):
    return process_readings(
        readings,
        lambda x: 0 < x < 150,
        lambda x: round(x / 3.6, 1),
    )
```

## Restored

The filter rack strips out dead sensors and spikes in one pass, ready to swap in any rule the deep survey needs.
