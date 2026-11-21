---
id: health-and-readiness
title: Health and readiness
system: Operations desk
symbol: controller
scene: tests
skills: containers, reliability
---

## Briefing

Container orchestrators and load balancers ask a running service two different questions:

- **Liveness (`/healthz`)**: "Is the process still alive, or should I kill and restart it?"
- **Readiness (`/readyz`)**: "Is this instance ready to receive live traffic right now?"

During a rolling deploy, a container is *alive* before its database migrations finish — and *alive* while draining in-flight requests during shutdown — but it is **not ready** for new traffic! Build the operations desk's health probe controller.

## Objective

Write a `HealthController(conn, required_tables)` class with:

- `self.shutting_down = False`
- `begin_shutdown(self)`: sets `self.shutting_down = True`.
- `liveness(self)`: returns `(200, {"status": "alive"})`.
- `readiness(self)`:
  - If `self.shutting_down` is `True`, return `(503, {"status": "shutting_down"})`.
  - Try running `SELECT 1` on `self.conn` and checking that every table name in `self.required_tables` exists in `sqlite_master` (`type = 'table'`).
  - If the database raises any error (e.g. closed connection), return `(503, {"status": "db_unavailable"})`.
  - If any required table is missing, return `(503, {"status": "missing_tables", "missing": sorted(missing)})`.
  - Otherwise return `(200, {"status": "ready"})`.

```python
hc = HealthController(conn, ["users", "orders"])
hc.liveness()   # (200, {"status": "alive"})
hc.readiness()  # (503, {"status": "missing_tables", "missing": ["orders", "users"]})
```

## Concept

Why separate `/healthz` from `/readyz`?

- If your database has a brief 5-second hiccup and `/healthz` fails, the orchestrator **kills and restarts every API container**, turning a 5-second blip into a 2-minute cold-start storm!
- Keeping `/healthz` simple (process alive) and `/readyz` thorough (DB reachable, migrations applied, not shutting down) lets the load balancer cleanly route traffic away without unnecessary restarts — and enables **zero-downtime rolling deploys**.

## Hints

1. Check `if self.shutting_down:` first in `readiness()`.
2. Wrap DB queries in `try ... except Exception: return (503, {"status": "db_unavailable"})`.
3. Query `existing = {r[0] for r in self.conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'").fetchall()}` and compute `missing = sorted(t for t in self.required_tables if t not in existing)`.

## Starter: guided

```python
class HealthController:
    def __init__(self, conn, required_tables):
        self.conn = conn
        self.required_tables = list(required_tables)
        self.shutting_down = False

    def begin_shutdown(self):
        self.shutting_down = True

    def liveness(self):
        return (200, {"status": "alive"})

    def readiness(self):
        # Check shutting_down, DB connectivity, and required_tables.
        return (503, {"status": "not_implemented"})
```

## Starter: standard

```python
class HealthController:
    def __init__(self, conn, required_tables):
        self.conn = conn
        self.required_tables = list(required_tables)
        self.shutting_down = False

    def begin_shutdown(self):
        pass

    def liveness(self):
        return (200, {"status": "alive"})

    def readiness(self):
        return (200, {"status": "ready"})
```

## Starter: challenge

```python
```

## Checks

```python
import sqlite3 as _sq

conn = _sq.connect(":memory:")
hc = get("HealthController")(conn, ["users", "orders"])
expect("liveness is 200 before tables exist", lambda: hc.liveness(), (200, {"status": "alive"}))
expect("readiness is 503 when tables are missing", lambda: hc.readiness(), (503, {"status": "missing_tables", "missing": ["orders", "users"]}))

conn.execute("CREATE TABLE users (id INTEGER PRIMARY KEY)")
conn.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY)")
expect("readiness becomes 200 once tables exist", lambda: hc.readiness(), (200, {"status": "ready"}))

hc.begin_shutdown()
expect("readiness returns 503 during graceful shutdown", lambda: hc.readiness(), (503, {"status": "shutting_down"}))
expect("liveness stays 200 while draining", lambda: hc.liveness(), (200, {"status": "alive"}))
```

## Hidden checks

```python
closed = _sq.connect(":memory:")
closed.close()
hc_bad = get("HealthController")(closed, [])
expect("closed DB returns 503 db_unavailable", lambda: hc_bad.readiness(), (503, {"status": "db_unavailable"}))
```

## Solution

```python
class HealthController:
    def __init__(self, conn, required_tables):
        self.conn = conn
        self.required_tables = list(required_tables)
        self.shutting_down = False

    def begin_shutdown(self):
        self.shutting_down = True

    def liveness(self):
        return (200, {"status": "alive"})

    def readiness(self):
        if self.shutting_down:
            return (503, {"status": "shutting_down"})
        try:
            self.conn.execute("SELECT 1").fetchone()
            existing = {
                r[0]
                for r in self.conn.execute(
                    "SELECT name FROM sqlite_master WHERE type = 'table'"
                ).fetchall()
            }
        except Exception:
            return (503, {"status": "db_unavailable"})
        missing = sorted(t for t in self.required_tables if t not in existing)
        if missing:
            return (503, {"status": "missing_tables", "missing": missing})
        return (200, {"status": "ready"})
```

## Restored

The operations desk now separates liveness from readiness so rolling deploys never send traffic to half-migrated or shutting-down instances.
