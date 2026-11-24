---
id: sql-savepoint-rollback-trace
kind: predict
language: sql
title: Trace BEGIN, SAVEPOINT, ROLLBACK TO, and COMMIT state transitions
system: Transaction desk
symbol: controller
scene: console
skills: sql-transactions, reading-code
---

## Briefing

Production databases rarely execute a single isolated write — they bundle multi-step state transitions inside transactions (`BEGIN` ... `COMMIT`) and use named `SAVEPOINT`s to undo a sub-step without discarding earlier work in the same transaction.

## Objective

Trace the transaction script below and predict **every line printed** by the final `SELECT` query (header row followed by surviving rows).

## Concept

- `BEGIN;` starts an explicit transaction; changes stay isolated until `COMMIT;` (or discarded by `ROLLBACK;`).
- `SAVEPOINT name;` marks a named checkpoint inside the active transaction.
- `ROLLBACK TO name;` undoes every write executed *after* `SAVEPOINT name`, while keeping both the transaction and the savepoint itself alive.
- `RELEASE name;` removes the savepoint marker and keeps all writes made since it was created.
- `COMMIT;` persists every surviving write atomically.

## Hints

1. `'A'` starts at `100`, `'B'` starts at `50`.
2. Before `SAVEPOINT sp1`, `'A'` loses `30` (`70`) and `'B'` gains `30` (`80`).
3. Between `SAVEPOINT sp1` and `ROLLBACK TO sp1`, `'A'` is updated to `0` and `'C'` is inserted — both are completely undone by `ROLLBACK TO sp1`!
4. After `ROLLBACK TO sp1`, `'B'` gains `10` (`90`), `RELEASE sp1` and `COMMIT` save the final state.

## Setup

```sql
CREATE TABLE vaults (
  code TEXT PRIMARY KEY,
  credits INTEGER NOT NULL
);

INSERT INTO vaults (code, credits) VALUES
  ('A', 100),
  ('B', 50);
```

## Program

```sql
BEGIN;
UPDATE vaults SET credits = credits - 30 WHERE code = 'A';
UPDATE vaults SET credits = credits + 30 WHERE code = 'B';
SAVEPOINT sp1;
UPDATE vaults SET credits = 0 WHERE code = 'A';
INSERT INTO vaults (code, credits) VALUES ('C', 999);
ROLLBACK TO sp1;
UPDATE vaults SET credits = credits + 10 WHERE code = 'B';
RELEASE sp1;
COMMIT;

SELECT code, credits FROM vaults ORDER BY code ASC;
```

## Output

```text
code | credits
A | 70
B | 90
```

## Restored

Transaction desk trace verified — `ROLLBACK TO sp1` unwound only the nested mutations while preserving the surrounding transfer.
