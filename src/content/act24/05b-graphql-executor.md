---
id: graphql-executor
title: Execute GraphQL selections with depth limits and partial errors
system: Graph rail
symbol: controller
scene: tests
skills: graphql-batching
---

## Briefing

Unlike REST where a single failure kills the entire HTTP response, GraphQL executes field-by-field: it projects ONLY the requested fields, enforces a **maximum query depth** to block recursive DoS attacks, and captures individual field resolver failures into `"errors"` while still returning the rest of `"data"`!

## Concept

Write `execute_gql(selection_ast, root_resolvers, max_depth=5)`:
- `selection_ast` is a list of field AST dicts `{"name": str, "args": dict, "fields": list | None}`.
- First check the maximum nesting depth of `selection_ast` (top-level fields have depth `1`, their children have depth `2`, etc.):
  - If `depth > max_depth`: return `{"data": None, "errors": ["query depth exceeded"]}` WITHOUT calling any resolvers!
- Otherwise recursively resolve the selection set:
  - At the root level, each field `name` calls `root_resolvers[name](args)` (if missing, record error `f"unknown field: {name}"` and set `data[name] = None`).
  - At nested levels (when resolving against a parent object `obj`):
    - If `obj` is a `list`: map the child selection over every item in `obj`!
    - If `obj` is `None`: return `None`.
    - If `obj` is a `dict`: look up `obj[field_name]` (if callable, invoke `val(args)`!). If missing, record error `f"unknown field: {field_name}"` and set `None`.
  - If ANY resolver call raises an `Exception as err`: record `str(err)` in `"errors"` and set that field's value to `None` while continuing to resolve sibling fields!
- Return `{"data": data_dict, "errors": errors_list}`.

## Objective

Implement `execute_gql(selection_ast, root_resolvers, max_depth=5)`.

## Hints

1. Write a clean helper `_ast_depth(fields)`: `return 1 + max((_ast_depth(f["fields"]) if f["fields"] else 0) for f in fields)` (for non-empty `fields`).
2. Keep a shared `errors = []` list passed through your recursive `_resolve(fields, source, is_root)` helper!

## Starter: guided

```python
def _ast_depth(fields):
    if not fields:
        return 0
    return 1 + max((_ast_depth(f["fields"]) if f["fields"] else 0) for f in fields)


def execute_gql(selection_ast, root_resolvers, max_depth=5):
    if _ast_depth(selection_ast) > max_depth:
        return {"data": None, "errors": ["query depth exceeded"]}
    errors = []
    # Recursively resolve root and nested fields, projecting only requested keys and capturing resolver errors.
    pass
```

## Starter: standard

```python
def execute_gql(selection_ast, root_resolvers, max_depth=5):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _exec_and_partial():
    ast = [
        {
            "name": "user",
            "args": {"id": 1},
            "fields": [
                {"name": "name", "args": {}, "fields": None},
                {"name": "posts", "args": {}, "fields": [{"name": "title", "args": {}, "fields": None}]},
            ],
        },
        {"name": "alerts", "args": {}, "fields": None},
    ]
    def boom(args):
        raise RuntimeError("alerts service offline")
    resolvers = {
        "user": lambda args: {
            "id": args["id"],
            "name": "Ada",
            "secret": "hidden",
            "posts": [{"title": "Hello", "body": "long"}, {"title": "World", "body": "text"}],
        },
        "alerts": boom,
    }
    return get("execute_gql")(ast, resolvers, max_depth=4)
expect("projects requested fields and captures partial resolver errors without aborting siblings", _exec_and_partial, {
    "data": {
        "user": {"name": "Ada", "posts": [{"title": "Hello"}, {"title": "World"}]},
        "alerts": None,
    },
    "errors": ["alerts service offline"],
})
```

## Hidden checks

```python
def _depth_blocked():
    called = []
    deep_ast = [{"name": "a", "args": {}, "fields": [{"name": "b", "args": {}, "fields": [{"name": "c", "args": {}, "fields": None}]}]}]
    res = get("execute_gql")(deep_ast, {"a": lambda _: called.append(1)}, max_depth=2)
    return (res, len(called))
expect("blocks queries deeper than max_depth before running resolvers", _depth_blocked, ({"data": None, "errors": ["query depth exceeded"]}, 0))
```

## Solution

```python
def _ast_depth(fields):
    if not fields:
        return 0
    return 1 + max((_ast_depth(f["fields"]) if f["fields"] else 0) for f in fields)


def execute_gql(selection_ast, root_resolvers, max_depth=5):
    if _ast_depth(selection_ast) > max_depth:
        return {"data": None, "errors": ["query depth exceeded"]}
    errors = []

    def resolve_selection(fields, source, is_root):
        if not is_root:
            if source is None:
                return None
            if isinstance(source, list):
                return [resolve_selection(fields, item, False) for item in source]
        out = {}
        for f in fields:
            name = f["name"]
            args = f.get("args", {})
            sub = f.get("fields")
            try:
                if is_root:
                    if name not in root_resolvers:
                        errors.append(f"unknown field: {name}")
                        out[name] = None
                        continue
                    val = root_resolvers[name](args)
                else:
                    if not isinstance(source, dict) or name not in source:
                        errors.append(f"unknown field: {name}")
                        out[name] = None
                        continue
                    raw = source[name]
                    val = raw(args) if callable(raw) else raw
            except Exception as err:
                errors.append(str(err))
                out[name] = None
                continue
            out[name] = resolve_selection(sub, val, False) if sub else val
        return out

    data = resolve_selection(selection_ast, root_resolvers, True)
    return {"data": data, "errors": errors}
```

## Restored

The graph rail now executes GraphQL selections safely with strict depth guards and graceful partial errors.
