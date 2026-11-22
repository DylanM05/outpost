---
id: maintenance-s3-prefix-list
title: List flat object keys as virtual folders using a delimiter
system: Bucket rack
symbol: equipment
scene: tests
skills: object-storage
reviewSkill: object-storage
prerequisite: presigned-urls
---

## Briefing

Object stores don't have real directories — they store flat keys like `"clips/2026/a.mp4"`. Listing with a `prefix` and `delimiter="/"` groups deeper keys into sorted `common_prefixes` (virtual folders) alongside direct child `objects`.

## Objective

Write `list_bucket(keys, prefix="", delimiter="/")` returning `{"objects": sorted_direct_keys, "prefixes": sorted_unique_folder_prefixes}` for keys starting with `prefix`. If the remainder `key[len(prefix):]` contains `delimiter`, collapse it into `prefix + remainder.split(delimiter, 1)[0] + delimiter` inside `"prefixes"`; otherwise put `key` in `"objects"`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Filter `for k in keys: if not k.startswith(prefix): continue`, then inspect `rest = k[len(prefix):]`.

## Starter

```python
```

## Checks

```python
_KEYS = ["clips/intro.mp4", "clips/2025/a.mp4", "clips/2025/b.mp4", "clips/2026/c.mp4", "docs/readme.txt"]
expect("groups nested keys into common prefixes", lambda: get("list_bucket")(_KEYS, prefix="clips/"), {
    "objects": ["clips/intro.mp4"],
    "prefixes": ["clips/2025/", "clips/2026/"],
})
```

## Hidden checks

```python
expect("empty prefix lists top-level folders", lambda: get("list_bucket")(_KEYS, prefix=""), {
    "objects": [],
    "prefixes": ["clips/", "docs/"],
})
expect("leaf folder lists only objects", lambda: get("list_bucket")(_KEYS, prefix="clips/2025/"), {
    "objects": ["clips/2025/a.mp4", "clips/2025/b.mp4"],
    "prefixes": [],
})
```

## Solution

```python
def list_bucket(keys, prefix="", delimiter="/"):
    objects = []
    prefixes = set()
    for k in keys:
        if not k.startswith(prefix):
            continue
        rest = k[len(prefix):]
        if delimiter and delimiter in rest:
            folder = rest.split(delimiter, 1)[0]
            prefixes.add(prefix + folder + delimiter)
        else:
            objects.append(k)
    return {"objects": sorted(objects), "prefixes": sorted(prefixes)}
```

## Restored

Bucket prefix listings now project flat object keys into tidy virtual folder hierarchies.
