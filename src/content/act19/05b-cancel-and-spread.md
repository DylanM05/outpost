---
id: cancel-and-spread
title: Support O(1) lazy order cancellation and live spread
system: Matching floor
symbol: equipment
scene: tests
skills: matching-engines
---

## Briefing

Traders cancel resting orders thousands of times per second. Removing an arbitrary item from the middle of a binary heap takes $O(n)$ — instead, exchanges mark canceled order IDs in an `active` map in $O(1)$ and lazily pop dead entries off the top of the heap when matching or inspecting top-of-book!

## Concept

Keep `self.active` mapping live resting `order_id -> entry_list`:
- `cancel(order_id)`: remove `order_id` from `self.active` (returning `True` if it was resting and active, `False` otherwise!).
- Write a helper `_clean(heap)` that pops while `heap` is non-empty and `heap[0][2] not in self.active`!
- `best_bid()`: clean `bids`, return `-bids[0][0]` if non-empty else `None`.
- `best_ask()`: clean `asks`, return `asks[0][0]` if non-empty else `None`.
- `spread()`: if both `best_bid` and `best_ask` exist, return `best_ask - best_bid`, else `None`.

## Objective

Implement `LiveOrderBook` with `submit(order_id, side, price, qty)`, `cancel(order_id)`, `best_bid()`, `best_ask()`, and `spread()`.

## Hints

1. Whenever a resting order is completely filled during `submit()`, delete its `order_id` from `self.active` so a later `cancel()` returns `False`!
2. Call `_clean(opposite_heap)` at the top of the matching `while` loop so canceled orders never match!

## Starter: guided

```python
import heapq


class LiveOrderBook:
    def __init__(self):
        self.bids = []
        self.asks = []
        self.active = {}
        self.seq = 0

    def _clean(self, heap):
        while heap and heap[0][2] not in self.active:
            heapq.heappop(heap)

    def submit(self, order_id, side, price, qty):
        # Match skipping inactive entries, rest remaining qty in self.active
        return []

    def cancel(self, order_id):
        return self.active.pop(order_id, None) is not None

    def best_bid(self):
        self._clean(self.bids)
        return -self.bids[0][0] if self.bids else None

    def best_ask(self):
        self._clean(self.asks)
        return self.asks[0][0] if self.asks else None

    def spread(self):
        b, a = self.best_bid(), self.best_ask()
        return None if (b is None or a is None) else a - b
```

## Starter: standard

```python
import heapq


class LiveOrderBook:
    def __init__(self):
        pass

    def submit(self, order_id, side, price, qty):
        pass

    def cancel(self, order_id):
        pass

    def best_bid(self):
        pass

    def best_ask(self):
        pass

    def spread(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _cancel_and_spread():
    ob = get("LiveOrderBook")()
    ob.submit("b1", "buy", 95, 5)
    ob.submit("b2", "buy", 98, 5)
    ob.submit("s1", "sell", 102, 5)
    s_before = ob.spread()
    c1 = ob.cancel("b2")
    c2 = ob.cancel("b2")
    s_after = ob.spread()
    # Canceled b2 must NOT match an incoming sell at 97!
    trades = ob.submit("s2", "sell", 97, 3)
    return (s_before, c1, c2, s_after, trades, ob.best_ask())
expect("lazily skips canceled orders in top-of-book and matching", _cancel_and_spread, (4, True, False, 7, [], 97))
```

## Hidden checks

```python
def _filled_cannot_cancel():
    ob = get("LiveOrderBook")()
    ob.submit("s1", "sell", 100, 4)
    ob.submit("b1", "buy", 100, 4)
    return (ob.cancel("s1"), ob.best_bid(), ob.best_ask(), ob.spread())
expect("fully filled order returns False on cancel and clears book", _filled_cannot_cancel, (False, None, None, None))
```

## Solution

```python
import heapq


class LiveOrderBook:
    def __init__(self):
        self.bids = []
        self.asks = []
        self.active = {}
        self.seq = 0

    def _clean(self, heap):
        while heap and heap[0][2] not in self.active:
            heapq.heappop(heap)

    def submit(self, order_id, side, price, qty):
        if side not in ("buy", "sell") or price <= 0 or qty <= 0:
            raise ValueError("invalid order")
        self.seq += 1
        trades = []
        if side == "buy":
            while qty > 0:
                self._clean(self.asks)
                if not self.asks or self.asks[0][0] > price:
                    break
                top = self.asks[0]
                fill = min(qty, top[3])
                trades.append({"buy_id": order_id, "sell_id": top[2], "price": top[0], "qty": fill})
                qty -= fill
                top[3] -= fill
                if top[3] == 0:
                    heapq.heappop(self.asks)
                    self.active.pop(top[2], None)
            if qty > 0:
                entry = [-price, self.seq, order_id, qty]
                heapq.heappush(self.bids, entry)
                self.active[order_id] = entry
        else:
            while qty > 0:
                self._clean(self.bids)
                if not self.bids or -self.bids[0][0] < price:
                    break
                top = self.bids[0]
                fill = min(qty, top[3])
                trades.append({"buy_id": top[2], "sell_id": order_id, "price": -top[0], "qty": fill})
                qty -= fill
                top[3] -= fill
                if top[3] == 0:
                    heapq.heappop(self.bids)
                    self.active.pop(top[2], None)
            if qty > 0:
                entry = [price, self.seq, order_id, qty]
                heapq.heappush(self.asks, entry)
                self.active[order_id] = entry
        return trades

    def cancel(self, order_id):
        return self.active.pop(order_id, None) is not None

    def best_bid(self):
        self._clean(self.bids)
        return -self.bids[0][0] if self.bids else None

    def best_ask(self):
        self._clean(self.asks)
        return self.asks[0][0] if self.asks else None

    def spread(self):
        b, a = self.best_bid(), self.best_ask()
        return None if (b is None or a is None) else a - b
```

## Restored

Lazy-tombstone cancellation keeps top-of-book spreads accurate and cancellation strictly $O(1)$.
