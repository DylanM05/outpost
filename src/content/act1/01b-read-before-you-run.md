---
id: read-before-you-run
kind: predict
title: Read before you run
system: Terminal
symbol: equipment
scene: console
skills: output, reading-code
---

## Briefing

The last engineer left a startup program on the terminal. Before you run anything on equipment you don't know, read it and work out what it will do. Engineers who can predict what code does make far fewer mistakes than engineers who run it and hope.

## Objective

Read the program. Type exactly what you think it prints, one line at a time, then check your prediction. There's no Run button here.

## Concept

Python runs a program one line at a time, from top to bottom. Each `print()` call produces one line of output.

Lines that start with `#` are **comments**. Python ignores them completely: they're notes for the people reading the code. Putting `#` in front of a line of code is a common way to switch it off without deleting it.

`print()` with nothing between the parentheses prints an empty line.

## Hints

1. Go through the program line by line. Comments print nothing, even when they look like code.
2. Each `print()` produces exactly one line, and `print()` on its own produces a blank line.
3. Text is printed exactly as written between the quotes, without the quotes.

## Program

```python
# Startup notes from the last engineer
print("KR-7 maintenance terminal")
# print("debug mode on")
print()
print("Systems checked: 0")
print("Status: waiting")
```

## Output

```text
KR-7 maintenance terminal

Systems checked: 0
Status: waiting
```

## Restored

The startup program runs exactly as you predicted. The terminal now reports its status every time it boots.
