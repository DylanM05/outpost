---
id: idempotent-transfers
title: Guard money transfers with idempotency keys
system: Journal vault
symbol: equipment
scene: tests
skills: event-sourcing, financial-ledgers
---

## Briefing

When a network timeout drops the HTTP response for *"send $50 from Alice to Bob"*, the client retries with the same `Idempotency-Key`. Without idempotency handling, Alice gets charged twice! With strict idempotency, retrying the exact same payload replays the original receipt, while reusing that key for a *different* payload raises an error.

## Concept

Store `records[idem_key] = (payload_fingerprint, receipt)`:
- `payload_fingerprint = (src, dst, amount)`
- When `transfer(idem_key, src, dst, amount)` arrives:
  1. If `idem_key` was seen before:
     - If its stored fingerprint matches `(src, dst, amount)`: return the **exact saved receipt** WITHOUT moving money again!
     - If the fingerprint differs: raise `ValueError("idempotency key conflict")`!
  2. Otherwise validate `amount > 0`, `src != dst`, accounts exist, and `balances[src] >= amount` (else `ValueError`), move `amount` from `src` to `dst`, build `receipt = {"tx_num": next_tx, "src": src, "dst": dst, "amount": amount}`, save under `idem_key`, and return `receipt`!

*(Note: failed validation calls should NOT permanently consume the idempotency key!)*

## Objective

Implement `TransferService(initial_balances)` with:
- `transfer(self, idem_key, src, dst, amount)` -> returns `receipt` dict (`tx_num` starting at `1`, incrementing only for genuinely executed transfers).
- `balance(self, account)` -> returns integer balance.

## Hints

1. Check `idem_key in self.records` FIRST; compare stored `(src, dst, amount)` to detect payload mismatch.
2. Only increment `self.next_tx` and store in `self.records` after validation succeeds and balances update.

## Starter: guided

```python
class TransferService:
    def __init__(self, initial_balances):
        self.balances = dict(initial_balances)
        self.records = {}
        self.next_tx = 1

    def transfer(self, idem_key, src, dst, amount):
        fingerprint = (src, dst, amount)
        if idem_key in self.records:
            saved_fp, receipt = self.records[idem_key]
            # Return receipt if fingerprint matches, else raise ValueError
            pass
        # Validate transfer, update balances, record receipt, return receipt
        return {}

    def balance(self, account):
        return self.balances[account]
```

## Starter: standard

```python
class TransferService:
    def __init__(self, initial_balances):
        pass

    def transfer(self, idem_key, src, dst, amount):
        pass

    def balance(self, account):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _retry():
    svc = get("TransferService")({"alice": 500, "bob": 100})
    r1 = svc.transfer("k-1", "alice", "bob", 200)
    r2 = svc.transfer("k-1", "alice", "bob", 200)
    return (r1, r2, svc.balance("alice"), svc.balance("bob"))
expect("replays original receipt without charging twice", _retry, (
    {"tx_num": 1, "src": "alice", "dst": "bob", "amount": 200},
    {"tx_num": 1, "src": "alice", "dst": "bob", "amount": 200},
    300,
    300,
))

def _conflict():
    svc = get("TransferService")({"alice": 500, "bob": 100})
    svc.transfer("k-1", "alice", "bob", 100)
    try:
        svc.transfer("k-1", "alice", "bob", 250)
        return False
    except ValueError:
        return svc.balance("alice") == 400
expect("rejects reusing an idempotency key with a different payload", _conflict, True)
```

## Hidden checks

```python
def _failed_does_not_lock_key():
    svc = get("TransferService")({"alice": 50, "bob": 0})
    try:
        svc.transfer("k-2", "alice", "bob", 100)
    except ValueError:
        pass
    r = svc.transfer("k-2", "alice", "bob", 40)
    return (r["tx_num"], svc.balance("alice"), svc.balance("bob"))
expect("failed transfer does not poison the idempotency key", _failed_does_not_lock_key, (1, 10, 40))
```

## Solution

```python
class TransferService:
    def __init__(self, initial_balances):
        self.balances = dict(initial_balances)
        self.records = {}
        self.next_tx = 1

    def transfer(self, idem_key, src, dst, amount):
        fingerprint = (src, dst, amount)
        if idem_key in self.records:
            saved_fp, receipt = self.records[idem_key]
            if saved_fp != fingerprint:
                raise ValueError("idempotency key reused with different parameters")
            return dict(receipt)
        if src not in self.balances or dst not in self.balances:
            raise ValueError("unknown account")
        if src == dst or isinstance(amount, bool) or not isinstance(amount, int) or amount <= 0:
            raise ValueError("invalid transfer parameters")
        if self.balances[src] < amount:
            raise ValueError("insufficient funds")
        self.balances[src] -= amount
        self.balances[dst] += amount
        receipt = {"tx_num": self.next_tx, "src": src, "dst": dst, "amount": amount}
        self.next_tx += 1
        self.records[idem_key] = (fingerprint, receipt)
        return dict(receipt)

    def balance(self, account):
        return self.balances[account]
```

## Restored

Network retries replay exact receipts safely while mismatched key reuse fails loudly.
