---
id: missing-crates
title: Find the missing crates
system: Depot
symbol: equipment
scene: tests
skills: sets
---

## Briefing

The supply office has a list of everything it sent, and the depot has a list of everything that arrived. They don't match. Somewhere between the landing pad and the shelves, things went missing, and a few things turned up that nobody ordered.

## Objective

Write two functions. Each takes two lists of item names, `sent` and `received`, and returns a **set**:

- `missing(sent, received)` returns the items that were sent but never received.
- `unexpected(sent, received)` returns the items that were received but never sent.

```python
missing(["fuel", "seed", "rope"], ["seed", "tools"])     # {"fuel", "rope"}
unexpected(["fuel", "seed", "rope"], ["seed", "tools"])  # {"tools"}
```

## Concept

A **set** is a collection with no order and no duplicates. Make one from a list with `set()`:

```python
crates = set(["fuel", "seed", "fuel"])  # {"fuel", "seed"}
crates.add("rope")
"fuel" in crates  # True, and fast even for very large sets
```

An empty set is written `set()`, because `{}` on its own is an empty dictionary.

Sets can be combined with operators:

| Expression | Result |
|---|---|
| `a - b` | items in `a` but not in `b` |
| `a & b` | items in both |
| `a \| b` | items in either |

## Hints

1. Turn each list into a set: `set(sent)`.
2. `missing` is `set(sent) - set(received)`.
3. `unexpected` is the same subtraction, the other way round.

## Starter: guided

```python
def missing(sent, received):
    # Items that were sent but not received.
    return set(sent) - set(received)


def unexpected(sent, received):
    # Items that were received but not sent.
    return set()


print(missing(["fuel", "seed", "rope"], ["seed", "tools"]))
print(unexpected(["fuel", "seed", "rope"], ["seed", "tools"]))
```

## Starter: standard

```python
def missing(sent, received):
    return set()


def unexpected(sent, received):
    return set()
```

## Starter: challenge

```python
```

## Checks

```python
sent = ["fuel", "seed", "rope"]
received = ["seed", "tools"]
expect('missing(["fuel", "seed", "rope"], ["seed", "tools"])', lambda: get("missing")(sent, received), {"fuel", "rope"})
expect('unexpected(["fuel", "seed", "rope"], ["seed", "tools"])', lambda: get("unexpected")(sent, received), {"tools"})
```

## Hidden checks

```python
expect('missing(["water", "seed", "water"], ["seed"])', lambda: get("missing")(["water", "seed", "water"], ["seed"]), {"water"})
expect('unexpected([], ["rope", "rope"])', lambda: get("unexpected")([], ["rope", "rope"]), {"rope"})
expect('missing(["fuel"], ["fuel"])', lambda: get("missing")(["fuel"], ["fuel"]), set())
expect('unexpected(["fuel"], [])', lambda: get("unexpected")(["fuel"], []), set())
```

## Solution

```python
def missing(sent, received):
    return set(sent) - set(received)


def unexpected(sent, received):
    return set(received) - set(sent)
```

## Restored

The fuel and rope never arrived, and a toolbox nobody ordered did. The supply office now has a short list to chase instead of a mystery.
