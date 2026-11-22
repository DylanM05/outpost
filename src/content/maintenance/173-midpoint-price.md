---
id: maintenance-midpoint-price
title: Compute top-of-book midpoint price safely
system: Matching floor
symbol: equipment
scene: tests
skills: matching-engines
reviewSkill: matching-engines
prerequisite: vwap-calculator
---

## Briefing

Before pricing a collateral portfolio, check that the order book is two-sided and uncrossed (`best_bid < best_ask`), then compute the midpoint `(best_bid + best_ask) / 2`.

## Objective

Write `book_midpoint(bid_prices, ask_prices)` where both arguments are iterables of positive numbers.

- If either side is empty, return `None`.
- Let `best_bid = max(bid_prices)` and `best_ask = min(ask_prices)`.
- If `best_bid >= best_ask` (crossed or locked book!), raise `ValueError("crossed book")`.
- Otherwise return `(best_bid + best_ask) / 2`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Convert both iterables to lists first so checking emptiness and taking `max`/`min` works on generators too!
2. Raise `ValueError` if `best_bid >= best_ask`.

## Starter

```python
```

## Checks

```python
expect("computes midpoint of best bid and best ask", lambda: get("book_midpoint")([98, 100, 95], [104, 102, 110]), 101.0)
expect("one-sided book returns None", lambda: (get("book_midpoint")([], [100]), get("book_midpoint")([100], [])), (None, None))
```

## Hidden checks

```python
def _crossed():
    try:
        get("book_midpoint")([102], [100])
        return False
    except ValueError:
        return True
expect("crossed book raises ValueError", _crossed, True)
```

## Solution

```python
def book_midpoint(bid_prices, ask_prices):
    bids = list(bid_prices)
    asks = list(ask_prices)
    if not bids or not asks:
        return None
    best_bid = max(bids)
    best_ask = min(asks)
    if best_bid >= best_ask:
        raise ValueError("crossed or locked book")
    return (best_bid + best_ask) / 2
```

## Restored

Midpoint pricing handles one-sided books gracefully and alerts on crossed quotes.
