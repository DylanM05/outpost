---
id: stock-depot
title: Stock the depot
system: Depot
symbol: equipment
scene: tests
skills: dictionaries, loops
---

## Briefing

The depot's inventory screen needs a count for every kind of crate, not just rations. You can't know in advance which labels will turn up, so a fixed set of counters won't work.

## Objective

Write `tally(crates)`. Return a dictionary that maps each label to the number of times it appears.

```python
tally(["fuel", "ration", "fuel"])  # {"fuel": 2, "ration": 1}
```

## Concept

A **dictionary** stores values under **keys**, so you can look them up by name:

```python
stock = {"fuel": 2, "ration": 5}
print(stock["fuel"])  # 2
stock["tools"] = 1    # add a new key
stock["fuel"] += 1    # update an existing one
```

Looking up a key that doesn't exist raises a `KeyError`. Use `in` to check first:

```python
if "water" in stock:
    print("We have water")
```

To count with a dictionary, loop over the items. If an item is already a key, add 1 to its count. If it isn't, add it with a count of 1.

## Hints

1. Start with an empty dictionary: `counts = {}`.
2. For each crate, use `if crate in counts:` to decide whether to add 1 or start at 1.
3. Return the dictionary after the loop.

## Starter: guided

```python
def tally(crates):
    counts = {}
    for crate in crates:
        if crate in counts:
            # Seen this label before: add 1 to its count.
            counts[crate] = counts[crate]
        else:
            # First time seeing this label: start its count at 1.
            counts[crate] = 0
    return counts


print(tally(["fuel", "ration", "fuel"]))
```

## Starter: standard

```python
def tally(crates):
    # Return a dictionary that maps each label to its count.
    return {}
```

## Starter: challenge

```python
```

## Checks

```python
cases = [
    (["fuel", "ration", "fuel"], {"fuel": 2, "ration": 1}),
    (["tools"], {"tools": 1}),
]
for crates, expected in cases:
    expect(f"tally({crates!r})", lambda: get("tally")(crates), expected)
```

## Hidden checks

```python
cases = [
    ([], {}),
    (["water"] * 4 + ["fuel"], {"water": 4, "fuel": 1}),
    (["ration", "tools", "ration", "seed", "tools", "ration"], {"ration": 3, "tools": 2, "seed": 1}),
]
for crates, expected in cases:
    expect(f"tally({crates!r})", lambda: get("tally")(crates), expected)
```

## Solution

```python
def tally(crates):
    counts = {}
    for crate in crates:
        if crate in counts:
            counts[crate] += 1
        else:
            counts[crate] = 1
    return counts
```

## Restored

The depot screen lists every type of crate with a live count. The crew can finally see what they're short of.
