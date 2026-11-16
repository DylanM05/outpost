---
id: two-kinds-of-error
title: Two kinds of error
system: Beacon
symbol: instrument
scene: console
skills: syntax-errors, debugging
---

## Briefing

The beacon's diagnostic script fails differently. It starts, prints a line or two, and then stops. When Python stops partway through a program, that's a **runtime error**, and it tells you different things than a syntax error does.

## Objective

Fix the script so it prints these four lines:

```text
Beacon diagnostics
Antenna: ok
Power: ok
Signal: strong
```

## Concept

There are two broad kinds of error:

- A **syntax error** means Python couldn't understand the program, so nothing runs at all.
- A **runtime error** happens while the program is running. Every line before it has already run, so you usually see some output first.

A common runtime error is `NameError`. It means Python met a name it doesn't know, often because of a typo:

```python
prnt("hello")  # NameError: name 'prnt' is not defined
```

Python names are case-sensitive, so `Print` and `print` are different names.

The error message tells you which line failed. The output tells you how far the program got before it did.

## Hints

1. Press Run. Look at what printed before the error. The problem is on the next line that should have printed.
2. Read the name in the error message letter by letter.
3. Line 3 misspells `print`. Once that's fixed, line 4 uses a capital letter where Python expects lowercase.

## Starter

```python
print("Beacon diagnostics")
print("Antenna: ok")
pirnt("Power: ok")
Print("Signal: strong")
```

## Checks

```python
expected = ["Beacon diagnostics", "Antenna: ok", "Power: ok", "Signal: strong"]
check(
    "Prints all four lines in order",
    lambda: [line for line in lines if line in expected] == expected,
    "Make sure each of the four lines is printed once, in this order.",
)
```

## Solution

```python
print("Beacon diagnostics")
print("Antenna: ok")
print("Power: ok")
print("Signal: strong")
```

## Restored

Every beacon diagnostic passes. From now on the beacon reports its own faults instead of failing silently.
