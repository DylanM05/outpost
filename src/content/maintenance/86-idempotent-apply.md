---
id: maintenance-idempotent-apply
title: Idempotent event application
system: Backup vault
symbol: equipment
scene: tests
skills: reliability
reviewSkill: reliability
prerequisite: retention-policy
---

## Briefing

Network retries deliver the same webhook event twice — and worse, a naive deduplicator that marks an event ID as "seen" *before* running the handler permanently drops the event if the handler crashes!

## Objective

Write `apply_once(seen_ids, event_id, handler)`:

- If `event_id` is already in `seen_ids`, do **not** call `handler` and return `None`.
- Otherwise call `result = handler()`.
- Record `event_id` in `seen_ids` **only if** `handler()` succeeds without raising an exception, then return `result`.
- If `handler()` raises, let the exception propagate and leave `event_id` **out** of `seen_ids` so a retry can succeed later.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `if event_id in seen_ids: return None`.
2. Call `result = handler()` *before* `seen_ids.add(event_id)`. If `handler()` raises, execution exits before `seen_ids.add()` runs!

## Starter

```python
```

## Checks

```python
def dedup_and_retry():
    seen = set()
    calls = []
    def flaky():
        calls.append("try")
        if len(calls) == 1:
            raise RuntimeError("transient db lock")
        return "applied"
    try:
        get("apply_once")(seen, "evt-1", flaky)
    except RuntimeError:
        pass
    first_seen = "evt-1" in seen
    second = get("apply_once")(seen, "evt-1", flaky)
    third = get("apply_once")(seen, "evt-1", flaky)
    return (first_seen, second, third, len(calls))

expect(
    "failed attempt stays retryable; succeeded attempt deduplicates",
    dedup_and_retry,
    (False, "applied", None, 2),
)
```

## Hidden checks

```python
def preserves_falsy_result():
    seen = set()
    r1 = get("apply_once")(seen, "evt-0", lambda: 0)
    r2 = get("apply_once")(seen, "evt-0", lambda: 99)
    return (r1, r2, "evt-0" in seen)
expect("falsy return value 0 still marks event seen", preserves_falsy_result, (0, None, True))
```

## Solution

```python
def apply_once(seen_ids, event_id, handler):
    if event_id in seen_ids:
        return None
    result = handler()
    seen_ids.add(event_id)
    return result
```

## Restored

Transient failures remain safely retryable while duplicate deliveries never double-charge or double-dispatch.
