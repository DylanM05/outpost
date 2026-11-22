---
id: maintenance-resource-diff-action
title: Classify a resource diff as no-op, update, or replace
system: Plan bench
symbol: instrument
scene: tests
skills: infra-as-code
reviewSkill: infra-as-code
prerequisite: state-locking
---

## Briefing

Not every config change requires recreating a server: changing tags is an in-place `"update"`, whereas changing an immutable field like `"az"` or `"cidr"` forces a destructive `"replace"`.

## Objective

Write `classify_change(old_attrs, new_attrs, immutable_keys)` returning `"no-op"` if `old_attrs == new_attrs`, `"replace"` if any added, removed, or modified key is in `immutable_keys`, else `"update"`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if old_attrs == new_attrs: return "no-op"`, then test if any key `k` where `old_attrs.get(k, sentinel) != new_attrs.get(k, sentinel)` is in `immutable_keys`.

## Starter

```python
```

## Checks

```python
expect("identical attrs return no-op", lambda: get("classify_change")({"a": 1}, {"a": 1}, {"a"}), "no-op")
expect("mutable change returns update", lambda: get("classify_change")({"cidr": "10.0.0.0/16", "tag": "v1"}, {"cidr": "10.0.0.0/16", "tag": "v2"}, {"cidr"}), "update")
expect("immutable change returns replace", lambda: get("classify_change")({"cidr": "10.0.0.0/16"}, {"cidr": "10.1.0.0/16"}, {"cidr"}), "replace")
```

## Hidden checks

```python
expect("removing an immutable key forces replace", lambda: get("classify_change")({"az": "us-1a"}, {}, {"az"}), "replace")
```

## Solution

```python
_MISSING = object()


def classify_change(old_attrs, new_attrs, immutable_keys):
    if old_attrs == new_attrs:
        return "no-op"
    immut = set(immutable_keys)
    for k in set(old_attrs) | set(new_attrs):
        if old_attrs.get(k, _MISSING) != new_attrs.get(k, _MISSING):
            if k in immut:
                return "replace"
    return "update"
```

## Restored

Resource diffing now separates safe in-place updates from immutable replacements.
