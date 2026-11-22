---
id: maintenance-fix-visibility-expiry
title: Fix a visibility-timeout check that locks expired messages forever
system: Scale deck
symbol: controller
scene: tests
skills: cloud-runtime
reviewSkill: cloud-runtime
prerequisite: serverless-cold-start
---

## Briefing

A queue scanner is comparing `now < visible_at` backwards, returning *invisible* leased messages instead of messages whose visibility timeout has expired!

## Objective

Fix `visible_message_ids(messages, now)` where each message is `{"id": str, "visible_at": int}` so it returns the IDs (preserving order) of all messages visible at timestamp `now` (`now >= visible_at`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. A message becomes visible once `now >= m["visible_at"]`, NOT when `now < m["visible_at"]`!

## Starter

```python
def visible_message_ids(messages, now):
    return [m["id"] for m in messages if now < m["visible_at"]]
```

## Checks

```python
_MSGS = [{"id": "m1", "visible_at": 100}, {"id": "m2", "visible_at": 150}, {"id": "m3", "visible_at": 120}]
expect("returns messages whose visibility lease has expired", lambda: get("visible_message_ids")(_MSGS, 120), ["m1", "m3"])
```

## Hidden checks

```python
expect("returns empty list when all messages are still leased", lambda: get("visible_message_ids")([{"id": "a", "visible_at": 50}], 49), [])
```

## Solution

```python
def visible_message_ids(messages, now):
    return [m["id"] for m in messages if now >= m["visible_at"]]
```

## Restored

Expired leases now resurface promptly for redelivery.
