---
id: event-store-occ
title: Guard append-only event streams with optimistic concurrency
system: Event spine
symbol: controller
scene: tests
skills: event-sourcing
---

## Briefing

In an **event-sourced** system, current state is computed by replaying an append-only log of domain events (`Deposited`, `Withdrawn`). If two workers read version `3` simultaneously and both try to append a withdrawal, **Optimistic Concurrency Control (OCC)** accepts the first (advancing the stream to version `4`) and rejects the second because its `expected_version == 3` is stale!

## Concept

Each `stream_id` stores an ordered list of events, 1-indexed by version (`1, 2, 3, ...`; an empty/unseen stream is at version `0`):
- `version(stream_id)` -> `len(streams.get(stream_id, []))`
- `append(stream_id, expected_version, new_events)`:
  - If `self.version(stream_id) != expected_version`: raise `RuntimeError("concurrency conflict")` without appending anything!
  - Otherwise append each event in `new_events` as `{"version": v, "type": ev["type"], "data": ev.get("data", {})}` and return the new stream version.
- `read(stream_id, after_version=0)`: return all events in `stream_id` with `version > after_version`.

## Objective

Implement `EventStore` with `version(stream_id)`, `append(stream_id, expected_version, new_events)`, and `read(stream_id, after_version=0)`.

## Hints

1. Validate `self.version(stream_id) == expected_version` first, then append all `new_events` sequentially incrementing version by `1` each.
2. Since versions are `1..N`, `read(stream_id, after_version=0)` is simply `stream[max(0, after_version):]`!

## Starter: guided

```python
class EventStore:
    def __init__(self):
        self.streams = {}

    def version(self, stream_id):
        return len(self.streams.get(stream_id, []))

    def append(self, stream_id, expected_version, new_events):
        current = self.version(stream_id)
        if current != expected_version:
            raise RuntimeError(f"version conflict: expected {expected_version}, actual {current}")
        # Append versioned copies of new_events and return new version
        return current

    def read(self, stream_id, after_version=0):
        return []
```

## Starter: standard

```python
class EventStore:
    def __init__(self):
        pass

    def version(self, stream_id):
        pass

    def append(self, stream_id, expected_version, new_events):
        pass

    def read(self, stream_id, after_version=0):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _occ():
    es = get("EventStore")()
    v1 = es.append("acct-1", 0, [{"type": "Opened", "data": {"owner": "Ada"}}, {"type": "Deposited", "data": {"cents": 500}}])
    try:
        es.append("acct-1", 1, [{"type": "Withdrawn", "data": {"cents": 100}}])
        conflict = False
    except RuntimeError:
        conflict = True
    v2 = es.append("acct-1", 2, [{"type": "Withdrawn", "data": {"cents": 100}}])
    tail = es.read("acct-1", after_version=1)
    return (v1, conflict, v2, [(e["version"], e["type"]) for e in tail])
expect("enforces expected_version and reads events after a version", _occ, (2, True, 3, [(2, "Deposited"), (3, "Withdrawn")]))
```

## Hidden checks

```python
def _empty():
    es = get("EventStore")()
    return (es.version("missing"), es.read("missing"))
expect("unseen stream has version 0 and empty read", _empty, (0, []))
```

## Solution

```python
class EventStore:
    def __init__(self):
        self.streams = {}

    def version(self, stream_id):
        return len(self.streams.get(stream_id, []))

    def append(self, stream_id, expected_version, new_events):
        current = self.version(stream_id)
        if current != expected_version:
            raise RuntimeError(f"concurrency conflict: expected {expected_version}, got {current}")
        stream = self.streams.setdefault(stream_id, [])
        for ev in new_events:
            current += 1
            stream.append({"version": current, "type": ev["type"], "data": dict(ev.get("data", {}))})
        return current

    def read(self, stream_id, after_version=0):
        stream = self.streams.get(stream_id, [])
        start = max(0, after_version)
        return list(stream[start:])
```

## Restored

Append-only streams reject stale concurrent writers cleanly while supporting incremental tail reads.
