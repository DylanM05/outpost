---
id: walk-the-pipeline
title: Walk the pipeline
system: Reservoir
symbol: equipment
scene: tests
skills: loops, lists
---

## Briefing

A pipe carries meltwater from the reservoir down to the greenhouse, section by section. Some sections froze solid overnight, and water stops at the first frozen one. The crew can only dig out one section before dark, so they need to know how far the water gets.

## Objective

Write `reach(sections)`. `sections` lists the pipe's sections in order from the reservoir, each one `"clear"` or `"frozen"`. Return how many sections the water flows through before it reaches the first frozen one. If nothing is frozen, it flows through all of them.

```python
reach(["clear", "clear", "frozen", "clear"])  # 2
reach(["clear", "clear"])                     # 2
```

## Concept

A `for` loop moves through a list one item at a time, from the start to the end. Sometimes you want to move a position yourself, and stop when you choose. A `while` loop with a position variable does that:

```python
readings = [3, 5, 9, 2]
i = 0
while i < len(readings) and readings[i] < 8:
    i += 1
print(i)  # 2, the position of the first reading of 8 or more
```

The condition does two jobs. `i < len(readings)` stops the loop at the end of the list, and `readings[i] < 8` stops it at the first big reading.

The order matters. Python checks the left side of an `and` first, and if it's false, it doesn't check the right side at all. Here, that means `readings[i]` is never read once `i` has run past the end. Swap the two sides, and a list with no big reading crashes with an `IndexError`, because the last check reads a position that doesn't exist.

You'll need loops like this whenever the position doesn't simply move forward one step at a time.

## Hints

1. Start with `i = 0`, and move `i` forward one section at a time while the section at `i` is clear.
2. Put `i < len(sections)` first in the condition, so the loop stops at the end of the pipe before reading past it.
3. `while i < len(sections) and sections[i] == "clear":`, then `i += 1` inside. Return `i` after the loop.

## Starter: guided

```python
def reach(sections):
    i = 0
    while i < len(sections):
        # Stop at the first frozen section. Add a second condition
        # to the while line, joined with and.
        i += 1
    return i


print(reach(["clear", "clear", "frozen", "clear"]))
```

## Starter: standard

```python
def reach(sections):
    # Move a position forward through the pipe until it reaches a frozen
    # section or the end, then return it.
    return 0
```

## Starter: challenge

```python
```

## Checks

```python
cases = [
    (["clear", "clear", "frozen", "clear"], 2),
    (["clear", "clear"], 2),
]
for sections, expected in cases:
    expect(f"reach({sections!r})", lambda: get("reach")(sections), expected)
```

## Hidden checks

```python
cases = [
    ([], 0),
    (["frozen"], 0),
    (["frozen", "clear", "clear"], 0),
    (["clear", "frozen", "frozen"], 1),
    (["clear"] * 50 + ["frozen"], 50),
]
for sections, expected in cases:
    label = f"reach({sections!r})" if len(sections) < 10 else "reach(50 clear sections, then a frozen one)"
    expect(label, lambda: get("reach")(sections), expected)
```

## Solution

```python
def reach(sections):
    i = 0
    while i < len(sections) and sections[i] == "clear":
        i += 1
    return i
```

## Restored

The crew digs out section 2, and meltwater reaches the greenhouse for the first time since autumn.
