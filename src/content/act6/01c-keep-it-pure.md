---
id: keep-it-pure
title: Keep it pure
system: Signal filters
symbol: instrument
scene: tests
skills: functional, debugging
---

## Briefing

Two consoles read the same list of baseline station temperatures: the morning report shows them in Celsius, and the ice-risk alarm checks them after adding a 4-degree wind-chill offset. Lately, every time the ice alarm runs, the morning report gets 4 degrees colder — and after three checks, it's 12 degrees off. Something is changing shared data behind the caller's back.

## Objective

Fix `apply_offset(stations, delta)` and `add_station(stations, name, temp)` so both are **pure functions**:

1. `apply_offset(stations, delta)` takes a list of `{"name": ..., "temp": ...}` dictionaries and returns a **new** list of **new** dictionaries with each `"temp"` shifted by `delta`. Neither `stations` nor any dictionary inside it may be modified.
2. `add_station(stations, name, temp)` returns a **new** list containing copies of the existing station dictionaries plus `{"name": name, "temp": temp}` at the end, without modifying `stations`.

```python
base = [{"name": "North", "temp": -10}]
shifted = apply_offset(base, -4)
# shifted == [{"name": "North", "temp": -14}]
# base is still [{"name": "North", "temp": -10}]
```

## Concept

A **pure function** has two properties:

1. Given the same inputs, it always returns the same output.
2. It has **no side effects** — it doesn't mutate its arguments, change global variables, or rely on hidden state.

A shallow copy of a list (`stations[:]`) makes a new list, but the dictionaries inside it are still the *same* dictionary objects. Mutating `station["temp"]` inside a shallow copy still corrupts the caller's data! To stay pure, build new dictionaries as well:

```python
[{**s, "temp": s["temp"] + delta} for s in stations]
```

`{**s, "temp": ...}` creates a new dictionary with all keys from `s` and an updated `"temp"`. Pure functions are far easier to test and reuse because calling one can never silently break another caller.

## Hints

1. Don't use `stations.append(...)` or `station["temp"] += delta` on the input objects.
2. In `apply_offset`, return `[{**s, "temp": s["temp"] + delta} for s in stations]` (or `dict(s)` and set `"temp"` on the copy).
3. In `add_station`, return `[dict(s) for s in stations] + [{"name": name, "temp": temp}]`.

## Starter: guided

```python
def apply_offset(stations, delta):
    # Bug: this changes every dictionary in the caller's list in place.
    for station in stations:
        station["temp"] = station["temp"] + delta
    return stations


def add_station(stations, name, temp):
    # Bug: this appends to the caller's list in place.
    stations.append({"name": name, "temp": temp})
    return stations


base = [{"name": "North", "temp": -10}]
print(apply_offset(base, -4))
print(base)
```

## Starter: standard

```python
def apply_offset(stations, delta):
    for station in stations:
        station["temp"] += delta
    return stations


def add_station(stations, name, temp):
    stations.append({"name": name, "temp": temp})
    return stations
```

## Starter: challenge

```python
```

## Checks

```python
base = [{"name": "North", "temp": -10}, {"name": "Ridge", "temp": -6}]
expect(
    "apply_offset shifts temperatures",
    lambda: get("apply_offset")(base, -4),
    [{"name": "North", "temp": -14}, {"name": "Ridge", "temp": -10}],
)
expect(
    "base is untouched after apply_offset",
    lambda: base,
    [{"name": "North", "temp": -10}, {"name": "Ridge", "temp": -6}],
    "Build new dictionaries instead of mutating the ones inside stations.",
)
added = get("add_station")(base, "Peak", -18)
expect(
    "add_station returns a list with the new station",
    lambda: added,
    [{"name": "North", "temp": -10}, {"name": "Ridge", "temp": -6}, {"name": "Peak", "temp": -18}],
)
expect(
    "base is untouched after add_station",
    lambda: base,
    [{"name": "North", "temp": -10}, {"name": "Ridge", "temp": -6}],
    "Return a new list instead of appending to stations.",
)
```

## Hidden checks

```python
extra = [{"name": "Pass", "temp": -2, "elev": 2100}]
shifted = get("apply_offset")(extra, 3)
expect(
    "apply_offset preserves extra keys",
    lambda: shifted,
    [{"name": "Pass", "temp": 1, "elev": 2100}],
    "Copy all keys from each dictionary, not just name and temp.",
)
check(
    "add_station does not share inner dicts with input",
    lambda: (
        (res := get("add_station")(extra, "Col", -5)),
        res[0].__setitem__("temp", 99),
        extra[0]["temp"] == -2,
    )[2],
    "Copy each existing station dictionary when returning the new list.",
)
expect("apply_offset on empty list", lambda: get("apply_offset")([], 5), [])
```

## Solution

```python
def apply_offset(stations, delta):
    return [{**station, "temp": station["temp"] + delta} for station in stations]


def add_station(stations, name, temp):
    return [dict(station) for station in stations] + [{"name": name, "temp": temp}]
```

## Restored

The ice alarm and morning report read the same baseline list without stepping on each other. Every console agrees on the temperature again.
