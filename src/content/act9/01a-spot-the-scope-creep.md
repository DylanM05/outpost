---
id: spot-the-scope-creep
title: Spot the scope creep
system: Drafting table
symbol: instrument
scene: tests
skills: architecture, shortest-paths
---

## Briefing

Kestrel Ridge is up, the exchange is running, and the valley wants you to design and build a brand-new settlement service from scratch. Before writing a line of code, every senior engineer learns the hardest skill of all: **scoping**. Every requested feature has a day cost, a value, a `"required"` flag, and dependencies on other features. Pull in every required feature (and anything it transitively depends on), then pick the highest-value optional features that still fit your schedule — and call out an impossible deadline early instead of promising the moon.

## Objective

Write `plan_mvp(features, budget_days)`.

- `features` is a list of dicts: `{"id": str, "days": int, "value": int, "required": bool, "needs": [str, ...]}`.
- Rules:
  1. Start with every feature where `required == True`, plus **all** of their transitive dependencies (`needs`). Raise `ValueError` if any dependency ID doesn't exist.
  2. If the total `days` of this required set exceeds `budget_days`, raise `ValueError("required scope exceeds budget")`.
  3. Among remaining optional features whose dependencies are **already** in the selected set (or satisfied iteratively), pick optional features to fit `remaining_days`: greedily evaluate candidates in descending order of `(value / days, value, -days)` (breaking remaining ties by `id` ascending) — repeating until no more unselected feature has all its dependencies met and fits within `remaining_days`.
  4. Return `{"selected": sorted(selected_ids), "total_days": total_days, "total_value": total_value}`.

```python
plan_mvp([
    {"id": "db", "days": 2, "value": 5, "required": False, "needs": []},
    {"id": "auth", "days": 2, "value": 10, "required": True, "needs": ["db"]},
    {"id": "alerts", "days": 1, "value": 8, "required": False, "needs": ["auth"]},
    {"id": "themes", "days": 3, "value": 2, "required": False, "needs": []},
], budget_days=5)
# {"selected": ["alerts", "auth", "db"], "total_days": 5, "total_value": 23}
```

## Concept

Scoping is an architecture decision, not a wish list:

- **Transitive dependencies are hidden cost:** marking `"auth"` required silently pulls `"db"` into your mandatory scope!
- **Saying "impossible" early is a win:** if required work already exceeds the deadline, surfacing that before day one lets stakeholders cut scope or extend the deadline rather than shipping half-built software.

## Hints

1. Index features in `by_id = {f["id"]: f for f in features}` and validate every `dep in by_id`.
2. Use a stack/queue starting from all `required` feature IDs to expand all transitive `needs` into `selected`.
3. Check `total_days > budget_days` -> raise `ValueError`.
4. Loop while any unselected feature has `all(d in selected for d in f["needs"])` and `f["days"] <= remaining`: pick the best by `(-f["value"] / f["days"], -f["value"], f["days"], f["id"])`, add it to `selected`, and subtract its `days` from `remaining`.

## Starter: guided

```python
def plan_mvp(features, budget_days):
    by_id = {f["id"]: f for f in features}
    for f in features:
        for dep in f.get("needs", []):
            if dep not in by_id:
                raise ValueError(f"unknown dependency: {dep}")

    selected = set()
    stack = [f["id"] for f in features if f.get("required")]
    while stack:
        fid = stack.pop()
        if fid in selected:
            continue
        selected.add(fid)
        for dep in by_id[fid].get("needs", []):
            stack.append(dep)

    # Check if required set exceeds budget_days, then add best fitting optional features.
    return {"selected": sorted(selected), "total_days": 0, "total_value": 0}
```

## Starter: standard

```python
def plan_mvp(features, budget_days):
    return {"selected": [], "total_days": 0, "total_value": 0}
```

## Starter: challenge

```python
```

## Checks

```python
feats = [
    {"id": "db", "days": 2, "value": 5, "required": False, "needs": []},
    {"id": "auth", "days": 2, "value": 10, "required": True, "needs": ["db"]},
    {"id": "alerts", "days": 1, "value": 8, "required": False, "needs": ["auth"]},
    {"id": "themes", "days": 3, "value": 2, "required": False, "needs": []},
]
expect(
    "pulls in transitive dependency db for required auth, then adds alerts within 5 days",
    lambda: get("plan_mvp")(feats, 5),
    {"selected": ["alerts", "auth", "db"], "total_days": 5, "total_value": 23},
)

def _raises(fn):
    try:
        fn()
        return False
    except ValueError:
        return True

check(
    "raises ValueError when required scope (including transitive needs) exceeds budget",
    lambda: _raises(lambda: get("plan_mvp")(feats, 3)),
)
```

## Hidden checks

```python
chained = [
    {"id": "a", "days": 1, "value": 5, "required": False, "needs": []},
    {"id": "b", "days": 1, "value": 20, "required": False, "needs": ["a"]},
    {"id": "c", "days": 2, "value": 6, "required": False, "needs": []},
]
expect(
    "unlocking 'a' enables high-value 'b' on next pass",
    lambda: get("plan_mvp")(chained, 2),
    {"selected": ["a", "b"], "total_days": 2, "total_value": 25},
)
check("unknown dependency raises ValueError", lambda: _raises(lambda: get("plan_mvp")([{"id": "x", "days": 1, "value": 1, "required": True, "needs": ["missing"]}], 5)))
expect("empty features returns empty plan", lambda: get("plan_mvp")([], 10), {"selected": [], "total_days": 0, "total_value": 0})
```

## Solution

```python
def plan_mvp(features, budget_days):
    by_id = {f["id"]: f for f in features}
    for f in features:
        for dep in f.get("needs", []):
            if dep not in by_id:
                raise ValueError(f"unknown dependency: {dep}")

    selected = set()
    stack = [f["id"] for f in features if f.get("required")]
    while stack:
        fid = stack.pop()
        if fid in selected:
            continue
        selected.add(fid)
        for dep in by_id[fid].get("needs", []):
            stack.append(dep)

    total_days = sum(by_id[fid]["days"] for fid in selected)
    if total_days > budget_days:
        raise ValueError("required scope exceeds budget")

    while True:
        remaining = budget_days - total_days
        candidates = [
            f
            for fid, f in by_id.items()
            if fid not in selected
            and f["days"] <= remaining
            and all(dep in selected for dep in f.get("needs", []))
        ]
        if not candidates:
            break
        best = min(
            candidates,
            key=lambda f: (-f["value"] / f["days"], -f["value"], f["days"], f["id"]),
        )
        selected.add(best["id"])
        total_days += best["days"]

    total_value = sum(by_id[fid]["value"] for fid in selected)
    return {
        "selected": sorted(selected),
        "total_days": total_days,
        "total_value": total_value,
    }
```

## Restored

The drafting table surfaces hidden transitive dependencies and impossible deadlines before a single line is written.
