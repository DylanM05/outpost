---
id: maintenance-receive
title: Record a delivery
system: Depot
symbol: equipment
scene: tests
skills: dictionaries
reviewSkill: dictionaries
prerequisite: plan-the-restock
---

## Briefing

A delivery may contain a crate type that is not in the inventory yet.

## Objective

Write `receive(stock, label, amount)`. Add amount to the count for label, starting from zero if absent, and return stock. You may update the supplied dictionary. Preserve other labels. Counts and amount are nonnegative integers.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. A missing key needs an initial value.
2. Only update the entry matching label.
3. Preserve the other dictionary entries, then return the inventory.

## Starter

```python

```

## Checks

```python
cases = [(({'fuel': 2}, 'fuel', 3), {'fuel': 5}), (({'fuel': 2}, 'water', 4), {'fuel': 2, 'water': 4})]
for args, expected in cases:
    expect(f"receive{args!r}", lambda: get("receive")(*args), expected)
```

## Hidden checks

```python
cases = [(({}, 'tools', 1), {'tools': 1}), (({'seed': 3}, 'seed', 0), {'seed': 3}), (({'fuel': 2, 'tools': 1}, 'fuel', 1), {'fuel': 3, 'tools': 1})]
for args, expected in cases:
    expect(f"receive{args!r}", lambda: get("receive")(*args), expected)
```

## Solution

```python
def receive(stock, label, amount):
    if label not in stock:
        stock[label] = 0
    stock[label] += amount
    return stock
```

## Restored

The new crate type gets its own line in the inventory instead of crashing the depot screen.
