---
id: sql-recursive-cte-graph
kind: code
language: sql
title: Traverse a relay command tree with WITH RECURSIVE
system: CTE spire
symbol: controller
scene: tests
skills: sql-windows-ctes
---

## Briefing

The outpost's routing hierarchy is stored as an adjacency list in `relay_tree(node_id, parent_id)`. Because the tree can be arbitrarily deep, a fixed number of self-joins cannot traverse it. A recursive CTE (`WITH RECURSIVE`) walks from the root node `'CORE'` down through every descendant level, tracking each node's hop `depth` and full routing `path`.

## Objective

Write a `WITH RECURSIVE` query against `relay_tree` that starts at `node_id = 'CORE'` and projects three columns for all reachable nodes ordered by `depth ASC, node_id ASC`:
1. `node_id`
2. `depth` — integer hop distance from `'CORE'` (`0` for `'CORE'`, `1` for direct children of `'CORE'`, etc.)
3. `path` — `'->'`-joined chain from `'CORE'` to `node_id` (e.g. `'CORE'`, `'CORE->R1'`, `'CORE->R1->R4'`)

## Concept

- A recursive CTE has two parts joined by `UNION ALL`:
  1. **Anchor member:** selects the starting root row(s) (`WHERE node_id = 'CORE'`, with `0 AS depth` and `node_id AS path`).
  2. **Recursive member:** joins the table (`relay_tree child`) to the CTE itself (`ON child.parent_id = tree.node_id`), incrementing `tree.depth + 1` and concatenating `tree.path || '->' || child.node_id`.

## Hints

1. Start with `WITH RECURSIVE tree AS (SELECT node_id, 0 AS depth, node_id AS path FROM relay_tree WHERE node_id = 'CORE' UNION ALL ...)`.
2. In the recursive step, join `relay_tree c JOIN tree t ON c.parent_id = t.node_id` and select `c.node_id, t.depth + 1, t.path || '->' || c.node_id`.
3. Select `node_id, depth, path FROM tree ORDER BY depth ASC, node_id ASC;`.

## Setup

```sql
CREATE TABLE relay_tree (
  node_id TEXT PRIMARY KEY,
  parent_id TEXT
);

INSERT INTO relay_tree (node_id, parent_id) VALUES
  ('CORE', NULL),
  ('R1',   'CORE'),
  ('R2',   'CORE'),
  ('R3',   'R1'),
  ('R4',   'R1'),
  ('R5',   'R2'),
  ('R6',   'R4'),
  ('ORPHAN', 'GHOST');
```

## Starter: guided

```sql
-- Traverse relay_tree starting from node_id = 'CORE' using WITH RECURSIVE.
-- Project node_id, depth, and path ordered by depth ASC, node_id ASC.
WITH RECURSIVE tree AS (
  SELECT
    node_id,
    0 AS depth,
    node_id AS path
  FROM relay_tree
  WHERE node_id = 'CORE'
)
SELECT node_id, depth, path FROM tree;
```

## Starter: standard

```sql
SELECT node_id, parent_id FROM relay_tree;
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "projects node_id, depth, path",
    lambda: columns,
    ["node_id", "depth", "path"],
)

expect(
    "traverses all descendants from CORE with accurate depth and path strings",
    lambda: rows,
    [
        ["CORE", 0, "CORE"],
        ["R1", 1, "CORE->R1"],
        ["R2", 1, "CORE->R2"],
        ["R3", 2, "CORE->R1->R3"],
        ["R4", 2, "CORE->R1->R4"],
        ["R5", 2, "CORE->R2->R5"],
        ["R6", 3, "CORE->R1->R4->R6"],
    ],
)

check(
    "uses WITH RECURSIVE",
    lambda: sql_uses("RECURSIVE"),
    "Use WITH RECURSIVE to traverse the relay tree.",
)
```

## Hidden checks

```python
def _test_deep_leaf():
    conn.execute("INSERT INTO relay_tree (node_id, parent_id) VALUES ('R7', 'R6')")
    return run_user_sql()

expect(
    "traverses newly attached depth-4 leaf node R7",
    _test_deep_leaf,
    [
        ["CORE", 0, "CORE"],
        ["R1", 1, "CORE->R1"],
        ["R2", 1, "CORE->R2"],
        ["R3", 2, "CORE->R1->R3"],
        ["R4", 2, "CORE->R1->R4"],
        ["R5", 2, "CORE->R2->R5"],
        ["R6", 3, "CORE->R1->R4->R6"],
        ["R7", 4, "CORE->R1->R4->R6->R7"],
    ],
)
```

## Solution

```sql
WITH RECURSIVE tree AS (
  SELECT
    node_id,
    0 AS depth,
    node_id AS path
  FROM relay_tree
  WHERE node_id = 'CORE'
  UNION ALL
  SELECT
    c.node_id,
    t.depth + 1 AS depth,
    t.path || '->' || c.node_id AS path
  FROM relay_tree c
  JOIN tree t
    ON c.parent_id = t.node_id
)
SELECT
  node_id,
  depth,
  path
FROM tree
ORDER BY depth ASC, node_id ASC;
```

## Restored

CTE spire recursive graph walker online — arbitrary-depth command hierarchies resolve with exact hop counts and lineage paths while ignoring disconnected orphans.
