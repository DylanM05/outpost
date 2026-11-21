---
id: tfidf-ranking
kind: code
title: Rank search results with BM25
system: Search index
symbol: instrument
scene: tests
skills: search-indexing
---

## Briefing

When a search matches 500 logs, which ones belong at the **top**? **Okapi BM25** — the ranking formula powering Lucene, Elasticsearch, and SQLite FTS5 — balances three signals:
1. **IDF (Inverse Document Frequency):** rare terms (like `"turbine"`) count far more than ubiquitous words (like `"the"`).
2. **TF saturation (`k1`):** seeing `"turbine"` 3 times beats 1 time, but seeing it 100 times isn't 100× better.
3. **Length normalization (`b`):** matching in a short focused log beats matching inside a 500-word dump.

## Objective

Write `rank_bm25(docs, query, k1=1.5, b=0.75)`:

- `docs` is a dict `{doc_id: text}`. Tokenize text and `query` with `re.findall(r"[a-z0-9]+", s.lower())`.
- Let $N = \text{len}(\text{docs})$ and $\text{avgdl}$ be the mean token count across all documents (return `[]` if `N == 0` or query has no terms or `avgdl == 0`).
- For each unique query term $q$ (or each term in `query_terms`; deduplicate query terms with `set(query_terms)` so repeated query words don't double-count), let $\text{df}(q)$ be the number of documents containing $q$. Use standard Lucene-style non-negative IDF:
  $$\text{idf}(q) = \ln\!\left(1 + \frac{N - \text{df}(q) + 0.5}{\text{df}(q) + 0.5}\right)$$
- For each document $d$ of length $|d|$ with term frequency $\text{tf}(q, d)$:
  $$\text{score}(d) = \sum_{q \in Q} \text{idf}(q) \cdot \frac{\text{tf}(q, d) \cdot (k_1 + 1)}{\text{tf}(q, d) + k_1 \cdot \left(1 - b + b \cdot \frac{|d|}{\text{avgdl}}\right)}$$
- Exclude documents with `score == 0.0`.
- Return a list of `(doc_id, round(score, 6))` tuples sorted by **descending score**, tie-breaking by `doc_id` ascending!

## Concept

Notice the `+ 1` inside $\ln(1 + \dots)$: classic Lucene BM25 guarantees $\text{idf}(q) > 0$ even when a term appears in more than half the corpus, while still weighting rare terms dramatically higher than common ones!

## Hints

1. Precompute `doc_tokens = {doc_id: _terms(text) for doc_id, text in docs.items()}` and `counts = {doc_id: Counter(toks) for doc_id, toks in doc_tokens.items()}`.
2. Sort matching `(doc_id, round(score, 6))` with `key=lambda item: (-item[1], item[0])`.

## Starter: guided

```python
from collections import Counter
import math
import re


def _terms(text):
    return re.findall(r"[a-z0-9]+", text.lower())


def rank_bm25(docs, query, k1=1.5, b=0.75):
    q_terms = set(_terms(query))
    if not docs or not q_terms:
        return []
    tokenized = {doc_id: _terms(text) for doc_id, text in docs.items()}
    n = len(docs)
    avgdl = sum(len(t) for t in tokenized.values()) / n
    if avgdl == 0:
        return []
    counts = {doc_id: Counter(t) for doc_id, t in tokenized.items()}
    # TODO: compute IDF for each q in q_terms, score each doc, filter > 0, sort (-score, doc_id)
    pass
```

## Starter: standard

```python
from collections import Counter
import math
import re


def rank_bm25(docs, query, k1=1.5, b=0.75):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
docs = {
    "d1": "the relay station logged the hourly status check and the voltage reading",
    "d2": "the turbine fault stopped the generator",
    "d3": "the turbine fault: turbine bearing overheated",
    "d4": "the weather report for the ridge",
}
ranked = get("rank_bm25")(docs, "the turbine")
expect("short dense match on rare term 'turbine' ranks #1, d2 #2, common-word-only docs last", lambda: [doc_id for doc_id, _ in ranked], ["d3", "d2", "d4", "d1"])
check("scores are strictly descending positive floats", lambda: all(ranked[i][1] >= ranked[i + 1][1] > 0 for i in range(len(ranked) - 1)))
```

## Hidden checks

```python
docs = {"a": "wind", "b": "solar"}
expect("no matching docs returns []", lambda: get("rank_bm25")(docs, "battery"), [])
expect("tie scores break alphabetically by doc_id", lambda: [d for d, _ in get("rank_bm25")({"b": "wind", "a": "wind"}, "wind")], ["a", "b"])
```

## Solution

```python
from collections import Counter
import math
import re


def _terms(text):
    return re.findall(r"[a-z0-9]+", text.lower())


def rank_bm25(docs, query, k1=1.5, b=0.75):
    q_terms = set(_terms(query))
    if not docs or not q_terms:
        return []
    tokenized = {doc_id: _terms(text) for doc_id, text in docs.items()}
    n = len(docs)
    avgdl = sum(len(t) for t in tokenized.values()) / n
    if avgdl == 0:
        return []
    counts = {doc_id: Counter(t) for doc_id, t in tokenized.items()}
    idfs = {}
    for q in q_terms:
        df = sum(1 for c in counts.values() if c[q] > 0)
        idfs[q] = math.log(1.0 + (n - df + 0.5) / (df + 0.5))

    scored = []
    for doc_id, toks in tokenized.items():
        dl = len(toks)
        c = counts[doc_id]
        score = 0.0
        for q in q_terms:
            tf = c[q]
            if tf == 0:
                continue
            denom = tf + k1 * (1.0 - b + b * (dl / avgdl))
            score += idfs[q] * (tf * (k1 + 1.0) / denom)
        if score > 0.0:
            scored.append((doc_id, round(score, 6)))
    return sorted(scored, key=lambda item: (-item[1], item[0]))
```

## Restored

Search results now surface the rarest, tightest log matches right at the top via BM25.
