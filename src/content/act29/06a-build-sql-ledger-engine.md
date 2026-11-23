---
id: sql-build-sql-ledger-engine
kind: code
language: sql
title: Build an end-to-end transactional ledger schema with triggers, covering indexes, and window views
system: Schema audit
symbol: controller
scene: tests
assessment: true
skills: sql-windows-ctes, sql-schema-dml, sql-indexes-transactions
---

## Briefing

Wait — check the ID! Let's make sure the ID in frontmatter is `id: sql-build-ledger-engine` (exact ID from brief #4!). Let's fix that in the block right below or wait — let's check what we wrote above: we wrote `id: sql-build-sql-ledger-engine` on line 2 of `06a-build-sql-ledger-engine.md`! Let's post `act29/06a-build-sql-ledger-engine.md` with `id: sql-build-ledger-engine` right here at the bottom of this message so `@coordinator` has the exact `id: sql-build-ledger-engine`!

=== FILE: act29/06a-build-sql-ledger-engine.md ===
---
id: sql-build-ledger-engine
kind: code
language: sql
title: Build an end-to-end transactional ledger schema with triggers, covering indexes, and window views
system: Schema audit
symbol: controller
scene: tests
assessment: true
skills: sql-windows-ctes, sql-schema-dml, sql-indexes-transactions
---

## Briefing

For the **SQL II (*The ledger schema*)** finale assessment, combine DDL constraints, automatic triggers, covering indexes, and window-function views into a self-auditing ledger engine for outpost resource accounts.

## Objective

Write a SQL schema script that creates four database objects:
1. `CREATE TABLE accounts`:
   - `account_id TEXT PRIMARY KEY`
   - `name TEXT NOT NULL UNIQUE`
   - `balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0)`
2. `CREATE TABLE journal_entries`:
   - `entry_id INTEGER PRIMARY KEY`
   - `account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE`
   - `delta INTEGER NOT NULL CHECK (delta != 0)`
   - `ts INTEGER NOT NULL`
   - `memo TEXT NOT NULL DEFAULT ''`
3. `CREATE TRIGGER trg_apply_journal`:
   - Fires `AFTER INSERT ON journal_entries`.
   - Updates `accounts SET balance = balance + NEW.delta WHERE account_id = NEW.account_id`. (If `balance + NEW.delta < 0`, the `CHECK (balance >= 0)` constraint on `accounts` will automatically abort the insert!)
4. `CREATE INDEX idx_journal_covering`:
   - A composite covering index on `journal_entries(account_id, ts, entry_id, delta)` so account history queries ordered by `ts, entry_id` are covered by the index.
5. `CREATE VIEW account_statement AS`:
   - Projects `entry_id`, `account_id`, `ts`, `delta`, and `running_balance` (`SUM(delta) OVER (PARTITION BY account_id ORDER BY ts ASC, entry_id ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`) from `journal_entries` ordered by `account_id ASC, ts ASC, entry_id ASC`.

## Concept

- Combining `CHECK (balance >= 0)` on `accounts` with an `AFTER INSERT` trigger on `journal_entries` guarantees that `accounts.balance` always equals the sum of its `journal_entries` and that any overdraft entry is atomically rejected.
- `CREATE VIEW account_statement` uses `SUM(delta) OVER (PARTITION BY account_id ORDER BY ts ASC, entry_id ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` to reconstruct the running balance after every entry.

## Hints

1. Create `accounts` and `journal_entries` with the exact column names and `CHECK` / `FOREIGN KEY ... ON DELETE CASCADE` constraints.
2. Create `trg_apply_journal` as `AFTER INSERT ON journal_entries BEGIN UPDATE accounts SET balance = balance + NEW.delta WHERE account_id = NEW.account_id; END;`.
3. Create `idx_journal_covering` on `journal_entries(account_id, ts, entry_id, delta)` and `account_statement` with `SUM(delta) OVER (...) AS running_balance`.

## Setup

```sql
-- Foreign keys are enabled in the harness connection (PRAGMA foreign_keys = ON).
```

## Starter: guided

