---
id: maintenance-dedup-snippets
title: Keep the best chunk per document
system: Grounding desk
symbol: controller
scene: tests
skills: vector-rag
reviewSkill: vector-rag
prerequisite: verify-citations
---

## Briefing

When one manual is split into five chunks, vector search often fills all top slots with overlapping chunks from the same manual. Deduplicate results by `doc_id`, keeping only each document's highest-scoring chunk.

## Objective

Write `best_chunk_per_doc(hits)` where `hits` is a list of `(doc_id, chunk_index, score)` tuples.

For each distinct `doc_id`, retain only the single tuple with the **highest `score`** (breaking score ties within the same document by smallest `chunk_index`). Return the surviving `(doc_id, chunk_index, score)` tuples sorted by `(-score, doc_id, chunk_index)`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Track `best[doc_id] = (chunk_index, score)`: replace the stored entry if `score > cur_score` or `(score == cur_score and chunk_index < cur_chunk)`.
2. Rebuild `[(doc_id, chunk_idx, score) for ...]` and sort by `(-score, doc_id, chunk_idx)`.

## Starter

```python
```

## Checks

```python
expect(
    "keeps highest-scoring chunk per document",
    lambda: get("best_chunk_per_doc")([("m1", 2, 0.7), ("m1", 0, 0.9), ("m2", 1, 0.85), ("m1", 1, 0.9)]),
    [("m1", 0, 0.9), ("m2", 1, 0.85)],
)
expect("empty list returns empty", lambda: get("best_chunk_per_doc")([]), [])
```

## Hidden checks

```python
expect(
    "sorts across docs by descending score then doc_id",
    lambda: get("best_chunk_per_doc")([("b", 0, 0.8), ("a", 3, 0.8)]),
    [("a", 3, 0.8), ("b", 0, 0.8)],
)
```

## Solution

```python
def best_chunk_per_doc(hits):
    best = {}
    for doc_id, chunk_idx, score in hits:
        prev = best.get(doc_id)
        if prev is None or score > prev[1] or (score == prev[1] and chunk_idx < prev[0]):
            best[doc_id] = (chunk_idx, score)
    out = [(doc_id, chunk_idx, score) for doc_id, (chunk_idx, score) in best.items()]
    out.sort(key=lambda item: (-item[2], item[0], item[1]))
    return out
```

## Restored

Retrieved prompts now span diverse manuals instead of repeating overlapping chunks from one file.
