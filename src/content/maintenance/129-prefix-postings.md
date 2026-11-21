---
id: maintenance-prefix-postings
title: Gather matching docs for a prefix query
system: Search index
symbol: equipment
scene: tests
skills: search-indexing
reviewSkill: search-indexing
prerequisite: tfidf-ranking
---

## Briefing

Autocomplete and wildcard queries like `rel*` union the posting lists of every indexed term beginning with that prefix.

## Objective

Write `prefix_docs(postings, prefix)` where `postings` is a dict mapping lowercase term strings to iterables of document IDs (e.g. `{"relay": [1, 3], "reload": [2, 3], "solar": [4]}`) and `prefix` is a string.

- Match case-insensitively (`prefix.lower()`).
- If `prefix == ""`, return `[]`.
- Otherwise return a **sorted** list of unique document IDs belonging to any term in `postings` that starts with `prefix.lower()`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Guard `if not prefix: return []` and normalize `p = prefix.lower()`.
2. Union all doc IDs into a `set` for every `term, docs` in `postings.items()` where `term.lower().startswith(p)`, then return `sorted(result)`.

## Starter

```python
```

## Checks

```python
expect("unions and sorts doc IDs across matching prefix terms", lambda: get("prefix_docs")({"relay": [3, 1], "reload": [2, 3], "solar": [4]}, "rel"), [1, 2, 3])
expect("matches prefix case-insensitively", lambda: get("prefix_docs")({"sensor": ["d2"], "send": ["d1"]}, "SEN"), ["d1", "d2"])
expect("empty prefix returns empty list", lambda: get("prefix_docs")({"relay": [1]}, ""), [])
```

## Hidden checks

```python
expect("non-matching prefix returns empty list", lambda: get("prefix_docs")({"relay": [1]}, "xyz"), [])
```

## Solution

```python
def prefix_docs(postings, prefix):
    if not prefix:
        return []
    needle = prefix.lower()
    found = set()
    for term, doc_ids in postings.items():
        if term.lower().startswith(needle):
            found.update(doc_ids)
    return sorted(found)
```

## Restored

Prefix queries now union matching posting lists cleanly without duplicate document IDs.
