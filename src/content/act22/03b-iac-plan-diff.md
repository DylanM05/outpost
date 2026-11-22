---
id: iac-plan-diff
title: Generate Terraform-style create, update, replace, and destroy plans
system: Plan bench
symbol: instrument
scene: tests
skills: infra-as-code
---

## Briefing

Before touching live infrastructure, `terraform plan` compares your **desired** config against **current state** and classifies every resource: `create`, `no-op`, `update` (in-place mutable tweak like tags), `replace` (destroy + recreate when an immutable field like `cidr` or `region` changes!), or `destroy`.

## Concept

Write `compute_plan(current_state, desired_config, immutable_fields)`:
- `current_state` and `desired_config` map `resource_id -> {"type": str, "attrs": dict}`.
- `immutable_fields` maps `resource_type -> set/list of immutable attr names`.
- For every `resource_id` in `sorted(current_state | desired_config)`:
  - Only in `desired_config` -> `{"id": rid, "action": "create", "changed": sorted(desired["attrs"].keys())}`
  - Only in `current_state` -> `{"id": rid, "action": "destroy", "changed": []}`
  - In both:
    - Find `changed = sorted(k for k in (cur_attrs.keys() | des_attrs.keys()) if cur_attrs.get(k) != des_attrs.get(k))`.
    - If `cur["type"] != des["type"]` or any key in `changed` is in `immutable_fields.get(des["type"], ())`:
      -> `action = "replace"`!
    - Else if `changed`:
      -> `action = "update"`!
    - Else:
      -> `action = "no-op"`!
- Return the list of plan entry dicts sorted by `resource_id`.

## Objective

Implement `compute_plan(current_state, desired_config, immutable_fields)` returning the sorted list of plan actions.

## Hints

1. Use `cur_attrs.get(k, _MISSING) != des_attrs.get(k, _MISSING)` with a sentinel object `_MISSING = object()` so a key changing from missing to `None` (or vice versa) is accurately detected as changed!

## Starter: guided

```python
_MISSING = object()


def compute_plan(current_state, desired_config, immutable_fields):
    plan = []
    for rid in sorted(set(current_state) | set(desired_config)):
        # Classify create, destroy, replace, update, or no-op.
        pass
    return plan
```

## Starter: standard

```python
def compute_plan(current_state, desired_config, immutable_fields):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _plan():
    cur = {
        "net": {"type": "vpc", "attrs": {"cidr": "10.0.0.0/16", "tag": "v1"}},
        "sub": {"type": "subnet", "attrs": {"cidr": "10.0.1.0/24"}},
        "old": {"type": "vm", "attrs": {"size": "small"}},
    }
    des = {
        "net": {"type": "vpc", "attrs": {"cidr": "10.0.0.0/16", "tag": "v2"}},  # mutable update
        "sub": {"type": "subnet", "attrs": {"cidr": "10.0.2.0/24"}},           # immutable replace!
        "web": {"type": "vm", "attrs": {"size": "medium"}},                    # create
    }
    immut = {"vpc": {"cidr"}, "subnet": {"cidr"}, "vm": {"region"}}
    return get("compute_plan")(cur, des, immut)
expect("classifies create, update, replace, and destroy accurately", _plan, [
    {"id": "net", "action": "update", "changed": ["tag"]},
    {"id": "old", "action": "destroy", "changed": []},
    {"id": "sub", "action": "replace", "changed": ["cidr"]},
    {"id": "web", "action": "create", "changed": ["size"]},
])
```

## Hidden checks

```python
def _noop_and_type_change():
    cur = {
        "a": {"type": "vm", "attrs": {"size": "s"}},
        "b": {"type": "vm", "attrs": {"size": "s"}},
    }
    des = {
        "a": {"type": "vm", "attrs": {"size": "s"}},
        "b": {"type": "container", "attrs": {"size": "s"}},
    }
    return get("compute_plan")(cur, des, {})
expect("detects no-op and forces replace when resource type changes", _noop_and_type_change, [
    {"id": "a", "action": "no-op", "changed": []},
    {"id": "b", "action": "replace", "changed": []},
])
```

## Solution

```python
_MISSING = object()


def compute_plan(current_state, desired_config, immutable_fields):
    plan = []
    for rid in sorted(set(current_state) | set(desired_config)):
        in_cur = rid in current_state
        in_des = rid in desired_config
        if not in_cur and in_des:
            plan.append({"id": rid, "action": "create", "changed": sorted(desired_config[rid]["attrs"].keys())})
        elif in_cur and not in_des:
            plan.append({"id": rid, "action": "destroy", "changed": []})
        else:
            cur = current_state[rid]
            des = desired_config[rid]
            ca, da = cur["attrs"], des["attrs"]
            changed = sorted(k for k in (set(ca) | set(da)) if ca.get(k, _MISSING) != da.get(k, _MISSING))
            immut = set(immutable_fields.get(des["type"], ()))
            if cur["type"] != des["type"] or any(k in immut for k in changed):
                action = "replace"
            elif changed:
                action = "update"
            else:
                action = "no-op"
            plan.append({"id": rid, "action": action, "changed": changed})
    return plan
```

## Restored

The plan bench now previews exact create, in-place update, destructive replace, and destroy diffs before apply.