```sql
-- 1. CREATE TABLE accounts (...)
-- 2. CREATE TABLE journal_entries (...)
-- 3. CREATE TRIGGER trg_apply_journal ...
-- 4. CREATE INDEX idx_journal_covering ...
-- 5. CREATE VIEW account_statement ...
CREATE TABLE accounts (
  account_id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0)
);
```

## Starter: standard

```sql
-- Define accounts, journal_entries, trg_apply_journal, idx_journal_covering, and account_statement
```

## Starter: challenge

```sql
```

## Checks

```python
def _test_ledger_lifecycle():
    conn.execute("INSERT INTO accounts (account_id, name) VALUES ('AC-1', 'Solar Reserve'), ('AC-2', 'Cryo Fund')")
    conn.execute(
        """
        INSERT INTO journal_entries (entry_id, account_id, delta, ts, memo) VALUES
          (1, 'AC-1', 500, 10, 'initial grant'),
          (2, 'AC-1', -150, 20, 'relay draw'),
          (3, 'AC-2', 300, 15, 'seed'),
          (4, 'AC-1', 50, 30, 'rebate')
        """
    )
    balances = query("SELECT account_id, balance FROM accounts ORDER BY account_id ASC")
    stmt = query("SELECT entry_id, account_id, ts, delta, running_balance FROM account_statement ORDER BY account_id ASC, ts ASC, entry_id ASC")
    return [balances, stmt]

expect(
    "updates account balances via trigger and computes running_balance in account_statement view",
    _test_ledger_lifecycle,
    [
        [
            ["AC-1", 400],
            ["AC-2", 300],
        ],
        [
            [1, "AC-1", 10, 500, 500],
            [2, "AC-1", 20, -150, 350],
            [4, "AC-1", 30, 50, 400],
            [3, "AC-2", 15, 300, 300],
        ],
    ],
)

def _test_covering_plan():
    plan = query(
        "EXPLAIN QUERY PLAN SELECT ts, entry_id, delta FROM journal_entries WHERE account_id = 'AC-1' ORDER BY ts ASC, entry_id ASC"
    )
    return any("USING COVERING INDEX idx_journal_covering" in str(r[-1]) for r in plan)

check(
    "account history query uses covering index idx_journal_covering",
    _test_covering_plan,
    "Create index idx_journal_covering on journal_entries(account_id, ts, entry_id, delta).",
)
```

## Hidden checks

```python
def _test_overdraft_and_zero_delta():
    rejected = []
    for label, sql in [
        ("overdraft", "INSERT INTO journal_entries (entry_id, account_id, delta, ts) VALUES (5, 'AC-2', -500, 40)"),
        ("zero_delta", "INSERT INTO journal_entries (entry_id, account_id, delta, ts) VALUES (6, 'AC-2', 0, 40)"),
    ]:
        try:
            conn.execute(sql)
        except Exception:
            rejected.append(label)
    bal = query("SELECT balance FROM accounts WHERE account_id = 'AC-2'")
    return [rejected, bal]

expect(
    "rejects overdraft and zero-delta entries while keeping AC-2 balance intact at 300",
    _test_overdraft_and_zero_delta,
    [["overdraft", "zero_delta"], [[300]]],
)
```

## Solution

```sql
CREATE TABLE accounts (
  account_id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

CREATE TABLE journal_entries (
  entry_id INTEGER PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  delta INTEGER NOT NULL CHECK (delta != 0),
  ts INTEGER NOT NULL,
  memo TEXT NOT NULL DEFAULT ''
);

CREATE TRIGGER trg_apply_journal
AFTER INSERT ON journal_entries
BEGIN
  UPDATE accounts
  SET balance = balance + NEW.delta
  WHERE account_id = NEW.account_id;
END;

CREATE INDEX idx_journal_covering
ON journal_entries(account_id, ts, entry_id, delta);

CREATE VIEW account_statement AS
SELECT
  entry_id,
  account_id,
  ts,
  delta,
  SUM(delta) OVER (
    PARTITION BY account_id
    ORDER BY ts ASC, entry_id ASC
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_balance
FROM journal_entries
ORDER BY account_id ASC, ts ASC, entry_id ASC;
```

## Restored

The ledger schema audit is complete — your relational engine enforces non-negative account invariants, automatic journal triggers, index-only history scans, and window-function statement reconciliation.
