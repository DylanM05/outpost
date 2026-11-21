---
id: layer-cache
kind: predict
title: Layer cache
system: Container bay
symbol: equipment
scene: console
skills: containers, reading-code
---

## Briefing

Containers package your code, Python runtime, and dependencies into a single reproducible **image** built from a `Dockerfile`. Each instruction (`FROM`, `COPY`, `RUN`) creates a cached **layer**. When a file copied by layer `k` changes, Docker reuses layers `0..k-1` and must **rebuild every layer from `k` onward**. Trace how reordering two lines changes how many layers rebuild when only `app.py` changes.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

Look at these two Dockerfiles:

- **Slow order:** `COPY . .` then `RUN pip install -r requirements.txt` -> editing one line of `app.py` invalidates `COPY . .`, forcing `pip install` to re-download and reinstall every package on every single build!
- **Fast order:** `COPY requirements.txt .` -> `RUN pip install -r requirements.txt` -> `COPY . .` -> editing `app.py` only rebuilds the final `COPY . .` layer; the expensive `pip install` layer stays cached!

## Hints

1. `simulate_rebuild(steps, changed_files)` walks the steps in order.
2. As soon as a `COPY` step touches a file in `changed_files`, `invalidated` becomes `True` and every remaining step has to rebuild!
3. Compare how many steps rebuild when `"app.py"` changes in `slow_dockerfile` vs `fast_dockerfile`.

## Program

```python
def rebuild_count(steps, changed):
    invalidated = False
    rebuilt = 0
    for kind, files in steps:
        if kind == "COPY" and any(f in changed for f in files):
            invalidated = True
        if invalidated:
            rebuilt += 1
    return rebuilt


slow_dockerfile = [
    ("FROM", []),
    ("COPY", ["requirements.txt", "app.py"]),
    ("RUN", []),  # pip install
    ("RUN", []),  # compile assets
]

fast_dockerfile = [
    ("FROM", []),
    ("COPY", ["requirements.txt"]),
    ("RUN", []),  # pip install
    ("COPY", ["app.py"]),
    ("RUN", []),  # compile assets
]

print(rebuild_count(slow_dockerfile, {"app.py"}))
print(rebuild_count(fast_dockerfile, {"app.py"}))
print(rebuild_count(fast_dockerfile, {"requirements.txt"}))
```

## Output

```text
3
2
4
```

## Restored

You traced why copying dependency files before application source keeps image builds fast whenever code changes.
