---
id: maintenance-detect-nonce-reuse
title: Audit packet logs for reused nonces
system: Stream bench
symbol: controller
scene: tests
skills: symmetric-crypto
reviewSkill: symmetric-crypto
prerequisite: cbc-chain
---

## Briefing

Reusing the same `(kid, nonce)` pair on a stream cipher breaks confidentiality immediately. Write a quick log auditor that flags any reused `(kid, nonce)` pairs!

## Objective

Write `find_reused_nonces(packets)` where `packets` is a list of `{"kid": str, "nonce": str}` dicts. Return a sorted list of unique `(kid, nonce)` tuples that appeared **more than once** in `packets` (note: the same `nonce` under two *different* `kid`s is NOT a reuse!).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Count occurrences of `(p["kid"], p["nonce"])` using `collections.Counter`.
2. Return `sorted(pair for pair, count in counts.items() if count > 1)`.

## Starter

```python
```

## Checks

```python
pkts = [
    {"kid": "k1", "nonce": "n1"},
    {"kid": "k1", "nonce": "n2"},
    {"kid": "k2", "nonce": "n1"},
    {"kid": "k1", "nonce": "n1"},
    {"kid": "k1", "nonce": "n1"},
]
expect("flags repeated (kid, nonce) once and ignores same nonce on different kid", lambda: get("find_reused_nonces")(pkts), [("k1", "n1")])
```

## Hidden checks

```python
expect("all unique returns []", lambda: get("find_reused_nonces")([{"kid": "k1", "nonce": "a"}, {"kid": "k1", "nonce": "b"}]), [])
```

## Solution

```python
from collections import Counter


def find_reused_nonces(packets):
    counts = Counter((p["kid"], p["nonce"]) for p in packets)
    return sorted(pair for pair, n in counts.items() if n > 1)
```

## Restored

The nonce auditor flags duplicate `(kid, nonce)` transmissions before a two-time-pad leak can linger.
