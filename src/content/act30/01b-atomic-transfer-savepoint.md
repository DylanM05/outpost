---
id: sql-atomic-transfer-savepoint
kind: code
language: sql
title: Execute an atomic ledger transfer with a SAVEPOINT and RETURNING
system: Transaction desk
symbol: controller
scene: tests
skills: sql-transactions
---

## Briefing

Dispatch is transferring `40` power credits from `'SOLAR'` to `'CRYO'` and testing a speculative `'AUX'` surcharge inside a savepoint before rolling the surcharge back. Finally, they want the updated `'CRYO'` row returned directly using `RETURNING`.

## Objective

Write a SQL script that:
1. Starts an explicit transaction with `BEGIN;`.
2. Transfers `40` credits from `'SOLAR'` to `'CRYO'` (debit `'SOLAR'`, credit `'CRYO'`), and logs `('xfer-1', 'SOLAR', 'CRYO', 40)` in `transfers`.
3. Creates a `SAVEPOINT bonus_try;`, inserts a speculative `('bonus-1', 'SOLAR', 'AUX', 15)` row into `transfers`, then undoes that speculative insert with `ROLLBACK TO bonus_try;` and `RELEASE bonus_try;`.
4. Commits the transaction with `COMMIT;`.
5. Updates `'CRYO'`'s `last_sync` to `'2026-11-23'` with a `RETURNING account_id, credits, last_sync` clause so the final result returns `'CRYO'`'s updated row!

## Concept

- `BEGIN; ... SAVEPOINT sp; ... ROLLBACK TO sp; RELEASE sp; COMMIT;` lets a script attempt risky sub-steps without aborting the outer transaction.
- SQLite 3.35+ supports `INSERT/UPDATE/DELETE ... RETURNING col1, col2` to return modified rows atomically in one round-trip without a separate `SELECT`.

## Hints

1. Wrap the two `UPDATE accounts` statements and the `'xfer-1'` `INSERT INTO transfers` before `SAVEPOINT bonus_try;`.
2. After `ROLLBACK TO bonus_try; RELEASE bonus_try; COMMIT;`, finish with `UPDATE accounts SET last_sync = '2026-11-23' WHERE account_id = 'CRYO' RETURNING account_id, credits, last_sync;`.

## Setup

```sql
CREATE TABLE accounts (
  account_id TEXT PRIMARY KEY,
  credits INTEGER NOT NULL CHECK (credits >= 0),
  last_sync TEXT NOT NULL DEFAULT 'never'
);

CREATE TABLE transfers (
  tx_id TEXT PRIMARY KEY,
  src TEXT NOT NULL,
  dst TEXT NOT NULL,
  amount INTEGER NOT NULL
);

INSERT INTO accounts (account_id, credits) VALUES
  ('SOLAR', 120),
  ('CRYO',   30),
  ('AUX',    10);
```

## Starter: guided

```sql
BEGIN;
-- Debit SOLAR by 40, credit CRYO by 40, insert 'xfer-1' into transfers
-- Create SAVEPOINT bonus_try, insert speculative 'bonus-1', ROLLBACK TO bonus_try, RELEASE bonus_try
COMMIT;
-- Finish with UPDATE accounts ... RETURNING account_id, credits, last_sync;
```

## Starter: standard

```sql
-- Perform the atomic transfer with SAVEPOINT rollback and finish with UPDATE ... RETURNING
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "RETURNING outputs updated CRYO row",
    lambda: [columns, rows],
    [["account_id", "credits", "last_sync"], [["CRYO", 70, "2026-11-23"]]],
)

expect(
    "final balances reflect only the committed 40-credit transfer",
    lambda: query("SELECT account_id, credits FROM accounts ORDER BY account_id ASC"),
    [["AUX", 10], ["CRYO", 70], ["SOLAR", 80]],
)

expect(
    "only xfer-1 survived in transfers after bonus_try rollback",
    lambda: query("SELECT tx_id, src, dst, amount FROM transfers ORDER BY tx_id ASC"),
    [["xfer-1", "SOLAR", "CRYO", 40]],
)
```

## Hidden checks

```python
check(
    "uses BEGIN, SAVEPOINT, ROLLBACK, COMMIT, and RETURNING",
    lambda: all(sql_uses(kw) for kw in ("BEGIN", "SAVEPOINT", "ROLLBACK", "COMMIT", "RETURNING")),
    "Use explicit BEGIN, SAVEPOINT, ROLLBACK TO, COMMIT, and RETURNING in your script.",
)

check(
    "leaves no open uncommitted transaction",
    lambda: not conn.in_transaction,
    "Make sure your transaction ends with COMMIT;.",
)
```

## Solution

```sql
BEGIN;
UPDATE accounts SET credits = credits - 40 WHERE account_id = 'SOLAR';
UPDATE accounts SET credits = credits + 40 WHERE account_id = 'CRYO';
INSERT INTO transfers (tx_id, src, dst, amount) VALUES ('xfer-1', 'SOLAR', 'CRYO', 40);
SAVEPOINT bonus_try;
INSERT INTO transfers (tx_id, src, dst, amount) VALUES ('bonus-1', 'SOLAR', 'AUX', 15);
ROLLBACK TO bonus_try;
RELEASE bonus_try;
COMMIT;

UPDATE accounts
SET last_sync = '2026-11-23'
WHERE account_id = 'CRYO'
RETURNING account_id, credits, last_sync;
```

## Restored

Transaction desk online — atomic transfers, nested savepoint rollbacks, and `RETURNING` projections are verified.
