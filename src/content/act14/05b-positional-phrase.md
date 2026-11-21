---
id: positional-phrase
kind: code
title: Exact phrase search with positional postings
system: Search index
symbol: instrument
scene: tests
skills: search-indexing
---

## Briefing

A boolean `AND` index can't tell `"low battery"` apart from `"battery voltage is low"`. Recording the **word positions** of every term inside each document (`term -> {doc_id: [pos1, pos2, ...]}`) lets a search engine answer exact `"quoted phrase"` queries in microseconds!

## Objective

Write a class `PositionalIndex`:

- Tokenize words with `re.findall(r"[a-z0-9]+", text.lower())` (0-indexed word positions).
- `index_doc(self, doc_id, text)` — stores `self._postings[term][doc_id] = [positions...]` for every term in `text`.
- `search_phrase(self, phrase)` — tokenizes `phrase` into `[t0, t1, ..., tk]`. Return `[]` if empty. Otherwise return a sorted list of `doc_id`s where there exists a starting position `p` such that `t0` occurs at `p`, `t1` occurs at `p + 1`, ..., and `tk` occurs at `p + k`!

```python
idx.index_doc("d1", "the battery low alarm fired")
idx.index_doc("d2", "low voltage on the battery")
idx.search_phrase("battery low")  # ["d1"] only!
```

## Concept

Look how cleanly positional matching reduces to candidate intersection + shifted-position checks:
1. First intersect the candidate `doc_id`s that contain **all** words in the phrase.
2. For each candidate `doc_id`, a phrase starts at position `p` in `positions[t0]` iff `p + offset in pos_set[t_offset]` for every `offset` from `1` to `len(terms) - 1`!

## Hints

1. Store `self._postings[term][doc_id]` as a `set` (or sorted list converted to `set`) of integer positions so checking `(p + offset) in postings[terms[offset]][doc_id]` is $O(1)$!
2. Remember to check `if any(t not in self._postings for t in terms): return []` up front.

## Starter: guided

```python
import re


def _terms(text):
    return re.findall(r"[a-z0-9]+", text.lower())


class PositionalIndex:
    def __init__(self):
        self._postings = {}

    def index_doc(self, doc_id, text):
        for pos, term in enumerate(_terms(text)):
            self._postings.setdefault(term, {}).setdefault(doc_id, set()).add(pos)

    def search_phrase(self, phrase):
        terms = _terms(phrase)
        if not terms:
            return []
        if any(t not in self._postings for t in terms):
            return []
        # TODO: intersect candidate doc_ids, then check for a starting pos p matching p + offset for all terms
        pass
```

## Starter: standard

```python
import re


class PositionalIndex:
    def __init__(self):
        pass

    def index_doc(self, doc_id, text):
        pass

    def search_phrase(self, phrase):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
PI = get("PositionalIndex")
def test_phrases():
    idx = PI()
    idx.index_doc("d1", "the battery low alarm fired twice")
    idx.index_doc("d2", "low voltage on the battery pack")
    idx.index_doc("d3", "alarm: battery low alarm cleared")
    return (
        idx.search_phrase("battery low"),
        idx.search_phrase("battery low alarm"),
        idx.search_phrase("low battery"),
        idx.search_phrase("twice"),
    )

expect("distinguishes exact consecutive word order from unordered matches", test_phrases, (["d1", "d3"], ["d1", "d3"], [], ["d1"]))
```

## Hidden checks

```python
PI = get("PositionalIndex")
idx = PI()
idx.index_doc("d1", "relay relay fault")
expect("handles repeated words in phrase accurately", lambda: (idx.search_phrase("relay relay"), idx.search_phrase("relay relay relay")), (["d1"], []))
expect("empty phrase returns []", lambda: idx.search_phrase(""), [])
```

## Solution

```python
import re


def _terms(text):
    return re.findall(r"[a-z0-9]+", text.lower())


class PositionalIndex:
    def __init__(self):
        self._postings = {}

    def index_doc(self, doc_id, text):
        for pos, term in enumerate(_terms(text)):
            self._postings.setdefault(term, {}).setdefault(doc_id, set()).add(pos)

    def search_phrase(self, phrase):
        terms = _terms(phrase)
        if not terms or any(t not in self._postings for t in terms):
            return []
        candidates = set.intersection(*(set(self._postings[t]) for t in terms))
        matched = []
        for doc_id in sorted(candidates):
            starts = self._postings[terms[0]][doc_id]
            if any(all((p + offset) in self._postings[terms[offset]][doc_id] for offset in range(1, len(terms))) for p in starts):
                matched.append(doc_id)
        return matched
```

## Restored

Exact quoted phrase searches now pinpoint `"battery low alarm"` without false positives from reordered logs.
