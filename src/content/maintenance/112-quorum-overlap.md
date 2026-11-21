---
id: maintenance-quorum-overlap
title: Verify strong quorum parameters
system: Quorum vault
symbol: equipment
scene: tests
skills: distributed-systems
reviewSkill: distributed-systems
prerequisite: vector-clocks
---

## Briefing

Operators can configure replication factor `N`, write quorum `W`, and read quorum `R`. A typo that makes `W + R <= N` silently permits stale reads!

## Objective

Write `is_strong_quorum(n, w, r)` returning `True` if the configuration guarantees every read overlaps with every write, and `False` otherwise.

A configuration is a valid strong quorum iff:
- `n >= 1`
- `1 <= w <= n`
- `1 <= r <= n`
- `w + r > n`

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check all four inequalities — remember that `w > n` or `r == 0` is invalid even if `w + r > n`!
2. For example, `(n=3, w=2, r=2)` gives `2 + 2 = 4 > 3` (`True`), whereas `(n=4, w=2, r=2)` gives `2 + 2 = 4 <= 4` (`False`).

## Starter

```python
```

## Checks

```python
expect("N=3 W=2 R=2 is strong", lambda: get("is_strong_quorum")(3, 2, 2), True)
expect("N=4 W=2 R=2 is NOT strong", lambda: get("is_strong_quorum")(4, 2, 2), False)
expect("N=5 W=5 R=1 is strong", lambda: get("is_strong_quorum")(5, 5, 1), True)
```

## Hidden checks

```python
expect("W exceeding N is invalid", lambda: get("is_strong_quorum")(3, 4, 1), False)
expect("R=0 is invalid", lambda: get("is_strong_quorum")(3, 3, 0), False)
expect("N=1 W=1 R=1 is strong", lambda: get("is_strong_quorum")(1, 1, 1), True)
```

## Solution

```python
def is_strong_quorum(n, w, r):
    return n >= 1 and 1 <= w <= n and 1 <= r <= n and (w + r) > n
```

## Restored

Misconfigured quorum triples are caught before a cluster can serve stale reads.
