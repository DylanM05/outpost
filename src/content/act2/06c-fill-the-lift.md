---
id: fill-the-lift
title: Fill the lift
system: Index vault
symbol: instrument
scene: work
skills: hashing, dictionaries
---

## Briefing

The vault's freight lift has the same rule as the solar array's: two crates per trip, adding up to exactly its capacity. But the vault has thousands of crates, and checking every pair, the way you did at the array, keeps the lift waiting all morning.

## Objective

Write `lift_pair(weights, capacity)`. Find two **different** crates whose weights add up to exactly `capacity`, and return their positions as a tuple `(i, j)` with `i` before `j`. Any pair that fits is accepted. If none fits, return `(-1, -1)`.

```python
lift_pair([30, 55, 20, 45], 75)  # (0, 3) or (1, 2)
lift_pair([30, 55], 100)         # (-1, -1)
```

The hidden test has 2,000 crates, with the only fitting pair at the very end, and allows 6,000 reads.

## Concept

For each crate, you already know exactly what weight its partner needs: `capacity - weights[j]`. So instead of searching all the earlier crates for that partner, look it up.

Walk through the crates once, keeping a dictionary that maps each weight seen so far to its position:

- Work out the partner weight this crate needs.
- If that weight is in the dictionary, the partner came earlier: return its position and this one.
- Otherwise, record this crate's weight and position, and move on.

```python
positions = {}
positions[30] = 0
positions[55] = 1
45 in positions   # False
positions[30]     # 0
```

Look up the partner **before** recording the current crate. That way a crate can't pair with itself when its weight is exactly half the capacity, but two different crates of that weight still can.

This is one of the most famous uses of hashing, often called "two-sum". The pair loop is quadratic; this is linear, with a dictionary as the memory.

## Hints

1. Create `positions = {}`, and loop `for j in range(len(weights)):`.
2. `need = capacity - weights[j]`. If `need in positions`, return `(positions[need], j)`.
3. Otherwise, `positions[weights[j]] = j`. After the loop, return `(-1, -1)`.

## Starter: guided

```python
def lift_pair(weights, capacity):
    positions = {}
    for j in range(len(weights)):
        need = capacity - weights[j]
        # If need is in positions, return its position and j.
        # Then record this crate: positions[weights[j]] = j
        print(j, weights[j], need)
    return (-1, -1)


print(lift_pair([30, 55, 20, 45], 75))
```

## Starter: standard

```python
def lift_pair(weights, capacity):
    for i in range(len(weights)):
        for j in range(i + 1, len(weights)):
            if weights[i] + weights[j] == capacity:
                return (i, j)
    return (-1, -1)
```

## Starter: challenge

```python
```

## Checks

```python
def fits(weights, capacity):
    def accept(pair):
        if not isinstance(pair, tuple) or len(pair) != 2:
            return False
        i, j = pair
        return 0 <= i < j < len(weights) and weights[i] + weights[j] == capacity
    return accept

hint = "Look up each crate's partner in a dictionary, instead of checking every pair."
expect(
    "lift_pair([30, 55, 20, 45], 75)",
    lambda: get("lift_pair")([30, 55, 20, 45], 75),
    "two different crates adding up to 75",
    accept=fits([30, 55, 20, 45], 75),
)
expect("lift_pair([30, 55], 100)", lambda: get("lift_pair")([30, 55], 100), (-1, -1))
plain = [(i * 37) % 1000 + 2 for i in range(100)] + [3000, 2000]
row = tracked(plain)
expect_within(
    "lift_pair(102 crates, 5000)",
    lambda: get("lift_pair")(row, 5000),
    "two different crates adding up to 5000",
    row,
    306,
    hint,
    accept=fits(plain, 5000),
)
```

## Hidden checks

```python
expect("lift_pair([], 50)", lambda: get("lift_pair")([], 50), (-1, -1))
expect("lift_pair([50], 100)", lambda: get("lift_pair")([50], 100), (-1, -1), "A crate can't be paired with itself.")
expect(
    "lift_pair([50, 30, 50], 100)",
    lambda: get("lift_pair")([50, 30, 50], 100),
    "two different crates adding up to 100",
    "Two different crates can weigh the same.",
    accept=fits([50, 30, 50], 100),
)
expect(
    "lift_pair([1, 2, 3, 4, 5, 6], 11)",
    lambda: get("lift_pair")([1, 2, 3, 4, 5, 6], 11),
    "two different crates adding up to 11",
    accept=fits([1, 2, 3, 4, 5, 6], 11),
)
big = [(i * 7919) % 100000 + 10 for i in range(1998)] + [500000, 7]
aisle = tracked(big)
expect_within(
    "lift_pair(2,000 crates, 500007)",
    lambda: get("lift_pair")(aisle, 500007),
    "two different crates adding up to 500007",
    aisle,
    6000,
    hint,
    accept=fits(big, 500007),
)
```

## Solution

```python
def lift_pair(weights, capacity):
    positions = {}
    for j in range(len(weights)):
        need = capacity - weights[j]
        if need in positions:
            return (positions[need], j)
        positions[weights[j]] = j
    return (-1, -1)
```

## Restored

The lift loads in one pass down the vault's aisle. Every trip goes up at full load, and nobody waits on the computer.
