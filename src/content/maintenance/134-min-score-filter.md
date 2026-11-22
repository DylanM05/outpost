---
id: maintenance-min-score-filter
title: Drop low-similarity RAG matches
system: Vector vault
symbol: equipment
scene: tests
skills: vector-rag
reviewSkill: vector-rag
prerequisite: verify-citations
---

## Briefing

Top-k search always returns `k` documents even when none of them match the query! Filtering by a similarity threshold stops irrelevant chunks from polluting the prompt.

## Objective

Write `filter_relevant(hits, min_score, limit)` where `hits` is a list of `(doc_id, score)` tuples, `min_score` is a float threshold, and `limit` is a non-negative integer cap.

Keep only hits with `score >= min_score`, sort them by `(-score, doc_id)`, and return at most `limit` tuples. Raise `ValueError` if `limit < 0`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if limit < 0: raise ValueError(...)`.
2. Filter `[h for h in hits if h[1] >= min_score]`, sort with `key=lambda h: (-h[1], h[0])`, and slice `[:limit]`.

## Starter

```python
```

## Checks

```python
expect("filters below threshold and sorts deterministically", lambda: get("filter_relevant")([("d3", 0.4), ("d2", 0.8), ("d1", 0.8), ("d4", 0.9)], 0.75, 2), [("d4", 0.9), ("d1", 0.8)])
expect("returns empty when nothing passes threshold", lambda: get("filter_relevant")([("d1", 0.2)], 0.5, 3), [])
```

## Hidden checks

```python
expect("limit 0 returns empty list", lambda: get("filter_relevant")([("d1", 0.99)], 0.1, 0), [])
def _neg():
    try:
        get("filter_relevant")([], 0.5, -1)
        return False
    except ValueError:
        return True
expect("negative limit raises ValueError", _neg, True)
```

## Solution

```python
def filter_relevant(hits, min_score, limit):
    if limit < 0:
        raise ValueError("limit must be >= 0")
    kept = [item for item in hits if item[1] >= min_score]
    kept.sort(key=lambda item: (-item[1], item[0]))
    return kept[:limit]
```

## Restored

Low-confidence vector hits are filtered out before reaching the context window.
