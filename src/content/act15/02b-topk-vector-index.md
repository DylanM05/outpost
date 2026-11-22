---
id: topk-vector-index
title: Top-k vector search with metadata filters
system: Vector vault
symbol: equipment
scene: tests
skills: vector-rag
---

## Briefing

Real RAG systems rarely search the entire knowledge base blindly — they filter by metadata like `{"sector": "power", "version": 2}` before ranking the nearest vectors. Build an in-memory `VectorIndex` that pre-normalizes stored embeddings for fast cosine search.

## Concept

If every stored vector $\hat{v}$ and the query vector $\hat{q}$ are unit-normalized up front, cosine similarity reduces to a plain dot product $\sum_i \hat{q}_i \hat{v}_i$!

Metadata filtering requires **exact match on every `(key, val)` pair** in `filters` (`meta.get(key) == val`). And deterministic ranking sorts by `(-score, doc_id)` so ties always break alphabetically by `doc_id`.

## Objective

Implement a `VectorIndex` class with:
- `__init__(self)` — empty index.
- `add(self, doc_id, vector, metadata=None)` — stores (or replaces) `doc_id` with its vector and optional metadata dict (`{}` if `None`). Raise `ValueError` if `vector` is empty or its dimension differs from existing vectors in the index.
- `search(self, query_vector, k=5, filters=None)`:
  - Raise `ValueError` if `k < 0` or `query_vector` is empty (or mismatches the index dimension when the index is non-empty).
  - If `k == 0` or index is empty, return `[]`.
  - Keep only documents whose metadata matches all `(key, value)` pairs in `filters` (if provided).
  - Score each matching document by cosine similarity with `query_vector` (zero vectors score `0.0`), sort by `(-score, doc_id)`, and return the top `k` as `[(doc_id, score), ...]`.

## Hints

1. Track `self.dim` on the first `add()` and verify `len(vector) == self.dim` on later `add()` and `search()` calls.
2. Pre-normalize each vector on `add()` (handling zero norm safely), normalize `query_vector` once in `search()`, and compute `sum(x * y for x, y in zip(q, v))`.

## Starter: guided

```python
import math


def _norm(vec):
    mag = math.sqrt(sum(x * x for x in vec))
    return [0.0 for _ in vec] if mag == 0.0 else [x / mag for x in vec]


class VectorIndex:
    def __init__(self):
        self.dim = None
        self.docs = {}

    def add(self, doc_id, vector, metadata=None):
        if not vector:
            raise ValueError("vector must not be empty")
        if self.dim is None:
            self.dim = len(vector)
        elif len(vector) != self.dim:
            raise ValueError("dimension mismatch")
        self.docs[doc_id] = (_norm(vector), dict(metadata or {}))

    def search(self, query_vector, k=5, filters=None):
        # Validate k and query_vector, filter by metadata, score via dot product, sort (-score, doc_id)
        return []
```

## Starter: standard

```python
import math


class VectorIndex:
    def __init__(self):
        pass

    def add(self, doc_id, vector, metadata=None):
        pass

    def search(self, query_vector, k=5, filters=None):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _basic():
    idx = get("VectorIndex")()
    idx.add("d1", [1.0, 0.0], {"sector": "power"})
    idx.add("d2", [0.8, 0.6], {"sector": "power"})
    idx.add("d3", [0.0, 1.0], {"sector": "comms"})
    hits = idx.search([1.0, 0.0], k=2)
    return [(d, round(s, 4)) for d, s in hits]
expect("returns top-k by descending cosine similarity", _basic, [("d1", 1.0), ("d2", 0.8)])

def _filtered():
    idx = get("VectorIndex")()
    idx.add("d1", [1.0, 0.0], {"sector": "power", "live": True})
    idx.add("d2", [0.9, 0.1], {"sector": "comms", "live": True})
    idx.add("d3", [0.95, 0.05], {"sector": "comms", "live": False})
    return [d for d, _ in idx.search([1.0, 0.0], k=5, filters={"sector": "comms", "live": True})]
expect("applies multi-field metadata filters", _filtered, ["d2"])
```

## Hidden checks

```python
def _ties():
    idx = get("VectorIndex")()
    idx.add("b", [1.0, 1.0])
    idx.add("a", [2.0, 2.0])
    return [d for d, _ in idx.search([1.0, 1.0], k=2)]
expect("breaks identical score ties by doc_id ascending", _ties, ["a", "b"])

def _bad_dim():
    idx = get("VectorIndex")()
    idx.add("d1", [1.0, 0.0])
    try:
        idx.search([1.0, 0.0, 0.0], k=1)
        return False
    except ValueError:
        return True
expect("query dimension mismatch raises ValueError", _bad_dim, True)
```

## Solution

```python
import math


def _normalize(vec):
    mag = math.sqrt(sum(x * x for x in vec))
    if mag == 0.0:
        return [0.0 for _ in vec]
    return [x / mag for x in vec]


class VectorIndex:
    def __init__(self):
        self.dim = None
        self.docs = {}

    def add(self, doc_id, vector, metadata=None):
        if not vector:
            raise ValueError("vector must not be empty")
        if self.dim is None:
            self.dim = len(vector)
        elif len(vector) != self.dim:
            raise ValueError("vector dimension mismatch")
        self.docs[doc_id] = (_normalize(vector), dict(metadata or {}))

    def search(self, query_vector, k=5, filters=None):
        if k < 0 or not query_vector:
            raise ValueError("invalid search parameters")
        if not self.docs or k == 0:
            return []
        if len(query_vector) != self.dim:
            raise ValueError("query vector dimension mismatch")
        q = _normalize(query_vector)
        scored = []
        for doc_id, (vec, meta) in self.docs.items():
            if filters and any(meta.get(fk) != fv for fk, fv in filters.items()):
                continue
            score = sum(a * b for a, b in zip(q, vec))
            scored.append((doc_id, score))
        scored.sort(key=lambda item: (-item[1], item[0]))
        return scored[:k]
```

## Restored

The vector vault indexes normalized embeddings and answers metadata-filtered top-k similarity queries deterministically.
