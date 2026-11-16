---
id: first-fault
title: Fix your first fault
system: Beacon
symbol: instrument
scene: console
skills: syntax-errors
---

## Briefing

The rescue beacon's startup script was saved halfway through an edit, and now it won't run at all. When a program breaks the rules of the language, Python refuses to start it. That's called a **syntax error**, and this script has two.

## Objective

Fix the script so it prints all three status lines, in this order:

```text
Beacon: warming up
Beacon: signal locked
Beacon: transmitting
```

## Concept

Python reads your whole program before it runs any of it. If a line breaks the rules, such as a missing quote or bracket, you get a `SyntaxError` and **nothing** runs, not even the lines that were fine.

The error message includes a line number. Start there, but check the line above it too: Python sometimes notices a problem a little after it happens.

Two rules cover most early syntax errors:

- Every string needs a quote at both ends.
- Every `(` needs a matching `)`.

Fix one error, run again, and see if a new one appears. That's normal.

## Hints

1. Press Run and read the error. Which line does it point to?
2. Look at the quotes on that line. Does every string open and close?
3. Line 2 is missing a closing quote before the `)`. Once that's fixed, check that line 3 closes its parenthesis.

## Starter

```python
print("Beacon: warming up")
print("Beacon: signal locked)
print("Beacon: transmitting"
```

## Checks

```python
expected = ["Beacon: warming up", "Beacon: signal locked", "Beacon: transmitting"]
check(
    "Prints all three status lines",
    lambda: all(line in lines for line in expected),
    "One of the status lines is missing or spelled differently.",
)
check(
    "Prints them in order",
    lambda: [line for line in lines if line in expected] == expected,
    "The beacon expects warming up, then signal locked, then transmitting.",
)
```

## Solution

```python
print("Beacon: warming up")
print("Beacon: signal locked")
print("Beacon: transmitting")
```

## Restored

The beacon starts transmitting a position fix. If anyone is listening, they now know someone is at Kestrel Ridge again.
