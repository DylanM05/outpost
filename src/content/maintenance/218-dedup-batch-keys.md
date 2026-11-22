---
id: maintenance-dedup-batch-keys
title: Deduplicate batch-loader keys while mapping results back in order
system: Graph rail
symbol: controller
scene: tests
skills: graphql-batching
reviewSkill: graphql-batching
prerequisite: dataloader-batcher
---

## Briefing

Before hitting SQL `WHERE id IN (...)`, a batch loader deduplicates repeated foreign keys so the database fetches each row once, then maps the returned values back to every original slot in order.

## Objective

Write `batched_lookup(keys, batch_fn)` where `batch_fn(unique_keys)` receives unique keys in first-seen order and returns an aligned list of values. Return `[value_for_k for k in keys]` (skipping `batch_fn` entirely if `keys` is empty!).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `unique = list(dict.fromkeys(keys))` to deduplicate while preserving first-seen order!

## Starter

```python
```

## Checks

```python
def _batch():
    seen = []
    def fn(ks):
        seen.append(list(ks))
        return [k * 10 for k in ks]
    res = get("batched_lookup")([3, 1, 3, 2, 1], fn)
    return (res, seen)
expect("calls batch_fn once with unique first-seen keys and fans results back out", _batch, ([30, 10, 30, 20, 10], [[3, 1, 2]]))
```

## Hidden checks

```python
expect("empty keys skips batch_fn", lambda: get("batched_lookup")([], lambda ks: 1 / 0), [])
```

## Solution

```python
def batched_lookup(keys, batch_fn):
    if not keys:
        return []
    unique = list(dict.fromkeys(keys))
    vals = batch_fn(unique)
    if len(vals) != len(unique):
        raise ValueError("batch_fn returned mismatched length")
    mapping = dict(zip(unique, vals))
    return [mapping[k] for k in keys]
```

## Restored

Batch key deduplication now cuts redundant database lookups cleanly.
