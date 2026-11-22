---
id: survive-the-partition
kind: code
title: Survive a node failure and rolling upgrade
system: Cluster audit
symbol: controller
scene: tests
skills: orchestration, distributed-systems
assessment: true
---

## Briefing

Time to bring the entire cluster online under real failure conditions. Build `ResilientCluster`, unifying pod scheduling, node cordoning/failure recovery, zero-downtime rolling upgrades, namespace-isolated service discovery, consistent-hash request routing, and leader-fenced state writes.

This is the final independent mission for **The cluster**.

## Objective

Implement a class `ResilientCluster`:

- `__init__(self, lease_ttl=10)` — initializes empty node pool, deployments, pods, leader lease manager (`ttl=lease_ttl`), and fenced cluster state (`{key: value}`).
- `add_node(self, name, cpu, mem, labels=None)` — registers a healthy schedulable node (`ready=True`, `cordoned=False`, `free_cpu=cpu`, `free_mem=mem`).
- `cordon_node(self, name)` — marks a node unschedulable (`cordoned=True`) **without** evicting pods already running on it (just like `kubectl cordon` before maintenance!).
- `fail_node(self, name)` — marks a node `ready=False` and immediately evicts every pod on it.
- `elect_leader(self, candidate, now)` — grants/renews a leader lease with monotonic fencing token (`1, 2, 3, ...`), returning the token or `None` if another candidate holds an active unexpired lease (`now < expires_at`).
- `write_state(self, holder, token, key, value, now)` — writes `state[key] = value` **only if** `holder` currently holds the valid unexpired lease with matching `token` at time `now` (and `token >= highest_seen_token`); otherwise raises `PermissionError`!
- `read_state(self, key)` — returns `state.get(key)`.
- `set_deployment(self, namespace, name, image, replicas, cpu, mem, labels)` — sets/updates desired spec for `(namespace, name)`.
- `reconcile_step(self, namespace, name, max_surge=1, max_unavailable=0)` — executes **one** safe rolling-update / healing step for `(namespace, name)`:
  - Pods matching the current `image` are `new_pods`; pods on older images are `old_pods`.
  - Respect `max_surge` and `max_unavailable` (`old_ready = len(old_pods)`, `new_ready = len(new_pods)`):
    - First compute how many `old_pods` can safely terminate (`terminate_old = min(old_ready, max(0, old_ready + new_ready - max(0, desired - max_unavailable)))`), terminating newest old pods first and refunding their node CPU/mem.
    - Next, if `new_ready > desired`, scale down excess new pods (newest first, refunding node resources).
    - Else create up to `max(0, min(desired - new_ready, (desired + max_surge) - (old_ready - terminate_old + new_ready)))` new pods on eligible nodes (`ready and not cordoned` with sufficient `free_cpu` and `free_mem`, picking highest `free_cpu`, then `free_mem`, then `name` ascending).
  - Return `{"old": remaining_old_count, "new": remaining_new_count}`.
- `route_request(self, namespace, selector, request_key)` — selects all live pods in `namespace` matching non-empty `selector` (whose host node is `ready`), puts their `pod["id"]` on a SHA-256 consistent hash ring (`replicas=32`), and returns the selected `pod["id"]` for `request_key` (or `None` if no matching pod is live).

## Concept

This independent finale unites every core system in Act XII:
- Scheduling + cordoning vs failure (`Desired state`)
- Zero-downtime rolling upgrades (`Rollout bay`)
- Namespace-scoped label selectors + consistent hashing (`Service mesh`)
- Leader leases & fencing tokens preventing split-brain writes (`Quorum vault`)

## Hints

1. Notice `cordon_node` keeps existing pods serving (`node["ready"]` stays `True`), while `_pick_node` requires `n["ready"] and not n["cordoned"]`.
2. Reuse the exact `next_rollout_step` formula inside `reconcile_step`, and refund `cpu`/`mem` whenever pods are terminated or evicted.
3. In `write_state`, check that the lease is unexpired (`now < expires_at`), `holder == leader`, and `token == active_token`; otherwise `raise PermissionError("stale or invalid leader lease")`.

## Starter: guided

```python
```

## Starter: standard

```python
```

## Starter: challenge

```python
```

## Checks

