---
id: inverted-index
kind: code
title: Boolean inverted search index
system: Search index
symbol: instrument
scene: tests
skills: search-indexing
---

## Briefing

Scanning every log file from top to bottom with `if word in text` is $O(\text{total text})$. Search engines flip the map inside out into an **inverted index** (`term -> set[doc_id]`) so finding all documents matching `"battery" AND "fault"` is a single instant set intersection!

## Objective

Write a class `InvertedIndex`:

- Tokenize text by lowercasing and extracting alphanumeric words with `re.findall(r"[a-z0-9]+", text.lower())`.
- `index_doc(self, doc_id, text)` — indexes all terms in `text` for `doc_id` (if `doc_id` was indexed before, replace its old terms cleanly so stale terms don't linger!).
- `search_and(self, query)` — tokenizes `query` and returns sorted list of `doc_id`s containing **every** query term (`[]` if query has no terms).
- `search_or(self, query)` — tokenizes `query` and returns sorted list of `doc_id`s containing **at least one** query term (`[]` if query has no terms).

## Concept

Inverted indexes power Elasticsearch, Lucene, SQLite FTS5, and grep-scale code search: intersecting posting sets takes time proportional to the **smallest** posting list instead of scanning the whole corpus!

## Hints

1. Keep `self._postings = {}` (`term -> set[doc_id]`) and `self._doc_terms = {}` (`doc_id -> set[term]`) so re-indexing a `doc_id` cleanly removes old postings first.
2. `set.intersection(*sets)` computes `search_and` and `set.union(*sets)` computes `search_or`.

## Starter: guided

```python
import re


def _terms(text):
    return re.findall(r"[a-z0-9]+", text.lower())


class InvertedIndex:
    def __init__(self):
        self._postings = {}
        self._doc_terms = {}

    def index_doc(self, doc_id, text):
        # TODO: remove any old terms for doc_id, then record new terms in _postings and _doc_terms
        pass

    def search_and(self, query):
        # TODO: intersect posting sets for all query terms and return sorted list
        pass

    def search_or(self, query):
        # TODO: union posting sets for all query terms and return sorted list
        pass
```

## Starter: standard

```python
import re


class InvertedIndex:
    def __init__(self):
        pass

    def index_doc(self, doc_id, text):
        pass

    def search_and(self, query):
        pass

    def search_or(self, query):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
Idx = get("InvertedIndex")
def test_boolean_search():
    idx = Idx()
    idx.index_doc("d1", "Battery voltage low at North Relay!")
    idx.index_doc("d2", "Solar array nominal; battery charged.")
    idx.index_doc("d3", "Wind gust fault at North Relay.")
    r_and = idx.search_and("north relay")
    r_or = idx.search_or("solar fault")
    # Re-index d1 without 'low' -> must no longer match 'low'
    idx.index_doc("d1", "Battery voltage restored at North Relay.")
    after_update = idx.search_and("low")
    return (r_and, r_or, after_update)

expect("AND/OR search and clean re-indexing", test_boolean_search, (["d1", "d3"], ["d2", "d3"], []))
```

## Hidden checks

```python
Idx = get("InvertedIndex")
idx = Idx()
idx.index_doc("d1", "hello world")
expect("empty or punctuation-only query returns []", lambda: (idx.search_and("   !!!"), idx.search_or("")), ([], []))
expect("AND with one unknown term returns []", lambda: idx.search_and("hello missing"), [])
```

## Solution

```python
import re


def _terms(text):
    return re.findall(r"[a-z0-9]+", text.lower())


class InvertedIndex:
    def __init__(self):
        self._postings = {}
        self._doc_terms = {}

    def index_doc(self, doc_id, text):
        for old_term in self._doc_terms.pop(doc_id, ()):
            bucket = self._postings.get(old_term)
            if bucket is not None:
                bucket.discard(doc_id)
                if not bucket:
                    del self._postings[old_term]
        new_terms = set(_terms(text))
        self._doc_terms[doc_id] = new_terms
        for term in new_terms:
            self._postings.setdefault(term, set()).add(doc_id)

    def search_and(self, query):
        qs = _terms(query)
        if not qs:
            return []
        sets = [self._postings.get(t, set()) for t in qs]
        return sorted(set.intersection(*sets))

    def search_or(self, query):
        qs = _terms(query)
        if not qs:
            return []
        sets = [self._postings.get(t, set()) for t in qs]
        return sorted(set.union(*sets))
```

## Restored

Boolean `AND` and `OR` queries now resolve in instant posting-set lookups across the entire station archive.
