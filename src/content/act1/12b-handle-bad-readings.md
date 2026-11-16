---
id: handle-bad-readings
title: Handle bad readings
system: Weather sensors
symbol: instrument
scene: tests
skills: errors, types
---

## Briefing

The weather mast's sensors ice over at night. When they do, they send `"ERR"` or garbage instead of a temperature, and anything that tries to turn that into a number crashes. The station has to keep running when one sensor misbehaves.

## Objective

Write `parse_readings(raw)`. `raw` is a list of strings from the sensors. Return a list of the readings that are valid numbers, converted to floats, in their original order. Skip any that can't be converted.

```python
parse_readings(["12.5", "ERR", "-3", "??"])  # [12.5, -3.0]
```

## Concept

Some errors can't be prevented in advance, only handled when they happen. `try` and `except` let you do that:

```python
try:
    level = float("ERR")
    print("got a number")
except ValueError:
    print("not a number")
```

Python runs the `try` block. If a `ValueError` is raised inside it, Python jumps straight to the `except` block instead of crashing. If nothing goes wrong, the `except` block is skipped.

Name the specific error you expect, such as `ValueError`. A bare `except:` catches everything, including bugs you'd want to know about.

`float()` raises `ValueError` when it's given text that isn't a number. Inside a loop, `continue` skips straight to the next item.

## Hints

1. Loop over `raw`, and put the conversion inside a `try:` block.
2. In the `try` block, convert with `float()` and append the result. In `except ValueError:`, use `continue` to skip that reading.
3. Return the list after the loop.

## Starter: guided

```python
def parse_readings(raw):
    readings = []
    for text in raw:
        # Wrap these lines in try / except ValueError, and skip bad readings.
        value = float(text)
        readings.append(value)
    return readings


print(parse_readings(["12.5", "ERR", "-3", "??"]))
```

## Starter: standard

```python
def parse_readings(raw):
    # Return the valid readings as floats, skipping the bad ones.
    return []
```

## Starter: challenge

```python
```

## Checks

```python
expect('parse_readings(["12.5", "ERR", "-3", "??"])', lambda: get("parse_readings")(["12.5", "ERR", "-3", "??"]), [12.5, -3.0])
expect('parse_readings(["4", "5"])', lambda: get("parse_readings")(["4", "5"]), [4.0, 5.0])
```

## Hidden checks

```python
expect("parse_readings([])", lambda: get("parse_readings")([]), [])
expect('parse_readings(["ERR", "ERR"])', lambda: get("parse_readings")(["ERR", "ERR"]), [])
expect(
    'parse_readings([" 7.25 ", "-0.5", "1e2"])',
    lambda: get("parse_readings")([" 7.25 ", "-0.5", "1e2"]),
    [7.25, -0.5, 100.0],
)
```

## Solution

```python
def parse_readings(raw):
    readings = []
    for text in raw:
        try:
            value = float(text)
        except ValueError:
            continue
        readings.append(value)
    return readings
```

## Restored

An iced-over sensor no longer takes the whole station down. Bad readings are skipped, and the good ones keep coming in.
