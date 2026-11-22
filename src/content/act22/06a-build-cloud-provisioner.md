---
id: build-cloud-provisioner
title: Build an end-to-end IAM-gated IaC cloud provisioner
system: Foundry audit
symbol: controller
scene: tests
assessment: true
skills: cloud-iam-vpc, infra-as-code, cloud-runtime
---

## Briefing

Unite the entire cloud foundry into `CloudFoundry(iam_policies, immutable_fields)`: IAM-authorized apply calls, TTL-locked state commits, topological dependency-wave planning (create/update/replace/destroy), live drift detection, and autoscaled service capacity!

## Concept

Implement `CloudFoundry(iam_policies, immutable_fields)`:
- `iam_policies`: list of IAM policy dicts (`{"statements": [{"effect": "Allow"|"Deny", "actions": [...], "resources": [...]}]}`).
- `immutable_fields`: dict mapping `resource_type -> set/list of immutable attr names`.
- State starts empty (`self.state = {}`, `self.live = {}`, `self.version = 0`) with an internal TTL lock (`acquire_lock(owner, now, ttl)` / `release_lock(token)`).
- **`authorize(action, resource)`:** Evaluates `iam_policies` with explicit-Deny-wins precedence, returning `True` for `"ALLOW"` else `False`.
- **`plan(desired_config)`:**
  - `desired_config` maps `rid -> {"type": str, "attrs": dict, "deps": list[str]}`.
  - Verifies all `deps` exist in `desired_config` and the dependency graph is acyclic (raise `ValueError` otherwise).
  - Computes parallel apply waves (`plan_apply_waves`) for resources in `desired_config`, AND classifies each resource across `self.state | desired_config` into `"create"`, `"update"`, `"replace"`, `"destroy"`, or `"no-op"`.
  - Returns `{"actions": {rid: action}, "apply_waves": waves}`.
- **`apply(token, desired_config, now)`:**
  - Requires a valid, non-expired lock `token` (`now < expires`), else raises `PermissionError("invalid or expired lock")`.
  - Computes `plan(desired_config)`.
  - For every resource whose action is NOT `"no-op"`, verifies `authorize(f"iac:{action}", f"arn:outpost:{rtype}:{rid}")` (using existing `type` for `"destroy"`, desired `type` for `"create"`/`"update"`/`"replace"`). If ANY action is unauthorized, raises `PermissionError("IAM denied")` WITHOUT modifying `self.state` or `self.live`!
  - On success, applies `desired_config` to both `self.state` and `self.live` (storing `{"type": ..., "attrs": dict(...)}` copies) and increments `self.version`.
  - Returns `{"version": self.version, "actions": actions, "apply_waves": waves}`.
- **`detect_drift(ignore_keys=())`:** Compares `self.state` vs. `self.live` (matching attribute dicts, skipping `ignore_keys`) and returns `{"missing": [...], "unmanaged": [...], "modified": {...}, "drifted": bool}`.

## Objective

Implement `CloudFoundry` with `acquire_lock`, `release_lock`, `authorize`, `plan`, `apply`, and `detect_drift`.

## Hints

1. Validate the lock, DAG/plan, AND every IAM permission **before** mutating `self.state` or `self.live` so rejected applies are 100% atomic!
2. Deep-copy each resource's `attrs` dict when storing into `self.state` and `self.live` so external console mutations on `foundry.live[rid]["attrs"]` show up cleanly in `detect_drift()`!

## Starter: guided

```python
from fnmatch import fnmatchcase

_MISSING = object()


class CloudFoundry:
    def __init__(self, iam_policies, immutable_fields=None):
        self.iam_policies = list(iam_policies)
        self.immutable_fields = dict(immutable_fields or {})
        self.state = {}
        self.live = {}
        self.version = 0
        self._next_token = 0
        self._lock = None

    def acquire_lock(self, owner, now, ttl):
        pass

    def release_lock(self, token):
        pass

    def authorize(self, action, resource):
        pass

    def plan(self, desired_config):
        pass

    def apply(self, token, desired_config, now):
        pass

    def detect_drift(self, ignore_keys=()):
        pass
```

## Starter: standard

