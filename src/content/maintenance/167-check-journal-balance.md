---
id: maintenance-check-journal-balance
title: Audit double-entry journals for unbalanced postings
system: Journal vault
symbol: equipment
scene: tests
skills: financial-ledgers
reviewSkill: financial-ledgers
prerequisite: reconcile-statements
---

## Briefing

Before closing the daily books, run an integrity audit over every journal entry to catch any transaction whose legs fail to sum to `0` (or which has zero legs).

## Objective

Write `unbalanced_entries(journal)` where `journal` is a list of `(tx_id, legs)` tuples and `legs` is a list of `(account, delta_cents)` pairs.

Return a **sorted** list of `tx_id`s where `legs` is empty OR `sum(delta for _, delta in legs) != 0`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `not legs or sum(d for _, d in legs) != 0` for each `(tx_id, legs)`.
2. Return `sorted(...)`.

## Starter

```python
```

## Checks

```python
expect(
    "flags unbalanced and empty journal entries",
    lambda: get("unbalanced_entries")([
        ("tx-1", [("a", -100), ("b", 100)]),
        ("tx-3", [("a", -100), ("b", 99)]),
        ("tx-2", []),
    ]),
    ["tx-2", "tx-3"],
)
expect("all balanced returns empty list", lambda: get("unbalanced_entries")([("t1", [("a", -50), ("b", 20), ("c", 30)])]), [])
```

## Hidden checks

```python
expect("empty journal returns empty list", lambda: get("unbalanced_entries")([]), [])
```

## Solution

```python
def unbalanced_entries(journal):
    return sorted(
        tx_id
        for tx_id, legs in journal
        if not legs or sum(delta for _, delta in legs) != 0
    )
```

## Restored

Daily journal audits catch every unbalanced or empty posting before close of books.
