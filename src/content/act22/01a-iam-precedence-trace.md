---
id: iam-precedence-trace
kind: predict
title: Trace AWS-style IAM policy evaluation precedence
system: Policy desk
symbol: instrument
scene: console
skills: cloud-iam-vpc, reading-code
---

## Briefing

Cloud IAM systems obey one ironclad rule: **default Deny**, overridden by **Allow**, which is ALWAYS overridden by **explicit Deny** — no matter where in the policy list the Deny statement appears!

## Objective

Trace the IAM policy evaluator below and predict **every line it prints**.

## Concept

When evaluating an action against a list of `(effect, action_pattern)` statements:
1. Scan **every** matching statement — never short-circuit on the first `"Allow"`!
2. If any matching statement has `"Deny"` -> `"EXPLICIT_DENY"`.
3. Else if at least one matching statement has `"Allow"` -> `"ALLOW"`.
4. Else -> `"IMPLICIT_DENY"`.

## Hints

1. `"s3:GetObject"` matches `("Allow", "s3:*")` and nothing denies it -> `"ALLOW"`.
2. `"s3:DeleteObject"` matches BOTH `("Allow", "s3:*")` and `("Deny", "s3:Delete*")` -> `"EXPLICIT_DENY"`.
3. `"ec2:RunInstances"` matches neither statement -> `"IMPLICIT_DENY"`.

## Program

```python
from fnmatch import fnmatchcase

statements = [
    ("Allow", "s3:*"),
    ("Deny", "s3:Delete*"),
    ("Allow", "logs:Put*"),
]

def evaluate(action):
    allowed = False
    for effect, pattern in statements:
        if fnmatchcase(action, pattern):
            if effect == "Deny":
                return "EXPLICIT_DENY"
            if effect == "Allow":
                allowed = True
    return "ALLOW" if allowed else "IMPLICIT_DENY"

for act in ["s3:GetObject", "s3:DeleteObject", "ec2:RunInstances", "logs:PutLogEvents"]:
    print(f"{act} -> {evaluate(act)}")
```

## Output

```text
s3:GetObject -> ALLOW
s3:DeleteObject -> EXPLICIT_DENY
ec2:RunInstances -> IMPLICIT_DENY
logs:PutLogEvents -> ALLOW
```

## Restored

You traced how explicit Deny statements override wildcard Allows regardless of statement order.
