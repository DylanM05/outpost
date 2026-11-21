---
id: last-in-first-out
kind: predict
title: Last in, first out
system: Command stack
symbol: equipment
scene: console
skills: linear-structures, reading-code
---

## Briefing

Operators on the deep survey terminal enter multi-step commands and often need to back out of the latest change first. That takes a **stack**: the last item placed on top is always the first item taken off. Trace what stays on the stack after a short run of edits.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

A **stack** is a last-in, first-out (LIFO) data structure with two main operations:

- **`push`**: put an item on top of the stack (`O(1)`).
- **`pop`**: remove and return the top item (`O(1)`).
- **`peek`**: look at the top item without removing it (`O(1)`).

Python's list already supports fast operations at its right end (`append` and `pop`), which makes it natural to back a stack. Wrapping it in a `Stack` class restricts access to the top so callers can't reach into the middle by mistake.

## Hints

1. Each `append` puts an item on top; `pop()` removes and returns the most recently added item.
2. `stack[-1]` looks at the top item without removing it.
3. Keep track of the list after every single line.

## Program

```python
stack = []
stack.append("open map")
stack.append("add marker")
stack.append("set beacon")
print(stack.pop())
stack.append("check wind")
print(stack[-1])
print(stack.pop())
print(len(stack))
```

## Output

```text
set beacon
check wind
check wind
2
```

## Restored

You traced the stack's top pointer through every push, peek, and pop.
