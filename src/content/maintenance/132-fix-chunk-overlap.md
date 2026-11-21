---
id: maintenance-fix-chunk-overlap
title: Fix a sliding-window chunker
system: Token bench
symbol: instrument
scene: tests
skills: tokenization-context
reviewSkill: tokenization-context
prerequisite: chunk-with-overlap
---

## Briefing

The manual chunker in the editor has two bugs: it advances by `max_words` instead of `max_words - overlap`, and it emits redundant trailing sub-chunks after already reaching the end of the text. Fix it!

## Objective

Fix `slice_windows(words, max_words, overlap)` in the editor so that:
- It raises `ValueError` if `max_words < 1`, `overlap < 0`, or `overlap >= max_words`.
- It returns `[]` if `words` is empty.
- It steps by `max_words - overlap` and stops as soon as a window reaches the end of `words` (`start + max_words >= len(words)`), returning a list of word-list chunks.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `max_words < 1 or overlap < 0 or overlap >= max_words` before looping.
2. Compute `step = max_words - overlap`, append `words[start : start + max_words]`, and `break` once `start + max_words >= len(words)`.

## Starter

```python
def slice_windows(words, max_words, overlap):
    chunks = []
    start = 0
    while start < len(words):
        chunks.append(words[start : start + max_words])
        start += max_words
    return chunks
```

## Checks

```python
expect("produces overlapping windows without redundant tail", lambda: get("slice_windows")(["a", "b", "c", "d", "e"], 3, 1), [["a", "b", "c"], ["c", "d", "e"]])
expect("stops after single window when text fits", lambda: get("slice_windows")(["a", "b", "c"], 4, 2), [["a", "b", "c"]])
def _bad():
    try:
        get("slice_windows")(["a", "b"], 2, 2)
        return False
    except ValueError:
        return True
expect("rejects overlap >= max_words", _bad, True)
```

## Hidden checks

```python
expect("empty words returns empty list", lambda: get("slice_windows")([], 3, 1), [])
expect("overlap 2 on 5 words steps by 1 cleanly", lambda: get("slice_windows")([1, 2, 3, 4, 5], 3, 2), [[1, 2, 3], [2, 3, 4], [3, 4, 5]])
```

## Solution

```python
def slice_windows(words, max_words, overlap):
    if max_words < 1 or overlap < 0 or overlap >= max_words:
        raise ValueError("invalid window parameters")
    if not words:
        return []
    chunks = []
    step = max_words - overlap
    start = 0
    while start < len(words):
        end = start + max_words
        chunks.append(words[start:end])
        if end >= len(words):
            break
        start += step
    return chunks
```

## Restored

The chunker now slides by the exact overlap stride without duplicating trailing slices.
