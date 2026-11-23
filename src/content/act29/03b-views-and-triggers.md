---
id: sql-views-and-triggers
kind: code
language: sql
title: Create an active_balances view and an AFTER UPDATE audit trigger
system: Schema forge
symbol: equipment
scene: tests
skills: sql-schema-dml
---

## Briefing

The schema forge needs two database objects on top of `vault_accounts`:
1. A virtual view `active_balances` so reporting queries can read active accounts (`active = 1`) without repeating filter logic.
2. An automatic trigger `trg_audit_balance` that records a row in `audit_log` whenever an account's `balance` actually changes on `UPDATE`.

## Objective

Write two DDL statements:
1. `CREATE VIEW active_balances AS`:
   - Projects `account_id`, `owner`, `balance` from `vault_accounts` where `active = 1`, ordered by `account_id ASC`.
2. `CREATE TRIGGER trg_audit_balance`:
   - Fires `AFTER UPDATE OF balance ON vault_accounts` **only when** `NEW.balance != OLD.balance`.
   - Inserts `(account_id, old_balance, new_balance)` into `audit_log` using `(NEW.account_id, OLD.balance, NEW.balance)`.

## Concept

- `CREATE VIEW view_name AS SELECT ...` stores a named query that acts like a read-only virtual table.
- `CREATE TRIGGER name AFTER UPDATE OF col ON table WHEN NEW.col != OLD.col BEGIN ... END;` executes statements inside `BEGIN ... END;` automatically after each qualifying row update, exposing `OLD.<col>` (pre-update value) and `NEW.<col>` (post-update value).

## Hints

1. Define the view with `CREATE VIEW active_balances AS SELECT account_id, owner, balance FROM vault_accounts WHERE active = 1 ORDER BY account_id ASC;`.
2. Define the trigger header with `CREATE TRIGGER trg_audit_balance AFTER UPDATE OF balance ON vault_accounts WHEN NEW.balance != OLD.balance`.
3. Inside `BEGIN ... END;`, run `INSERT INTO audit_log (account_id, old_balance, new_balance) VALUES (NEW.account_id, OLD.balance, NEW.balance);`.

## Setup

```sql
CREATE TABLE vault_accounts (
  account_id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  balance INTEGER NOT NULL,
  active INTEGER NOT NULL
);

CREATE TABLE audit_log (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL,
  old_balance INTEGER NOT NULL,
  new_balance INTEGER NOT NULL
);

INSERT INTO vault_accounts (account_id, owner, balance, active) VALUES
  ('A-01', 'Vera', 500, 1),
  ('A-02', 'Lin',  300, 0),
  ('A-03', 'Mira', 750, 1);
```

## Starter: guided

```sql
-- 1. Create view active_balances (account_id, owner, balance for active = 1)
-- 2. Create trigger trg_audit_balance logging balance changes into audit_log
CREATE VIEW active_balances AS
SELECT account_id, owner, balance
FROM vault_accounts
WHERE active = 1;
```

## Starter: standard

```sql
-- Create active_balances view and trg_audit_balance trigger
```

## Starter: challenge

```sql
```

## Checks

```python
expect(
    "active_balances view returns only active accounts",
    lambda: query("SELECT account_id, owner, balance FROM active_balances ORDER BY account_id ASC"),
    [
        ["A-01", "Vera", 500],
        ["A-03", "Mira", 750],
    ],
)

def _test_trigger_fires():
    conn.execute("UPDATE vault_accounts SET balance = 650 WHERE account_id = 'A-01'")
    conn.execute("UPDATE vault_accounts SET balance = 650 WHERE account_id = 'A-01'")  # no-op update!
    conn.execute("UPDATE vault_accounts SET balance = 900 WHERE account_id = 'A-03'")
    return query("SELECT account_id, old_balance, new_balance FROM audit_log ORDER BY log_id ASC")

expect(
    "trg_audit_balance logs changed balances and ignores no-op updates",
    _test_trigger_fires,
    [
        ["A-01", 500, 650],
        ["A-03", 750, 900],
    ],
)
```

## Hidden checks

```python
def _test_view_reflects_updates():
    conn.execute("UPDATE vault_accounts SET active = 1, balance = 400 WHERE account_id = 'A-02'")
    return [
        query("SELECT account_id, balance FROM active_balances ORDER BY account_id ASC"),
        query("SELECT account_id, old_balance, new_balance FROM audit_log ORDER BY log_id ASC"),
    ]

expect(
    "view reflects newly activated account and trigger logs its balance update",
    _test_view_reflects_updates,
    [
        [
            ["A-01", 650],
            ["A-02", 400],
            ["A-03", 900],
        ],
        [
            ["A-01", 500, 650],
            ["A-03", 750, 900],
            ["A-02", 300, 400],
        ],
    ],
)
```

## Solution

```sql
CREATE VIEW active_balances AS
SELECT
  account_id,
  owner,
  balance
FROM vault_accounts
WHERE active = 1
ORDER BY account_id ASC;

CREATE TRIGGER trg_audit_balance
AFTER UPDATE OF balance ON vault_accounts
WHEN NEW.balance != OLD.balance
BEGIN
  INSERT INTO audit_log (account_id, old_balance, new_balance)
  VALUES (NEW.account_id, OLD.balance, NEW.balance);
END;
```

## Restored

Schema forge view and audit trigger online — `active_balances` exposes live active accounts while `trg_audit_balance` captures every real balance mutation.
