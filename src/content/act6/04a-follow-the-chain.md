---
id: follow-the-chain
kind: predict
title: Follow the chain
system: Dispatch line
symbol: equipment
scene: console
skills: linear-structures, classes, reading-code
---

## Briefing

A Python list stores its items side by side in memory. Removing from the **front** (`pop(0)`) forces Python to shift every remaining item down by one slot — `O(n)` work for a single removal. A **linked list** avoids shifting by storing each item in its own `Node` that simply points to the next node. Trace how the links change when nodes are chained together.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

Each node in a singly linked list holds two attributes:

- `val`: the data stored at that position.
- `next`: a reference to the next `Node`, or `None` at the end of the chain.

```python
class Node:
    def __init__(self, val, next_node=None):
        self.val = val
        self.next = next_node
```

Because nodes are connected by references rather than contiguous positions, inserting or removing at the front only changes one pointer — `O(1)` time no matter how long the chain is. The trade-off: jumping to the 50th item takes 50 hops instead of one index lookup.

## Hints

1. `head` starts pointing to `Node("Kite")` whose `.next` is `None`.
2. `head = Node("Wren", head)` puts `"Wren"` in front of `"Kite"`.
3. `head = head.next` moves `head` forward one step, dropping the front node.

## Program

```python
class Node:
    def __init__(self, val, next_node=None):
        self.val = val
        self.next = next_node


head = Node("Kite")
head = Node("Wren", head)
head = Node("Hawk", head)

head = head.next

current = head
while current is not None:
    print(current.val)
    current = current.next
```

## Output

```text
Wren
Kite
```

## Restored

You followed the chain from `head` to `None`, watching the front node drop off in a single pointer move.
