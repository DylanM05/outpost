---
id: maintenance-fix-iam-deny
title: Fix an IAM checker that short-circuits on Allow before checking Deny
system: Policy desk
symbol: instrument
scene: tests
skills: cloud-iam-vpc
reviewSkill: cloud-iam-vpc
prerequisite: subnet-carver
---

## Briefing

A security audit caught a critical bug: `is_allowed(statements, action)` returns `True` on the first matching `"Allow"` statement without checking if a later statement explicitly `"Deny"`s the action!

## Objective

Fix `is_allowed(statements, action)` where each statement is `(effect, pattern)` so an explicit `"Deny"` ALWAYS overrides any `"Allow"`, regardless of order.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Track `allowed = False`, return `False` immediately on a matching `"Deny"`, and only return `allowed` after scanning ALL statements!

## Starter

```python
from fnmatch import fnmatchcase


def is_allowed(statements, action):
    for effect, pattern in statements:
        if fnmatchcase(action, pattern):
            if effect == "Allow":
                return True
            if effect == "Deny":
                return False
    return False
```

## Checks

```python
expect("explicit Deny after Allow still denies", lambda: get("is_allowed")([("Allow", "s3:*"), ("Deny", "s3:Delete*")], "s3:DeleteBucket"), False)
expect("non-denied action stays allowed", lambda: get("is_allowed")([("Allow", "s3:*"), ("Deny", "s3:Delete*")], "s3:GetObject"), True)
```

## Hidden checks

```python
expect("unmatched action defaults to False", lambda: get("is_allowed")([("Allow", "s3:*")], "iam:CreateUser"), False)
```

## Solution

```python
from fnmatch import fnmatchcase


def is_allowed(statements, action):
    allowed = False
    for effect, pattern in statements:
        if fnmatchcase(action, pattern):
            if effect == "Deny":
                return False
            if effect == "Allow":
                allowed = True
    return allowed
```

## Restored

The IAM checker now scans every statement so explicit Denies always override Allows.
