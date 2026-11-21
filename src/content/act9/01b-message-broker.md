---
id: message-broker
title: Message broker
system: Drafting table
symbol: instrument
scene: tests
skills: architecture, linear-structures
---

## Briefing

When a blizzard warning fires on the ridge, five different services care: the drone fleet, the supply exchange, the beacon log, the heater controller, and Valley Station. Calling all five synchronously over HTTP couples the weather station to every consumer — if one is slow or down, the alert stalls. **Publish/Subscribe (Pub/Sub)** decouples them: publishers send events to a named **topic** on a broker, and the broker fans each event out to every matching subscriber independently, capturing failures in a **dead-letter queue (DLQ)**.

## Objective

Write a `TopicBroker` class with:

- `subscribe(self, pattern, consumer_id, handler)`: registers a subscriber (`handler(event)` where `event` is `{"id": event_id, "topic": topic, "payload": payload}`).
  - A pattern matches a topic if `pattern == topic`, or if `pattern` ends with `".*"` and `topic.startswith(pattern[:-1])` (for example, `"weather.*"` matches `"weather.wind"` and `"weather.temp"`, not `"weather"` or `"weathering"`!).
- `publish(self, topic, event_id, payload)`:
  - Fans the event out to every subscriber whose `pattern` matches `topic` (in subscription order).
  - **Per-subscriber idempotency:** if `(consumer_id, event_id)` was already delivered successfully, skip calling `handler` again!
  - **Isolation & DLQ:** if a subscriber's `handler(event)` raises any exception, catch it, append `{"consumer_id": consumer_id, "event": event, "error": str(exc)}` to `self.dead_letters`, and **continue delivering to all other subscribers**!
  - Return `{"delivered": delivered_count, "failed": failed_count, "skipped": skipped_count}`.

```python
broker = TopicBroker()
broker.subscribe("weather.*", "fleet", handle_fleet)
broker.subscribe("weather.wind", "alarm", handle_alarm)
broker.publish("weather.wind", "evt-1", {"kph": 95})
# {"delivered": 2, "failed": 0, "skipped": 0}
```

## Concept

Pub/Sub architecture (like RabbitMQ, Kafka, or NATS) solves three scaling headaches at once:

- **Decoupling:** publishers only know topic names (`"weather.wind"`), never who is listening.
- **Fault isolation:** a crashing consumer drops into the **dead-letter queue** instead of taking down the publisher or sibling consumers.
- **At-least-once + idempotency:** tracking `(consumer_id, event_id)` ensures re-publishing an event delivers it to any consumer that missed it without double-delivering to consumers that already succeeded.

## Hints

1. Helper `_matches(pattern, topic)`: if `pattern.endswith(".*")`, return `topic.startswith(pattern[:-1])`; else `return pattern == topic`.
2. Keep `self._subs = []`, `self._delivered = set()` (storing `(consumer_id, event_id)`), and `self.dead_letters = []`.
3. Wrap `handler(event)` in `try ... except Exception as exc:` so one bad subscriber appends to `self.dead_letters` without stopping the loop.

## Starter: guided

```python
def _matches(pattern, topic):
    if pattern.endswith(".*"):
        return topic.startswith(pattern[:-1])
    return pattern == topic


class TopicBroker:
    def __init__(self):
        self._subs = []
        self._delivered = set()
        self.dead_letters = []

    def subscribe(self, pattern, consumer_id, handler):
        self._subs.append((pattern, consumer_id, handler))

    def publish(self, topic, event_id, payload):
        event = {"id": event_id, "topic": topic, "payload": payload}
        delivered = failed = skipped = 0
        # Fan out to matching subscribers, enforcing per-consumer idempotency and DLQ isolation.
        return {"delivered": delivered, "failed": failed, "skipped": skipped}
```

## Starter: standard

```python
class TopicBroker:
    def __init__(self):
        self.dead_letters = []

    def subscribe(self, pattern, consumer_id, handler):
        pass

    def publish(self, topic, event_id, payload):
        return {"delivered": 0, "failed": 0, "skipped": 0}
```

## Starter: challenge

```python
```

## Checks

```python
b = get("TopicBroker")()
seen_fleet = []
seen_alarm = []

def _broken(ev):
    raise RuntimeError("disk full")

b.subscribe("weather.*", "fleet", lambda ev: seen_fleet.append(ev))
b.subscribe("weather.wind", "broken", _broken)
b.subscribe("weather.wind", "alarm", lambda ev: seen_alarm.append(ev))

expect(
    "fans out to matching subscribers and isolates failing consumer into DLQ",
    lambda: b.publish("weather.wind", "e1", {"kph": 95}),
    {"delivered": 2, "failed": 1, "skipped": 0},
)
expect("both healthy subscribers received the event", lambda: (len(seen_fleet), len(seen_alarm)), (1, 1))
expect("DLQ captured failed consumer", lambda: (len(b.dead_letters), b.dead_letters[0]["consumer_id"]), (1, "broken"))
expect(
    "re-publishing e1 skips already-delivered consumers and retries failed one",
    lambda: b.publish("weather.wind", "e1", {"kph": 95}),
    {"delivered": 0, "failed": 1, "skipped": 2},
)
```

## Hidden checks

```python
b2 = get("TopicBroker")()
got = []
b2.subscribe("weather.*", "c1", lambda ev: got.append(ev["topic"]))
b2.publish("weather", "e1", {})
b2.publish("weathering.snow", "e2", {})
b2.publish("weather.snow", "e3", {})
expect(
    "wildcard 'weather.*' only matches topics starting with 'weather.'",
    lambda: got,
    ["weather.snow"],
    "Check topic.startswith(pattern[:-1]) so 'weather.*' requires the dot.",
)
```

## Solution

```python
def _matches(pattern, topic):
    if pattern.endswith(".*"):
        return topic.startswith(pattern[:-1])
    return pattern == topic


class TopicBroker:
    def __init__(self):
        self._subs = []
        self._delivered = set()
        self.dead_letters = []

    def subscribe(self, pattern, consumer_id, handler):
        self._subs.append((pattern, consumer_id, handler))

    def publish(self, topic, event_id, payload):
        event = {"id": event_id, "topic": topic, "payload": payload}
        delivered = 0
        failed = 0
        skipped = 0
        for pattern, consumer_id, handler in self._subs:
            if not _matches(pattern, topic):
                continue
            key = (consumer_id, event_id)
            if key in self._delivered:
                skipped += 1
                continue
            try:
                handler(event)
                self._delivered.add(key)
                delivered += 1
            except Exception as exc:
                self.dead_letters.append(
                    {"consumer_id": consumer_id, "event": event, "error": str(exc)}
                )
                failed += 1
        return {"delivered": delivered, "failed": failed, "skipped": skipped}
```

## Restored

Events fan out cleanly across wildcard topics, idempotent consumers never double-process, and crashing handlers drop safely into the dead-letter queue.
