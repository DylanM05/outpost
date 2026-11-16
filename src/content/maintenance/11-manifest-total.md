---
id: maintenance-manifest-total
title: Reconcile the manifest
system: Depot
symbol: equipment
scene: tests
skills: dictionaries
reviewSkill: dictionaries
prerequisite: plan-the-restock
---

## Briefing

The manifest stores quantities by crate label. The truck scale needs the total number of crates.

## Objective

Write `manifest_total(stock)`. Return the sum of all counts in the dictionary. Empty stock totals 0. Counts are nonnegative integers.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. You need the counts, not the number of labels.
2. Look up each label’s count as you visit the dictionary.
3. Add those counts and return the total after the loop.

## Starter

```python

```

## Checks

```python
cases = [(({'fuel': 3, 'water': 2},), 5), (({'tools': 1},), 1)]
for args, expected in cases:
    expect(f"manifest_total{args!r}", lambda: get("manifest_total")(*args), expected)
```

## Hidden checks

```python
cases = [(({},), 0), (({'seed': 0, 'food': 8},), 8), (({'a': 2, 'b': 2, 'c': 2},), 6)]
for args, expected in cases:
    expect(f"manifest_total{args!r}", lambda: get("manifest_total")(*args), expected)
```

## Solution

```python
def manifest_total(stock):
    total = 0
    for label in stock:
        total += stock[label]
    return total
```

## Restored

The truck scale's crate count matches the manifest. The delivery is signed off.