```python
RC = get("ResilientCluster")

def test_rolling_upgrade_and_cordon():
    cl = RC(lease_ttl=10)
    cl.add_node("n1", cpu=2000, mem=4096)
    cl.add_node("n2", cpu=2000, mem=4096)
    cl.set_deployment("prod", "relay", "relay:v1", replicas=3, cpu=500, mem=512, labels={"app": "relay"})
    # Converge v1
    for _ in range(4):
        cl.reconcile_step("prod", "relay", max_surge=1, max_unavailable=0)
    # Cordon n1: existing pods stay serving, new v2 pods must land on n2!
    cl.cordon_node("n1")
    cl.set_deployment("prod", "relay", "relay:v2", replicas=3, cpu=500, mem=512, labels={"app": "relay"})
    min_serving = 99
    for _ in range(8):
        st = cl.reconcile_step("prod", "relay", max_surge=1, max_unavailable=0)
        min_serving = min(min_serving, st["old"] + st["new"])
    routed = cl.route_request("prod", {"app": "relay"}, "station-42")
    wrong_ns = cl.route_request("staging", {"app": "relay"}, "station-42")
    return (st, min_serving >= 3, isinstance(routed, str), wrong_ns)

expect("zero-downtime rolling upgrade respects cordon and namespace isolation", test_rolling_upgrade_and_cordon, ({"old": 0, "new": 3}, True, True, None))

def test_leader_fencing():
    cl = RC(lease_ttl=10)
    t1 = cl.elect_leader("ctrl-a", now=0)
    cl.write_state("ctrl-a", t1, "mode", "normal", now=5)
    t2 = cl.elect_leader("ctrl-b", now=12)   # ctrl-a expired at 10
    stale_blocked = False
    try:
        cl.write_state("ctrl-a", t1, "mode", "corrupted", now=13)
    except PermissionError:
        stale_blocked = True
    cl.write_state("ctrl-b", t2, "mode", "winter", now=14)
    return (t1, t2, stale_blocked, cl.read_state("mode"))

expect("fencing tokens block stale leader writes after partition/expiry", test_leader_fencing, (1, 2, True, "winter"))
```

## Hidden checks

```python
RC = get("ResilientCluster")

def test_node_failure_recovery_and_consistent_routing():
    cl = RC(lease_ttl=5)
    cl.add_node("a", cpu=1000, mem=2048)
    cl.add_node("b", cpu=1000, mem=2048)
    cl.add_node("c", cpu=1000, mem=2048)
    cl.set_deployment("prod", "api", "api:1", replicas=3, cpu=400, mem=512, labels={"svc": "api"})
    for _ in range(4):
        cl.reconcile_step("prod", "api", max_surge=1, max_unavailable=0)
    cl.fail_node("a")
    for _ in range(4):
        st = cl.reconcile_step("prod", "api", max_surge=1, max_unavailable=0)
    r1 = cl.route_request("prod", {"svc": "api"}, "user-99")
    r2 = cl.route_request("prod", {"svc": "api"}, "user-99")
    return (st, r1 == r2 and r1 is not None)

expect("heals pods after node failure and routes deterministically", test_node_failure_recovery_and_consistent_routing, ({"old": 0, "new": 3}, True))
```

## Solution

