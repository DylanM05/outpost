---
id: balance-the-lift
title: Balance the lift
system: Solar array
symbol: equipment
scene: tests
skills: lists, loops
---

## Briefing

The array's lift carries crates of spare panels up to the roof, two at a time. Its motor only runs at full load, so each trip needs two crates whose weights add up to exactly its capacity.

## Objective

Write `lift_pair(weights, capacity)`. Find two **different** crates whose weights add up to exactly `capacity`, and return their positions as a tuple `(i, j)`, with `i` before `j`. Check crate 0 against every crate after it, then crate 1 against every crate after it, and so on, and return the first pair that fits. If no pair fits, return `(-1, -1)`.

```python
lift_pair([30, 55, 20, 45], 75)  # (0, 3), because 30 + 45 is 75
lift_pair([30, 55], 100)         # (-1, -1)
```

## Concept

To compare every item with every other item, nest two loops over positions, and start the inner loop just past the outer one, as in the panel scan:

```python
for i in range(len(items)):
    for j in range(i + 1, len(items)):
        # items[i] and items[j] are a pair
```

This checks each pair once, and never pairs an item with itself. If the inner loop started at 0 instead, every pair would come up twice, and each crate would be paired with itself, which would let a single 50 kg crate pass for a pair when the capacity is 100.

A `return` inside both loops ends the whole function at once, as it did when you searched the conveyor.

With 10 crates, this checks 45 pairs. With 1,000 crates, it's nearly half a million. That's fine for a lift, and the survey office will have more to say about it.

## Hints

1. Loop `for i in range(len(weights)):`, and inside it `for j in range(i + 1, len(weights)):`.
2. If `weights[i] + weights[j] == capacity`, return `(i, j)` straight away.
3. After both loops, return `(-1, -1)`. That line only runs if no pair fitted.

## Starter: guided

```python
def lift_pair(weights, capacity):
    for i in range(len(weights)):
        for j in range(len(weights)):
            # j starts at 0, so this pairs crates with themselves.
            # Start it just past i instead.
            if weights[i] + weights[j] == capacity:
                return (i, j)
    return (-1, -1)


print(lift_pair([50, 30, 45], 100))
```

## Starter: standard

```python
def lift_pair(weights, capacity):
    # Check every pair of different crates, and return the positions
    # of the first pair that adds up to capacity.
    return (-1, -1)
```

## Starter: challenge

```python
```

## Checks

```python
expect("lift_pair([30, 55, 20, 45], 75)", lambda: get("lift_pair")([30, 55, 20, 45], 75), (0, 3))
expect("lift_pair([30, 55], 100)", lambda: get("lift_pair")([30, 55], 100), (-1, -1))
expect("lift_pair([10, 40, 35], 75)", lambda: get("lift_pair")([10, 40, 35], 75), (1, 2))
```

## Hidden checks

```python
expect("lift_pair([], 50)", lambda: get("lift_pair")([], 50), (-1, -1))
expect(
    "lift_pair([50], 100)",
    lambda: get("lift_pair")([50], 100),
    (-1, -1),
    "A crate can't be paired with itself.",
)
expect(
    "lift_pair([50, 30, 50], 100)",
    lambda: get("lift_pair")([50, 30, 50], 100),
    (0, 2),
    "Two different crates can weigh the same.",
)
expect("lift_pair([25, 50, 50, 25], 75)", lambda: get("lift_pair")([25, 50, 50, 25], 75), (0, 1))
expect("lift_pair([5, 10, 15, 20], 35)", lambda: get("lift_pair")([5, 10, 15, 20], 35), (2, 3))
```

## Solution

```python
def lift_pair(weights, capacity):
    for i in range(len(weights)):
        for j in range(i + 1, len(weights)):
            if weights[i] + weights[j] == capacity:
                return (i, j)
    return (-1, -1)
```

## Restored

Every trip goes up at exactly full load. The spares reach the roof by noon, and the whole array is generating again.
