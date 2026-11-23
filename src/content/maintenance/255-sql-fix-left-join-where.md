---
id: maintenance-sql-fix-left-join-where
language: sql
title: Fix a LEFT JOIN query whose WHERE filter silently dropped unmatched rows
system: Join bridge
symbol: equipment
scene: tests
skills: sql-joins
reviewSkill: sql-joins
prerequisite: sql-multi-join-rollup
---

## Briefing

A query is supposed to list **every** technician in `techs` along with how many `'urgent'` tickets they have in `tickets` (`0` if they have no urgent tickets). However, the author placed `WHERE tk.priority = 'urgent'` in the outer `WHERE` clause — which rejects rows where `tk.priority` is `NULL` and turns the `LEFT JOIN` into an `INNER JOIN`!

## Objective

Fix the query by moving the `tk.priority = 'urgent'` condition into the `LEFT JOIN ... ON` clause so every technician is returned with their urgent ticket count (`urgent_count`), ordered by `tech_id ASC`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Change the join to `LEFT JOIN tickets tk ON t.tech_id = tk.tech_id AND tk.priority = 'urgent'` and remove the `WHERE` clause.

## Setup

```sql
CREATE TABLE techs (
  tech_id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE tickets (
  ticket_id INTEGER PRIMARY KEY,
  tech_id TEXT NOT NULL REFERENCES techs(tech_id),
  priority TEXT NOT NULL
);

INSERT INTO techs (tech_id, name) VALUES
  ('T-1', 'Vera'),
  ('T-2', 'Lin'),
  ('T-3', 'Mira');

INSERT INTO tickets (ticket_id, tech_id, priority) VALUES
  (1, 'T-1', 'urgent'),
  (2, 'T-1', 'normal'),
  (3, 'T-2', 'normal');
```

## Starter

```sql
SELECT
  t.tech_id,
  t.name,
  COUNT(tk.ticket_id) AS urgent_count
FROM techs t
LEFT JOIN tickets tk
  ON t.tech_id = tk.tech_id
WHERE tk.priority = 'urgent'
GROUP BY t.tech_id, t.name
ORDER BY t.tech_id ASC;
```

## Checks

```python
expect(
    "preserves all technicians with 0 urgent_count when they have only normal or no tickets",
    lambda: rows,
    [
        ["T-1", "Vera", 1],
        ["T-2", "Lin", 0],
        ["T-3", "Mira", 0],
    ],
)
```

## Hidden checks

```python
def _test_urgent_for_mira():
    conn.execute("INSERT INTO tickets VALUES (4, 'T-3', 'urgent'), (5, 'T-3', 'urgent')")
    return run_user_sql()

expect(
    "counts new urgent tickets for Mira while keeping Lin at 0",
    _test_urgent_for_mira,
    [
        ["T-1", "Vera", 1],
        ["T-2", "Lin", 0],
        ["T-3", "Mira", 2],
    ],
)
```

## Solution

```sql
SELECT
  t.tech_id,
  t.name,
  COUNT(tk.ticket_id) AS urgent_count
FROM techs t
LEFT JOIN tickets tk
  ON t.tech_id = tk.tech_id
 AND tk.priority = 'urgent'
GROUP BY t.tech_id, t.name
ORDER BY t.tech_id ASC;
```

## Restored

Join bridge outer-join predicate fixed — filtering the right table inside `ON` preserves unmatched left rows.
