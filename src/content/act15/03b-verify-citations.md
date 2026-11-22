---
id: verify-citations
title: Audit grounded citations in model answers
system: Grounding desk
symbol: controller
scene: tests
skills: vector-rag
---

## Briefing

Even when given real snippets `[doc-1]` and `[doc-2]`, language models sometimes invent plausible-looking citations like `[doc-9]` or answer without citing anything at all. Build a citation auditor to verify every bracketed reference against the retrieved set.

## Concept

Extract bracketed citation IDs matching `r"\[([A-Za-z0-9_-]+)\]"` from `answer`:
- Preserve unique IDs in **first-seen order**.
- Split them into:
  - `"cited"`: all unique cited IDs found in `answer` (in first-seen order).
  - `"hallucinated"`: subset of `"cited"` that are **not** in `valid_doc_ids`.
  - `"grounded"`: `True` iff there is **at least one** valid citation (`len(cited) > 0`) AND **zero** hallucinated citations (`len(hallucinated) == 0`).

## Objective

Write `audit_citations(answer, valid_doc_ids)` returning:
`{"cited": [...], "hallucinated": [...], "grounded": bool}`.

## Hints

1. Use `re.findall(r"\[([A-Za-z0-9_-]+)\]", answer)` and deduplicate while preserving order (`dict.fromkeys(...)`).
2. Convert `valid = set(valid_doc_ids)` and compute `hallucinated = [c for c in cited if c not in valid]`.

## Starter: guided

```python
import re


def audit_citations(answer, valid_doc_ids):
    valid = set(valid_doc_ids)
    raw = re.findall(r"\[([A-Za-z0-9_-]+)\]", answer)
    cited = list(dict.fromkeys(raw))
    # Compute hallucinated and grounded
    return {"cited": cited, "hallucinated": [], "grounded": False}
```

## Starter: standard

```python
import re


def audit_citations(answer, valid_doc_ids):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect(
    "valid citations pass grounding audit",
    lambda: get("audit_citations")("Flip breaker B2 [man-1] and verify voltage [man-2] [man-1].", ["man-1", "man-2", "man-3"]),
    {"cited": ["man-1", "man-2"], "hallucinated": [], "grounded": True},
)
expect(
    "flags fabricated citation as ungrounded",
    lambda: get("audit_citations")("See [man-1] and [man-99].", ["man-1"]),
    {"cited": ["man-1", "man-99"], "hallucinated": ["man-99"], "grounded": False},
)
expect(
    "uncited answer is not grounded",
    lambda: get("audit_citations")("Flip breaker B2.", ["man-1"]),
    {"cited": [], "hallucinated": [], "grounded": False},
)
```

## Hidden checks

```python
expect(
    "ignores bracketed prose with spaces",
    lambda: get("audit_citations")("Note [see section 2] per [doc_7].", ["doc_7"]),
    {"cited": ["doc_7"], "hallucinated": [], "grounded": True},
)
```

## Solution

```python
import re


def audit_citations(answer, valid_doc_ids):
    valid = set(valid_doc_ids)
    cited = list(dict.fromkeys(re.findall(r"\[([A-Za-z0-9_-]+)\]", answer)))
    hallucinated = [doc_id for doc_id in cited if doc_id not in valid]
    return {
        "cited": cited,
        "hallucinated": hallucinated,
        "grounded": len(cited) > 0 and len(hallucinated) == 0,
    }
```

## Restored

Fabricated and missing citations are caught automatically before an answer reaches the operator.
