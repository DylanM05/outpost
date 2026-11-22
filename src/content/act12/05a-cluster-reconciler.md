---
id: cluster-reconciler
kind: code
title: Build a mini cluster controller
system: Control plane
symbol: equipment
scene: tests
skills: orchestration
---

## Briefing

Now combine your scheduler, ReplicaSet loop, and Service discovery into a working **Mini Cluster Controller** (`ClusterController`) that places pods onto nodes, tracks CPU/memory accounting, automatically reschedules pods when a node fails, and exposes live service endpoints!

## Objective

Write a class `ClusterController`:

- `__init__(self, nodes)` — `nodes` is a list of `{"name": str, "cpu": int, "mem": int}` (each node starts `"ready": True`, with `free_cpu = cpu`, `free_mem = mem`).
- `deploy(self, name, replicas, cpu, mem, labels)` — sets or updates the desired deployment spec for `name`.
- `fail_node(self, node_name)` — marks `node_name` as `ready = False`, evicts all pods running on it (freeing their CPU/mem on that node — though the node is now unready), and removes those evicted pods from the live pod list.
- `reconcile(self)` — for every deployment (in sorted deployment name order):
  - If active pods for that deployment `< desired["replicas"]`: schedule new pods one by one onto the eligible ready node with the most `free_cpu` (tie-break highest `free_mem`, then `name` ascending), deducting `cpu`/`mem` from the chosen node and recording a live pod `{"id": ..., "deployment": name, "node": node_name, "labels": dict(labels)}`. Stop creating if no node has enough capacity (leaving the shortage unscheduled until capacity returns!).
  - If active pods `> desired["replicas"]`: remove the newest pods first, returning their `cpu`/`mem` back to their host nodes!
  - Return a summary dict `{deployment_name: running_pod_count}`.
- `service_pods(self, selector)` — returns sorted list of `pod["id"]` whose `labels` match every `(k, v)` in non-empty `selector` (and whose host node is still `ready`).

## Concept

This is the core heart of Kubernetes in ~60 lines of Python: desired specs in, continuous `reconcile()` loop out, self-healing automatically whenever `fail_node()` wipes out a machine!

## Hints

1. Keep `self._nodes = {n["name"]: {"name": n["name"], "ready": True, "free_cpu": n["cpu"], "free_mem": n["mem"]} for n in nodes}`.
2. Keep `self._pods = []` (ordered by creation time, so `self._pods.pop()` or removing the latest matching pods cleanly removes newest first on scale-down!).
3. Remember to refund `node["free_cpu"] += pod["cpu"]` and `node["free_mem"] += pod["mem"]` whenever a pod is deleted during scale-down!

## Starter: guided

```python
class ClusterController:
    def __init__(self, nodes):
        self._nodes = {
            n["name"]: {"name": n["name"], "ready": True, "free_cpu": n["cpu"], "free_mem": n["mem"]}
            for n in nodes
        }
        self._deployments = {}
        self._pods = []
        self._seq = 0

    def deploy(self, name, replicas, cpu, mem, labels):
        self._deployments[name] = {
            "replicas": replicas,
            "cpu": cpu,
            "mem": mem,
            "labels": dict(labels),
        }

    def fail_node(self, node_name):
        # TODO: mark node ready=False and drop pods hosted on it
        pass

    def reconcile(self):
        # TODO: for each deployment in sorted order, scale up onto best ready node or scale down newest first
        pass

    def service_pods(self, selector):
        # TODO: return sorted pod IDs matching non-empty selector on ready nodes
        pass
```

## Starter: standard

