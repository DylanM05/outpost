---
id: bpe-pair-merge
title: Byte-pair encoding merges
system: Token bench
symbol: instrument
scene: tests
skills: tokenization-context
---

## Briefing

Language models don't read raw characters or whole English words — they break text into **subword tokens** using Byte-Pair Encoding (BPE). Training a BPE tokenizer repeats two steps: count every adjacent pair of token IDs, then replace all occurrences of the winning pair with a fresh token ID.

## Concept

Given a sequence of token IDs like `[1, 2, 1, 2, 3]`, adjacent pairs are `(1, 2)`, `(2, 1)`, `(1, 2)`, `(2, 3)`.

When merging a pair `(a, b)` into `new_id`, scan **left to right**:
- If `tokens[i] == a` and `i + 1 < len(tokens)` and `tokens[i + 1] == b`, emit `new_id` and advance `i += 2`!
- Otherwise emit `tokens[i]` and advance `i += 1`.

Watch out for overlapping triples like `[7, 7, 7]` merging `(7, 7) -> 99`: left-to-right greedy merging consumes indices `0` and `1` into `99`, leaving index `2` untouched -> `[99, 7]`.

## Objective

Implement two functions:
1. `count_pairs(tokens)` — returns a `dict[(int, int), int]` mapping each adjacent `(tokens[i], tokens[i + 1])` pair to its frequency.
2. `merge_pair(tokens, pair, new_id)` — returns a new list with all non-overlapping left-to-right occurrences of `pair` replaced by `new_id` (without mutating `tokens`).

## Hints

1. In `count_pairs(tokens)`, loop `for i in range(len(tokens) - 1):` and increment `counts[(tokens[i], tokens[i + 1])]`.
2. In `merge_pair(tokens, pair, new_id)`, use a `while i < len(tokens):` loop: advance by `2` on match and by `1` otherwise.

## Starter: guided

```python
def count_pairs(tokens):
    counts = {}
    for i in range(len(tokens) - 1):
        pair = (tokens[i], tokens[i + 1])
        # Increment counts[pair]
        pass
    return counts


def merge_pair(tokens, pair, new_id):
    out = []
    i = 0
    a, b = pair
    while i < len(tokens):
        # If tokens[i] == a and next element is b, append new_id and i += 2
        # Otherwise append tokens[i] and i += 1
        out.append(tokens[i])
        i += 1
    return out
```

## Starter: standard

```python
def count_pairs(tokens):
    pass


def merge_pair(tokens, pair, new_id):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("counts adjacent pairs accurately", lambda: get("count_pairs")([1, 2, 1, 2, 3]), {(1, 2): 2, (2, 1): 1, (2, 3): 1})
expect("merges non-overlapping pairs left to right", lambda: get("merge_pair")([1, 2, 1, 2, 3], (1, 2), 99), [99, 99, 3])
expect("handles overlapping triple left-to-right", lambda: get("merge_pair")([7, 7, 7], (7, 7), 99), [99, 7])
```

## Hidden checks

```python
expect("short sequences have no pairs", lambda: get("count_pairs")([42]), {})
expect("quadruple merges into two pairs", lambda: get("merge_pair")([5, 5, 5, 5], (5, 5), 10), [10, 10])
def _no_mut():
    src = [1, 2, 3]
    res = get("merge_pair")(src, (1, 2), 9)
    return (res, src)
expect("does not mutate input list", _no_mut, ([9, 3], [1, 2, 3]))
```

## Solution

```python
def count_pairs(tokens):
    counts = {}
    for i in range(len(tokens) - 1):
        pair = (tokens[i], tokens[i + 1])
        counts[pair] = counts.get(pair, 0) + 1
    return counts


def merge_pair(tokens, pair, new_id):
    out = []
    i = 0
    a, b = pair
    n = len(tokens)
    while i < n:
        if i + 1 < n and tokens[i] == a and tokens[i + 1] == b:
            out.append(new_id)
            i += 2
        else:
            out.append(tokens[i])
            i += 1
    return out
```

## Restored

The token bench counts adjacent pairs and executes greedy left-to-right BPE merges without losing overlapping tokens.
