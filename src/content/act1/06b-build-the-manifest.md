---
id: build-the-manifest
title: Build the manifest
system: Supply line
symbol: equipment
scene: tests
skills: lists, loops
---

## Briefing

The lift at the landing pad can only carry so much at once. Before the next delivery arrives, the crew needs a list of every crate that's too heavy for it, so they can unload those by hand.

## Objective

Write `too_heavy(weights, limit)`. `weights` is a list of crate weights in kilograms. Return a **new list** of the weights greater than `limit`, in their original order.

```python
too_heavy([12, 80, 45, 95], 50)  # [80, 95]
```

## Concept

Lists can grow. `append()` adds an item to the end:

```python
found = []
found.append("fuel")
found.append("tools")
print(found)       # ['fuel', 'tools']
print(len(found))  # 2
```

`len()` gives a list's length. Square brackets get an item by its position, counting from 0:

```python
print(found[0])   # fuel
print(found[-1])  # tools (negative positions count back from the end)
```

Building a new list from an old one is a common loop pattern: start with an empty list, loop over the original, and append the items you want to keep. The original list stays as it was.

## Hints

1. Create `heavy = []` before the loop.
2. Inside the loop: `if weight > limit:`, then `heavy.append(weight)`.
3. Return the new list after the loop. Don't remove anything from `weights` itself.

## Starter: guided

```python
def too_heavy(weights, limit):
    heavy = []
    for weight in weights:
        if weight > limit:
            # Add this weight to the end of heavy.
            print(weight)
    return heavy


print(too_heavy([12, 80, 45, 95], 50))
```

## Starter: standard

```python
def too_heavy(weights, limit):
    # Return a new list of the weights greater than limit.
    return []
```

## Starter: challenge

```python
```

## Checks

```python
expect("too_heavy([12, 80, 45, 95], 50)", lambda: get("too_heavy")([12, 80, 45, 95], 50), [80, 95])
expect("too_heavy([5, 10], 50)", lambda: get("too_heavy")([5, 10], 50), [])
```

## Hidden checks

```python
expect("too_heavy([], 50)", lambda: get("too_heavy")([], 50), [])
expect("too_heavy([50, 51, 49], 50)", lambda: get("too_heavy")([50, 51, 49], 50), [51])
expect("too_heavy([200, 150, 300], 100)", lambda: get("too_heavy")([200, 150, 300], 100), [200, 150, 300])
original = [60, 20, 70]
check(
    "Leaves the original list unchanged",
    lambda: (get("too_heavy")(original, 50), original)[1] == [60, 20, 70],
    "Build a new list instead of changing weights.",
)
```

## Solution

```python
def too_heavy(weights, limit):
    heavy = []
    for weight in weights:
        if weight > limit:
            heavy.append(weight)
    return heavy
```

## Restored

Heavy crates now get a red tag on the manifest, so nobody has to guess which ones will break the lift.
