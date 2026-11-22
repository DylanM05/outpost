---
id: maintenance-schema-diff
title: Detect breaking ETL schema changes
system: Schema gate
symbol: controller
scene: tests
skills: data-pipelines
reviewSkill: data-pipelines
prerequisite: join-asof
---

## Briefing

Adding a new optional column to a telemetry table is backward-compatible, whereas removing an existing column or changing its type breaks downstream jobs! Catch breaking changes automatically before deployment.

## Objective

Write `breaking_changes(old_schema, new_schema)` where both are dicts mapping column name (`str`) to type name (`str`).

Return a **sorted** list of column names that either:
- Existed in `old_schema` and were **removed** in `new_schema`, OR
- Still exist in `new_schema` with a **different type** than in `old_schema`.

Columns newly added in `new_schema` are NOT breaking and must NOT be included.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check every `col, old_type` in `old_schema.items()`: it is breaking iff `col not in new_schema or new_schema[col] != old_type`.
2. Return `sorted(...)`.

## Starter

```python
```

## Checks

```python
expect(
    "flags removed and retyped columns while allowing new columns",
    lambda: get("breaking_changes")(
        {"ts": "int", "temp": "float", "legacy": "str"},
        {"ts": "int", "temp": "str", "humidity": "float"},
    ),
    ["legacy", "temp"],
)
expect("additive-only evolution has no breaking changes", lambda: get("breaking_changes")({"id": "int"}, {"id": "int", "extra": "str"}), [])
```

## Hidden checks

```python
expect("identical schemas return empty list", lambda: get("breaking_changes")({"a": "int"}, {"a": "int"}), [])
```

## Solution

```python
def breaking_changes(old_schema, new_schema):
    return sorted(
        col
        for col, old_type in old_schema.items()
        if col not in new_schema or new_schema[col] != old_type
    )
```

## Restored

Schema registry checks catch removed or retyped columns while letting additive fields ship smoothly.
