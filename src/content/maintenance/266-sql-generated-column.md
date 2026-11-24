---
id: maintenance-sql-generated-column
language: sql
title: Define a STRICT battery_packs table with a stored GENERATED ALWAYS watt-hour column
system: Migration bay
symbol: equipment
scene: tests
skills: sql-transactions
reviewSkill: sql-transactions
prerequisite: sql-safe-table-rebuild
---

## Briefing

`battery_packs` stores nominal voltage (`volts`) and amp-hours (`ah`). Add a `STRICT` table with an automatically computed `wh` (`volts * ah`) stored generated column so capacity never drifts out of sync.

## Objective

Create a `STRICT` table `battery_packs` with:
- `pack_id TEXT PRIMARY KEY`
- `volts INT NOT NULL CHECK (volts > 0)`
- `ah INT NOT NULL CHECK (ah > 0)`
- `wh INT GENERATED ALWAYS AS (volts * ah) STORED`

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `wh INT GENERATED ALWAYS AS (volts * ah) STORED` and finish the `CREATE TABLE` with `) STRICT;`.

## Setup

```sql
-- Fresh database ready for battery_packs.
```

## Starter

```sql
-- Create STRICT table battery_packs with GENERATED ALWAYS AS (volts * ah) STORED column wh
```

## Checks

```python
def _test_pack():
    conn.execute("INSERT INTO battery_packs (pack_id, volts, ah) VALUES ('BP-1', 48, 20)")
    conn.execute("UPDATE battery_packs SET ah = 25 WHERE pack_id = 'BP-1'")
    return query("SELECT pack_id, volts, ah, wh FROM battery_packs")

expect(
    "computes and updates wh automatically",
    _test_pack,
    [["BP-1", 48, 25, 1200]],
)
```

## Hidden checks

```python
def _test_strict():
    try:
        conn.execute("INSERT INTO battery_packs (pack_id, volts, ah) VALUES ('BP-2', 'forty-eight', 10)")
        return False
    except Exception:
        return True

check(
    "rejects non-integer volts in STRICT mode",
    _test_strict,
    "Append STRICT to CREATE TABLE battery_packs (...) STRICT;.",
)
```

## Solution

```sql
CREATE TABLE battery_packs (
  pack_id TEXT PRIMARY KEY,
  volts INT NOT NULL CHECK (volts > 0),
  ah INT NOT NULL CHECK (ah > 0),
  wh INT GENERATED ALWAYS AS (volts * ah) STORED
) STRICT;
```

## Restored

Migration bay battery schema restored — watt-hours stay automatically synchronized under `STRICT` type rules.
