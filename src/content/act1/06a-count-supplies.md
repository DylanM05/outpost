---
id: count-supplies
title: Count the supplies
system: Supply line
symbol: equipment
scene: tests
skills: loops, lists
---

## Briefing

The supply line is a conveyor that carries crates from the landing pad into storage. Each crate has a label. Before the next storm arrives, the crew needs to know how many crates of rations made it inside.

## Objective

Write `count_rations(crates)`. `crates` is a list of labels such as `["ration", "fuel", "ration"]`. Return how many of them are exactly `"ration"`.

## Concept

A **list** holds several values in order:

```python
readings = [12, 40, 7]
```

A `for` loop runs its body once for each item in a list. Each time, the loop variable holds the current item:

```python
total = 0
for reading in readings:
    total = total + reading
print(total)  # 59
```

This pattern is called an **accumulator**: create a variable before the loop, update it inside the loop, and use it after the loop. Counting works the same way. Start at 0 and add 1 whenever an item matches.

An `if` inside the loop decides which items count.

## Hints

1. Create a counter set to 0 before the loop.
2. Loop with `for crate in crates:`, and use `if crate == "ration":` inside it.
3. Add 1 inside the `if`. Return the counter after the loop has finished, not inside it.

## Starter: guided

```python
def count_rations(crates):
    count = 0
    for crate in crates:
        # This prints each label. Replace it with an if that
        # adds 1 to count when the crate is "ration".
        print(crate)
    return count


print(count_rations(["ration", "fuel", "ration", "tools"]))
```

## Starter: standard

```python
def count_rations(crates):
    # Loop over crates and count the labels that are exactly "ration".
    return 0
```

## Starter: challenge

```python
```

## Checks

```python
cases = [
    (["ration", "fuel", "ration", "tools"], 2),
    (["fuel", "fuel"], 0),
]
for crates, expected in cases:
    expect(f"count_rations({crates!r})", lambda: get("count_rations")(crates), expected)
```

## Hidden checks

```python
cases = [
    ([], 0),
    (["ration"] * 5, 5),
    (["tools", "ration"], 1),
    (["Ration", "ration", "rations"], 1),
]
for crates, expected in cases:
    expect(f"count_rations({crates!r})", lambda: get("count_rations")(crates), expected)
```

## Solution

```python
def count_rations(crates):
    count = 0
    for crate in crates:
        if crate == "ration":
            count += 1
    return count
```

## Restored

The conveyor is running again, and storage gets an accurate ration count after every delivery.
