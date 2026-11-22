---
id: vwap-calculator
title: Compute Volume-Weighted Average Price (VWAP)
system: Matching floor
symbol: equipment
scene: tests
skills: matching-engines
---

## Briefing

A simple average of trade prices gets distorted by tiny 1-unit trades. **VWAP** weights every trade by its volume so large fills dominate the benchmark price accurately.

## Concept

Given trade fills `[(price, qty), ...]`:
$$\text{VWAP} = \frac{\sum (\text{price}_i \times \text{qty}_i)}{\sum \text{qty}_i}$$
where `notional = sum(price * qty)` and `volume = sum(qty)`.
Return `None` for `"vwap"` when total volume is `0`.

## Objective

Write `trade_summary(fills)` where `fills` is a list of `(price, qty)` tuples (validate `price > 0` and `qty > 0`, raising `ValueError` otherwise).

Return `{"volume": total_qty, "notional": total_notional, "vwap": total_notional / total_qty if total_qty else None}`.

## Hints

1. Validate every `(price, qty)` has `price > 0` and `qty > 0` before accumulating.
2. When `fills` is empty, return `{"volume": 0, "notional": 0, "vwap": None}`.

## Starter: guided

```python
def trade_summary(fills):
    volume = 0
    notional = 0
    for price, qty in fills:
        if price <= 0 or qty <= 0:
            raise ValueError("price and qty must be positive")
        # Accumulate volume and notional
        pass
    return {
        "volume": volume,
        "notional": notional,
        "vwap": notional / volume if volume else None,
    }
```

## Starter: standard

```python
def trade_summary(fills):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "weights average price by trade volume",
    lambda: get("trade_summary")([(100, 10), (110, 30)]),
    {"volume": 40, "notional": 4300, "vwap": 107.5},
)
expect("empty fills returns None vwap", lambda: get("trade_summary")([]), {"volume": 0, "notional": 0, "vwap": None})
```

## Hidden checks

```python
def _bad():
    try:
        get("trade_summary")([(100, 0)])
        return False
    except ValueError:
        return True
expect("non-positive price or qty raises ValueError", _bad, True)
```

## Solution

```python
def trade_summary(fills):
    volume = 0
    notional = 0
    for price, qty in fills:
        if price <= 0 or qty <= 0:
            raise ValueError("price and qty must be positive")
        volume += qty
        notional += price * qty
    return {
        "volume": volume,
        "notional": notional,
        "vwap": notional / volume if volume else None,
    }
```

## Restored

Trade tapes now summarize exact volume, notional value, and VWAP without distortion from tiny fills.
