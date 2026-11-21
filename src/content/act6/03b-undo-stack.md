---
id: undo-stack
title: Undo stack
system: Command stack
symbol: equipment
scene: tests
skills: linear-structures, classes
---

## Briefing

The deep survey console keeps an action history so operators can step backwards when a route edit goes wrong. Build a `Stack` class from scratch, then use it to drive an `UndoLog` that records states and steps back cleanly.

## Objective

Write two classes:

1. `Stack`:
   - `push(item)` adds `item` to the top.
   - `pop()` removes and returns the top item, or returns `None` if the stack is empty.
   - `peek()` returns the top item without removing it, or `None` if empty.
   - `size()` returns the number of items on the stack.
   - `is_empty()` returns `True` if there are no items, `False` otherwise.
2. `UndoLog`:
   - Starts with `current = ""` and an empty `Stack` of previous states.
   - `write(text)` saves the current value onto the history stack and replaces `current` with `text`.
   - `undo()` restores `current` to the most recent value popped from the stack and returns it. If there is nothing to undo, leaves `current` unchanged and returns `None`.

```python
log = UndoLog()
log.write("north")
log.write("east")
log.undo()     # "north"  (log.current is now "north")
log.undo()     # ""       (log.current is now "")
log.undo()     # None
```

## Concept

Encapsulating a list inside `Stack` hides how items are stored and gives every caller a clear, minimal interface: you can only touch the top. Both `append` and `pop` at the end of a Python list run in `O(1)` time.

`UndoLog` shows **composition**: it *has* a `Stack` instead of inheriting from one. Every `write` pushes the old state before overwriting `current`, and `undo` pops it back.

## Hints

1. Store `self._items = []` inside `Stack.__init__`. Check `if not self._items: return None` before popping or peeking.
2. In `UndoLog.__init__`, set `self.current = ""` and `self._history = Stack()`.
3. In `UndoLog.write(text)`, push `self.current` *before* assigning `self.current = text`.
4. In `UndoLog.undo()`, if `self._history.is_empty()` return `None`; otherwise pop into `self.current` and return `self.current`.

## Starter: guided

```python
class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        # Return None when empty, otherwise remove and return the top item.
        return None

    def peek(self):
        # Return None when empty, otherwise return the top item.
        return None

    def size(self):
        return len(self._items)

    def is_empty(self):
        return len(self._items) == 0


class UndoLog:
    def __init__(self):
        self.current = ""
        self._history = Stack()

    def write(self, text):
        # Save self.current to self._history, then update self.current.
        self.current = text

    def undo(self):
        # If history is empty, return None. Otherwise restore and return self.current.
        return None
```

## Starter: standard

```python
class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        pass

    def pop(self):
        return None

    def peek(self):
        return None

    def size(self):
        return 0

    def is_empty(self):
        return True


class UndoLog:
    def __init__(self):
        self.current = ""

    def write(self, text):
        pass

    def undo(self):
        return None
```

## Starter: challenge

```python
```

## Checks

```python
s = get("Stack")()
expect("empty stack is_empty()", lambda: s.is_empty(), True)
expect("empty stack pop()", lambda: s.pop(), None)
expect("empty stack peek()", lambda: s.peek(), None)
s.push("a")
s.push("b")
expect("stack size after two pushes", lambda: s.size(), 2)
expect("stack peek returns top", lambda: s.peek(), "b")
expect("stack pop returns top", lambda: s.pop(), "b")
expect("stack pop returns first item", lambda: s.pop(), "a")

log = get("UndoLog")()
log.write("north")
log.write("east")
expect("first undo returns 'north'", lambda: log.undo(), "north")
expect("current is now 'north'", lambda: log.current, "north")
expect("second undo returns ''", lambda: log.undo(), "")
expect("third undo returns None", lambda: log.undo(), None)
```

## Hidden checks

```python
s2 = get("Stack")()
s2.push(0)
expect("stack handles falsy value 0", lambda: (s2.peek(), s2.pop(), s2.is_empty()), (0, 0, True))

log2 = get("UndoLog")()
log2.write("first")
log2.undo()
log2.write("second")
log2.write("third")
expect("undo after rewriting", lambda: (log2.undo(), log2.current, log2.undo(), log2.undo()), ("second", "second", "", None))
```

## Solution

```python
class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        if not self._items:
            return None
        return self._items.pop()

    def peek(self):
        if not self._items:
            return None
        return self._items[-1]

    def size(self):
        return len(self._items)

    def is_empty(self):
        return len(self._items) == 0


class UndoLog:
    def __init__(self):
        self.current = ""
        self._history = Stack()

    def write(self, text):
        self._history.push(self.current)
        self.current = text

    def undo(self):
        if self._history.is_empty():
            return None
        self.current = self._history.pop()
        return self.current
```

## Restored

The command console now tracks every edit on its undo stack. A mistyped coordinate is one keystroke away from gone.
