---
id: linked-dispatch
title: Linked dispatch
system: Dispatch line
symbol: equipment
scene: tests
skills: linear-structures, classes
---

## Briefing

Drones returning to the deep survey pad line up for recharging in strict first-in, first-out order. If you keep only a `head` pointer on a linked list, adding to the back means walking the whole chain every time. Keep both `head` and `tail` pointers so adding to the back and removing from the front are both instant.

## Objective

Write two classes:

1. `Node(val)`: stores `self.val = val` and `self.next = None`.
2. `LinkedQueue`: a FIFO queue backed by `Node` objects with `self.head`, `self.tail`, and a counter:
   - `enqueue(val)` adds a new `Node(val)` to the **back** (`tail`) in `O(1)` time.
   - `dequeue()` removes and returns the value at the **front** (`head`) in `O(1)` time, or returns `None` if empty.
   - `peek()` returns the front value without removing it, or `None` if empty.
   - `size()` returns the number of items in the queue.

Don't use a Python `list` or `deque` to store the items.

```python
q = LinkedQueue()
q.enqueue("Kite")
q.enqueue("Wren")
q.dequeue()  # "Kite"
q.peek()     # "Wren"
q.size()     # 1
```

## Concept

A **queue** is first-in, first-out (FIFO): items enter at the **tail** and leave from the **head**.

With both `self.head` and `self.tail` stored on the queue, there are two edge cases to get right:

- **Enqueuing into an empty queue:** both `self.head` and `self.tail` must point to the new node. Otherwise, link `self.tail.next = node` and move `self.tail = node`.
- **Dequeuing the last item:** when `self.head` becomes `None`, reset `self.tail = None` too, so the queue doesn't hold a stale pointer to the removed node.

Both operations touch a constant number of pointers — `O(1)` time regardless of how many drones are waiting.

## Hints

1. In `LinkedQueue.__init__`, set `self.head = None`, `self.tail = None`, and `self._size = 0`.
2. In `enqueue(val)`: make `node = Node(val)`. If `self.tail is None`, set both `self.head` and `self.tail` to `node`; else set `self.tail.next = node` and `self.tail = node`. Increment `self._size`.
3. In `dequeue()`: if `self.head is None`, return `None`. Save `val = self.head.val`, advance `self.head = self.head.next`, decrement `self._size`, and if `self.head is None`, set `self.tail = None`.

## Starter: guided

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


class LinkedQueue:
    def __init__(self):
        self.head = None
        self.tail = None
        self._size = 0

    def enqueue(self, val):
        node = Node(val)
        # Handle empty queue vs non-empty queue, and update self._size.
        pass

    def dequeue(self):
        if self.head is None:
            return None
        # Save head.val, move head forward, clear tail if now empty, update _size.
        return None

    def peek(self):
        return None if self.head is None else self.head.val

    def size(self):
        return self._size
```

## Starter: standard

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


class LinkedQueue:
    def __init__(self):
        self.head = None
        self.tail = None
        self._size = 0

    def enqueue(self, val):
        pass

    def dequeue(self):
        return None

    def peek(self):
        return None

    def size(self):
        return 0
```

## Starter: challenge

```python
```

## Checks

```python
check(
    "Uses linked nodes instead of deque",
    lambda: not uses("deque"),
    "Build the queue with Node objects and head/tail pointers.",
)
q = get("LinkedQueue")()
expect("empty dequeue() is None", lambda: q.dequeue(), None)
expect("empty peek() is None", lambda: q.peek(), None)
q.enqueue("Kite")
q.enqueue("Wren")
q.enqueue("Hawk")
expect("size after 3 enqueues", lambda: q.size(), 3)
expect("head is a Node holding 'Kite'", lambda: (isinstance(q.head, get("Node")), q.head.val), (True, "Kite"))
expect("tail is a Node holding 'Hawk'", lambda: (isinstance(q.tail, get("Node")), q.tail.val), (True, "Hawk"))
expect("first dequeue returns 'Kite'", lambda: q.dequeue(), "Kite")
expect("peek returns 'Wren'", lambda: q.peek(), "Wren")
expect("size is now 2", lambda: q.size(), 2)
```

## Hidden checks

```python
q2 = get("LinkedQueue")()
q2.enqueue("A")
expect("dequeue only element", lambda: q2.dequeue(), "A")
expect("tail resets to None when emptied", lambda: (q2.head, q2.tail, q2.size()), (None, None, 0), "Set self.tail = None when dequeuing the last node.")
q2.enqueue("B")
q2.enqueue("C")
expect("works cleanly after refilling", lambda: (q2.dequeue(), q2.dequeue(), q2.dequeue()), ("B", "C", None))

q3 = get("LinkedQueue")()
for i in range(2000):
    q3.enqueue(i)
out = [q3.dequeue() for _ in range(2000)]
expect("handles 2,000 items in FIFO order", lambda: (out[0], out[-1], len(out), q3.size()), (0, 1999, 2000, 0))
```

## Solution

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


class LinkedQueue:
    def __init__(self):
        self.head = None
        self.tail = None
        self._size = 0

    def enqueue(self, val):
        node = Node(val)
        if self.tail is None:
            self.head = node
            self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self._size += 1

    def dequeue(self):
        if self.head is None:
            return None
        val = self.head.val
        self.head = self.head.next
        self._size -= 1
        if self.head is None:
            self.tail = None
        return val

    def peek(self):
        if self.head is None:
            return None
        return self.head.val

    def size(self):
        return self._size
```

## Restored

The dispatch line now tracks both ends of the queue. Drones join at the tail and launch from the head in constant time.
