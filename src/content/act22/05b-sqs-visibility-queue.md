---
id: sqs-visibility-queue
title: Build an SQS-style visibility-timeout queue with a dead-letter queue
system: Scale deck
symbol: controller
scene: tests
skills: cloud-runtime
---

## Briefing

Cloud message queues (like Amazon SQS) guarantee **at-least-once delivery**: when a worker receives a message, it isn't deleted yet — it simply turns **invisible** for a `visibility_timeout`. If the worker crashes before calling `ack()`, the message reappears for another worker, and after `max_receives` failures it moves to a **Dead-Letter Queue (DLQ)**.

## Concept

Implement `CloudQueue(visibility_timeout, max_receives)`:
- `send(msg_id, payload)` -> appends message in FIFO order with `receives = 0`, `visible_at = 0`, `receipt = None`.
- `receive(now)` -> scans messages in FIFO order for the first message with `now >= visible_at`:
  - If a candidate already has `receives >= max_receives`: move it out of the main queue into `self.dlq` (appending `{"id": msg_id, "payload": payload, "receives": receives}`) and keep scanning!
  - Otherwise increment `receives += 1`, set `visible_at = now + visibility_timeout`, generate a fresh receipt handle (e.g. `f"{msg_id}:{receives}"`), and return `{"id": msg_id, "payload": payload, "receipt": receipt, "receives": receives}`.
  - If no visible message remains, return `None`.
- `ack(receipt, now)` -> deletes the message matching `receipt` ONLY if it is still currently leased (`now < visible_at` and `msg["receipt"] == receipt`), returning `True`; otherwise returns `False` (preventing a slow worker whose lease expired from deleting a redelivered message!).

## Objective

Implement `CloudQueue(visibility_timeout, max_receives)` with `send`, `receive`, `ack`, and `self.dlq`.

## Hints

1. Notice what happens when `max_receives = 2`:
   - 1st `receive()` -> `receives = 1` (leased). Worker crashes, lease expires.
   - 2nd `receive()` -> `receives = 2` (leased). Worker crashes again, lease expires.
   - 3rd `receive()` -> sees `receives == 2 >= max_receives` -> moves message to `self.dlq` and continues to the next message!

## Starter: guided

```python
class CloudQueue:
    def __init__(self, visibility_timeout, max_receives):
        if visibility_timeout <= 0 or max_receives < 1:
            raise ValueError("invalid queue config")
        self.visibility_timeout = visibility_timeout
        self.max_receives = max_receives
        self.messages = []
        self.dlq = []

    def send(self, msg_id, payload):
        self.messages.append({
            "id": msg_id,
            "payload": payload,
            "receives": 0,
            "visible_at": 0,
            "receipt": None,
        })

    def receive(self, now):
        pass

    def ack(self, receipt, now):
        pass
```

## Starter: standard

```python
class CloudQueue:
    def __init__(self, visibility_timeout, max_receives):
        pass

    def send(self, msg_id, payload):
        pass

    def receive(self, now):
        pass

    def ack(self, receipt, now):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _sqs():
    q = get("CloudQueue")(visibility_timeout=30, max_receives=2)
    q.send("m1", "poison")
    q.send("m2", "good")
    r1 = q.receive(now=100)       # m1 attempt 1, invisible until 130
    r2 = q.receive(now=105)       # m2 attempt 1, invisible until 135
    ack_m2 = q.ack(r2["receipt"], now=110)
    # m1 lease expires at 130 -> stale ack fails, redelivery succeeds!
    stale_ack = q.ack(r1["receipt"], now=130)
    r3 = q.receive(now=130)       # m1 attempt 2, invisible until 160
    # Fails again -> at t=160, m1 hits max_receives=2 and moves to DLQ!
    r4 = q.receive(now=160)
    return (
        (r1["id"], r1["receives"]),
        (r2["id"], ack_m2),
        stale_ack,
        (r3["id"], r3["receives"]),
        r4,
        q.dlq,
    )
expect("handles visibility timeouts, stale ack rejection, redelivery, and DLQ dead-lettering", _sqs, (
    ("m1", 1),
    ("m2", True),
    False,
    ("m1", 2),
    None,
    [{"id": "m1", "payload": "poison", "receives": 2}],
))
```

## Hidden checks

```python
def _dlq_doesnt_block_next():
    q = get("CloudQueue")(10, max_receives=1)
    q.send("bad", "x")
    q.send("ok", "y")
    q.receive(0)  # bad receives=1
    # At t=10, bad moves to DLQ and receive() immediately returns ok!
    nxt = q.receive(10)
    return (nxt["id"], len(q.dlq), q.dlq[0]["id"])
expect("dead-lettering a poison message advances to the next visible message", _dlq_doesnt_block_next, ("ok", 1, "bad"))
```

## Solution

```python
class CloudQueue:
    def __init__(self, visibility_timeout, max_receives):
        if visibility_timeout <= 0 or max_receives < 1:
            raise ValueError("invalid queue config")
        self.visibility_timeout = visibility_timeout
        self.max_receives = max_receives
        self.messages = []
        self.dlq = []

    def send(self, msg_id, payload):
        self.messages.append({
            "id": msg_id,
            "payload": payload,
            "receives": 0,
            "visible_at": 0,
            "receipt": None,
        })

    def receive(self, now):
        i = 0
        while i < len(self.messages):
            msg = self.messages[i]
            if now < msg["visible_at"]:
                i += 1
                continue
            if msg["receives"] >= self.max_receives:
                dead = self.messages.pop(i)
                self.dlq.append({"id": dead["id"], "payload": dead["payload"], "receives": dead["receives"]})
                continue
            msg["receives"] += 1
            msg["visible_at"] = now + self.visibility_timeout
            msg["receipt"] = f"{msg['id']}:{msg['receives']}"
            return {
                "id": msg["id"],
                "payload": msg["payload"],
                "receipt": msg["receipt"],
                "receives": msg["receives"],
            }
        return None

    def ack(self, receipt, now):
        for i, msg in enumerate(self.messages):
            if msg["receipt"] == receipt:
                if now < msg["visible_at"]:
                    self.messages.pop(i)
                    return True
                return False
        return False
```

## Restored

The scale deck's cloud queue now delivers messages reliably with visibility leases and automatic dead-lettering.
