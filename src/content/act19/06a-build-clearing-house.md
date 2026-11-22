---
id: build-clearing-house
title: Build an end-to-end clearing house and matching engine
system: Ledger audit
symbol: controller
scene: tests
assessment: true
skills: financial-ledgers, event-sourcing, matching-engines
---

## Briefing

Tie the entire ledger house together into a single `ClearingHouse`: integer-cent double-entry accounts, idempotent deposits, price-time limit order matching, atomic trade settlement across cash and asset accounts, and a zero-sum trial balance invariant!

## Concept

Each user has a cash balance in integer cents (strictly `>= 0`!) and an asset unit balance (strictly `>= 0`!), backed by a `"treasury"` cash account and `"inventory"` asset account so BOTH cash and asset books ALWAYS sum to `0`:
- `deposit_cash(idem_key, user, cents)`: idempotent deposit (`treasury -= cents`, `cash[user] += cents`). Replaying the exact same `(idem_key, user, cents)` is a no-op returning `True`; reusing `idem_key` with different `(user, cents)` raises `ValueError`!
- `deposit_asset(idem_key, user, units)`: same idempotency semantics on the asset book (`inventory -= units`, `asset[user] += units`).
- `place_order(order_id, user, side, price_cents, qty)`:
  - Match against the opposite side of the price-time priority limit order book!
  - Whenever a buy (`buyer`) matches a sell (`seller`) for `fill_qty` at `maker_price`:
    - Settle `notional = maker_price * fill_qty` atomically: `cash[buyer] -= notional`, `cash[seller] += notional`, `asset[seller] -= fill_qty`, `asset[buyer] += fill_qty`!
  - Guard affordability up front:
    - Before placing a `"buy"` order, verify `available_cash(user) >= price_cents * qty` (and reserve `price_cents * qty` while resting, releasing any price-improvement savings `(order_price - trade_price) * fill_qty` on each fill!).
    - Before placing a `"sell"` order, verify `available_asset(user) >= qty` (and reserve `qty` while resting!).
    - If insufficient available funds/assets, raise `ValueError("insufficient funds")` without modifying book or balances!
- `cancel_order(order_id)`: cancels a resting order and releases its remaining reserved cash or asset!
- `cash_balance(user)` / `asset_balance(user)` / `trial_balances()` returning `(sum_all_cash_including_treasury, sum_all_assets_including_inventory)` — ALWAYS `(0, 0)`!

## Objective

Implement `ClearingHouse` with `deposit_cash`, `deposit_asset`, `place_order`, `cancel_order`, `cash_balance`, `asset_balance`, and `trial_balances`.

## Hints

1. Track `reserved_cash[user]` and `reserved_asset[user]` separately from settled `cash[user]` and `asset[user]`:
   - `available_cash = cash[user] - reserved_cash[user]`
   - On resting a buy of `(price, qty)`: reserve `price * qty`. On each fill of `fill_qty` at `trade_price`: release `resting_price * fill_qty` from buyer's reserve and transfer `trade_price * fill_qty` cash!
   - On cancelling a resting buy of `(price, rem_qty)`: release `price * rem_qty`!
2. For an aggressive (taker) buy, check `available_cash >= price * qty` before matching; each fill transfers `maker_price * fill_qty` directly (leaving any price improvement automatically unspent!), and if `rem_qty > 0` rests on the book, reserve `price * rem_qty`!

## Starter: guided

```python
import heapq


class ClearingHouse:
    def __init__(self):
        self.cash = {"treasury": 0}
        self.asset = {"inventory": 0}
        self.reserved_cash = {}
        self.reserved_asset = {}
        self.idem = {}
        self.bids = []
        self.asks = []
        self.active = {}
        self.seq = 0

    def deposit_cash(self, idem_key, user, cents):
        pass

    def deposit_asset(self, idem_key, user, units):
        pass

    def cash_balance(self, user):
        return self.cash.get(user, 0)

    def asset_balance(self, user):
        return self.asset.get(user, 0)

    def trial_balances(self):
        return (sum(self.cash.values()), sum(self.asset.values()))

    def place_order(self, order_id, user, side, price_cents, qty):
        return []

    def cancel_order(self, order_id):
        return False
```

## Starter: standard

