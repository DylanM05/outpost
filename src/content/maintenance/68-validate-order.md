---
id: maintenance-validate-order
title: Validate a JSON order payload
system: Route switchboard
symbol: controller
scene: tests
skills: api-design
reviewSkill: api-design
prerequisite: validate-the-body
---

## Briefing

Supply order requests arrive as parsed JSON dictionaries. Validate them strictly at the API boundary before touching the database.

## Objective

Write `validate_order(payload)` returning `(200, cleaned)` on success or `(400, {"errors": errors})` on failure:

- `payload` must be a `dict` (otherwise return `(400, {"errors": ["payload must be an object"]})`).
- `sku`: required non-empty string after `.strip()`.
- `qty`: required integer `> 0` (**reject booleans** — remember `isinstance(True, int)` is `True` in Python!).
- `priority`: optional, defaults to `"normal"`, must be one of `"low"`, `"normal"`, `"high"`.
- On success, `cleaned` is `{"sku": sku.strip(), "qty": qty, "priority": priority}`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Check `isinstance(qty, int) and not isinstance(qty, bool) and qty > 0`.
2. Collect every validation error into a list `errors`; if `errors` is non-empty return `(400, {"errors": errors})`.

## Starter

```python
```

## Checks

```python
expect(
    "valid order applies default priority",
    lambda: get("validate_order")({"sku": " BAT-12 ", "qty": 3}),
    (200, {"sku": "BAT-12", "qty": 3, "priority": "normal"}),
)
check(
    "boolean qty is rejected with 400",
    lambda: get("validate_order")({"sku": "BAT-12", "qty": True})[0] == 400,
)
check(
    "unknown priority is rejected with 400",
    lambda: get("validate_order")({"sku": "BAT-12", "qty": 2, "priority": "urgent"})[0] == 400,
)
```

## Hidden checks

```python
check("non-dict payload returns 400", lambda: get("validate_order")(["not", "a", "dict"])[0] == 400)
check("blank sku returns 400", lambda: get("validate_order")({"sku": "   ", "qty": 1})[0] == 400)
check("zero qty returns 400", lambda: get("validate_order")({"sku": "BAT-12", "qty": 0})[0] == 400)
```

## Solution

```python
VALID_PRIORITIES = {"low", "normal", "high"}


def validate_order(payload):
    if not isinstance(payload, dict):
        return 400, {"errors": ["payload must be an object"]}
    errors = []
    sku = payload.get("sku")
    if not isinstance(sku, str) or not sku.strip():
        errors.append("sku must be a non-empty string")
    qty = payload.get("qty")
    if isinstance(qty, bool) or not isinstance(qty, int) or qty <= 0:
        errors.append("qty must be a positive integer")
    priority = payload.get("priority", "normal")
    if priority not in VALID_PRIORITIES:
        errors.append("priority must be low, normal, or high")
    if errors:
        return 400, {"errors": errors}
    return 200, {"sku": sku.strip(), "qty": qty, "priority": priority}
```

## Restored

Bad payloads bounce at the API door with `400` instead of sneaking booleans or blank SKUs into the database.
