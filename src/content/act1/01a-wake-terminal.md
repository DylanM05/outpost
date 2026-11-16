---
id: wake-terminal
title: Wake the terminal
system: Terminal
symbol: equipment
scene: console
skills: output
---

## Briefing

The maintenance terminal still has power, but it's waiting for its first instruction. Every other system at Kestrel Ridge is controlled from here, so start by proving it can hear you.

## Objective

Make the terminal print exactly this line:

```text
KR-7 terminal online
```

## Concept

A Python program is a list of instructions that run from top to bottom. `print()` shows a value in the console:

```python
print("Hello")
```

Text inside quotes is a **string**. Python prints a string exactly as written, including capital letters and spaces, but without the quotes.

## Hints

1. You need one line of code that uses `print()`.
2. Put the text inside quotes, inside the parentheses: `print("...")`.
3. Check capitals, the hyphen, and the spaces: `KR-7 terminal online`.

## Starter: guided

```python
# Instructions run from top to bottom.
# This line prints a greeting. Press Run to see it:
print("Hello from Kestrel Ridge")

# Now print the line the terminal is waiting for:
# KR-7 terminal online
```

## Starter: standard

```python
# Print the line: KR-7 terminal online
```

## Starter: challenge

```python
```

## Checks

```python
check(
    "Prints KR-7 terminal online",
    lambda: "KR-7 terminal online" in lines,
    "Compare your output with the objective character by character, including capitals.",
)
```

## Solution

```python
print("KR-7 terminal online")
```

## Restored

The terminal answers with a blinking cursor and a list of systems that need repair. Every one of them reports offline.
