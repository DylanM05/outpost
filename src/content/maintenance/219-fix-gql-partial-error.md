---
id: maintenance-fix-gql-partial-error
title: Fix a GraphQL field runner that aborts siblings on a single error
system: Graph rail
symbol: controller
scene: tests
skills: graphql-batching
reviewSkill: graphql-batching
prerequisite: dataloader-batcher
---

## Briefing

A GraphQL resolver loop lets a single failing field raise an uncaught exception and wipe out every healthy sibling field instead of returning partial `data` alongside `errors`!

## Objective

Fix `resolve_fields(field_names, resolvers)` so it catches any `Exception` per field, sets `data[name] = None`, appends `f"{name}: {err}"` to `errors`, and keeps resolving all remaining fields, returning `{"data": data, "errors": errors}`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Wrap `resolvers[name]()` in a `try / except Exception as err:` inside the `for name in field_names:` loop!

## Starter

```python
def resolve_fields(field_names, resolvers):
    data = {}
    errors = []
    for name in field_names:
        data[name] = resolvers[name]()
    return {"data": data, "errors": errors}
```

## Checks

```python
def _partial():
    def fail():
        raise RuntimeError("timeout")
    return get("resolve_fields")(["status", "metrics", "version"], {
        "status": lambda: "up",
        "metrics": fail,
        "version": lambda: 2,
    })
expect("returns healthy sibling fields alongside captured error", _partial, {
    "data": {"status": "up", "metrics": None, "version": 2},
    "errors": ["metrics: timeout"],
})
```

## Hidden checks

```python
expect("succeeds with empty errors list when all resolvers pass", lambda: get("resolve_fields")(["a"], {"a": lambda: 1}), {"data": {"a": 1}, "errors": []})
```

## Solution

```python
def resolve_fields(field_names, resolvers):
    data = {}
    errors = []
    for name in field_names:
        try:
            data[name] = resolvers[name]()
        except Exception as err:
            data[name] = None
            errors.append(f"{name}: {err}")
    return {"data": data, "errors": errors}
```

## Restored

GraphQL field resolution now degrades gracefully with partial data and structured errors.
