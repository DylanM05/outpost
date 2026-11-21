---
id: maintenance-reverse-chain
title: Reverse a linked chain
system: Command stack
symbol: equipment
scene: tests
skills: linear-structures
reviewSkill: linear-structures
prerequisite: wait-times
---

## Briefing

Waypoints are stored as a singly linked list of `Node(val, next)` objects from base to ridge. Reverse the chain in place so the drone can follow it home.

## Objective

Given `Node` in the starter, write `reverse_chain(head)` that reverses the linked list **in place** by rewiring `.next` pointers and returns the new head node (or `None` if `head is None`).

```python
# A -> B -> C -> None  becomes  C -> B -> A -> None
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Keep `prev = None` and `curr = head`.
2. Inside `while curr is not None:`, save `nxt = curr.next`, point `curr.next = prev`, then advance `prev = curr` and `curr = nxt`.
3. Return `prev`.

## Starter

```python
class Node:
    def __init__(self, val, next_node=None):
        self.val = val
        self.next = next_node


def reverse_chain(head):
    return head
```

## Checks

```python
N = get("Node")
def _build(vals):
    h = None
    for v in reversed(vals):
        h = N(v, h)
    return h

def _vals(h):
    out = []
    while h is not None:
        out.append(h.val)
        h = h.next
    return out

expect("reverses A -> B -> C", lambda: _vals(get("reverse_chain")(_build(["A", "B", "C"]))), ["C", "B", "A"])
```

## Hidden checks

```python
expect("empty chain returns None", lambda: get("reverse_chain")(None), None)
expect("single node unchanged", lambda: _vals(get("reverse_chain")(_build([9]))), [9])
```

## Solution

```python
class Node:
    def __init__(self, val, next_node=None):
        self.val = val
        self.next = next_node


def reverse_chain(head):
    prev = None
    curr = head
    while curr is not None:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
```

## Restored

The waypoint chain flips in place with three pointers and zero extra memory.
