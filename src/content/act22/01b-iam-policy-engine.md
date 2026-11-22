---
id: iam-policy-engine
title: Evaluate wildcard IAM policies with conditions
system: Policy desk
symbol: instrument
scene: tests
skills: cloud-iam-vpc
---

## Briefing

Real cloud IAM policies check three dimensions at once: **action** patterns (`"s3:Get*"`), **resource** ARN patterns (`"arn:outpost:s3:::prod/*"`), and optional **conditions** (such as requiring `{"mfa": True}` or `{"env": "prod"}`).

## Concept

Write `evaluate_iam(policies, action, resource, context=None)` where:
- `policies` is a list of policy dicts, each containing `"statements": [...]`.
- Each statement dict has:
  - `"effect"`: `"Allow"` or `"Deny"`
  - `"actions"`: list of glob strings (matched with `fnmatch.fnmatchcase`)
  - `"resources"`: list of glob strings (matched with `fnmatch.fnmatchcase`)
  - optional `"conditions"`: dict of `{key: expected_value}` — matches iff `context.get(key) == expected_value` for EVERY key in `"conditions"`!
- Precedence across ALL policies and ALL statements:
  1. Any matching `"Deny"` -> return `"DENY"`.
  2. Else any matching `"Allow"` -> return `"ALLOW"`.
  3. Else -> return `"DENY"` (implicit deny).

## Objective

Implement `evaluate_iam(policies, action, resource, context=None)` returning `"ALLOW"` or `"DENY"`.

## Hints

1. A statement matches iff `any(fnmatchcase(action, p) for p in stmt["actions"])` AND `any(fnmatchcase(resource, r) for r in stmt["resources"])` AND `all(ctx.get(k) == v for k, v in stmt.get("conditions", {}).items())`.
2. Never return `"ALLOW"` early inside the loop — a later policy might have a matching `"Deny"`!

## Starter: guided

```python
from fnmatch import fnmatchcase


def evaluate_iam(policies, action, resource, context=None):
    ctx = context or {}
    allowed = False
    for policy in policies:
        for stmt in policy.get("statements", ()):
            # Check action match, resource match, and all condition matches.
            # Return "DENY" immediately on matching Deny; track allowed = True on matching Allow.
            pass
    return "ALLOW" if allowed else "DENY"
```

## Starter: standard

```python
from fnmatch import fnmatchcase


def evaluate_iam(policies, action, resource, context=None):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
_POLICIES = [
    {"statements": [
        {"effect": "Allow", "actions": ["s3:Get*", "s3:Put*"], "resources": ["arn:outpost:s3:::data/*"]},
    ]},
    {"statements": [
        {"effect": "Deny", "actions": ["s3:Put*"], "resources": ["arn:outpost:s3:::data/prod/*"], "conditions": {"mfa": False}},
    ]},
]
expect("allows matching read on prod", lambda: get("evaluate_iam")(_POLICIES, "s3:GetObject", "arn:outpost:s3:::data/prod/a.csv", {"mfa": False}), "ALLOW")
expect("explicit deny blocks prod write without MFA", lambda: get("evaluate_iam")(_POLICIES, "s3:PutObject", "arn:outpost:s3:::data/prod/a.csv", {"mfa": False}), "DENY")
expect("allows prod write when MFA is True (deny condition not met)", lambda: get("evaluate_iam")(_POLICIES, "s3:PutObject", "arn:outpost:s3:::data/prod/a.csv", {"mfa": True}), "ALLOW")
expect("implicit deny on unmatched resource", lambda: get("evaluate_iam")(_POLICIES, "s3:GetObject", "arn:outpost:s3:::secrets/k.pem", {"mfa": True}), "DENY")
```

## Hidden checks

```python
def _conditional_allow():
    pols = [{"statements": [
        {"effect": "Allow", "actions": ["db:*"], "resources": ["*"], "conditions": {"env": "staging", "mfa": True}},
    ]}]
    return (
        get("evaluate_iam")(pols, "db:Query", "arn:db:1", {"env": "staging", "mfa": True}),
        get("evaluate_iam")(pols, "db:Query", "arn:db:1", {"env": "prod", "mfa": True}),
        get("evaluate_iam")(pols, "db:Query", "arn:db:1", None),
    )
expect("requires all Allow conditions to match", _conditional_allow, ("ALLOW", "DENY", "DENY"))
```

## Solution

```python
from fnmatch import fnmatchcase


def evaluate_iam(policies, action, resource, context=None):
    ctx = context or {}
    allowed = False
    for policy in policies:
        for stmt in policy.get("statements", ()):
            if not any(fnmatchcase(action, pat) for pat in stmt.get("actions", ())):
                continue
            if not any(fnmatchcase(resource, pat) for pat in stmt.get("resources", ())):
                continue
            conds = stmt.get("conditions", {})
            if not all(ctx.get(k) == v for k, v in conds.items()):
                continue
            if stmt.get("effect") == "Deny":
                return "DENY"
            if stmt.get("effect") == "Allow":
                allowed = True
    return "ALLOW" if allowed else "DENY"
```

## Restored

The policy desk now enforces wildcard, multi-policy, condition-aware IAM authorization with explicit-deny dominance.
