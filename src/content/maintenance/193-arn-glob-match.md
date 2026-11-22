---
id: maintenance-arn-glob-match
title: Match cloud resource ARNs against wildcard patterns
system: Policy desk
symbol: instrument
scene: tests
skills: cloud-iam-vpc
reviewSkill: cloud-iam-vpc
prerequisite: subnet-carver
---

## Briefing

IAM policies restrict access by matching candidate resource ARNs against wildcard patterns like `"arn:outpost:s3:::prod-*"` while staying case-sensitive.

## Objective

Write `match_arns(arns, pattern)` returning a list of all ARNs in `arns` (preserving input order) that match `pattern` using case-sensitive glob matching (`*` and `?`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `fnmatch.fnmatchcase(arn, pattern)` (never `fnmatch.fnmatch`, which can be case-insensitive on some OSes).

## Starter

```python
```

## Checks

```python
_ARNS = ["arn:outpost:s3:::prod-logs", "arn:outpost:s3:::PROD-logs", "arn:outpost:s3:::dev-logs"]
expect("matches case-sensitive glob patterns", lambda: get("match_arns")(_ARNS, "arn:outpost:s3:::prod-*"), ["arn:outpost:s3:::prod-logs"])
```

## Hidden checks

```python
expect("supports ? single-char wildcard", lambda: get("match_arns")(["r-1", "r-2", "r-10"], "r-?"), ["r-1", "r-2"])
```

## Solution

```python
from fnmatch import fnmatchcase


def match_arns(arns, pattern):
    return [a for a in arns if fnmatchcase(a, pattern)]
```

## Restored

ARN wildcard filtering now matches resource patterns with strict case sensitivity.