```python
from fnmatch import fnmatchcase


class CloudFoundry:
    def __init__(self, iam_policies, immutable_fields=None):
        pass

    def acquire_lock(self, owner, now, ttl):
        pass

    def release_lock(self, token):
        pass

    def authorize(self, action, resource):
        pass

    def plan(self, desired_config):
        pass

    def apply(self, token, desired_config, now):
        pass

    def detect_drift(self, ignore_keys=()):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _foundry_e2e():
    policies = [
        {"statements": [
            {"effect": "Allow", "actions": ["iac:*"], "resources": ["arn:outpost:*"]},
            {"effect": "Deny", "actions": ["iac:destroy"], "resources": ["arn:outpost:db:*"]},
        ]}
    ]
    cf = get("CloudFoundry")(policies, immutable_fields={"vpc": {"cidr"}})
    tok = cf.acquire_lock("ci-bot", now=100, ttl=60)
    v1 = {
        "vpc-main": {"type": "vpc", "attrs": {"cidr": "10.0.0.0/16", "tag": "a"}, "deps": []},
        "prod-db": {"type": "db", "attrs": {"tier": "lg"}, "deps": ["vpc-main"]},
    }
    r1 = cf.apply(tok, v1, now=110)

    # Simulate manual console drift on prod-db!
    cf.live["prod-db"]["attrs"]["tier"] = "xl"
    drift = cf.detect_drift()

    # Try destroying prod-db -> explicit IAM Deny blocks it atomically!
    v2_bad = {"vpc-main": {"type": "vpc", "attrs": {"cidr": "10.0.0.0/16", "tag": "b"}, "deps": []}}
    denied = False
    try:
        cf.apply(tok, v2_bad, now=120)
    except PermissionError:
        denied = True

    # Updating tag on vpc-main while keeping prod-db succeeds!
    v2_ok = {
        "vpc-main": {"type": "vpc", "attrs": {"cidr": "10.0.0.0/16", "tag": "b"}, "deps": []},
        "prod-db": {"type": "db", "attrs": {"tier": "lg"}, "deps": ["vpc-main"]},
    }
    r2 = cf.apply(tok, v2_ok, now=125)
    drift_after = cf.detect_drift()
    return (
        r1["apply_waves"],
        r1["actions"],
        drift["modified"],
        denied,
        r2["version"],
        r2["actions"],
        drift_after["drifted"],
    )
expect("runs locked IAM-authorized IaC apply waves, blocks denied destroys, and reconciles drift", _foundry_e2e, (
    [["vpc-main"], ["prod-db"]],
    {"prod-db": "create", "vpc-main": "create"},
    {"prod-db": {"tier": ("lg", "xl")}},
    True,
    2,
    {"prod-db": "no-op", "vpc-main": "update"},
    False,
))
```

## Hidden checks

```python
def _lock_and_cycle():
    pols = [{"statements": [{"effect": "Allow", "actions": ["iac:*"], "resources": ["*"]}]}]
    cf = get("CloudFoundry")(pols)
    tok = cf.acquire_lock("u1", now=0, ttl=10)
    expired_err = False
    try:
        cf.apply(tok, {}, now=10)
    except PermissionError:
        expired_err = True
    tok2 = cf.acquire_lock("u2", now=10, ttl=20)
    cycle_err = False
    try:
        cf.apply(tok2, {
            "a": {"type": "vm", "attrs": {}, "deps": ["b"]},
            "b": {"type": "vm", "attrs": {}, "deps": ["a"]},
        }, now=15)
    except ValueError:
        cycle_err = True
    return (expired_err, cycle_err, cf.release_lock(tok2))
expect("enforces lock expiry and rejects cyclic resource graphs", _lock_and_cycle, (True, True, True))
```

## Solution

