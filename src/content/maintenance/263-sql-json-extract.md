---
id: maintenance-sql-json-extract
language: sql
title: Filter and sort JSON sensor envelopes with json_extract
system: Index bench
symbol: instrument
scene: tests
skills: sql-indexes-transactions
reviewSkill: sql-indexes-transactions
prerequisite: sql-json-and-fts
---

## Briefing

`raw_envelopes` stores incoming sensor JSON documents in `doc`. Engineers need a query that extracts `$.sensor`, `$.meta.zone`, and `$.reading.value` for envelopes where `json_extract(doc, '$.meta.calibrated') = 1`, ordered by the numeric reading value descending.

## Objective

Write a `SELECT` query against `raw_envelopes` that filters to `json_extract(doc, '$.meta.calibrated') = 1` and projects:
1. `sensor` (`json_extract(doc, '$.sensor')`)
2. `zone` (`json_extract(doc, '$.meta.zone')`)
3. `val` (`json_extract(doc, '$.reading.value')`)

Order the results by `val DESC, sensor ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Use `json_extract(doc, '$.sensor') AS sensor`, `json_extract(doc, '$.meta.zone') AS zone`, `json_extract(doc, '$.reading.value') AS val`, and filter with `WHERE json_extract(doc, '$.meta.calibrated') = 1`.

## Setup

```sql
CREATE TABLE raw_envelopes (
  env_id INTEGER PRIMARY KEY,
  doc TEXT NOT NULL
);

INSERT INTO raw_envelopes (env_id, doc) VALUES
  (1, '{"sensor":"S-1","meta":{"zone":"north","calibrated":1},"reading":{"value":42}}'),
  (2, '{"sensor":"S-2","meta":{"zone":"east","calibrated":0},"reading":{"value":99}}'),
  (3, '{"sensor":"S-3","meta":{"zone":"south","calibrated":1},"reading":{"value":78}}'),
  (4, '{"sensor":"S-4","meta":{"zone":"north","calibrated":1},"reading":{"value":65}}');
```

## Starter

```sql
SELECT env_id, doc
FROM raw_envelopes;
```

## Checks

```python
expect(
    "projects sensor, zone, val",
    lambda: columns,
    ["sensor", "zone", "val"],
)

expect(
    "extracts JSON fields for calibrated envelopes ordered by val DESC",
    lambda: rows,
    [
        ["S-3", "south", 78],
        ["S-4", "north", 65],
        ["S-1", "north", 42],
    ],
)
```

## Hidden checks

```python
def _test_new_envelope():
    conn.execute(
        """
        INSERT INTO raw_envelopes VALUES
          (5, '{"sensor":"S-0","meta":{"zone":"west","calibrated":1},"reading":{"value":78}}')
        """
    )
    return run_user_sql()

expect(
    "includes newly inserted calibrated JSON envelope and breaks ties by sensor ASC",
    _test_new_envelope,
    [
        ["S-0", "west", 78],
        ["S-3", "south", 78],
        ["S-4", "north", 65],
        ["S-1", "north", 42],
    ],
)
```

## Solution

```sql
SELECT
  json_extract(doc, '$.sensor') AS sensor,
  json_extract(doc, '$.meta.zone') AS zone,
  json_extract(doc, '$.reading.value') AS val
FROM raw_envelopes
WHERE json_extract(doc, '$.meta.calibrated') = 1
ORDER BY val DESC, sensor ASC;
```

## Restored

Index bench JSON envelope extractor online — calibrated readings and nested zone metadata are projected directly from JSON documents.
