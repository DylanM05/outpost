---
id: chunk-with-overlap
title: Split documents into overlapping chunks
system: Token bench
symbol: instrument
scene: tests
skills: tokenization-context
---

## Briefing

Long station manuals don't fit in a single embedding vector. If you slice a manual cleanly every 100 words, an important fact split across word 99 and word 101 loses its context. Overlapping sliding windows keep boundary sentences intact.

## Concept

Given a list of words, a window of `max_words` with `overlap` advances by `step = max_words - overlap` words each chunk:
- Chunk 0: `words[0 : max_words]`
- Chunk 1: `words[step : step + max_words]`
- Stop once a chunk reaches the end of `words` (`start + max_words >= len(words)`), so you never emit a redundant trailing sub-chunk already completely contained in the previous chunk!

Validate arguments cleanly: `max_words >= 1` and `0 <= overlap < max_words` (else `ValueError`, because `overlap >= max_words` would advance by `<= 0` and loop forever!).

## Objective

Write `chunk_text(text, max_words, overlap=0)`:
- Validate `max_words >= 1` and `0 <= overlap < max_words`, raising `ValueError` otherwise.
- Split `text` on whitespace (`text.split()`). If empty, return `[]`.
- Return a list of space-joined chunk strings of at most `max_words` words, stepping by `max_words - overlap`, stopping as soon as the final word is included.

## Hints

1. Check `if max_words < 1 or overlap < 0 or overlap >= max_words: raise ValueError(...)`.
2. Compute `step = max_words - overlap`. Loop from `start = 0`: append `" ".join(words[start : start + max_words])`, then `if start + max_words >= len(words): break`, else `start += step`.

## Starter: guided

```python
def chunk_text(text, max_words, overlap=0):
    if max_words < 1 or overlap < 0 or overlap >= max_words:
        raise ValueError("invalid chunk settings")
    words = text.split()
    if not words:
        return []
    chunks = []
    step = max_words - overlap
    start = 0
    while start < len(words):
        chunks.append(" ".join(words[start : start + max_words]))
        # Stop once this chunk already reached the end of words
        break
    return chunks
```

## Starter: standard

```python
def chunk_text(text, max_words, overlap=0):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("splits 7 words with size 4 and overlap 2", lambda: get("chunk_text")("one two three four five six seven", 4, 2), ["one two three four", "three four five six", "five six seven"])
expect("short text returns single chunk", lambda: get("chunk_text")("solar array online", 10, 2), ["solar array online"])
expect("exact fit emits no redundant trailing tail", lambda: get("chunk_text")("a b c d", 4, 2), ["a b c d"])
```

## Hidden checks

```python
expect("whitespace-only text returns empty list", lambda: get("chunk_text")("   \n\t ", 5, 1), [])
def _bad():
    for args in [("a b", 0, 0), ("a b", 3, 3), ("a b", 3, -1)]:
        try:
            get("chunk_text")(*args)
            return False
        except ValueError:
            pass
    return True
expect("invalid max_words or overlap raises ValueError", _bad, True)
expect("zero overlap partitions cleanly", lambda: get("chunk_text")("a b c d e", 2, 0), ["a b", "c d", "e"])
```

## Solution

```python
def chunk_text(text, max_words, overlap=0):
    if max_words < 1 or overlap < 0 or overlap >= max_words:
        raise ValueError("max_words must be >= 1 and 0 <= overlap < max_words")
    words = text.split()
    if not words:
        return []
    chunks = []
    step = max_words - overlap
    start = 0
    while start < len(words):
        end = start + max_words
        chunks.append(" ".join(words[start:end]))
        if end >= len(words):
            break
        start += step
    return chunks
```

## Restored

Manuals slice cleanly into overlapping retrieval chunks with zero redundant tails or infinite loops.
