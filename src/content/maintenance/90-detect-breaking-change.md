---
id: maintenance-detect-breaking-change
title: Detect breaking API schema changes
system: Drafting table
symbol: controller
scene: tests
skills: architecture
reviewSkill: architecture
prerequisite: backpressure-and-dlq
---

## Briefing

Adding a new optional field to a JSON response is backward-compatible; removing an existing field or changing its type breaks older clients. Write an automated schema compatibility checker.

## Objective

Write `breaking_changes(old_schema, new_schema)` where each schema is a dict mapping `field_name -> type_name` (e.g. `{"id": "str", "count": "int"}`):

- If a field in `old_schema` is missing from `new_schema`, record `f"removed:{field}"`.
- If a field exists in both but `new_schema[field] != old_schema[field]`, record `f"type_changed:{field}"`.
- Fields newly added in `new_schema` are compatible and must **not** be reported.
- Return the breaking change strings sorted alphabetically.

```python
breaking_changes(
    {"id": "str", "count": "int", "legacy": "bool"},
    {"id": "str", "count": "str", "notes": "str"},
)
# ["removed:legacy", "type_changed:count"]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Iterate over `old_schema.items()` (never over keys only in `new_schema`).
2. Check `if field not in new_schema` vs `elif new_schema[field] != old_type`, then return `sorted(issues)`.

## Starter

```python
```

## Checks

```python
expect(
    "detects removals and type changes, ignores additive fields",
    lambda: get("breaking_changes")(
        {"id": "str", "count": "int", "legacy": "bool"},
        {"id": "str", "count": "str", "notes": "str"},
    ),
    ["removed:legacy", "type_changed:count"],
)
expect(
    "purely additive evolution returns []",
    lambda: get("breaking_changes")({"id": "str"}, {"id": "str", "version": "int"}),
    [],
)
```

## Hidden checks

```python
expect("identical schemas return []", lambda: get("breaking_changes")({"a": "int"}, {"a": "int"}), [])
expect("empty old schema never breaks", lambda: get("breaking_changes")({}, {"a": "int"}), [])
```

## Solution

```python
def breaking_changes(old_schema, new_schema):
    issues = []
    for field, old_type in old_schema.items():
        if field not in new_schema:
            issues.append(f"removed:{field}")
        elif new_schema[field] != old_type:
            issues.append(f"type_changed:{field}")
    return sorted(issues)
```

## Restored

CI now flags removed fields and type drift before a breaking response ever ships to valley stations.
