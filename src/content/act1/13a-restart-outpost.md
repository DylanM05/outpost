---
id: restart-outpost
title: Restart the outpost
system: Core
symbol: controller
scene: tests
skills: functions, conditionals, loops, lists, strings, dictionaries
assessment: true
---

## Briefing

Every system is ready, but the core controller won't restart until it has a fault report. The startup log is long, and summarizing it is up to you.

This is an independent mission. There's no starter code, and hints unlock after your second submission. Use what you've learned, and look things up in the Python documentation if you need to.

## Objective

Write `diagnose(log)`. `log` is a list of lines like these:

```text
06:12 WARN pump pressure low
06:14 ERROR heater circuit open
06:15 INFO drone docked
```

Each line contains a time, a level, a system name, and then a message, separated by spaces. Return a dictionary that maps each system that logged an `ERROR` to the number of errors it logged. Leave out systems with no errors.

```python
diagnose([
    "06:12 WARN pump pressure low",
    "06:14 ERROR heater circuit open",
    "06:20 ERROR heater circuit open",
])
# {"heater": 2}
```

## Concept

A reminder from the depot: `split()` with nothing in the parentheses breaks a string into a list of words wherever there's a space.

```python
parts = "06:14 ERROR heater circuit open".split()
print(parts)     # ['06:14', 'ERROR', 'heater', 'circuit', 'open']
print(parts[1])  # ERROR
```

List positions start at 0, so `parts[0]` is the time.

## Hints

1. Split each line into words. The level is at position 1 and the system at position 2.
2. Only lines whose level is exactly `"ERROR"` count. Then use the same counting pattern as the depot.
3. A message can contain any words, including "ERROR". Check the level position, not the whole line.

## Starter

```python
```

## Checks

```python
sample = [
    "06:12 WARN pump pressure low",
    "06:14 ERROR heater circuit open",
    "06:20 ERROR heater circuit open",
]
expect("diagnose(the example log)", lambda: get("diagnose")(sample), {"heater": 2})
expect("diagnose([])", lambda: get("diagnose")([]), {})
```

## Hidden checks

```python
startup = [
    "05:58 INFO core boot sequence started",
    "06:02 ERROR pump seal failure",
    "06:03 WARN beacon antenna icing",
    "06:09 ERROR heater circuit open",
    "06:11 ERROR pump seal failure",
    "06:15 INFO drone docked",
    "06:21 ERROR sensor no reading",
]
expect("diagnose(the full startup log)", lambda: get("diagnose")(startup), {"pump": 2, "heater": 1, "sensor": 1})
expect(
    "diagnose(a log with no errors)",
    lambda: get("diagnose")(["06:00 INFO core ready", "06:01 WARN pump slow"]),
    {},
)
expect(
    "diagnose(a message that mentions ERROR)",
    lambda: get("diagnose")(["06:30 WARN core ERROR flag cleared", "06:31 ERROR core watchdog reset"]),
    {"core": 1},
)
```

## Solution

```python
def diagnose(log):
    errors = {}
    for line in log:
        parts = line.split()
        level = parts[1]
        system = parts[2]
        if level == "ERROR":
            if system in errors:
                errors[system] += 1
            else:
                errors[system] = 1
    return errors
```

## Restored

The core controller accepts the fault report and brings Kestrel Ridge fully online. Every line on the schematic is live.