```python
import heapq


class ClearingHouse:
    def __init__(self):
        pass

    def deposit_cash(self, idem_key, user, cents):
        pass

    def deposit_asset(self, idem_key, user, units):
        pass

    def cash_balance(self, user):
        pass

    def asset_balance(self, user):
        pass

    def trial_balances(self):
        pass

    def place_order(self, order_id, user, side, price_cents, qty):
        pass

    def cancel_order(self, order_id):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _clearing():
    ch = get("ClearingHouse")()
    ch.deposit_cash("dep-1", "alice", 1000)
    ch.deposit_cash("dep-1", "alice", 1000)  # idempotent retry!
    ch.deposit_asset("dep-2", "bob", 10)

    # Bob sells 4 units at 200 cents; Alice bids 5 units at 220 cents -> 4 fill at 200, 1 rests at 220!
    t1 = ch.place_order("s1", "bob", "sell", 200, 4)
    t2 = ch.place_order("b1", "alice", "buy", 220, 5)
    # Alice now has 1000 - 800 = 200 cash (all 200? Wait: 1 resting at 220 needs 220! Let's check affordability!)
    return (t1, t2)

def _clearing_clean():
    ch = get("ClearingHouse")()
    ch.deposit_cash("dep-1", "alice", 1200)
    ch.deposit_cash("dep-1", "alice", 1200)  # idempotent retry!
    ch.deposit_asset("dep-2", "bob", 10)

    ch.place_order("s1", "bob", "sell", 200, 4)
    trades = ch.place_order("b1", "alice", "buy", 220, 5)
    # 4 filled at 200 (=800 spent), 1 resting at 220 (=220 reserved, 180 available)
    # Trying to buy 1 more at 200 must fail (only 180 available)!
    try:
        ch.place_order("b2", "alice", "buy", 200, 1)
        blocked = False
    except ValueError:
        blocked = True
    # Cancel b1 -> releases 220 reserve -> now b2 succeeds!
    canceled = ch.cancel_order("b1")
    ch.place_order("b2", "alice", "buy", 200, 1)
    return (
        trades,
        blocked,
        canceled,
        ch.cash_balance("alice"),
        ch.cash_balance("bob"),
        ch.asset_balance("alice"),
        ch.asset_balance("bob"),
        ch.trial_balances(),
    )
expect("matches, settles double-entry accounts, enforces reserves, and preserves zero-sum trial balances", _clearing_clean, (
    [{"buy_id": "b1", "sell_id": "s1", "price": 200, "qty": 4}],
    True,
    True,
    400,
    800,
    4,
    6,
    (0, 0),
))
```

## Hidden checks

```python
def _idem_conflict_and_oversell():
    ch = get("ClearingHouse")()
    ch.deposit_cash("k1", "alice", 500)
    try:
        ch.deposit_cash("k1", "alice", 600)
        conflict = False
    except ValueError:
        conflict = True
    try:
        ch.place_order("s1", "alice", "sell", 100, 1)
        oversell = False
    except ValueError:
        oversell = True
    return (conflict, oversell, ch.trial_balances())
expect("rejects idempotency conflict and unbacked short sells", _idem_conflict_and_oversell, (True, True, (0, 0)))
```

## Solution

