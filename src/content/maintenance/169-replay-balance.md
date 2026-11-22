---
id: maintenance-replay-balance
title: Project an account balance from domain events
system: Event spine
symbol: controller
scene: tests
skills: event-sourcing
reviewSkill: event-sourcing
prerequisite: saga-orchestrator
---

## Briefing

Event-sourced read models fold domain events into materialized balances cleanly without touching the underlying immutable log.

## Objective

Write `project_balance(events)` where `events` is a list of `(event_type, amount)` tuples:
- `"deposit"` adds `amount`
- `"withdraw"` subtracts `amount`
- `"fee"` subtracts `amount`
- `"refund"` adds `amount`

Raise `ValueError` on any unknown event type; return the final integer balance starting from `0`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Fold `balance = 0` over each `(kind, amount)` with clear `if/elif` handling and `else: raise ValueError(...)`.

## Starter

```python
```

## Checks

```python
expect("folds deposits, withdrawals, fees, and refunds", lambda: get("project_balance")([("deposit", 500), ("withdraw", 120), ("fee", 15), ("refund", 20)]), 385)
expect("empty event stream yields 0", lambda: get("project_balance")([]), 0)
```

## Hidden checks

```python
def _bad():
    try:
        get("project_balance")([("teleport", 10)])
        return False
    except ValueError:
        return True
expect("unknown event type raises ValueError", _bad, True)
```

## Solution

```python
def project_balance(events):
    balance = 0
    for kind, amount in events:
        if kind in ("deposit", "refund"):
            balance += amount
        elif kind in ("withdraw", "fee"):
            balance -= amount
        else:
            raise ValueError(f"unknown event type: {kind}")
    return balance
```

## Restored

Account balance projections now replay deterministically from any domain event log.
