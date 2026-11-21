---
id: urgent-repairs
title: Urgent repairs
system: Priority board
symbol: equipment
scene: work
skills: heaps, complexity
---

## Briefing

Now that you've built a min-heap by hand, you know what Python's built-in `heapq` module is doing under the hood. The workshop's repair board receives a stream of events — new fault tickets arriving and technicians pulling the most urgent open ticket. Right now the board re-sorts its whole backlog every time a technician asks for the next job. Replace the re-sorting with a priority queue.

## Objective

Write `run_board(events)`. `events` is a list of tuples:

- `("add", urgency, ticket_id)`: adds a ticket to the board (`urgency` is a number — smaller means more urgent; `ticket_id` is a string).
- `("next",)`: removes and records the `ticket_id` of the most urgent open ticket (smallest `urgency`; if two tickets tie on urgency, pick the smaller `ticket_id` alphabetically). If the board is empty, ignore `"next"`.

Return the list of `ticket_id`s dispatched, in the order they were pulled.

```python
run_board([
    ("add", 3, "door"),
    ("add", 1, "heater"),
    ("next",),
    ("add", 2, "antenna"),
    ("next",),
    ("next",),
])  # ["heater", "antenna", "door"]
```

The hidden test runs 900 events and allows 12,000 comparisons. Re-sorting on every `"next"` takes over 100,000.

## Concept

Python's `heapq` module turns any plain list into a min-heap:

```python
import heapq

board = []
heapq.heappush(board, (1, "heater"))
heapq.heappush(board, (3, "door"))
urgency, ticket_id = heapq.heappop(board)  # (1, "heater")
```

Python compares tuples element by element from left to right, so pushing `(urgency, ticket_id)` automatically breaks urgency ties alphabetically by `ticket_id`! Each `heappush` and `heappop` is `O(log n)`, so processing `m` events takes `O(m log m)` instead of `O(m² log m)`.

## Hints

1. `import heapq` and start with `heap = []` and `done = []`.
2. On `("add", urgency, ticket_id)`: `heapq.heappush(heap, (urgency, ticket_id))`.
3. On `("next",)`: if `heap`, pop `_, ticket_id = heapq.heappop(heap)` and append `ticket_id` to `done`.

## Starter: guided

```python
import heapq


def run_board(events):
    heap = []
    done = []
    for event in events:
        if event[0] == "add":
            # Push (urgency, ticket_id) onto heap.
            pass
        elif event[0] == "next":
            # If heap is non-empty, pop the most urgent ticket and append its id to done.
            pass
    return done
```

## Starter: standard

```python
def run_board(events):
    # Correct, but sorts the entire backlog on every "next" event.
    backlog = []
    done = []
    for event in events:
        if event[0] == "add":
            backlog.append((event[1], event[2]))
        elif event[0] == "next" and backlog:
            backlog.sort()
            _, ticket_id = backlog.pop(0)
            done.append(ticket_id)
    return done
```

## Starter: challenge

```python
```

## Checks

```python
sample = [
    ("add", 3, "door"),
    ("add", 1, "heater"),
    ("next",),
    ("add", 2, "antenna"),
    ("next",),
    ("next",),
]
expect("run_board(sample)", lambda: get("run_board")(sample), ["heater", "antenna", "door"])
ties = [
    ("add", 2, "relay-b"),
    ("add", 2, "relay-a"),
    ("next",),
    ("next",),
]
expect("tie-break alphabetically", lambda: get("run_board")(ties), ["relay-a", "relay-b"])
```

## Hidden checks

```python
expect("empty next events ignored", lambda: get("run_board")([("next",), ("add", 5, "lamp"), ("next",), ("next",)]), ["lamp"])

def _ref(events):
    import heapq as _hq
    h = []
    out = []
    for ev in events:
        if ev[0] == "add":
            _hq.heappush(h, (ev[1], ev[2]))
        elif ev[0] == "next" and h:
            out.append(_hq.heappop(h)[1])
    return out

raw_urgencies = [(i * 7919) % 1000 for i in range(600)]
comp_urgencies = compared(raw_urgencies)
plain_events = []
comp_events = []
for i in range(600):
    plain_events.append(("add", raw_urgencies[i], f"t{i:03d}"))
    comp_events.append(("add", comp_urgencies[i], f"t{i:03d}"))
    if i >= 200 and i % 2 == 0:
        plain_events.append(("next",))
        comp_events.append(("next",))
for _ in range(100):
    plain_events.append(("next",))
    comp_events.append(("next",))

expected_out = _ref(plain_events)
expect_comparisons(
    "run_board(900 events)",
    lambda: get("run_board")(comp_events),
    expected_out,
    len(comp_events),
    12000,
    "Use heapq.heappush and heapq.heappop instead of re-sorting the backlog on every step.",
)
```

## Solution

```python
import heapq


def run_board(events):
    heap = []
    done = []
    for event in events:
        if event[0] == "add":
            heapq.heappush(heap, (event[1], event[2]))
        elif event[0] == "next" and heap:
            _, ticket_id = heapq.heappop(heap)
            done.append(ticket_id)
    return done
```

## Restored

The priority board dispatches urgent repairs with `heapq` in a fraction of the comparisons, ready for the weighted route planner next.