```python
import heapq


class ClearingHouse:
    def __init__(self):
        self.cash = {"treasury": 0}
        self.asset = {"inventory": 0}
        self.reserved_cash = {}
        self.reserved_asset = {}
        self.idem = {}
        self.bids = []
        self.asks = []
        self.active = {}  # order_id -> [heap_price, seq, order_id, qty, user, side, limit_price]
        self.seq = 0

    def deposit_cash(self, idem_key, user, cents):
        if isinstance(cents, bool) or not isinstance(cents, int) or cents <= 0:
            raise ValueError("cents must be positive int")
        fp = ("cash", user, cents)
        if idem_key in self.idem:
            if self.idem[idem_key] != fp:
                raise ValueError("idempotency key conflict")
            return True
        self.cash["treasury"] -= cents
        self.cash[user] = self.cash.get(user, 0) + cents
        self.idem[idem_key] = fp
        return True

    def deposit_asset(self, idem_key, user, units):
        if isinstance(units, bool) or not isinstance(units, int) or units <= 0:
            raise ValueError("units must be positive int")
        fp = ("asset", user, units)
        if idem_key in self.idem:
            if self.idem[idem_key] != fp:
                raise ValueError("idempotency key conflict")
            return True
        self.asset["inventory"] -= units
        self.asset[user] = self.asset.get(user, 0) + units
        self.idem[idem_key] = fp
        return True

    def cash_balance(self, user):
        return self.cash.get(user, 0)

    def asset_balance(self, user):
        return self.asset.get(user, 0)

    def trial_balances(self):
        return (sum(self.cash.values()), sum(self.asset.values()))

    def _avail_cash(self, user):
        return self.cash.get(user, 0) - self.reserved_cash.get(user, 0)

    def _avail_asset(self, user):
        return self.asset.get(user, 0) - self.reserved_asset.get(user, 0)

    def _clean(self, heap):
        while heap and heap[0][2] not in self.active:
            heapq.heappop(heap)

    def place_order(self, order_id, user, side, price_cents, qty):
        if side not in ("buy", "sell") or price_cents <= 0 or qty <= 0:
            raise ValueError("invalid order")
        if order_id in self.active:
            raise ValueError("duplicate order_id")
        if side == "buy":
            if self._avail_cash(user) < price_cents * qty:
                raise ValueError("insufficient funds")
        else:
            if self._avail_asset(user) < qty:
                raise ValueError("insufficient assets")

        self.seq += 1
        trades = []
        if side == "buy":
            while qty > 0:
                self._clean(self.asks)
                if not self.asks or self.asks[0][0] > price_cents:
                    break
                top = self.asks[0]
                maker_price = top[0]
                maker_id = top[2]
                seller = top[4]
                fill = min(qty, top[3])
                notional = maker_price * fill
                self.cash[user] = self.cash.get(user, 0) - notional
                self.cash[seller] = self.cash.get(seller, 0) + notional
                self.asset[seller] = self.asset.get(seller, 0) - fill
                self.asset[user] = self.asset.get(user, 0) + fill
                self.reserved_asset[seller] -= fill
                trades.append({"buy_id": order_id, "sell_id": maker_id, "price": maker_price, "qty": fill})
                qty -= fill
                top[3] -= fill
                if top[3] == 0:
                    heapq.heappop(self.asks)
                    self.active.pop(maker_id, None)
            if qty > 0:
                self.reserved_cash[user] = self.reserved_cash.get(user, 0) + price_cents * qty
                entry = [-price_cents, self.seq, order_id, qty, user, "buy", price_cents]
                heapq.heappush(self.bids, entry)
                self.active[order_id] = entry
        else:
            while qty > 0:
                self._clean(self.bids)
                if not self.bids or -self.bids[0][0] < price_cents:
                    break
                top = self.bids[0]
                maker_price = -top[0]
                maker_id = top[2]
                buyer = top[4]
                fill = min(qty, top[3])
                notional = maker_price * fill
                self.cash[buyer] = self.cash.get(buyer, 0) - notional
                self.cash[user] = self.cash.get(user, 0) + notional
                self.asset[user] = self.asset.get(user, 0) - fill
                self.asset[buyer] = self.asset.get(buyer, 0) + fill
                self.reserved_cash[buyer] -= maker_price * fill
                trades.append({"buy_id": maker_id, "sell_id": order_id, "price": maker_price, "qty": fill})
                qty -= fill
                top[3] -= fill
                if top[3] == 0:
                    heapq.heappop(self.bids)
                    self.active.pop(maker_id, None)
            if qty > 0:
                self.reserved_asset[user] = self.reserved_asset.get(user, 0) + qty
                entry = [price_cents, self.seq, order_id, qty, user, "sell", price_cents]
                heapq.heappush(self.asks, entry)
                self.active[order_id] = entry
        return trades

    def cancel_order(self, order_id):
        entry = self.active.pop(order_id, None)
        if entry is None:
            return False
        _, _, _, rem_qty, user, side, limit_price = entry
        if side == "buy":
            self.reserved_cash[user] -= limit_price * rem_qty
        else:
            self.reserved_asset[user] -= rem_qty
        return True
```

## Restored

The clearing house settles matched orders atomically across double-entry cash and asset accounts while keeping reserves and trial balances airtight.
