---
id: lifecycle-tiering
title: Evaluate object-storage lifecycle transition and expiration rules
system: Media rail
symbol: controller
scene: tests
skills: object-storage
---

## Briefing

Keeping five-year-old raw drone footage in hot SSD storage burns budget fast. Object stores run automated **lifecycle policies** matching key prefixes to transition aging objects from `STANDARD` -> `INFREQUENT` -> `GLACIER`, or expire temporary scratch files altogether.

## Concept

Each object is a dict `{"key": str, "age_days": int, "tier": str}` (where tier rank is `STANDARD=0`, `INFREQUENT=1`, `GLACIER=2`).
Each rule is a dict:
- `"prefix"`: string prefix that must match `obj["key"].startswith(prefix)` (empty string `""` matches all keys).
- Optional `"expire_days"`: if `age_days >= expire_days`, the object is marked for expiration (`"EXPIRE"`).
- Optional `"transitions"`: list of `(days, target_tier)` pairs — any transition with `age_days >= days` proposes moving to `target_tier`.

When evaluating **all matching rules** for an object:
1. Expiration always wins: if any matching rule's `expire_days <= age_days`, final action is `"EXPIRE"`.
2. Otherwise pick the **coldest** (highest rank) tier among the object's current tier and all triggered transitions (lifecycle rules never automatically promote objects back to a hotter tier!).
3. If the coldest tier is strictly colder than `obj["tier"]`, action is `"TRANSITION"` with `"target": coldest_tier`; otherwise action is `"KEEP"` with `"target": obj["tier"]`.

Return a dict `{"keep": sorted_keys, "transition": {key: target_tier}, "expire": sorted_keys}`.

## Objective

Write `plan_lifecycle(objects, rules)` returning `{"keep": [...], "transition": {...}, "expire": [...]}`.

## Hints

1. Map tier names to ranks `TIER_RANK = {"STANDARD": 0, "INFREQUENT": 1, "GLACIER": 2}`.
2. Check every rule whose `rule["prefix"]` matches `obj["key"]` — multiple rules can apply to the same object!

## Starter: guided

```python
TIER_RANK = {"STANDARD": 0, "INFREQUENT": 1, "GLACIER": 2}


def plan_lifecycle(objects, rules):
    keep = []
    transition = {}
    expire = []
    for obj in objects:
        key = obj["key"]
        age = obj["age_days"]
        cur = obj["tier"]
        # Evaluate all matching rules: expire wins, else pick coldest tier > cur.
        pass
    keep.sort()
    expire.sort()
    return {"keep": keep, "transition": transition, "expire": expire}
```

## Starter: standard

```python
def plan_lifecycle(objects, rules):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _plan():
    objs = [
        {"key": "tmp/a.bin", "age_days": 8, "tier": "STANDARD"},
        {"key": "logs/2025.gz", "age_days": 100, "tier": "STANDARD"},
        {"key": "logs/fresh.gz", "age_days": 5, "tier": "STANDARD"},
        {"key": "logs/old.gz", "age_days": 40, "tier": "GLACIER"},
    ]
    rules = [
        {"prefix": "tmp/", "expire_days": 7},
        {"prefix": "logs/", "transitions": [(30, "INFREQUENT"), (90, "GLACIER")]},
    ]
    return get("plan_lifecycle")(objs, rules)
expect("expires scratch files, transitions aging logs to coldest tier, and never warms cold objects", _plan, {
    "keep": ["logs/fresh.gz", "logs/old.gz"],
    "transition": {"logs/2025.gz": "GLACIER"},
    "expire": ["tmp/a.bin"],
})
```

## Hidden checks

```python
def _overlap_rules():
    objs = [{"key": "media/raw/clip.mp4", "age_days": 60, "tier": "STANDARD"}]
    rules = [
        {"prefix": "media/", "transitions": [(30, "INFREQUENT")]},
        {"prefix": "media/raw/", "expire_days": 60},
    ]
    return get("plan_lifecycle")(objs, rules)
expect("expiration wins when multiple matching rules apply", _overlap_rules, {
    "keep": [],
    "transition": {},
    "expire": ["media/raw/clip.mp4"],
})
```

## Solution

```python
TIER_RANK = {"STANDARD": 0, "INFREQUENT": 1, "GLACIER": 2}


def plan_lifecycle(objects, rules):
    keep = []
    transition = {}
    expire = []
    for obj in objects:
        key = obj["key"]
        age = obj["age_days"]
        cur = obj["tier"]
        should_expire = False
        best_tier = cur
        for rule in rules:
            if not key.startswith(rule.get("prefix", "")):
                continue
            exp = rule.get("expire_days")
            if exp is not None and age >= exp:
                should_expire = True
                break
            for days, target in rule.get("transitions", ()):
                if age >= days and TIER_RANK[target] > TIER_RANK[best_tier]:
                    best_tier = target
        if should_expire:
            expire.append(key)
        elif TIER_RANK[best_tier] > TIER_RANK[cur]:
            transition[key] = best_tier
        else:
            keep.append(key)
    keep.sort()
    expire.sort()
    return {"keep": keep, "transition": transition, "expire": expire}
```

## Restored

The media rail now transitions aging footage to cold tiers and expires temporary blobs automatically.
