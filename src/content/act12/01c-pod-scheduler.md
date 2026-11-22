---
id: pod-scheduler
kind: code
title: Schedule pods onto cluster nodes
system: Desired state
symbol: controller
scene: tests
skills: orchestration
---

## Briefing

When a ReplicaSet asks for a new pod, the **scheduler** decides *which* physical node runs it — filtering out unready nodes, checking CPU/memory capacity, matching `node_selector` labels (like `zone=north`), respecting node **taints** unless the pod has matching **tolerations**, and spreading load across the least-loaded eligible node!

## Objective

Write `schedule_pod(nodes, pod)`:

- Each node in `nodes` is a dict:
  - `"name": str`
  - `"ready": bool`
  - `"free_cpu": int` (millicores), `"free_mem": int` (MiB)
  - `"labels": dict[str, str]`
  - `"taints": list[str]` (e.g. `["gpu-only"]`, optional/default `[]`)
- `pod` is a dict:
  - `"cpu": int`, `"mem": int`
  - `"node_selector": dict[str, str]` (optional/default `{}`)
  - `"tolerations": list[str]` (optional/default `[]`)
- A node is **eligible** iff ALL hold:
  1. `node["ready"]` is `True`
  2. `node["free_cpu"] >= pod["cpu"]` and `node["free_mem"] >= pod["mem"]`
  3. Every `(k, v)` in `pod.get("node_selector", {})` matches `node["labels"].get(k) == v`
  4. Every taint in `node.get("taints", [])` is present in `pod.get("tolerations", [])`
- Among eligible nodes, pick the one with the **most** `free_cpu` (tie-break by highest `free_mem`, then `name` ascending) and return its `"name"`. Return `None` if no node fits.

## Concept

Kubernetes's real `kube-scheduler` runs this exact two-phase pipeline on every Pending pod:
1. **Filtering (Predicates):** eliminate any node that cannot legally run the pod (not ready, out of CPU/RAM, wrong zone/arch label, untolerated taint).
2. **Scoring (Priorities):** rank surviving nodes so load spreads evenly instead of piling everything onto `node-1`.

## Hints

1. Check `tolerations = set(pod.get("tolerations", []))` and `all(t in tolerations for t in node.get("taints", []))`.
2. Pick the best eligible node with `min(eligible, key=lambda n: (-n["free_cpu"], -n["free_mem"], n["name"]))`.

## Starter: guided

```python
def schedule_pod(nodes, pod):
    selector = pod.get("node_selector", {})
    tolerations = set(pod.get("tolerations", []))
    eligible = []
    for node in nodes:
        if not node.get("ready"):
            continue
        if node["free_cpu"] < pod["cpu"] or node["free_mem"] < pod["mem"]:
            continue
        # TODO: check node_selector labels and node taints against tolerations
        eligible.append(node)
    if not eligible:
        return None
    # TODO: pick highest free_cpu, then free_mem, then lowest name
    return eligible[0]["name"]
```

## Starter: standard

```python
def schedule_pod(nodes, pod):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
nodes = [
    {"name": "n1", "ready": False, "free_cpu": 4000, "free_mem": 8192, "labels": {"zone": "ridge"}, "taints": []},
    {"name": "n2", "ready": True, "free_cpu": 2000, "free_mem": 4096, "labels": {"zone": "ridge"}, "taints": ["dedicated-db"]},
    {"name": "n3", "ready": True, "free_cpu": 1000, "free_mem": 2048, "labels": {"zone": "ridge"}, "taints": []},
    {"name": "n4", "ready": True, "free_cpu": 1500, "free_mem": 2048, "labels": {"zone": "ridge"}, "taints": []},
    {"name": "n5", "ready": True, "free_cpu": 4000, "free_mem": 8192, "labels": {"zone": "valley"}, "taints": []},
]
pod = {"cpu": 500, "mem": 1024, "node_selector": {"zone": "ridge"}, "tolerations": []}
expect("skips NotReady, tainted, and wrong-zone nodes; picks highest free_cpu", lambda: get("schedule_pod")(nodes, pod), "n4")

db_pod = {"cpu": 500, "mem": 1024, "node_selector": {"zone": "ridge"}, "tolerations": ["dedicated-db"]}
expect("pod with matching toleration can schedule on tainted node", lambda: get("schedule_pod")(nodes, db_pod), "n2")
```

## Hidden checks

```python
nodes = [
    {"name": "b", "ready": True, "free_cpu": 1000, "free_mem": 2048, "labels": {}, "taints": []},
    {"name": "a", "ready": True, "free_cpu": 1000, "free_mem": 2048, "labels": {}, "taints": []},
]
expect("tie-breaks equal resources by node name ascending", lambda: get("schedule_pod")(nodes, {"cpu": 500, "mem": 512}), "a")
expect("returns None when no node has enough memory", lambda: get("schedule_pod")(nodes, {"cpu": 100, "mem": 4096}), None)
```

## Solution

```python
def schedule_pod(nodes, pod):
    selector = pod.get("node_selector", {})
    tolerations = set(pod.get("tolerations", []))
    eligible = []
    for node in nodes:
        if not node.get("ready"):
            continue
        if node["free_cpu"] < pod["cpu"] or node["free_mem"] < pod["mem"]:
            continue
        labels = node.get("labels", {})
        if any(labels.get(k) != v for k, v in selector.items()):
            continue
        if any(t not in tolerations for t in node.get("taints", [])):
            continue
        eligible.append(node)
    if not eligible:
        return None
    best = min(eligible, key=lambda n: (-n["free_cpu"], -n["free_mem"], n["name"]))
    return best["name"]
```

## Restored

Pods now land on healthy, matching, least-loaded nodes while tainted hardware stays strictly protected.
