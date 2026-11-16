---
id: find-the-crate
title: Find the crate
system: Supply line
symbol: equipment
scene: tests
skills: lists, loops
---

## Briefing

A medical kit came in on the last delivery, but nobody knows which bay it went to. The conveyor log lists every crate in the order it arrived, and each crate's bay number is its position in that list.

## Objective

Write `find_crate(crates, label)`. Return the position of the **first** crate that matches `label`. If there's no match, return `-1`.

```python
find_crate(["fuel", "medical", "tools", "medical"], "medical")  # 1
find_crate(["fuel"], "medical")                                # -1
```

## Concept

A `for crate in crates:` loop gives you each item, but not where it is. When the answer is a position, loop over positions with `range(len(crates))`, as the bay listing did, and look at the item in each one:

```python
crates = ["fuel", "tools", "seed"]
for i in range(len(crates)):
    if crates[i] == "seed":
        print("seed is in bay", i)
```

```text
seed is in bay 2
```

Giving `print` several values prints them separated by spaces.

A `return` inside a loop ends the whole function immediately, loop and all. That's exactly what you want when you're searching: once you've found the first match, stop. If the loop finishes without returning, nothing matched, and the code after the loop runs.

## Hints

1. Loop over positions: `for i in range(len(crates)):`.
2. When `crates[i] == label`, return `i` straight away.
3. After the loop, `return -1`. That line only runs if nothing matched.

## Starter: guided

```python
def find_crate(crates, label):
    for i in range(len(crates)):
        # If the crate at position i matches label, return i.
        print(i, crates[i])
    # The loop finished, so nothing matched.
    return -1


print(find_crate(["fuel", "medical", "tools"], "medical"))
```

## Starter: standard

```python
def find_crate(crates, label):
    # Return the position of the first match, or -1.
    return -1
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    'find_crate(["fuel", "medical", "tools", "medical"], "medical")',
    lambda: get("find_crate")(["fuel", "medical", "tools", "medical"], "medical"),
    1,
)
expect('find_crate(["fuel"], "medical")', lambda: get("find_crate")(["fuel"], "medical"), -1)
```

## Hidden checks

```python
expect('find_crate([], "medical")', lambda: get("find_crate")([], "medical"), -1)
expect('find_crate(["medical"], "medical")', lambda: get("find_crate")(["medical"], "medical"), 0)
expect('find_crate(["seed", "seed", "tools"], "tools")', lambda: get("find_crate")(["seed", "seed", "tools"], "tools"), 2)
expect('find_crate(["Medical", "medical"], "medical")', lambda: get("find_crate")(["Medical", "medical"], "medical"), 1)
```

## Solution

```python
def find_crate(crates, label):
    for i in range(len(crates)):
        if crates[i] == label:
            return i
    return -1
```

## Restored

The medical kit is in bay 1. The crew finds it before anyone needs it.
