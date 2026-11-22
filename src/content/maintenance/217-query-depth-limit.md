---
id: maintenance-query-depth-limit
title: Measure GraphQL selection nesting depth to block deep queries
system: Graph rail
symbol: controller
scene: tests
skills: graphql-batching
reviewSkill: graphql-batching
prerequisite: dataloader-batcher
---

## Briefing

Without a depth cap, a malicious GraphQL client can request `{ user { friends { friends { friends ... } } } }` and bring down your database in one request!

## Objective

Write `selection_depth(tree)` where `tree` is a nested dict mapping field names to either `None` (leaf scalar) or a child selection dict. Return `0` for an empty dict `{}`, `1` for flat scalar selections like `{"id": None, "name": None}`, and `1 + max(child_depths)` for nested selections.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Recursively return `1 + max(selection_depth(v) if isinstance(v, dict) else 0 for v in tree.values())` when `tree` is non-empty.

## Starter

```python
```

## Checks

```python
expect("flat selection has depth 1", lambda: get("selection_depth")({"id": None, "name": None}), 1)
expect("measures deepest nested branch", lambda: get("selection_depth")({"id": None, "user": {"name": None, "posts": {"title": None}}}), 3)
```

## Hidden checks

```python
expect("empty dict has depth 0", lambda: get("selection_depth")({}), 0)
```

## Solution

```python
def selection_depth(tree):
    if not tree:
        return 0
    return 1 + max((selection_depth(v) if isinstance(v, dict) else 0) for v in tree.values())
```

## Restored

GraphQL query depth guards now measure nested selection trees accurately.