```python
class ClusterController:
    def __init__(self, nodes):
        pass

    def deploy(self, name, replicas, cpu, mem, labels):
        pass

    def fail_node(self, node_name):
        pass

    def reconcile(self):
        pass

    def service_pods(self, selector):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
CC = get("ClusterController")
def test_self_healing_cluster():
    c = CC([
        {"name": "n1", "cpu": 1000, "mem": 2048},
        {"name": "n2", "cpu": 1000, "mem": 2048},
        {"name": "n3", "cpu": 1000, "mem": 2048},
    ])
    c.deploy("relay", replicas=3, cpu=500, mem=512, labels={"app": "relay"})
    s1 = c.reconcile()
    ep1 = len(c.service_pods({"app": "relay"}))
    # Fail n1 -> evicts pods on n1, then reconcile reschedules them on n2 & n3!
    c.fail_node("n1")
    ep_during = len(c.service_pods({"app": "relay"}))
    s2 = c.reconcile()
    ep2 = len(c.service_pods({"app": "relay"}))
    # Scale down to 1 -> frees capacity cleanly
    c.deploy("relay", replicas=1, cpu=500, mem=512, labels={"app": "relay"})
    s3 = c.reconcile()
    return (s1, ep1, ep_during < 3, s2, ep2, s3)

expect("schedules across nodes, self-heals after node failure, and scales down cleanly", test_self_healing_cluster, ({"relay": 3}, 3, True, {"relay": 3}, 3, {"relay": 1}))
```

## Hidden checks

```python
CC = get("ClusterController")
def test_insufficient_capacity():
    c = CC([{"name": "tiny", "cpu": 600, "mem": 512}])
    c.deploy("big", replicas=4, cpu=400, mem=256, labels={"app": "big"})
    return c.reconcile()

expect("schedules only as many pods as cluster capacity allows", test_insufficient_capacity, {"big": 1})
```

## Solution

```python
class ClusterController:
    def __init__(self, nodes):
        self._nodes = {
            n["name"]: {"name": n["name"], "ready": True, "free_cpu": n["cpu"], "free_mem": n["mem"]}
            for n in nodes
        }
        self._deployments = {}
        self._pods = []
        self._seq = 0

    def deploy(self, name, replicas, cpu, mem, labels):
        self._deployments[name] = {
            "replicas": replicas,
            "cpu": cpu,
            "mem": mem,
            "labels": dict(labels),
        }

    def fail_node(self, node_name):
        if node_name in self._nodes:
            self._nodes[node_name]["ready"] = False
        kept = []
        for pod in self._pods:
            if pod["node"] == node_name:
                self._nodes[node_name]["free_cpu"] += pod["cpu"]
                self._nodes[node_name]["free_mem"] += pod["mem"]
            else:
                kept.append(pod)
        self._pods = kept

    def _pick_node(self, cpu, mem):
        eligible = [
            n for n in self._nodes.values()
            if n["ready"] and n["free_cpu"] >= cpu and n["free_mem"] >= mem
        ]
        if not eligible:
            return None
        return min(eligible, key=lambda n: (-n["free_cpu"], -n["free_mem"], n["name"]))

    def reconcile(self):
        summary = {}
        for name in sorted(self._deployments):
            spec = self._deployments[name]
            mine = [p for p in self._pods if p["deployment"] == name]
            desired = spec["replicas"]
            if len(mine) < desired:
                for _ in range(desired - len(mine)):
                    node = self._pick_node(spec["cpu"], spec["mem"])
                    if node is None:
                        break
                    node["free_cpu"] -= spec["cpu"]
                    node["free_mem"] -= spec["mem"]
                    self._seq += 1
                    pod = {
                        "id": f"{name}-{self._seq}",
                        "deployment": name,
                        "node": node["name"],
                        "cpu": spec["cpu"],
                        "mem": spec["mem"],
                        "labels": dict(spec["labels"]),
                    }
                    self._pods.append(pod)
                    mine.append(pod)
            elif len(mine) > desired:
                to_drop = set(p["id"] for p in mine[desired:])
                kept = []
                for pod in self._pods:
                    if pod["id"] in to_drop:
                        host = self._nodes[pod["node"]]
                        host["free_cpu"] += pod["cpu"]
                        host["free_mem"] += pod["mem"]
                    else:
                        kept.append(pod)
                self._pods = kept
                mine = mine[:desired]
            summary[name] = len(mine)
        return summary

    def service_pods(self, selector):
        if not selector:
            return []
        return sorted(
            p["id"]
            for p in self._pods
            if self._nodes[p["node"]]["ready"]
            and all(p["labels"].get(k) == v for k, v in selector.items())
        )
```

## Restored

When node `n1` drops off the grid, the control plane notices immediately and reschedules its workload onto surviving nodes.
