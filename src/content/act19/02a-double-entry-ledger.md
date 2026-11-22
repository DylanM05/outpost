---
id: double-entry-ledger
title: Enforce an immutable double-entry journal
system: Journal vault
symbol: equipment
scene: tests
skills: financial-ledgers
---

## Briefing

Updating a single `balance += 50` column makes bugs invisible and destroys audit trails. In **double-entry bookkeeping**, every transaction is an immutable **journal entry** of signed integer legs whose sum is **strictly `0`** — money never appears or disappears, it only moves between accounts!

## Concept

Represent each journal entry as `post(tx_id, legs)` where `legs` is a non-empty list of `(account, delta_cents)` tuples (`delta_cents` is a non-zero `int`):
1. Reject duplicate `tx_id` (`ValueError`).
2. Reject empty `legs`, any non-integer or `0` delta, or any entry where `sum(delta for _, delta in legs) != 0` (`ValueError("unbalanced entry")`)!
3. Some accounts (declared `no_overdraft=True`) may NEVER go negative (`balance < 0`). Before committing ANY leg, check every affected `no_overdraft` account's post-entry balance (handling multiple legs touching the same account in one entry!) — if any would drop `< 0`, raise `ValueError("insufficient funds")` leaving the ledger completely unchanged!
4. Only after all checks pass, append the entry to `self.journal` and update `self.balances`.

Notice the global invariant: at ALL times, `sum(self.balances.values()) == 0`!

## Objective

Implement `DoubleEntryLedger` with:
- `open_account(self, name, no_overdraft=False)` — creates account at balance `0` (raising `ValueError` if already exists).
- `post(self, tx_id, legs)` — validates accounts exist, `tx_id` unique, balanced zero-sum, non-zero integer deltas, and no overdrafts on `no_overdraft` accounts; commits atomically.
- `balance(self, name)` — returns integer balance (raising `KeyError` if unknown).
- `trial_balance(self)` — returns `sum(self.balances.values())` (always `0`!).

## Hints

1. Aggregate net change per account across `legs` first (`net[acc] += delta`) so a split entry like `[("a", -50), ("a", +20), ("b", +30)]` checks `balances["a"] - 30 >= 0` accurately!
2. Validate EVERYTHING before mutating `self.balances` or `self.journal` so failed postings are 100% atomic.

## Starter: guided

```python
class DoubleEntryLedger:
    def __init__(self):
        self.balances = {}
        self.no_overdraft = set()
        self.tx_ids = set()
        self.journal = []

    def open_account(self, name, no_overdraft=False):
        if name in self.balances:
            raise ValueError(f"account already exists: {name}")
        self.balances[name] = 0
        if no_overdraft:
            self.no_overdraft.add(name)

    def post(self, tx_id, legs):
        # Validate tx_id, legs non-empty, zero-sum, valid accounts, non-zero int deltas, no overdrafts, then commit
        pass

    def balance(self, name):
        return self.balances[name]

    def trial_balance(self):
        return sum(self.balances.values())
```

## Starter: standard

```python
class DoubleEntryLedger:
    def __init__(self):
        pass

    def open_account(self, name, no_overdraft=False):
        pass

    def post(self, tx_id, legs):
        pass

    def balance(self, name):
        pass

    def trial_balance(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _ledger():
    lg = get("DoubleEntryLedger")()
    lg.open_account("treasury", no_overdraft=False)
    lg.open_account("alice", no_overdraft=True)
    lg.open_account("bob", no_overdraft=True)
    lg.post("tx1", [("treasury", -1000), ("alice", 1000)])
    lg.post("tx2", [("alice", -350), ("bob", 350)])
    return (lg.balance("treasury"), lg.balance("alice"), lg.balance("bob"), lg.trial_balance())
expect("posts balanced entries and preserves zero-sum trial balance", _ledger, (-1000, 650, 350, 0))

def _atomic_reject():
    lg = get("DoubleEntryLedger")()
    lg.open_account("treasury", no_overdraft=False)
    lg.open_account("alice", no_overdraft=True)
    lg.open_account("bob", no_overdraft=True)
    lg.post("fund", [("treasury", -100), ("alice", 100)])
    errs = []
    for tx, legs in [
        ("bad1", [("alice", -50), ("bob", 40)]),       # unbalanced
        ("bad2", [("alice", -200), ("bob", 200)]),     # overdraft
        ("fund", [("alice", -10), ("bob", 10)]),       # duplicate tx_id
    ]:
        try:
            lg.post(tx, legs)
            errs.append("ok")
        except ValueError:
            errs.append("err")
    return (errs, lg.balance("alice"), lg.balance("bob"))
expect("atomically rejects unbalanced, overdraft, and duplicate entries", _atomic_reject, (["err", "err", "err"], 100, 0))
```

## Hidden checks

```python
def _bool_zero():
    lg = get("DoubleEntryLedger")()
    lg.open_account("a")
    lg.open_account("b")
    for legs in [[], [("a", 0), ("b", 0)], [("a", True), ("b", -1)]]:
        try:
            lg.post("t", legs)
            return False
        except ValueError:
            pass
    return True
expect("rejects empty, zero-delta, and bool-delta legs", _bool_zero, True)
```

## Solution

```python
class DoubleEntryLedger:
    def __init__(self):
        self.balances = {}
        self.no_overdraft = set()
        self.tx_ids = set()
        self.journal = []

    def open_account(self, name, no_overdraft=False):
        if name in self.balances:
            raise ValueError(f"account already exists: {name}")
        self.balances[name] = 0
        if no_overdraft:
            self.no_overdraft.add(name)

    def post(self, tx_id, legs):
        if tx_id in self.tx_ids:
            raise ValueError(f"duplicate tx_id: {tx_id}")
        if not legs:
            raise ValueError("journal entry must have at least one leg")
        net = {}
        total = 0
        for acc, delta in legs:
            if acc not in self.balances:
                raise ValueError(f"unknown account: {acc}")
            if isinstance(delta, bool) or not isinstance(delta, int) or delta == 0:
                raise ValueError("delta must be a non-zero integer")
            net[acc] = net.get(acc, 0) + delta
            total += delta
        if total != 0:
            raise ValueError("journal entry does not balance to zero")
        for acc, change in net.items():
            if acc in self.no_overdraft and self.balances[acc] + change < 0:
                raise ValueError(f"insufficient funds in {acc}")
        for acc, change in net.items():
            self.balances[acc] += change
        self.tx_ids.add(tx_id)
        self.journal.append((tx_id, list(legs)))

    def balance(self, name):
        return self.balances[name]

    def trial_balance(self):
        return sum(self.balances.values())
```

## Restored

Every credit has an equal debit, overdrafts abort atomically, and the global trial balance stays locked at zero.
