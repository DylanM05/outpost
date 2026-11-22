---
id: maintenance-dlq-partition
title: Partition queue messages into active vs. dead-letter buckets
system: Scale deck
symbol: controller
scene: tests
skills: cloud-runtime
reviewSkill: cloud-runtime
prerequisite: serverless-cold-start
---

## Briefing

When a worker fleet repeatedly fails to process a malformed job, the queue routes messages whose `receives >= max_receives` into the dead-letter queue while keeping healthier messages active.

## Objective

Write `partition_dlq(messages, max_receives)` where each message is `{"id": str, "receives": int}` and `max_receives >= 1` (raise `ValueError` otherwise). Return `{"active": [...], "dlq": [...]}` containing message IDs in their original order.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Any message with `m["receives"] >= max_receives` goes into `"dlq"`; all others stay in `"active"`.

## Starter

```python
```

## Checks

```python
expect("separates poison messages at or above max_receives", lambda: get("partition_dlq")([{"id": "a", "receives": 1}, {"id": "b", "receives": 3}, {"id": "c", "receives": 2}], 3), {"active": ["a", "c"], "dlq": ["b"]})
```

## Hidden checks

```python
expect("handles empty queue", lambda: get("partition_dlq")([], 2), {"active": [], "dlq": []})
def _bad():
    try:
        get("partition_dlq")([], 0)
        return False
    except ValueError:
        return True
expect("max_receives < 1 raises ValueError", _bad, True)
```

## Solution

```python
def partition_dlq(messages, max_receives):
    if max_receives < 1:
        raise ValueError("max_receives must be >= 1")
    active = []
    dlq = []
    for m in messages:
        if m["receives"] >= max_receives:
            dlq.append(m["id"])
        else:
            active.append(m["id"])
    return {"active": active, "dlq": dlq}
```

## Restored

Poison-pill messages now drain cleanly into the DLQ without stalling healthy work.
