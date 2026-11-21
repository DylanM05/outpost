---
id: config-and-secrets
kind: code
title: Inject ConfigMaps and Secrets by namespace
system: Service mesh
symbol: instrument
scene: tests
skills: orchestration
---

## Briefing

Containers should never bake environment-specific URLs or credentials into their image. Kubernetes separates plain settings (**ConfigMaps**) from Base64-encoded credentials (**Secrets**), injecting both into a pod's environment strictly from the pod's **own namespace**.

## Objective

Write `build_pod_env(pod_spec, configmaps, secrets)`:

- `pod_spec` is a dict:
  - `"namespace": str`
  - `"env": list[dict]` — each item is one of:
    - `{"name": "VAR", "value": "literal"}`
    - `{"name": "VAR", "configMapKeyRef": {"name": cm_name, "key": key}}`
    - `{"name": "VAR", "secretKeyRef": {"name": sec_name, "key": key}}`
- `configmaps` is keyed by `(namespace, cm_name) -> dict[str, str]`.
- `secrets` is keyed by `(namespace, sec_name) -> dict[str, str]` where each value is **Base64-encoded UTF-8**!
- Resolve every entry in `pod_spec["env"]` (in order, later entries overriding earlier ones if the same `"name"` repeats):
  - Look up ConfigMaps and Secrets strictly under `(pod_spec["namespace"], ref_name)`.
  - Decode Secret values with `base64.b64decode(val, validate=True).decode("utf-8")`.
  - Raise `ValueError` if a referenced ConfigMap, Secret, or key is missing (or cannot be decoded as Base64/UTF-8).
- Return the resolved `dict[str, str]`.

## Concept

Notice why `configmaps` and `secrets` are keyed by `(namespace, name)`: a pod in `"staging"` asking for secret `"db-creds"` can **only** see `("staging", "db-creds")`, never `("prod", "db-creds")` — and Base64 in Kubernetes Secrets is only wire encoding, not encryption (which is why production clusters also encrypt etcd at rest!).

## Hints

1. Check `(ns, ref["name"]) in configmaps` and `ref["key"] in cm`, raising `ValueError` on any miss.
2. Wrap `base64.b64decode(encoded, validate=True).decode("utf-8")` in `try ... except Exception as exc: raise ValueError(...) from exc`.

## Starter: guided

```python
import base64


def build_pod_env(pod_spec, configmaps, secrets):
    ns = pod_spec["namespace"]
    env = {}
    for entry in pod_spec.get("env", []):
        var = entry["name"]
        if "value" in entry:
            env[var] = str(entry["value"])
        elif "configMapKeyRef" in entry:
            ref = entry["configMapKeyRef"]
            # TODO: look up (ns, ref["name"])[ref["key"]] or raise ValueError
            pass
        elif "secretKeyRef" in entry:
            ref = entry["secretKeyRef"]
            # TODO: look up (ns, ref["name"])[ref["key"]], Base64-decode UTF-8, or raise ValueError
            pass
    return env
```

## Starter: standard

```python
import base64


def build_pod_env(pod_spec, configmaps, secrets):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
import base64
cms = {("prod", "relay-cfg"): {"LOG_LEVEL": "INFO", "PORT": "8080"}}
secs = {
    ("prod", "relay-sec"): {"API_TOKEN": base64.b64encode(b"s3cr3t-prod").decode()},
    ("staging", "relay-sec"): {"API_TOKEN": base64.b64encode(b"s3cr3t-stg").decode()},
}
pod = {
    "namespace": "prod",
    "env": [
        {"name": "ENV", "value": "production"},
        {"name": "LOG_LEVEL", "configMapKeyRef": {"name": "relay-cfg", "key": "LOG_LEVEL"}},
        {"name": "API_TOKEN", "secretKeyRef": {"name": "relay-sec", "key": "API_TOKEN"}},
    ],
}
expect(
    "resolves literal, ConfigMap, and Base64 Secret in pod namespace",
    lambda: get("build_pod_env")(pod, cms, secs),
    {"ENV": "production", "LOG_LEVEL": "INFO", "API_TOKEN": "s3cr3t-prod"},
)

def blocks_cross_namespace():
    stg_pod = {"namespace": "staging", "env": [{"name": "PORT", "configMapKeyRef": {"name": "relay-cfg", "key": "PORT"}}]}
    try:
        get("build_pod_env")(stg_pod, cms, secs)
        return False
    except ValueError:
        return True
check("staging pod cannot read prod ConfigMap", blocks_cross_namespace)
```

## Hidden checks

```python
def bad_b64_secret():
    pod = {"namespace": "prod", "env": [{"name": "K", "secretKeyRef": {"name": "s", "key": "k"}}]}
    try:
        get("build_pod_env")(pod, {}, {("prod", "s"): {"k": "not!base64!"}})
        return False
    except ValueError:
        return True
check("malformed Base64 secret raises ValueError", bad_b64_secret)
```

## Solution

```python
import base64


def build_pod_env(pod_spec, configmaps, secrets):
    ns = pod_spec["namespace"]
    env = {}
    for entry in pod_spec.get("env", []):
        var = entry["name"]
        if "value" in entry:
            env[var] = str(entry["value"])
        elif "configMapKeyRef" in entry:
            ref = entry["configMapKeyRef"]
            cm = configmaps.get((ns, ref["name"]))
            if cm is None or ref["key"] not in cm:
                raise ValueError(f"missing ConfigMap key: {ref['name']}.{ref['key']}")
            env[var] = str(cm[ref["key"]])
        elif "secretKeyRef" in entry:
            ref = entry["secretKeyRef"]
            sec = secrets.get((ns, ref["name"]))
            if sec is None or ref["key"] not in sec:
                raise ValueError(f"missing Secret key: {ref['name']}.{ref['key']}")
            try:
                env[var] = base64.b64decode(sec[ref["key"]].encode("ascii"), validate=True).decode("utf-8")
            except Exception as exc:
                raise ValueError(f"invalid Base64 secret: {ref['name']}.{ref['key']}") from exc
        else:
            raise ValueError(f"unsupported env entry for {var}")
    return env
```

## Restored

Pods receive decoded secrets and config strictly from their own namespace, with cross-namespace lookups blocked cold.