```python
from fnmatch import fnmatchcase

_MISSING = object()


class CloudFoundry:
    def __init__(self, iam_policies, immutable_fields=None):
        self.iam_policies = list(iam_policies)
        self.immutable_fields = {k: set(v) for k, v in (immutable_fields or {}).items()}
        self.state = {}
        self.live = {}
        self.version = 0
        self._next_token = 0
        self._lock = None

    def acquire_lock(self, owner, now, ttl):
        if ttl <= 0:
            raise ValueError("ttl must be positive")
        if self._lock is not None and now < self._lock["expires"]:
            return None
        self._next_token += 1
        self._lock = {"owner": owner, "token": self._next_token, "expires": now + ttl}
        return self._next_token

    def release_lock(self, token):
        if self._lock is not None and self._lock["token"] == token:
            self._lock = None
            return True
        return False

    def authorize(self, action, resource):
        allowed = False
        for policy in self.iam_policies:
            for stmt in policy.get("statements", ()):
                if not any(fnmatchcase(action, p) for p in stmt.get("actions", ())):
                    continue
                if not any(fnmatchcase(resource, r) for r in stmt.get("resources", ())):
                    continue
                if stmt.get("effect") == "Deny":
                    return False
                if stmt.get("effect") == "Allow":
                    allowed = True
        return allowed

    def _apply_waves(self, desired_config):
        for rid, cfg in desired_config.items():
            for dep in cfg.get("deps", ()):
                if dep not in desired_config:
                    raise ValueError(f"unknown dependency: {dep}")
        in_deg = {rid: len(set(cfg.get("deps", ()))) for rid, cfg in desired_config.items()}
        dependents = {rid: [] for rid in desired_config}
        for rid, cfg in desired_config.items():
            for dep in set(cfg.get("deps", ())):
                dependents[dep].append(rid)
        waves = []
        ready = sorted(r for r, d in in_deg.items() if d == 0)
        visited = 0
        while ready:
            waves.append(ready)
            visited += len(ready)
            nxt = []
            for r in ready:
                for dep in dependents[r]:
                    in_deg[dep] -= 1
                    if in_deg[dep] == 0:
                        nxt.append(dep)
            ready = sorted(nxt)
        if visited != len(desired_config):
            raise ValueError("dependency cycle detected")
        return waves

    def plan(self, desired_config):
        waves = self._apply_waves(desired_config)
        actions = {}
        for rid in sorted(set(self.state) | set(desired_config)):
            in_cur = rid in self.state
            in_des = rid in desired_config
            if not in_cur and in_des:
                actions[rid] = "create"
            elif in_cur and not in_des:
                actions[rid] = "destroy"
            else:
                cur = self.state[rid]
                des = desired_config[rid]
                ca, da = cur["attrs"], des["attrs"]
                changed = [k for k in (set(ca) | set(da)) if ca.get(k, _MISSING) != da.get(k, _MISSING)]
                immut = self.immutable_fields.get(des["type"], set())
                if cur["type"] != des["type"] or any(k in immut for k in changed):
                    actions[rid] = "replace"
                elif changed:
                    actions[rid] = "update"
                else:
                    actions[rid] = "no-op"
        return {"actions": actions, "apply_waves": waves}

    def apply(self, token, desired_config, now):
        if self._lock is None or self._lock["token"] != token or now >= self._lock["expires"]:
            raise PermissionError("invalid or expired lock")
        planned = self.plan(desired_config)
        actions = planned["actions"]
        for rid, action in actions.items():
            if action == "no-op":
                continue
            rtype = self.state[rid]["type"] if action == "destroy" else desired_config[rid]["type"]
            if not self.authorize(f"iac:{action}", f"arn:outpost:{rtype}:{rid}"):
                raise PermissionError(f"IAM denied iac:{action} on {rid}")
        new_state = {
            rid: {"type": cfg["type"], "attrs": dict(cfg["attrs"])}
            for rid, cfg in desired_config.items()
        }
        self.state = {rid: {"type": v["type"], "attrs": dict(v["attrs"])} for rid, v in new_state.items()}
        self.live = {rid: {"type": v["type"], "attrs": dict(v["attrs"])} for rid, v in new_state.items()}
        self.version += 1
        return {"version": self.version, "actions": actions, "apply_waves": planned["apply_waves"]}

    def detect_drift(self, ignore_keys=()):
        ignored = set(ignore_keys)
        missing = sorted(r for r in self.state if r not in self.live)
        unmanaged = sorted(r for r in self.live if r not in self.state)
        modified = {}
        for rid in sorted(set(self.state) & set(self.live)):
            sa = self.state[rid]["attrs"]
            la = self.live[rid]["attrs"]
            diffs = {}
            for k in sorted((set(sa) | set(la)) - ignored):
                if sa.get(k, _MISSING) != la.get(k, _MISSING):
                    diffs[k] = (sa.get(k), la.get(k))
            if diffs:
                modified[rid] = diffs
        return {
            "missing": missing,
            "unmanaged": unmanaged,
            "modified": modified,
            "drifted": bool(missing or unmanaged or modified),
        }
```

## Restored

The cloud foundry now provisions declarative infrastructure under strict IAM authorization, state locking, and continuous drift reconciliation.
