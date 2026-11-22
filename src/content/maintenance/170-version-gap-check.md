---
id: maintenance-version-gap-check
title: Verify contiguous event stream versions
system: Event spine
symbol: controller
scene: tests
skills: event-sourcing
reviewSkill: event-sourcing
prerequisite: saga-orchestrator
---

## Briefing

A corrupted replica or dropped replication message can leave a gap or duplicate version inside an event stream (`[1, 2, 4]`). Verify that stream versions are strictly contiguous `1, 2, ..., N`.

## Objective

Write `is_contiguous_versions(versions)` returning `True` iff `versions` equals `[1, 2, ..., len(versions)]` (empty list `[]` is contiguous and returns `True`), and `False` otherwise.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Compare `list(versions) == list(range(1, len(versions) + 1))` (or check `all(v == i for i, v in enumerate(versions, start=1))`).

## Starter

```python
```

## Checks

```python
expect("contiguous 1..4 returns True", lambda: get("is_contiguous_versions")([1, 2, 3, 4]), True)
expect("missing version 3 returns False", lambda: get("is_contiguous_versions")([1, 2, 4]), False)
expect("duplicate or zero-based version returns False", lambda: (get("is_contiguous_versions")([1, 2, 2]), get("is_contiguous_versions")([0, 1, 2])), (False, False))
```

## Hidden checks

```python
expect("empty list is valid contiguous stream", lambda: get("is_contiguous_versions")([]), True)
```

## Solution

```python
def is_contiguous_versions(versions):
    return all(v == i for i, v in enumerate(versions, start=1))
```

## Restored

Stream integrity checks spot dropped, duplicated, or out-of-order version numbers immediately.
