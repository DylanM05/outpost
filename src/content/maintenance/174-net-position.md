---
id: maintenance-net-position
title: Compute net trader positions from a trade tape
system: Matching floor
symbol: equipment
scene: tests
skills: matching-engines
reviewSkill: matching-engines
prerequisite: vwap-calculator
---

## Briefing

Clearing houses net every participant's buys (`+qty`) and sells (`-qty`) across the day's trade tape so only net asset deltas need physical delivery.

## Objective

Write `net_positions(trades)` where `trades` is a list of dicts `{"buyer": str, "seller": str, "qty": int}`.

Compute each trader's net quantity (`+qty` when buyer, `-qty` when seller), omitting accounts whose final net position is `0`! Return `{account: net_qty}`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Update `pos[buyer] += qty` and `pos[seller] -= qty` for every trade (notice a self-trade cancels out cleanly!).
2. Filter `{k: v for k, v in pos.items() if v != 0}` before returning.

## Starter

```python
```

## Checks

```python
expect(
    "nets buys and sells and omits flat zero accounts",
    lambda: get("net_positions")([
        {"buyer": "alice", "seller": "bob", "qty": 10},
        {"buyer": "bob", "seller": "carol", "qty": 10},
    ]),
    {"alice": 10, "carol": -10},
)
expect("empty tape returns empty dict", lambda: get("net_positions")([]), {})
```

## Hidden checks

```python
expect("self-trade nets to zero cleanly", lambda: get("net_positions")([{"buyer": "alice", "seller": "alice", "qty": 5}]), {})
```

## Solution

```python
def net_positions(trades):
    pos = {}
    for t in trades:
        qty = t["qty"]
        pos[t["buyer"]] = pos.get(t["buyer"], 0) + qty
        pos[t["seller"]] = pos.get(t["seller"], 0) - qty
    return {acct: qty for acct, qty in pos.items() if qty != 0}
```

## Restored

Trade tapes now collapse into exact zero-sum net settlement positions.
