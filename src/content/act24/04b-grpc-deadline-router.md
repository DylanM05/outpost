---
id: grpc-deadline-router
title: Dispatch gRPC methods with canonical status codes and deadline propagation
system: RPC bay
symbol: equipment
scene: tests
skills: protobuf-grpc
---

## Briefing

Unlike REST's HTTP codes, gRPC standardizes status codes (`OK=0`, `INVALID_ARGUMENT=3`, `DEADLINE_EXCEEDED=4`, `NOT_FOUND=5`, `UNIMPLEMENTED=12`, `INTERNAL=13`) and propagates a **call deadline** across microservices so downstream hops abort immediately once the caller's budget runs out!

## Concept

Implement `GrpcRouter`:
- `register(full_method, handler)` -> registers `handler(req, remaining_ms)` under `full_method` (e.g. `"/outpost.Telemetry/GetReading"`).
- `call(full_method, req, now_ms, deadline_ms, simulated_cost_ms=0)`:
  - Let `remaining = deadline_ms - now_ms`.
  - If `remaining <= 0`: return `{"code": "DEADLINE_EXCEEDED", "body": None}` immediately WITHOUT invoking the handler!
  - If `full_method` is not registered: return `{"code": "UNIMPLEMENTED", "body": None}`.
  - If `simulated_cost_ms > remaining`: return `{"code": "DEADLINE_EXCEEDED", "body": None}` (call timed out in flight!).
  - Otherwise invoke `handler(req, remaining - simulated_cost_ms)`:
    - Map raised exceptions cleanly:
      - `ValueError` -> `{"code": "INVALID_ARGUMENT", "body": str(err)}`
      - `KeyError` -> `{"code": "NOT_FOUND", "body": str(err)}`
      - Any other `Exception` -> `{"code": "INTERNAL", "body": str(err)}`
    - On success -> `{"code": "OK", "body": result}`.

## Objective

Implement `GrpcRouter` with `register` and `call`.

## Hints

1. Check deadline exhaustion (`remaining <= 0`) BEFORE looking up the handler or running business logic — dead requests should cost zero CPU!

## Starter: guided

```python
class GrpcRouter:
    def __init__(self):
        self.handlers = {}

    def register(self, full_method, handler):
        self.handlers[full_method] = handler

    def call(self, full_method, req, now_ms, deadline_ms, simulated_cost_ms=0):
        pass
```

## Starter: standard

```python
class GrpcRouter:
    def __init__(self):
        pass

    def register(self, full_method, handler):
        pass

    def call(self, full_method, req, now_ms, deadline_ms, simulated_cost_ms=0):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _grpc():
    r = get("GrpcRouter")()
    calls = []
    def get_sensor(req, rem_ms):
        calls.append(rem_ms)
        if req["id"] < 0:
            raise ValueError("negative id")
        if req["id"] == 99:
            raise KeyError("sensor 99")
        return {"temp": 21, "budget_left": rem_ms}
    r.register("/outpost.Sensors/Get", get_sensor)

    ok = r.call("/outpost.Sensors/Get", {"id": 1}, now_ms=100, deadline_ms=250, simulated_cost_ms=40)
    expired = r.call("/outpost.Sensors/Get", {"id": 1}, now_ms=300, deadline_ms=250)
    in_flight_to = r.call("/outpost.Sensors/Get", {"id": 1}, now_ms=100, deadline_ms=130, simulated_cost_ms=40)
    unimpl = r.call("/outpost.Sensors/Unknown", {}, now_ms=100, deadline_ms=200)
    bad_arg = r.call("/outpost.Sensors/Get", {"id": -1}, now_ms=100, deadline_ms=200)
    not_found = r.call("/outpost.Sensors/Get", {"id": 99}, now_ms=100, deadline_ms=200)
    return (ok, expired["code"], in_flight_to["code"], unimpl["code"], bad_arg["code"], not_found["code"], len(calls))
expect("enforces deadlines, propagates remaining budget, and maps canonical gRPC status codes", _grpc, (
    {"code": "OK", "body": {"temp": 21, "budget_left": 110}},
    "DEADLINE_EXCEEDED",
    "DEADLINE_EXCEEDED",
    "UNIMPLEMENTED",
    "INVALID_ARGUMENT",
    "NOT_FOUND",
    3,
))
```

## Hidden checks

```python
def _internal():
    r = get("GrpcRouter")()
    r.register("/svc/Crash", lambda req, rem: 1 / 0)
    res = r.call("/svc/Crash", {}, now_ms=0, deadline_ms=100)
    return res["code"]
expect("maps unexpected exceptions to INTERNAL", _internal, "INTERNAL")
```

## Solution

```python
class GrpcRouter:
    def __init__(self):
        self.handlers = {}

    def register(self, full_method, handler):
        self.handlers[full_method] = handler

    def call(self, full_method, req, now_ms, deadline_ms, simulated_cost_ms=0):
        remaining = deadline_ms - now_ms
        if remaining <= 0:
            return {"code": "DEADLINE_EXCEEDED", "body": None}
        handler = self.handlers.get(full_method)
        if handler is None:
            return {"code": "UNIMPLEMENTED", "body": None}
        if simulated_cost_ms > remaining:
            return {"code": "DEADLINE_EXCEEDED", "body": None}
        try:
            body = handler(req, remaining - simulated_cost_ms)
            return {"code": "OK", "body": body}
        except ValueError as err:
            return {"code": "INVALID_ARGUMENT", "body": str(err)}
        except KeyError as err:
            return {"code": "NOT_FOUND", "body": str(err)}
        except Exception as err:
            return {"code": "INTERNAL", "body": str(err)}
```

## Restored

The RPC bay now dispatches gRPC services with strict deadline propagation and canonical status mapping.
