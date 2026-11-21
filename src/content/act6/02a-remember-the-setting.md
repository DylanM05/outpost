---
id: remember-the-setting
kind: predict
title: Remember the setting
system: Memo desk
symbol: instrument
scene: console
skills: functional, reading-code
---

## Briefing

At the memo desk, sensors are calibrated by building specialized checker functions from a shared factory. Each checker remembers the threshold it was made with, even long after the factory function has returned. Trace what two checkers print when they run side by side.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

A function defined *inside* another function can read variables from the outer function. Even after the outer function finishes, the inner function remembers those variables. That combination — an inner function together with its remembered outer variables — is called a **closure**.

```python
def make_adder(step):
    def add(value):
        return value + step
    return add
```

Each call to `make_adder` creates a fresh inner function with its own `step`. Calling `make_adder(2)` and `make_adder(10)` gives two independent functions that do not overwrite each other.

## Hints

1. `wind_alert` remembers `limit = 50`; `frost_alert` remembers `limit = 0`.
2. Calling `wind_alert(60)` checks `60 >= 50` and returns `True`; calling `wind_alert(40)` returns `False`.
3. `frost_alert` still uses its own `limit = 0`, unchanged by `wind_alert`.

## Program

```python
def make_threshold(label, limit):
    def check(reading):
        if reading >= limit:
            return f"{label}: high ({reading})"
        return f"{label}: ok ({reading})"
    return check


wind_alert = make_threshold("wind", 50)
gust_alert = make_threshold("gust", 80)

print(wind_alert(60))
print(gust_alert(60))
print(gust_alert(85))
```

## Output

```text
wind: high (60)
gust: ok (60)
gust: high (85)
```

## Restored

Each checker holds onto the threshold it was built with, cleanly separated from the others.
