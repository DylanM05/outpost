---
id: maintenance-merge-two-sst
title: Merge two sorted SSTable segments
system: Memtable rack
symbol: equipment
scene: tests
skills: storage-engines
reviewSkill: storage-engines
prerequisite: mvcc-store
---

## Briefing

Compacting two immutable SSTable segments combines their sorted `(key, value)` pairs in linear time while keeping the newer segment's value whenever a key appears in both.

## Objective

Write `merge_pair(newer, older)` where `newer` and `older` are each lists of `(key, value)` tuples already sorted strictly ascending by `key`.

Return a single sorted list of `(key, value)` tuples containing every key from `newer` and `older` (preserving `newer`'s value on duplicate keys).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use two pointers `i = 0`, `j = 0`: compare `newer[i][0]` and `older[j][0]`.
2. When `k_new == k_old`, append `newer[i]` and advance **both** `i` and `j`; afterwards append whichever tail remains.

## Starter

```python
```

## Checks

```python
expect("merges sorted pairs with newer winning ties", lambda: get("merge_pair")([("b", 20), ("d", 40)], [("a", 1), ("b", 2), ("c", 3)]), [("a", 1), ("b", 20), ("c", 3), ("d", 40)])
expect("handles empty older segment", lambda: get("merge_pair")([("a", 1)], []), [("a", 1)])
expect("handles empty newer segment", lambda: get("merge_pair")([], [("a", 1)]), [("a", 1)])
```

## Hidden checks

```python
expect("preserves None tombstone from newer over older live value", lambda: get("merge_pair")([("k", None)], [("k", "old")]), [("k", None)])
expect("both empty returns empty", lambda: get("merge_pair")([], []), [])
```

## Solution

```python
def merge_pair(newer, older):
    out = []
    i = 0
    j = 0
    while i < len(newer) and j < len(older):
        kn, vn = newer[i]
        ko, vo = older[j]
        if kn < ko:
            out.append((kn, vn))
            i += 1
        elif ko < kn:
            out.append((ko, vo))
            j += 1
        else:
            out.append((kn, vn))
            i += 1
            j += 1
    out.extend(newer[i:])
    out.extend(older[j:])
    return out
```

## Restored

Two-way SSTable compaction merges segments in $O(n + m)$ time with newest-wins deduplication.
