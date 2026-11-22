---
id: maintenance-fix-penny-split
title: Fix a bill splitter that loses remainder pennies
system: Mint bench
symbol: instrument
scene: tests
skills: financial-ledgers
reviewSkill: financial-ledgers
prerequisite: reconcile-statements
---

## Briefing

The invoice splitter in the editor divides `total_cents // n` for everyone, silently dropping up to `n - 1` pennies on every bill! Fix it so remainder pennies go to the first `total_cents % n` shares and total cents are always conserved.

## Objective

Fix `split_evenly(total_cents, n)` in the editor so that:
- It raises `ValueError` if `total_cents < 0` or `n < 1`.
- It returns a list of `n` integers summing to `total_cents`, with `base + 1` for the first `total_cents % n` entries and `base` for the rest.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `base, rem = divmod(total_cents, n)`.
2. Return `[base + (1 if i < rem else 0) for i in range(n)]`.

## Starter

```python
def split_evenly(total_cents, n):
    if total_cents < 0 or n < 1:
        raise ValueError("invalid split")
    base = total_cents // n
    return [base] * n
```

## Checks

```python
expect("conserves every penny on 100 / 3", lambda: get("split_evenly")(100, 3), [34, 33, 33])
expect("conserves pennies on 10 / 4", lambda: get("split_evenly")(10, 4), [3, 3, 2, 2])
expect("exact division stays uniform", lambda: get("split_evenly")(60, 3), [20, 20, 20])
```

## Hidden checks

```python
def _bad():
    try:
        get("split_evenly")(10, 0)
        return False
    except ValueError:
        return True
expect("n < 1 raises ValueError", _bad, True)
```

## Solution

```python
def split_evenly(total_cents, n):
    if total_cents < 0 or n < 1:
        raise ValueError("invalid split")
    base, rem = divmod(total_cents, n)
    return [base + (1 if i < rem else 0) for i in range(n)]
```

## Restored

Even splits now distribute remainder pennies cleanly with zero rounding loss.
