---
id: maintenance-most-frequent-pair
title: Pick the top BPE pair to merge
system: Token bench
symbol: instrument
scene: tests
skills: tokenization-context
reviewSkill: tokenization-context
prerequisite: chunk-with-overlap
---

## Briefing

Each BPE merge step chooses the most frequent adjacent token pair, breaking ties deterministically so every station builds the exact same vocabulary.

## Objective

Write `top_pair(tokens)` returning the adjacent `(tokens[i], tokens[i + 1])` tuple that appears most often in `tokens`.

- If two pairs have the same frequency, return the lexicographically smallest tuple (e.g. `(1, 2)` before `(2, 1)`).
- If `len(tokens) < 2`, return `None`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Count pairs into a `counts` dict for `i in range(len(tokens) - 1)`.
2. Pick `min(counts, key=lambda p: (-counts[p], p))` when `counts` is non-empty.

## Starter

```python
```

## Checks

```python
expect("returns most frequent adjacent pair", lambda: get("top_pair")([3, 1, 2, 1, 2, 3]), (1, 2))
expect("breaks frequency ties lexicographically", lambda: get("top_pair")([2, 1, 2]), (1, 2))
expect("returns None for fewer than two tokens", lambda: get("top_pair")([9]), None)
```

## Hidden checks

```python
expect("empty list returns None", lambda: get("top_pair")([]), None)
expect("all equal elements returns pair of that element", lambda: get("top_pair")([4, 4, 4]), (4, 4))
```

## Solution

```python
def top_pair(tokens):
    if len(tokens) < 2:
        return None
    counts = {}
    for i in range(len(tokens) - 1):
        pair = (tokens[i], tokens[i + 1])
        counts[pair] = counts.get(pair, 0) + 1
    return min(counts, key=lambda p: (-counts[p], p))
```

## Restored

BPE pair selection now breaks ties deterministically across every node.
