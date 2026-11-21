---
id: label-selector
kind: code
title: Service discovery by label selector
system: Service mesh
symbol: instrument
scene: tests
skills: orchestration
---

## Briefing

Pods are ephemeral — their IP addresses change every time a pod restarts. A Kubernetes **Service** gives callers a stable name and dynamically discovers live backends by matching **labels** strictly inside the same **namespace** (so staging pods can never leak into a production service!).

## Objective

Write `select_endpoints(pods, selector, namespace="default")`:

- `pods` is a list of dicts: `{"namespace": str, "ip": str, "port": int, "ready": bool, "labels": dict[str, str]}`.
- `selector` is a non-empty `dict[str, str]` (if `selector` is empty `{}`, return `[]` so an empty selector never accidentally routes to every pod in the namespace!).
- Include a pod iff:
  1. `pod["namespace"] == namespace`
  2. `pod["ready"]` is `True`
  3. Every `(k, v)` in `selector` matches `pod["labels"].get(k) == v`
- Return the matching endpoints formatted as `f"{pod['ip']}:{pod['port']}"`, sorted alphabetically.

## Concept

Notice the three guards every real service mesh enforces:
1. **Namespace isolation:** `prod` services only select `prod` pods.
2. **Readiness gating:** unready pods are excluded from endpoints until their readiness probe passes.
3. **Label subsets:** a pod with extra labels (`{"app": "api", "version": "v2"}`) still matches `{"app": "api"}`, letting both `v1` and `v2` serve behind the same Service during a rolling update!

## Hints

1. Guard `if not selector: return []`.
2. Check `pod["namespace"] == namespace and pod["ready"] and all(pod["labels"].get(k) == v for k, v in selector.items())`.

## Starter: guided

```python
def select_endpoints(pods, selector, namespace="default"):
    if not selector:
        return []
    endpoints = []
    for pod in pods:
        # TODO: check namespace, ready, and every selector key/value
        pass
    return sorted(endpoints)
```

## Starter: standard

```python
def select_endpoints(pods, selector, namespace="default"):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
pods = [
    {"namespace": "prod", "ip": "10.0.0.2", "port": 8080, "ready": True, "labels": {"app": "relay", "v": "1"}},
    {"namespace": "prod", "ip": "10.0.0.1", "port": 8080, "ready": True, "labels": {"app": "relay", "v": "2"}},
    {"namespace": "prod", "ip": "10.0.0.3", "port": 8080, "ready": False, "labels": {"app": "relay", "v": "2"}},
    {"namespace": "staging", "ip": "10.0.1.1", "port": 8080, "ready": True, "labels": {"app": "relay", "v": "2"}},
    {"namespace": "prod", "ip": "10.0.0.4", "port": 5432, "ready": True, "labels": {"app": "db"}},
]
expect(
    "selects only Ready pods matching selector in exact namespace",
    lambda: get("select_endpoints")(pods, {"app": "relay"}, namespace="prod"),
    ["10.0.0.1:8080", "10.0.0.2:8080"],
)
expect("empty selector returns []", lambda: get("select_endpoints")(pods, {}, namespace="prod"), [])
```

## Hidden checks

```python
pods = [
    {"namespace": "default", "ip": "10.0.0.9", "port": 80, "ready": True, "labels": {"app": "web", "tier": "edge"}},
]
expect("default namespace works and multi-label selector requires all keys", lambda: (get("select_endpoints")(pods, {"app": "web", "tier": "edge"}), get("select_endpoints")(pods, {"app": "web", "tier": "core"})), (["10.0.0.9:80"], []))
```

## Solution

```python
def select_endpoints(pods, selector, namespace="default"):
    if not selector:
        return []
    endpoints = [
        f"{pod['ip']}:{pod['port']}"
        for pod in pods
        if pod.get("namespace") == namespace
        and pod.get("ready")
        and all(pod.get("labels", {}).get(k) == v for k, v in selector.items())
    ]
    return sorted(endpoints)
```

## Restored

Services automatically route around unready pods and keep staging traffic strictly isolated from production.
