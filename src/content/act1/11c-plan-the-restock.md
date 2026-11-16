---
id: plan-the-restock
title: Plan the restock
system: Depot
symbol: equipment
scene: tests
skills: dictionaries, loops
---

## Briefing

With the inventory counted, the next supply request can go out. It should only list what's running low, and the supply office wants it in alphabetical order.

## Objective

Write `restock(stock, minimum)`. `stock` is a dictionary of item counts. Return a list of the items whose count is **below** `minimum`, sorted alphabetically.

```python
restock({"fuel": 2, "seed": 40, "medical": 1}, 5)  # ["fuel", "medical"]
```

## Concept

Loop over a dictionary's keys and values together with `.items()`:

```python
stock = {"fuel": 2, "seed": 40}
for item, count in stock.items():
    print(item, count)
```

Each pass gives you one key and its value. Looping over the dictionary itself, as in `for item in stock:`, gives only the keys.

`sorted()` returns a new list in order, alphabetical for strings and smallest first for numbers:

```python
sorted(["seed", "fuel", "medical"])  # ["fuel", "medical", "seed"]
```

## Hints

1. Start with an empty list, and loop with `for item, count in stock.items():`.
2. Append `item` when `count < minimum`.
3. Return `sorted(low)`.

## Starter: guided

```python
def restock(stock, minimum):
    low = []
    for item, count in stock.items():
        # Add item to low if its count is below minimum.
        print(item, count)
    # Return low in alphabetical order.
    return low


print(restock({"fuel": 2, "seed": 40, "medical": 1}, 5))
```

## Starter: standard

```python
def restock(stock, minimum):
    # Return the items below minimum, sorted alphabetically.
    return []
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    'restock({"fuel": 2, "seed": 40, "medical": 1}, 5)',
    lambda: get("restock")({"fuel": 2, "seed": 40, "medical": 1}, 5),
    ["fuel", "medical"],
)
expect('restock({"water": 10}, 5)', lambda: get("restock")({"water": 10}, 5), [])
```

## Hidden checks

```python
expect("restock({}, 5)", lambda: get("restock")({}, 5), [])
expect('restock({"tools": 5, "rope": 4}, 5)', lambda: get("restock")({"tools": 5, "rope": 4}, 5), ["rope"])
expect(
    'restock({"water": 0, "batteries": 3, "antifreeze": 1}, 10)',
    lambda: get("restock")({"water": 0, "batteries": 3, "antifreeze": 1}, 10),
    ["antifreeze", "batteries", "water"],
)
```

## Solution

```python
def restock(stock, minimum):
    low = []
    for item, count in stock.items():
        if count < minimum:
            low.append(item)
    return sorted(low)
```

## Restored

The supply request goes out listing only what's running low. The supply office approves it the same day.
