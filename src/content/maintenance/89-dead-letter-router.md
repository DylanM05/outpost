---
id: maintenance-dead-letter-router
title: Retries and dead-letter routing
system: Drafting table
symbol: controller
scene: tests
skills: architecture
reviewSkill: architecture
prerequisite: backpressure-and-dlq
---

## Briefing

A single poison message in a queue shouldn't crash the worker or block the rest of the batch. Retry each message up to `max_attempts`, and move persistently failing messages to a dead-letter list.

## Objective

Write `process_batch(messages, handler, max_attempts=3)`:

- For each `msg` in `messages`, call `handler(msg)` up to `max_attempts` times.
- If `handler(msg)` succeeds without raising an exception, append its return value to `ok` and stop retrying that message.
- If all `max_attempts` raise an exception, append `{"message": msg, "error": str(last_exc)}` to `dlq` and continue to the next message.
- Return `{"ok": ok, "dlq": dlq}`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. For each message, loop `for _ in range(max_attempts):` inside a `try / except Exception as exc:`.
2. On success, append the result and `break`; use `else:` on the `for` loop (which runs only if `break` never happened!) to append to `dlq`.

## Starter

```python
```

## Checks

```python
def run_batch():
    attempts = {}
    def handler(msg):
        attempts[msg] = attempts.get(msg, 0) + 1
        if msg == "flaky" and attempts[msg] < 2:
            raise RuntimeError("try again")
        if msg == "poison":
            raise ValueError("bad payload")
        return f"done:{msg}"
    return get("process_batch")(["good", "flaky", "poison", "after"], handler, max_attempts=3)

expect(
    "retries flaky, isolates poison to dlq, continues batch",
    run_batch,
    {
        "ok": ["done:good", "done:flaky", "done:after"],
        "dlq": [{"message": "poison", "error": "bad payload"}],
    },
)
```

## Hidden checks

```python
def respects_max_attempts():
    count = [0]
    def always_fail(m):
        count[0] += 1
        raise RuntimeError("down")
    res = get("process_batch")(["x"], always_fail, max_attempts=2)
    return (count[0], len(res["dlq"]))
expect("stops after exact max_attempts", respects_max_attempts, (2, 1))
```

## Solution

```python
def process_batch(messages, handler, max_attempts=3):
    ok = []
    dlq = []
    for msg in messages:
        last_exc = None
        for _ in range(max_attempts):
            try:
                ok.append(handler(msg))
                break
            except Exception as exc:
                last_exc = exc
        else:
            dlq.append({"message": msg, "error": str(last_exc)})
    return {"ok": ok, "dlq": dlq}
```

## Restored

Transient errors recover automatically and poison messages land safely in the dead-letter queue without stalling the worker.
