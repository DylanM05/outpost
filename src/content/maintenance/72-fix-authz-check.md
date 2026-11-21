---
id: maintenance-fix-authz-check
title: Fix the 401 vs 403 gate
system: Gatehouse
symbol: controller
scene: tests
skills: auth
reviewSkill: auth
prerequisite: who-may-change-it
---

## Briefing

`authorize_edit(user, record)` below mixes up authentication (`401`) and authorization (`403`) — and worse, allows any logged-in user to edit someone else's record! Fix the security bug.

## Objective

Modify `authorize_edit(user, record)` so that:

- If `user` is `None` (unauthenticated), return `401`.
- If `user["role"] == "admin"` **or** `user["id"] == record["owner_id"]`, return `200`.
- Otherwise (authenticated, but neither the owner nor an admin), return `403`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if user is None: return 401` first — never return `403` for an unauthenticated caller.
2. Check ownership (`user.get("id") == record.get("owner_id")`) or admin role (`user.get("role") == "admin"`), returning `200` if either holds and `403` otherwise.

## Starter

```python
def authorize_edit(user, record):
    if user is None:
        return 403
    if user.get("role") in ("admin", "member"):
        return 200
    return 401
```

## Checks

```python
rec = {"id": "ord-1", "owner_id": "u-ines"}
expect("unauthenticated returns 401", lambda: get("authorize_edit")(None, rec), 401)
expect("owner returns 200", lambda: get("authorize_edit")({"id": "u-ines", "role": "member"}, rec), 200)
expect("different member returns 403", lambda: get("authorize_edit")({"id": "u-tomas", "role": "member"}, rec), 403)
expect("admin returns 200", lambda: get("authorize_edit")({"id": "u-mara", "role": "admin"}, rec), 200)
```

## Hidden checks

```python
rec = {"id": "ord-2", "owner_id": "u-1"}
expect("guest cannot edit others' record", lambda: get("authorize_edit")({"id": "u-2", "role": "guest"}, rec), 403)
expect("missing owner_id does not accidentally match missing user id", lambda: get("authorize_edit")({"role": "member"}, {"id": "ord-3"}), 403)
```

## Solution

```python
def authorize_edit(user, record):
    if user is None:
        return 401
    if user.get("role") == "admin":
        return 200
    owner = record.get("owner_id")
    if owner is not None and user.get("id") == owner:
        return 200
    return 403
```

## Restored

Unauthenticated callers get `401`, unauthorized members get `403`, and cross-account edits are closed for good.
