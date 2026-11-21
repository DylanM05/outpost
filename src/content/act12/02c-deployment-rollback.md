---
id: deployment-rollback
kind: code
title: Revision history and safe rollback
system: Rollout bay
symbol: equipment
scene: tests
skills: orchestration
---

## Briefing

When revision `3` ships a bad image (`relay:v3-broken`), `kubectl rollout undo` doesn't delete revision `3` from the audit log — it copies revision `2`'s spec forward as **revision `4`**! That way operators always have a complete timeline of what ran and when.

## Objective

Write a class `DeploymentHistory`:

- `__init__(self)` starts with no revisions (`revision = 0`).
- `apply(self, image, replicas)` records a new monotonically increasing revision (`1, 2, 3, ...`) with `{"revision": rev, "image": image, "replicas": replicas}` and returns `rev`.
- `current(self)` returns a copy of the latest revision dict (or `None` if nothing has been applied yet).
- `rollback(self, to_revision=None)`:
  - If `to_revision is None`, roll back to the **immediately previous** revision (`latest_rev - 1`). Raise `ValueError` if fewer than 2 revisions exist or if `to_revision` doesn't exist in history.
  - Copy the target revision's `image` and `replicas` into a **brand-new** revision (`latest_rev + 1`), keeping all prior revisions intact in `self.history()`, and return the new revision number!
- `history(self)` returns a list of copies of all revisions in ascending revision order.

## Concept

Append-only revision numbers make rollbacks auditable and reversible — if rolling back from `v3` to `v2` (as revision `4`) somehow makes things worse, you can even roll back from `4` to `3` (as revision `5`) with zero lost history!

## Hints

1. Store `self._revisions = []` (list of dicts, 1-indexed by `rev - 1`).
2. `target = self._revisions[-2]` when `to_revision is None` (after checking `len(self._revisions) >= 2`).

## Starter: guided

```python
class DeploymentHistory:
    def __init__(self):
        self._revisions = []

    def apply(self, image, replicas):
        rev = len(self._revisions) + 1
        self._revisions.append({"revision": rev, "image": image, "replicas": replicas})
        return rev

    def current(self):
        return dict(self._revisions[-1]) if self._revisions else None

    def rollback(self, to_revision=None):
        # TODO: locate target revision (previous by default), append copy as new revision number
        pass

    def history(self):
        return [dict(r) for r in self._revisions]
```

## Starter: standard

```python
class DeploymentHistory:
    def __init__(self):
        pass

    def apply(self, image, replicas):
        pass

    def current(self):
        pass

    def rollback(self, to_revision=None):
        pass

    def history(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
DH = get("DeploymentHistory")
def test_rollout_undo():
    h = DH()
    r1 = h.apply("relay:1.0", 2)
    r2 = h.apply("relay:1.1", 3)
    r3 = h.apply("relay:1.2-bad", 3)
    r4 = h.rollback()
    r5 = h.rollback(to_revision=1)
    return (r1, r2, r3, r4, r5, h.current(), len(h.history()))

expect(
    "rollback appends new revision numbers without erasing audit history",
    test_rollout_undo,
    (1, 2, 3, 4, 5, {"revision": 5, "image": "relay:1.0", "replicas": 2}, 5),
)
```

## Hidden checks

```python
DH = get("DeploymentHistory")
def bad_rollback():
    h = DH()
    h.apply("relay:1.0", 1)
    try:
        h.rollback()
        return False
    except ValueError:
        return True
check("rollback with only 1 revision raises ValueError", bad_rollback)
def missing_rev():
    h = DH()
    h.apply("a", 1)
    h.apply("b", 1)
    try:
        h.rollback(to_revision=99)
        return False
    except ValueError:
        return True
check("rollback to non-existent revision raises ValueError", missing_rev)
```

## Solution

```python
class DeploymentHistory:
    def __init__(self):
        self._revisions = []

    def apply(self, image, replicas):
        rev = len(self._revisions) + 1
        self._revisions.append({"revision": rev, "image": image, "replicas": replicas})
        return rev

    def current(self):
        return dict(self._revisions[-1]) if self._revisions else None

    def rollback(self, to_revision=None):
        if to_revision is None:
            if len(self._revisions) < 2:
                raise ValueError("no previous revision to roll back to")
            target = self._revisions[-2]
        else:
            if not (1 <= to_revision <= len(self._revisions)):
                raise ValueError(f"unknown revision: {to_revision}")
            target = self._revisions[to_revision - 1]
        return self.apply(target["image"], target["replicas"])

    def history(self):
        return [dict(r) for r in self._revisions]
```

## Restored

One command rolls back broken deploys to any prior revision while preserving the full release audit trail.
