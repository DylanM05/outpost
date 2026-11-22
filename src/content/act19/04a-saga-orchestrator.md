---
id: saga-orchestrator
title: Roll back failed workflows with compensating sagas
system: Saga rail
symbol: controller
scene: tests
skills: event-sourcing
---

## Briefing

Across separate microservices (reserve inventory -> charge card -> dispatch drone), you don't have a single SQL `ROLLBACK`. A **Saga orchestrator** pairs every forward step with a **compensating undo action**: if step 3 fails, it runs step 2's undo and then step 1's undo in strict reverse order!

## Concept

`steps` is a list of `(name, do_fn, undo_fn)` tuples:
- Maintain `ctx = dict(initial_ctx)` and `completed = []`.
- For each `(name, do_fn, undo_fn)` in `steps`:
  - Try `do_fn(ctx)`.
  - If it succeeds, append `(name, undo_fn)` to `completed`.
  - If it raises an exception `exc`:
    - Run compensating actions in **reverse order** (`reversed(completed)`): for each `(done_name, undo)` where `undo is not None`, call `undo(ctx)` and record `done_name` in `compensated`.
    - Return `{"ok": False, "failed_step": name, "error": str(exc), "compensated": compensated, "ctx": ctx}`!
- If every step succeeds, return `{"ok": True, "failed_step": None, "error": None, "compensated": [], "ctx": ctx}`.

## Objective

Write `run_saga(steps, initial_ctx=None)` implementing the compensating Saga orchestrator above.

## Hints

1. Note that the failing step itself did NOT complete, so only previously completed steps get compensated — in strict LIFO reverse order!
2. Handle `undo_fn is None` cleanly (skip steps that have no side effects to compensate).

## Starter: guided

```python
def run_saga(steps, initial_ctx=None):
    ctx = dict(initial_ctx or {})
    completed = []
    for name, do_fn, undo_fn in steps:
        try:
            do_fn(ctx)
            completed.append((name, undo_fn))
        except Exception as exc:
            compensated = []
            # Run undo_fn(ctx) in reverse order over completed steps
            return {
                "ok": False,
                "failed_step": name,
                "error": str(exc),
                "compensated": compensated,
                "ctx": ctx,
            }
    return {"ok": True, "failed_step": None, "error": None, "compensated": [], "ctx": ctx}
```

## Starter: standard

```python
def run_saga(steps, initial_ctx=None):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _rollback():
    log = []
    def step(name, fail=False):
        def do(ctx):
            log.append(f"do:{name}")
            if fail:
                raise RuntimeError(f"{name} exploded")
            ctx[name] = True
        def undo(ctx):
            log.append(f"undo:{name}")
            ctx.pop(name, None)
        return (name, do, undo)
    res = get("run_saga")([step("reserve"), step("charge"), step("ship", fail=True)])
    return (res["ok"], res["failed_step"], res["compensated"], res["ctx"], log)
expect("compensates completed steps in reverse order on failure", _rollback, (
    False,
    "ship",
    ["charge", "reserve"],
    {},
    ["do:reserve", "do:charge", "do:ship", "undo:charge", "undo:reserve"],
))

def _success():
    res = get("run_saga")([("a", lambda c: c.__setitem__("x", 1), None), ("b", lambda c: c.__setitem__("y", 2), None)])
    return (res["ok"], res["ctx"], res["compensated"])
expect("completes cleanly when all steps succeed", _success, (True, {"x": 1, "y": 2}, []))
```

## Hidden checks

```python
def _skip_none_undo():
    res = get("run_saga")([
        ("read", lambda c: None, None),
        ("lock", lambda c: c.__setitem__("locked", True), lambda c: c.pop("locked", None)),
        ("boom", lambda c: (_ for _ in ()).throw(ValueError("bad")), None),
    ])
    return (res["compensated"], res["ctx"])
expect("skips steps whose undo_fn is None", _skip_none_undo, (["lock"], {}))
```

## Solution

```python
def run_saga(steps, initial_ctx=None):
    ctx = dict(initial_ctx or {})
    completed = []
    for name, do_fn, undo_fn in steps:
        try:
            do_fn(ctx)
            completed.append((name, undo_fn))
        except Exception as exc:
            compensated = []
            for done_name, undo in reversed(completed):
                if undo is not None:
                    undo(ctx)
                    compensated.append(done_name)
            return {
                "ok": False,
                "failed_step": name,
                "error": str(exc),
                "compensated": compensated,
                "ctx": ctx,
            }
    return {"ok": True, "failed_step": None, "error": None, "compensated": [], "ctx": ctx}
```

## Restored

Multi-service workflows now unwind completed steps in exact reverse order whenever a downstream step fails.
