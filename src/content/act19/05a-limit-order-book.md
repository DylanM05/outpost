---
id: limit-order-book
title: Match bids and asks by price-time priority
system: Matching floor
symbol: equipment
scene: tests
skills: matching-engines
---

## Briefing

Financial exchanges match buyers (`"buy"`) and sellers (`"sell"`) in a **Limit Order Book** using strict **price-time priority**:
- Incoming **buys** match against the **lowest-priced** resting asks first (as long as `ask_price <= buy_price`), breaking equal-price ties by earliest arrival (FIFO).
- Incoming **sells** match against the **highest-priced** resting bids first (as long as `bid_price >= sell_price`), breaking equal-price ties by earliest arrival (FIFO).
- Every trade executes at the **resting (maker) order's price**! Any remaining unfilled quantity rests on the book.

## Concept

Store resting bids sorted by `(-price, seq)` and resting asks sorted by `(price, seq)` (using `heapq` or a sorted list — `heapq` is $O(\log n)$!).
When `submit(order_id, side, price, qty)` arrives (`side` in `("buy", "sell")`, `price > 0`, `qty > 0`):
- Match greedily against the best opposite resting order while `qty > 0` and prices cross (`ask_price <= price` for a buy; `bid_price >= price` for a sell).
- Fill `fill_qty = min(qty, maker_qty)` at `maker_price`, emit `{"buy_id": ..., "sell_id": ..., "price": maker_price, "qty": fill_qty}`, decrement both quantities, and remove fully filled maker orders.
- If `qty > 0` remains after crossing everything possible, rest the remainder on its side of the book!

## Objective

Implement `OrderBook` with:
- `submit(self, order_id, side, price, qty)` -> validates `side in ("buy", "sell")`, `price > 0`, `qty > 0` (else `ValueError`), executes all crossing fills, rests any remaining `qty`, and returns the list of trade dicts `[{"buy_id", "sell_id", "price", "qty"}, ...]`.

## Hints

1. Use an incrementing `self.seq` counter on every order so FIFO time priority is exact!
2. With `heapq`: store asks as `[price, seq, order_id, qty]` and bids as `[-price, seq, order_id, qty]` (using mutable lists lets you decrement `entry[3]` in place for partial fills!).

## Starter: guided

```python
import heapq


class OrderBook:
    def __init__(self):
        self.bids = []  # [-price, seq, order_id, qty]
        self.asks = []  # [price, seq, order_id, qty]
        self.seq = 0

    def submit(self, order_id, side, price, qty):
        if side not in ("buy", "sell") or price <= 0 or qty <= 0:
            raise ValueError("invalid order")
        self.seq += 1
        trades = []
        # Match against opposite heap while prices cross and qty > 0; rest remainder if qty > 0
        return trades
```

## Starter: standard

```python
import heapq


class OrderBook:
    def __init__(self):
        pass

    def submit(self, order_id, side, price, qty):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _match():
    ob = get("OrderBook")()
    ob.submit("s1", "sell", 100, 5)
    ob.submit("s2", "sell", 100, 5)
    ob.submit("s3", "sell", 98, 4)
    trades = ob.submit("b1", "buy", 101, 10)
    return trades
expect("matches best price first, then FIFO time priority, at maker prices", _match, [
    {"buy_id": "b1", "sell_id": "s3", "price": 98, "qty": 4},
    {"buy_id": "b1", "sell_id": "s1", "price": 100, "qty": 5},
    {"buy_id": "b1", "sell_id": "s2", "price": 100, "qty": 1},
])

def _partial_rest():
    ob = get("OrderBook")()
    t1 = ob.submit("b1", "buy", 50, 10)
    t2 = ob.submit("s1", "sell", 48, 6)
    t3 = ob.submit("s2", "sell", 50, 6)
    return (t1, t2, t3)
expect("rests partial remainder and fills it on subsequent crossing order", _partial_rest, (
    [],
    [{"buy_id": "b1", "sell_id": "s1", "price": 50, "qty": 6}],
    [{"buy_id": "b1", "sell_id": "s2", "price": 50, "qty": 4}],
))
```

## Hidden checks

```python
def _no_cross():
    ob = get("OrderBook")()
    ob.submit("b1", "buy", 99, 5)
    return ob.submit("s1", "sell", 100, 5)
expect("non-crossing bid and ask produce no trades", _no_cross, [])
```

## Solution

```python
import heapq


class OrderBook:
    def __init__(self):
        self.bids = []
        self.asks = []
        self.seq = 0

    def submit(self, order_id, side, price, qty):
        if side not in ("buy", "sell") or price <= 0 or qty <= 0:
            raise ValueError("invalid order")
        self.seq += 1
        trades = []
        if side == "buy":
            while qty > 0 and self.asks and self.asks[0][0] <= price:
                top = self.asks[0]
                fill = min(qty, top[3])
                trades.append({"buy_id": order_id, "sell_id": top[2], "price": top[0], "qty": fill})
                qty -= fill
                top[3] -= fill
                if top[3] == 0:
                    heapq.heappop(self.asks)
            if qty > 0:
                heapq.heappush(self.bids, [-price, self.seq, order_id, qty])
        else:
            while qty > 0 and self.bids and -self.bids[0][0] >= price:
                top = self.bids[0]
                fill = min(qty, top[3])
                trades.append({"buy_id": top[2], "sell_id": order_id, "price": -top[0], "qty": fill})
                qty -= fill
                top[3] -= fill
                if top[3] == 0:
                    heapq.heappop(self.bids)
            if qty > 0:
                heapq.heappush(self.asks, [price, self.seq, order_id, qty])
        return trades
```

## Restored

Bids and asks now match by strict price-time priority at resting maker prices.
