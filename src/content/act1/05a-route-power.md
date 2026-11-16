---
id: route-power
title: Route the power
system: Power router
symbol: controller
scene: tests
skills: conditionals
---

## Briefing

The power router decides which systems get electricity. Right now it sends full power everywhere, even to systems whose batteries are nearly flat. Teach it to choose a mode based on each battery's charge.

## Objective

Write `power_mode(battery)`, where `battery` is a charge from 0 to 100. Return:

- `"full"` when the battery is 70 or more
- `"saver"` when it's at least 20 but less than 70
- `"off"` when it's below 20

## Concept

Programs make decisions with `if`, `elif` (short for "else if"), and `else`:

```python
def door_state(pressure):
    if pressure > 90:
        return "sealed"
    elif pressure > 40:
        return "locked"
    else:
        return "open"
```

Python checks each condition from the top and runs the first block whose condition is true. It skips the rest.

Comparisons produce `True` or `False`:

| Comparison | Meaning |
|---|---|
| `a == b` | equal |
| `a != b` | not equal |
| `a > b`, `a < b` | greater than, less than |
| `a >= b`, `a <= b` | at least, at most |

`==` compares two values. A single `=` stores a value in a variable.

Watch the boundaries. Is a battery at exactly 70 "full" or "saver"? The objective says which, and the hidden tests check.

## Hints

1. Check the highest range first: `if battery >= 70:`.
2. Then `elif battery >= 20:` for saver. Anything left over is off.
3. Each branch returns a string, such as `return "full"`.

## Starter: guided

```python
def power_mode(battery):
    if battery >= 70:
        return "full"
    # Add an elif that returns "saver" for 20 or more,
    # then an else that returns "off".


print(power_mode(95))
print(power_mode(45))
```

## Starter: standard

```python
def power_mode(battery):
    # Return "full", "saver", or "off".
    return "full"
```

## Starter: challenge

```python
```

## Checks

```python
for battery, mode in [(95, "full"), (45, "saver"), (5, "off")]:
    expect(f"power_mode({battery})", lambda: get("power_mode")(battery), mode)
```

## Hidden checks

```python
for battery, mode in [(70, "full"), (69, "saver"), (20, "saver"), (19, "off"), (0, "off"), (100, "full")]:
    expect(f"power_mode({battery})", lambda: get("power_mode")(battery), mode)
```

## Solution

```python
def power_mode(battery):
    if battery >= 70:
        return "full"
    elif battery >= 20:
        return "saver"
    else:
        return "off"
```

## Restored

The router dims the drone pad and the depot heaters to save charge, and keeps the beacon at full power.
