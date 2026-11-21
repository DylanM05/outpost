---
id: atomic-tx-recovery
kind: code
title: Replay interleaved transactions in commit order
system: Journal desk
symbol: instrument
scene: tests
skills: storage-engines
---

## Briefing

When two transactions interleave their writes in the WAL:
- `tx=1` writes `x=1` first,
- `tx=2` writes `x=2` second,
- `tx=2` commits **before** `tx=1` commits!

When replaying the WAL, the final state of `x` must reflect **commit order** (`tx=2` committed first, then `tx=1` committed after, so `x=1` wins — NOT the order individual `PUT` records landed in the log!), and any transaction that aborted or never committed must leave **zero** trace!

## Objective

Write `replay_transactions(records)` where each record is one of:
- `("BEGIN", tx_id)`
- `("PUT", tx_id, key, value)`
- `("DEL", tx_id, key)`
- `("COMMIT", tx_id)`
- `("ABORT", tx_id)`

Rules:
- Buffer each active transaction's operations (`PUT` / `DEL`) separately in `pending[tx_id]`.
- On `("COMMIT", tx_id)`: apply all buffered operations of `tx_id` to `db` in order and clear `pending[tx_id]`.
- On `("ABORT", tx_id)`: discard `pending[tx_id]` without touching `db`.
- Any transaction still in `pending` at the end of `records` (never committed) is discarded!
- Return the recovered `db` dictionary.

## Concept

Buffering per-transaction write sets and applying them atomically at the exact `COMMIT` record guarantees both **atomicity** (no partial writes) and **commit-order serializability** (a transaction's writes become visible together at its commit point).

## Hints

1. Use `pending = {}` mapping `tx_id -> list[op]`.
2. On `PUT`/`DEL`, append to `pending.setdefault(tx_id, [])`. On `COMMIT`, loop over `pending.pop(tx_id, [])` updating `db` (`db[k] = v` or `db.pop(k, None)`).

## Starter: guided

```python
def replay_transactions(records):
    db = {}
    pending = {}
    for rec in records:
        kind = rec[0]
        tx = rec[1]
        if kind == "BEGIN":
            pending[tx] = []
        elif kind in ("PUT", "DEL"):
            pending.setdefault(tx, []).append(rec)
        elif kind == "ABORT":
            pending.pop(tx, None)
        elif kind == "COMMIT":
            # TODO: apply buffered PUT/DEL ops for tx in order to db
            pass
    return db
```

## Starter: standard

```python
def replay_transactions(records):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
wal = [
    ("BEGIN", 1),
    ("PUT", 1, "x", 1),
    ("BEGIN", 2),
    ("PUT", 2, "x", 2),
    ("PUT", 2, "y", 20),
    ("COMMIT", 2),           # x=2, y=20
    ("PUT", 1, "z", 10),
    ("COMMIT", 1),           # tx=1 commits AFTER tx=2 -> x=1 wins!
    ("BEGIN", 3),
    ("DEL", 3, "y"),         # never committed -> y stays!
    ("BEGIN", 4),
    ("PUT", 4, "bad", 99),
    ("ABORT", 4),
]
expect("applies committed transactions in commit order and discards uncommitted/aborted", lambda: get("replay_transactions")(wal), {"x": 1, "y": 20, "z": 10})
```

## Hidden checks

```python
wal_del = [
    ("BEGIN", 1),
    ("PUT", 1, "k", "v"),
    ("COMMIT", 1),
    ("BEGIN", 2),
    ("DEL", 2, "k"),
    ("DEL", 2, "never-existed"),
    ("COMMIT", 2),
]
expect("committed DEL removes key safely", lambda: get("replay_transactions")(wal_del), {})
```

## Solution

```python
def replay_transactions(records):
    db = {}
    pending = {}
    for rec in records:
        kind = rec[0]
        tx = rec[1]
        if kind == "BEGIN":
            pending[tx] = []
        elif kind in ("PUT", "DEL"):
            pending.setdefault(tx, []).append(rec)
        elif kind == "ABORT":
            pending.pop(tx, None)
        elif kind == "COMMIT":
            for op in pending.pop(tx, []):
                if op[0] == "PUT":
                    db[op[2]] = op[3]
                elif op[0] == "DEL":
                    db.pop(op[2], None)
    return db
```

## Restored

Interleaved transactions now recover atomically in exact commit order with zero leaks from crashed or aborted work.