```python
import bisect
import hashlib


def _h(text):
    return int.from_bytes(hashlib.sha256(text.encode("utf-8")).digest()[:8], "big")


class ResilientCluster:
    def __init__(self, lease_ttl=10):
        if lease_ttl <= 0:
            raise ValueError("lease_ttl must be positive")
        self._ttl = lease_ttl
        self._nodes = {}
        self._deployments = {}
        self._pods = []
        self._seq = 0
        self._leader = None
        self._token = 0
        self._expires_at = 0
        self._state = {}

    def add_node(self, name, cpu, mem, labels=None):
        self._nodes[name] = {
            "name": name,
            "ready": True,
            "cordoned": False,
            "free_cpu": cpu,
            "free_mem": mem,
            "labels": dict(labels or {}),
        }

    def cordon_node(self, name):
        if name in self._nodes:
            self._nodes[name]["cordoned"] = True

    def fail_node(self, name):
        if name in self._nodes:
            self._nodes[name]["ready"] = False
        kept = []
        for pod in self._pods:
            if pod["node"] == name:
                self._nodes[name]["free_cpu"] += pod["cpu"]
                self._nodes[name]["free_mem"] += pod["mem"]
            else:
                kept.append(pod)
        self._pods = kept

    def elect_leader(self, candidate, now):
        if self._leader is not None and now < self._expires_at:
            if candidate == self._leader:
                self._expires_at = now + self._ttl
                return self._token
            return None
        self._token += 1
        self._leader = candidate
        self._expires_at = now + self._ttl
        return self._token

    def write_state(self, holder, token, key, value, now):
        if self._leader != holder or self._token != token or now >= self._expires_at:
            raise PermissionError("stale or expired leader lease")
        self._state[key] = value

    def read_state(self, key):
        return self._state.get(key)

    def set_deployment(self, namespace, name, image, replicas, cpu, mem, labels):
        self._deployments[(namespace, name)] = {
            "namespace": namespace,
            "name": name,
            "image": image,
            "replicas": replicas,
            "cpu": cpu,
            "mem": mem,
            "labels": dict(labels),
        }

    def _pick_node(self, cpu, mem):
        eligible = [
            n for n in self._nodes.values()
            if n["ready"] and not n["cordoned"] and n["free_cpu"] >= cpu and n["free_mem"] >= mem
        ]
        if not eligible:
            return None
        return min(eligible, key=lambda n: (-n["free_cpu"], -n["free_mem"], n["name"]))

    def _drop_pods(self, ids_to_drop):
        drop_set = set(ids_to_drop)
        kept = []
        for pod in self._pods:
            if pod["id"] in drop_set:
                node = self._nodes[pod["node"]]
                node["free_cpu"] += pod["cpu"]
                node["free_mem"] += pod["mem"]
            else:
                kept.append(pod)
        self._pods = kept

    def reconcile_step(self, namespace, name, max_surge=1, max_unavailable=0):
        spec = self._deployments[(namespace, name)]
        desired = spec["replicas"]
        mine = [p for p in self._pods if p["namespace"] == namespace and p["deployment"] == name]
        old_pods = [p for p in mine if p["image"] != spec["image"]]
        new_pods = [p for p in mine if p["image"] == spec["image"]]

        old_ready = len(old_pods)
        new_ready = len(new_pods)
        min_avail = max(0, desired - max_unavailable)
        terminate_old = min(old_ready, max(0, (old_ready + new_ready) - min_avail))
        if terminate_old > 0:
            self._drop_pods([p["id"] for p in old_pods[-terminate_old:]])
            old_pods = old_pods[:-terminate_old]
            old_ready = len(old_pods)

        if new_ready > desired:
            excess = new_ready - desired
            self._drop_pods([p["id"] for p in new_pods[-excess:]])
            new_pods = new_pods[:-excess]
            new_ready = len(new_pods)
        else:
            remaining = old_ready + new_ready
            create_new = max(0, min(desired - new_ready, (desired + max_surge) - remaining))
            for _ in range(create_new):
                node = self._pick_node(spec["cpu"], spec["mem"])
                if node is None:
                    break
                node["free_cpu"] -= spec["cpu"]
                node["free_mem"] -= spec["mem"]
                self._seq += 1
                pod = {
                    "id": f"{namespace}-{name}-{self._seq}",
                    "namespace": namespace,
                    "deployment": name,
                    "image": spec["image"],
                    "node": node["name"],
                    "cpu": spec["cpu"],
                    "mem": spec["mem"],
                    "labels": dict(spec["labels"]),
                }
                self._pods.append(pod)
                new_pods.append(pod)
                new_ready += 1

        return {"old": old_ready, "new": new_ready}

    def route_request(self, namespace, selector, request_key):
        if not selector:
            return None
        live = [
            p["id"]
            for p in self._pods
            if p["namespace"] == namespace
            and self._nodes[p["node"]]["ready"]
            and all(p["labels"].get(k) == v for k, v in selector.items())
        ]
        if not live:
            return None
        ring = {}
        for pod_id in live:
            for i in range(32):
                ring[_h(f"{pod_id}#{i}")] = pod_id
        keys = sorted(ring)
        idx = bisect.bisect_left(keys, _h(str(request_key)))
        if idx == len(keys):
            idx = 0
        return ring[keys[idx]]
```

## Restored

The cluster rides through node cordons, rolling upgrades, sudden hardware failures, and split-brain partitions without losing a single request or writing stale state.
