---
id: maintenance-doc-frequency
title: Compute per-term document frequencies
system: Search index
symbol: equipment
scene: tests
skills: search-indexing
reviewSkill: search-indexing
prerequisite: tfidf-ranking
---

## Briefing

Inverse document frequency (IDF) depends on **document frequency** — how many *distinct documents* contain a term, NOT how many total times the term appears inside one repetitive document.

## Objective

Write `document_frequencies(docs)` where `docs` is a list of document text strings.

Tokenize each document into lowercase alphanumeric words (`[a-z0-9]+`) and return a `dict[str, int]` mapping each word to the number of documents in `docs` that contain it at least once.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `re.findall(r"[a-z0-9]+", doc.lower())` and wrap the result in `set(...)` before incrementing counts so repeated words in one document only add `1`.
2. Empty documents contribute no terms.

## Starter

```python
```

## Checks

```python
expect("counts each term at most once per document", lambda: get("document_frequencies")(["relay relay solar", "Solar! Battery.", "relay"]), {"relay": 2, "solar": 2, "battery": 1})
expect("empty list returns empty dict", lambda: get("document_frequencies")([]), {})
```

## Hidden checks

```python
expect("handles punctuation-only documents", lambda: get("document_frequencies")(["!!!", "a-1 a-1"]), {"a": 1, "1": 1})
```

## Solution

```python
import re


def document_frequencies(docs):
    df = {}
    for doc in docs:
        for term in set(re.findall(r"[a-z0-9]+", doc.lower())):
            df[term] = df.get(term, 0) + 1
    return df
```

## Restored

Document frequencies count unique documents per term without being skewed by repeated words.
