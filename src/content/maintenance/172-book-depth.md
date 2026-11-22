---
id: maintenance-book-depth
title: Aggregate order-book depth by price level
system: Matching floor
symbol: equipment
scene: tests
skills: matching-engines
reviewSkill: matching-engines
prerequisite: vwap-calculator
---

## Briefing

Market-data feeds don't broadcast every individual resting order — they aggregate total resting quantity at each price level, sorted best-price first (highest first for bids, lowest first for asks).

## Objective

Write `aggregate_depth(orders, side)` where `orders` is a list of `(price, qty)` tuples (ignoring any entry with `qty <= 0`) and `side` is `"buy"` or `"sell"` (raise `ValueError` otherwise).

Sum quantities per distinct `price` and return `[(price, total_qty), ...]` sorted descending by `price` for `"buy"`, or ascending by `price` for `"sell"`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Sum `levels[price] += qty` for `qty > 0`.
2. Sort `levels.items()` with `reverse=(side == "buy")`.

## Starter

```python
```

## Checks

```python
expect("aggregates buy depth highest price first", lambda: get("aggregate_depth")([(100, 5), (102, 3), (100, 4)], "buy"), [(102, 3), (100, 9)])
expect("aggregates sell depth lowest price first", lambda: get("aggregate_depth")([(105, 2), (103, 6), (105, 1)], "sell"), [(103, 6), (105, 3)])
```

## Hidden checks

```python
expect("ignores zero-qty orders", lambda: get("aggregate_depth")([(100, 0), (101, 2)], "sell"), [(101, 2)])
def _bad():
    try:
        get("aggregate_depth")([], "hold")
        return False
    except ValueError:
        return True
expect("invalid side raises ValueError", _bad, True)
```

## Solution

```python
def aggregate_depth(orders, side):
    if side not in ("buy", "sell"):
        raise ValueError("side must be 'buy' or 'sell'")
    levels = {}
    for price, qty in orders:
        if qty > 0:
            levels[price] = levels.get(price, 0) + qty
    return sorted(levels.items(), key=lambda item: item[0], reverse=(side == "buy"))
```

## Restored

Level-2 market depth now aggregates cleanly into best-price-first ladders.
