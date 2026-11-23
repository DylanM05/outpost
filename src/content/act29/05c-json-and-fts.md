---
id: sql-json-and-fts
kind: code
language: sql
title: Extract and aggregate nested JSON telemetry with json_extract and json_each
system: Index bench
symbol: instrument
scene: tests
skills: sql-indexes-transactions
---

## Briefing

Modern relational databases store semi-structured diagnostic payloads as JSON alongside relational columns. SQLite's built-in JSON functions (`json_extract(col, '$.path')` and the table-valued `json_each(col, '$.array')`) let you filter, unpack, and aggregate nested JSON properties and arrays directly inside SQL queries.

## Objective

Write a `SELECT` query against `packet_store` that unpacks the `$.tags` array in each row's JSON `payload` using `json_each(packet_store.payload, '$.tags')`:
1. Filter to packets where `json_extract(payload, '$.severity') = 'high'`.
2. Group by each unpacked tag value (`tag.value`).
3. Project three columns ordered by `packet_count DESC, tag_name ASC`:
   - `tag_name` (`tag.value`)
   - `packet_count` (`COUNT(*)`)
   - `max_temp` (`MAX(json_extract(payload, '$.metrics.temp'))`)

## Concept

- `json_extract(json_col, '$.a.b')` extracts a scalar value (string, number, boolean, or `NULL`) from a JSON object at path `$.a.b`.
- `FROM packet_store p, json_each(p.payload, '$.tags') AS tag` (or `JOIN json_each(p.payload, '$.tags') AS tag`) expands a JSON array into one row per element, exposing the element's value as `tag.value`.

## Hints

1. Join `packet_store p` with `json_each(p.payload, '$.tags') AS tag`.
2. Filter with `WHERE json_extract(p.payload, '$.severity') = 'high'`.
3. Group by `tag.value`, project `tag.value AS tag_name, COUNT(*) AS packet_count, MAX(json_extract(p.payload, '$.metrics.temp')) AS max_temp`, and sort by `packet_count DESC, tag_name ASC`.

## Setup

```sql
CREATE TABLE packet_store (
  packet_id INTEGER PRIMARY KEY,
  payload TEXT NOT NULL
);

INSERT INTO packet_store (packet_id, payload) VALUES
  (1, '{"device":"R-1","severity":"high","metrics":{"temp":85},"tags":["thermal","surge"]}'),
  (2, '{"device":"R-2","severity":"low","metrics":{"temp":95},"tags":["thermal","routine"]}'),
  (3, '{"device":"R-3","severity":"high","metrics":{"temp":92},"tags":["thermal","grid"]}'),
  (4, '{"device":"R-4","severity":"high","metrics":{"temp":78},"tags":["surge","grid"]}');
```

## Starter: guided

```sql
-- Unpack $.tags from high-severity packets using json_extract and json_each.
-- Project tag_name, packet_count, max_temp ordered by packet_count DESC, tag_name ASC.
SELECT
  json_extract(p.payload, '$.device') AS device
FROM packet_store p;
```

## Starter: standard

```sql
SELECT packet_id, payload FROM packet_store;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects tag_name, packet_count, max_temp",
    lambda: columns,
    ["tag_name", "packet_count", "max_temp"],
)

expect(
    "extracts and aggregates JSON tags and nested temp metrics for high-severity packets",
    lambda: rows,
    [
        ["grid", 2, 92],
        ["surge", 2, 85],
        ["thermal", 2, 92],
    ],
)

check(
    "uses json_extract and json_each",
    lambda: sql_uses("json_extract") and sql_uses("json_each"),
    "Use json_extract and json_each to query the JSON payload.",
)
```

## Hidden checks

```python
def _test_new_json_packet():
    conn.execute(
        """
        INSERT INTO packet_store (packet_id, payload) VALUES
          (5, '{"device":"R-5","severity":"high","metrics":{"temp":99},"tags":["surge","cryo"]}')
        """
    )
    return run_user_sql()

expect(
    "incorporates newly inserted JSON packet into tag counts and max_temp",
    _test_new_json_packet,
    [
        ["surge", 3, 99],
        ["grid", 2, 92],
        ["thermal", 2, 92],
        ["cryo", 1, 99],
    ],
)
```

## Solution

```sql
SELECT
  tag.value AS tag_name,
  COUNT(*) AS packet_count,
  MAX(json_extract(p.payload, '$.metrics.temp')) AS max_temp
FROM packet_store p,
     json_each(p.payload, '$.tags') AS tag
WHERE json_extract(p.payload, '$.severity') = 'high'
GROUP BY tag.value
ORDER BY packet_count DESC, tag_name ASC;
```

## Restored

Index bench JSON extraction pipeline restored — nested telemetry objects and tag arrays are unpacked and aggregated natively in SQL.
