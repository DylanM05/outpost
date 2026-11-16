---
id: maintenance-shortages
title: Prepare a shortage report
system: Depot
symbol: equipment
scene: tests
skills: dictionaries
reviewSkill: dictionaries
prerequisite: plan-the-restock
---

## Briefing

The depot needs a report of exactly what to order before the next storm.

## Objective

Write `shortages(stock, targets)`. Return a new dictionary mapping each target label below its target to the missing quantity. Missing stock labels count as 0. Omit labels already at or above target and stock labels absent from targets. Do not modify either input. Counts are nonnegative integers.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Start a new dictionary for the report.
2. Visit target labels and treat an absent stock label as zero.
3. Only add an entry when target minus available stock is positive.

## Starter

```python

```

## Checks

```python
cases = [(({'fuel': 2}, {'fuel': 5, 'water': 1}), {'fuel': 3, 'water': 1}), (({'fuel': 8}, {'fuel': 5}), {})]
for args, expected in cases:
    expect(f"shortages{args!r}", lambda: get("shortages")(*args), expected)
```

## Hidden checks

```python
cases = [(({}, {}), {}), (({'fuel': 5, 'tools': 9}, {'fuel': 5}), {}), (({}, {'seed': 0}), {})]
for args, expected in cases:
    expect(f"shortages{args!r}", lambda: get("shortages")(*args), expected)
stock = {"fuel": 2}
targets = {"fuel": 5}
get("shortages")(stock, targets)
expect("stock stays unchanged", lambda: stock, {"fuel": 2})
expect("targets stay unchanged", lambda: targets, {"fuel": 5})
```

## Solution

```python
def shortages(stock, targets):
    missing = {}
    for label in targets:
        have = stock[label] if label in stock else 0
        if have < targets[label]:
            missing[label] = targets[label] - have
    return missing
```

## Restored

The shortage report lists exactly what to order before the storm, and nothing the depot already has.
