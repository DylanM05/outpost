---
id: hybrid-rrf
title: Fuse hybrid search with Reciprocal Rank Fusion
system: Vector vault
symbol: equipment
scene: tests
skills: vector-rag
---

## Briefing

Vector search shines on conceptual queries (*"restore backup generator"*), while BM25 keyword search nails exact part codes (*"ERR-409B"*). Because their raw scores aren't on the same scale, **Reciprocal Rank Fusion (RRF)** combines them purely by rank position.

## Concept

Given multiple ranked lists of `doc_id`s (for instance, one from BM25 and one from vector search), each document's RRF score is:
$$\text{RRF}(d) = \sum_{r \in \text{rankings}} \frac{1}{k + \text{rank}_r(d)}$$
where $\text{rank}_r(d)$ is **1-based** (`1` for the top hit, `2` for the second, etc.) and $k$ is a smoothing constant (standard default `k = 60`). If a document appears in multiple lists, its contributions add up — boosting results that BOTH keyword and vector search agree on!

If the same `doc_id` accidentally appears twice in a single ranking list, count only its **first (best)** rank in that list.

## Objective

Write `reciprocal_rank_fusion(rankings, k=60)`:
- `rankings` is a list of ranked `doc_id` lists (each ordered best-first).
- Validate `k >= 1` (raising `ValueError` otherwise).
- Compute each document's cumulative RRF score across all lists (using 1-based ranks and ignoring duplicate entries within the same list).
- Return `[(doc_id, score), ...]` sorted by `(-score, doc_id)`.

## Hints

1. For each `ranking` in `rankings`, track a `seen = set()` so duplicate `doc_id`s inside the same list don't double-count; use `for rank, doc_id in enumerate(ranking, start=1):` (or only increment rank on unique items — wait: standard 1-based position in the deduplicated list or raw position; deduplicating `ranking` first preserves clean 1-based ranks!).
2. Accumulate `scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)`, then sort `scores.items()` by `(-score, doc_id)`.

## Starter: guided

```python
def reciprocal_rank_fusion(rankings, k=60):
    if k < 1:
        raise ValueError("k must be >= 1")
    scores = {}
    for ranking in rankings:
        seen = set()
        rank = 0
        for doc_id in ranking:
            if doc_id in seen:
                continue
            seen.add(doc_id)
            rank += 1
            # Add 1.0 / (k + rank) to scores[doc_id]
            pass
    return sorted(scores.items(), key=lambda item: (-item[1], item[0]))
```

## Starter: standard

```python
def reciprocal_rank_fusion(rankings, k=60):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _agree():
    bm25 = ["d1", "d2", "d3"]
    vec = ["d2", "d4", "d1"]
    res = get("reciprocal_rank_fusion")([bm25, vec], k=60)
    return [(d, round(s, 6)) for d, s in res[:3]]
expect("boosts documents appearing high in both lists", _agree, [
    ("d2", round(1/62 + 1/61, 6)),
    ("d1", round(1/61 + 1/63, 6)),
    ("d4", round(1/62, 6)),
])
expect("empty rankings returns empty list", lambda: get("reciprocal_rank_fusion")([]), [])
```

## Hidden checks

```python
expect("ignores duplicate doc_id in same ranking list", lambda: [(d, round(s, 6)) for d, s in get("reciprocal_rank_fusion")([["a", "a", "b"]], k=10)], [("a", round(1/11, 6)), ("b", round(1/12, 6))])
def _bad_k():
    try:
        get("reciprocal_rank_fusion")([["a"]], k=0)
        return False
    except ValueError:
        return True
expect("k < 1 raises ValueError", _bad_k, True)
```

## Solution

```python
def reciprocal_rank_fusion(rankings, k=60):
    if k < 1:
        raise ValueError("k must be >= 1")
    scores = {}
    for ranking in rankings:
        seen = set()
        rank = 0
        for doc_id in ranking:
            if doc_id in seen:
                continue
            seen.add(doc_id)
            rank += 1
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda item: (-item[1], item[0]))
```

## Restored

Hybrid BM25 and vector rankings fuse smoothly into a single consensus ranking without fragile score calibration.
