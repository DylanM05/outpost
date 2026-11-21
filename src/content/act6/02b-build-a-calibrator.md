---
id: build-a-calibrator
title: Build a calibrator
system: Memo desk
symbol: instrument
scene: tests
skills: functional
---

## Briefing

Every deep-survey instrument has a different safe operating band: thermometers clamp between `-50` and `40`, barometers between `850` and `1050`, voltage rails between `0` and `24`. Instead of writing a separate clamping function for every instrument, build a factory that produces one on demand.

## Objective

Write two function factories:

1. `make_clamper(low, high)`: returns a function `clamp(value)` that returns `low` if `value < low`, `high` if `value > high`, and `value` otherwise.
2. `compose(first, second)`: takes two single-argument functions and returns a new function `combined(x)` that runs `second(first(x))` — applying `first` and then feeding its result into `second`.

```python
clamp_voltage = make_clamper(0, 24)
clamp_voltage(30)   # 24
clamp_voltage(-2)   # 0
clamp_voltage(12)   # 12

pipeline = compose(lambda x: x + 5, clamp_voltage)
pipeline(22)        # 24  (22 + 5 = 27, clamped to 24)
```

## Concept

Functions that *return* new functions are **function transformations**. They let you configure behavior once and pass the resulting function wherever a plain single-argument function is expected — like into `process_readings` or `sorted(key=...)`.

```python
def make_scaler(factor):
    def scale(x):
        return x * factor
    return scale
```

`compose(first, second)` combines two small, pure functions into one pipeline step:

```python
def compose(first, second):
    def combined(x):
        return second(first(x))
    return combined
```

## Hints

1. Inside `make_clamper(low, high)`, define `def clamp(value):` using `max(low, min(high, value))` (or `if`/`elif`/`else`), then `return clamp` without parentheses.
2. Inside `compose(first, second)`, define `def combined(x): return second(first(x))` and `return combined`.
3. Remember: return the inner function itself, not the result of calling it.

## Starter: guided

```python
def make_clamper(low, high):
    def clamp(value):
        # Return low if value < low, high if value > high, else value.
        return value
    return clamp


def compose(first, second):
    def combined(x):
        # Run first(x), then pass that result to second.
        return x
    return combined


clamp_v = make_clamper(0, 24)
print(clamp_v(30), clamp_v(-2), clamp_v(12))
```

## Starter: standard

```python
def make_clamper(low, high):
    return lambda x: x


def compose(first, second):
    return lambda x: x
```

## Starter: challenge

```python
```

## Checks

```python
clamp_v = get("make_clamper")(0, 24)
clamp_t = get("make_clamper")(-50, 40)
expect("clamp_v(30)", lambda: clamp_v(30), 24)
expect("clamp_v(-2)", lambda: clamp_v(-2), 0)
expect("clamp_v(12)", lambda: clamp_v(12), 12)
expect("clamp_t(-80) stays independent", lambda: clamp_t(-80), -50)
pipe = get("compose")(lambda x: x + 5, clamp_v)
expect("compose(+5, clamp_v)(22)", lambda: pipe(22), 24)
expect("compose(+5, clamp_v)(10)", lambda: pipe(10), 15)
```

## Hidden checks

```python
c = get("make_clamper")(10, 10)
expect("equal bounds clamp anything to 10", lambda: c(5), 10)
expect("boundary value low", lambda: get("make_clamper")(0, 10)(0), 0)
expect("boundary value high", lambda: get("make_clamper")(0, 10)(10), 10)
order_pipe = get("compose")(lambda x: x * 2, lambda x: x + 1)
expect("compose runs first then second: (3 * 2) + 1", lambda: order_pipe(3), 7, "Apply first(x) before second(...).")
```

## Solution

```python
def make_clamper(low, high):
    def clamp(value):
        if value < low:
            return low
        if value > high:
            return high
        return value
    return clamp


def compose(first, second):
    def combined(x):
        return second(first(x))
    return combined
```

## Restored

The memo desk builds calibrated clamps and chained pipelines for every gauge on the ridge in one line each.
