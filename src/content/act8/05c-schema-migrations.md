---
id: schema-migrations
title: Schema migrations
system: Pipeline gate
symbol: equipment
scene: tests
skills: sql, reliability
---

## Briefing

When you deploy a new version of the exchange that adds a column or a new table, you can't wipe the production database and start fresh — you apply numbered **schema migrations** in order, recording each applied version in a `schema_migrations` table so every deploy runs only what's new, and rolls back cleanly if a migration fails halfway.

## Objective

Write `apply_migrations(conn, migrations)`.

- `migrations` is a list of dicts `{"version": int, "name": str, "statements": [str, ...]}` (may be given in any order!).
- Ensure `schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL)` exists.
- Sort migrations by `version` ascending.
- Skip any migration whose `version` is already recorded in `schema_migrations`.
- For each pending migration:
  - Run every SQL statement in `migration["statements"]` with `conn.execute(stmt)` (do **not** use `conn.executescript`, which commits implicitly!).
  - Insert `(version, name)` into `schema_migrations`.
  - Call `conn.commit()`.
  - If **any** statement raises an exception, call `conn.rollback()` and re-raise the exception — leaving all previously committed migrations intact and the failed migration completely rolled back!
- Return the list of newly applied `version` integers in ascending order.

```python
migrations = [
    {"version": 1, "name": "create_items", "statements": ["CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)"]},
    {"version": 2, "name": "add_qty", "statements": ["ALTER TABLE items ADD COLUMN qty INTEGER DEFAULT 0"]},
]
apply_migrations(conn, migrations)  # [1, 2]
apply_migrations(conn, migrations)  # [] (already applied!)
```

## Concept

Safe **database migrations** are how CI/CD pipelines evolve live databases without losing data:

- **Idempotent re-runs:** running the migrator twice applies nothing on the second run.
- **Per-migration transactions:** if migration 3 has two statements and the second fails, rolling back undoes the first statement too, so the database is never left half-migrated!

## Hints

1. Create `schema_migrations` first (`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL)`) and commit.
2. Fetch `applied = {row[0] for row in conn.execute("SELECT version FROM schema_migrations").fetchall()}`.
3. Loop over `sorted(migrations, key=lambda m: m["version"])`. For each unapplied migration, wrap executing its statements + inserting into `schema_migrations` + `conn.commit()` in `try ... except Exception: conn.rollback(); raise`.

## Starter: guided

```python
def apply_migrations(conn, migrations):
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        )
        """
    )
    conn.commit()
    applied = {r[0] for r in conn.execute("SELECT version FROM schema_migrations").fetchall()}
    newly_applied = []
    # Sort migrations by version, skip applied ones, execute statements + record version atomically.
    return newly_applied
```

## Starter: standard

```python
def apply_migrations(conn, migrations):
    return []
```

## Starter: challenge

```python
```

## Checks

```python
import sqlite3 as _sq

conn = _sq.connect(":memory:")
migs = [
    {"version": 2, "name": "add_qty", "statements": ["ALTER TABLE items ADD COLUMN qty INTEGER NOT NULL DEFAULT 0"]},
    {"version": 1, "name": "create_items", "statements": ["CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL)"]},
]
expect("applies migrations in ascending version order", lambda: get("apply_migrations")(conn, migs), [1, 2])
expect("second run is idempotent and applies []", lambda: get("apply_migrations")(conn, migs), [])
conn.execute("INSERT INTO items (name, qty) VALUES ('fuel', 5)")
expect("migrated schema works", lambda: conn.execute("SELECT name, qty FROM items").fetchone(), ("fuel", 5))
```

## Hidden checks

```python
bad_migs = migs + [
    {
        "version": 3,
        "name": "broken_migration",
        "statements": [
            "INSERT INTO items (name, qty) VALUES ('should-rollback', 99)",
            "THIS IS NOT VALID SQL",
        ],
    }
]

def _fails_and_rolls_back():
    try:
        get("apply_migrations")(conn, bad_migs)
        return False
    except Exception:
        rows = conn.execute("SELECT name FROM items").fetchall()
        versions = [r[0] for r in conn.execute("SELECT version FROM schema_migrations ORDER BY version").fetchall()]
        return rows == [("fuel",)] and versions == [1, 2]

check(
    "failed migration rolls back its earlier statements and isn't recorded",
    _fails_and_rolls_back,
    "Execute each statement with conn.execute() and call conn.rollback() on error before re-raising.",
)
```

## Solution

```python
def apply_migrations(conn, migrations):
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        )
        """
    )
    conn.commit()

    applied = {r[0] for r in conn.execute("SELECT version FROM schema_migrations").fetchall()}
    newly_applied = []
    for mig in sorted(migrations, key=lambda m: m["version"]):
        version = mig["version"]
        if version in applied:
            continue
        try:
            for stmt in mig["statements"]:
                conn.execute(stmt)
            conn.execute(
                "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
                (version, mig["name"]),
            )
            conn.commit()
            newly_applied.append(version)
        except Exception:
            conn.rollback()
            raise
    return newly_applied
```

## Restored

Database deployments now advance cleanly version by version and roll back automatically if a migration ever trips.
