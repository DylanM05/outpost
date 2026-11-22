---
id: maintenance-l2-distance
title: Compute Euclidean distance between embeddings
system: Vector vault
symbol: equipment
scene: tests
skills: vector-rag
reviewSkill: vector-rag
prerequisite: verify-citations
---

## Briefing

Some embedding indexes rank neighbors by straight-line Euclidean (L2) distance instead of cosine similarity. Implement `euclidean_distance(a, b)` with dimension validation.

## Objective

Write `euclidean_distance(a, b)` returning $\sqrt{\sum_i (a_i - b_i)^2}$ as a `float`.

Raise `ValueError` if either vector is empty or if `len(a) != len(b)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `if not a or len(a) != len(b): raise ValueError(...)`.
2. Return `math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))`.

## Starter

```python
```

## Checks

```python
expect("3-4-5 right triangle gives 5.0", lambda: round(get("euclidean_distance")([0, 0], [3, 4]), 6), 5.0)
expect("identical vectors have 0.0 distance", lambda: get("euclidean_distance")([1.5, -2.0], [1.5, -2.0]), 0.0)
```

## Hidden checks

```python
def _bad():
    for a, b in [([], []), ([1, 2], [1])]:
        try:
            get("euclidean_distance")(a, b)
            return False
        except ValueError:
            pass
    return True
expect("empty or mismatched lengths raise ValueError", _bad, True)
```

## Solution

```python
import math


def euclidean_distance(a, b):
    if not a or len(a) != len(b):
        raise ValueError("vectors must be non-empty and the same length")
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))
```

## Restored

Euclidean nearest-neighbor distance checks work accurately across any embedding dimension.
