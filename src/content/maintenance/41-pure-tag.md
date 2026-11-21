---
id: maintenance-pure-tag
title: Tag without mutating
system: Memo desk
symbol: instrument
scene: tests
skills: functional
reviewSkill: functional
prerequisite: cache-the-readings
---

## Briefing

An operator's tagging script appends `"urgent"` directly onto shared ticket dicts, contaminating the archive copy. Make the tagging function pure.

## Objective

Write `tag_heavy(crates, limit)`. `crates` is a list of `{"sku": str, "weight": int}` dicts. Return a **new** list of **new** dicts where each crate has an added key `"heavy": crate["weight"] > limit`, without modifying `crates` or any dict inside it.

```python
tag_heavy([{"sku": "A", "weight": 12}, {"sku": "B", "weight": 4}], 10)
# [{"sku": "A", "weight": 12, "heavy": True}, {"sku": "B", "weight": 4, "heavy": False}]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use a list comprehension with dictionary unpacking: `[{**c, "heavy": c["weight"] > limit} for c in crates]`.

## Starter

```python
def tag_heavy(crates, limit):
    for crate in crates:
        crate["heavy"] = crate["weight"] > limit
    return crates
```

## Checks

```python
orig = [{"sku": "A", "weight": 12}, {"sku": "B", "weight": 4}]
expect("tags heavy crates accurately", lambda: get("tag_heavy")(orig, 10), [{"sku": "A", "weight": 12, "heavy": True}, {"sku": "B", "weight": 4, "heavy": False}])
expect("original dicts untouched", lambda: orig, [{"sku": "A", "weight": 12}, {"sku": "B", "weight": 4}])
```

## Hidden checks

```python
expect("boundary equal to limit is False", lambda: get("tag_heavy")([{"sku": "C", "weight": 10}], 10), [{"sku": "C", "weight": 10, "heavy": False}])
expect("empty list", lambda: get("tag_heavy")([], 5), [])
```

## Solution

```python
def tag_heavy(crates, limit):
    return [{**c, "heavy": c["weight"] > limit} for c in crates]
```

## Restored

Heavy-crate tags no longer leak back into the shared manifest list.
