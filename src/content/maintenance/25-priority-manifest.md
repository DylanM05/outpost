---
id: maintenance-priority-manifest
title: Sort the cargo manifest
system: Sample sorter
symbol: equipment
scene: tests
skills: sorting
reviewSkill: sorting
prerequisite: loading-order
---

## Briefing

Cargo manifests list crates as `(priority, weight, label)` tuples. Dispatch wants highest priority first, then lightest weight first on ties, then alphabetical label.

## Objective

Write `sort_manifest(crates)`. Return a **new** list of `(priority, weight, label)` tuples sorted by:
1. `priority` descending (largest number first),
2. `weight` ascending (lightest first),
3. `label` ascending (alphabetical).

Leave the input list unchanged.

```python
sort_manifest([(1, 10, "b"), (3, 8, "c"), (3, 4, "a")])
# [(3, 4, "a"), (3, 8, "c"), (1, 10, "b")]
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `sorted(crates, key=...)` so the original list stays untouched.
2. Negate `priority` in the key tuple to sort it descending while keeping `weight` and `label` ascending.

## Starter

```python
```

## Checks

```python
sample = [(1, 10, "b"), (3, 8, "c"), (3, 4, "a")]
expect("sort_manifest example", lambda: get("sort_manifest")(sample), [(3, 4, "a"), (3, 8, "c"), (1, 10, "b")])
expect("does not mutate input", lambda: sample, [(1, 10, "b"), (3, 8, "c"), (3, 4, "a")])
```

## Hidden checks

```python
expect("breaks priority and weight ties by label", lambda: get("sort_manifest")([(2, 5, "z"), (2, 5, "a"), (2, 5, "m")]), [(2, 5, "a"), (2, 5, "m"), (2, 5, "z")])
expect("empty list", lambda: get("sort_manifest")([]), [])
```

## Solution

```python
def sort_manifest(crates):
    return sorted(crates, key=lambda c: (-c[0], c[1], c[2]))
```

## Restored

The loading dock stacks high-priority, lightweight crates right at the ramp door.
