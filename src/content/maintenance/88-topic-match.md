---
id: maintenance-topic-match
title: Wildcard pub/sub topic matcher
system: Drafting table
symbol: controller
scene: tests
skills: architecture
reviewSkill: architecture
prerequisite: backpressure-and-dlq
---

## Briefing

Pub/sub brokers route dot-separated topics like `"ridge.power.battery"` to subscribers using `*` (single segment) and `#` (zero or more remaining segments at the end).

## Objective

Write `topic_matches(pattern, topic)`:

- Both `pattern` and `topic` are dot-separated strings (`"a.b.c"`).
- `*` matches **exactly one** segment.
- `#` (when it appears as the last segment of `pattern`) matches **zero or more** remaining segments in `topic`.
- Any other segment must match literally.
- Return `True` if `topic` matches `pattern`, else `False`.

```python
topic_matches("ridge.*.fault", "ridge.power.fault")   # True
topic_matches("ridge.#", "ridge")                      # True
topic_matches("ridge.#", "ridge.power.temp.low")       # True
topic_matches("ridge.*", "ridge.power.temp")           # False
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Split both into `p_parts = pattern.split(".")` and `t_parts = topic.split(".")`.
2. If `p_parts[-1] == "#"`, check that `len(t_parts) >= len(p_parts) - 1` and every prefix segment before `#` matches (either `"*"` or equal).
3. Otherwise `len(p_parts) == len(t_parts)` must hold and every segment pair must match.

## Starter

```python
```

## Checks

```python
expect("single wildcard *", lambda: get("topic_matches")("ridge.*.fault", "ridge.power.fault"), True)
expect("multi wildcard # matches zero segments", lambda: get("topic_matches")("ridge.#", "ridge"), True)
expect("multi wildcard # matches many segments", lambda: get("topic_matches")("ridge.#", "ridge.power.temp.low"), True)
expect("* does not match two segments", lambda: get("topic_matches")("ridge.*", "ridge.power.temp"), False)
```

## Hidden checks

```python
expect("bare # matches any topic", lambda: get("topic_matches")("#", "a.b.c"), True)
expect("literal mismatch returns False", lambda: get("topic_matches")("ridge.power", "valley.power"), False)
expect("too short for # prefix returns False", lambda: get("topic_matches")("ridge.power.#", "ridge"), False)
```

## Solution

```python
def topic_matches(pattern, topic):
    p_parts = pattern.split(".")
    t_parts = topic.split(".")
    if p_parts and p_parts[-1] == "#":
        prefix = p_parts[:-1]
        if len(t_parts) < len(prefix):
            return False
        return all(p == "*" or p == t for p, t in zip(prefix, t_parts))
    if len(p_parts) != len(t_parts):
        return False
    return all(p == "*" or p == t for p, t in zip(p_parts, t_parts))
```

## Restored

Subscribers get every matching event across the outpost without drowning in unrelated topics.
