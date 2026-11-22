---
id: cow-fork
title: Share pages on fork with Copy-on-Write (CoW)
system: Page vault
symbol: equipment
scene: tests
skills: virtual-memory
---

## Briefing

When Unix `fork()` spawns a child process from a 4 GB parent, copying all 4 GB up front would be horribly slow — especially if the child immediately calls `exec()`. **Copy-on-Write (CoW)** points both page tables at the **same physical frames** (marking them shared/read-only) and only clones a frame on the first write!

## Concept

Track physical frames:
- `frames`: dict `frame_id -> data_value`
- `refcount`: dict `frame_id -> int` (how many process page tables currently reference `frame_id`)
- `proc_tables`: dict `pid -> {vpage: frame_id}`

Operations:
- `alloc(pid, vpage, value)`: allocate a brand-new `frame_id` (`0, 1, 2, ...`), store `frames[fid] = value`, `refcount[fid] = 1`, `proc_tables[pid][vpage] = fid`.
- `fork(parent_pid, child_pid)`: clone `parent_pid`'s page-table mapping into `child_pid` pointing to the **exact same `frame_id`s** (zero new frames allocated!) and increment `refcount[fid] += 1` for every mapped page!
- `read(pid, vpage)`: return `frames[proc_tables[pid][vpage]]`.
- `write(pid, vpage, new_value)`:
  - Look up `fid = proc_tables[pid][vpage]`.
  - If `refcount[fid] == 1`: sole owner! Update `frames[fid] = new_value` in place (zero copy!).
  - If `refcount[fid] > 1`: **CoW fault!** Decrement `refcount[fid] -= 1`, allocate a fresh `new_fid`, set `frames[new_fid] = new_value`, `refcount[new_fid] = 1`, `proc_tables[pid][vpage] = new_fid`, and increment `self.cow_copies += 1`!

## Objective

Implement `CowMemory` with `alloc(pid, vpage, value)`, `fork(parent_pid, child_pid)`, `read(pid, vpage)`, `write(pid, vpage, value)`, and attribute `cow_copies` (integer count of CoW frame clones performed).

## Hints

1. Track `self.next_frame = 0` so each newly allocated physical frame gets a unique ID.
2. When `refcount[fid] == 1`, writing directly mutates `frames[fid]` without incrementing `cow_copies` — notice that after one process faults and clones a 2-way shared frame, the *other* process now has `refcount == 1` and won't trigger an unnecessary second copy if it later writes!

## Starter: guided

```python
class CowMemory:
    def __init__(self):
        self.next_frame = 0
        self.frames = {}
        self.refcount = {}
        self.tables = {}
        self.cow_copies = 0

    def alloc(self, pid, vpage, value):
        fid = self.next_frame
        self.next_frame += 1
        self.frames[fid] = value
        self.refcount[fid] = 1
        self.tables.setdefault(pid, {})[vpage] = fid

    def fork(self, parent_pid, child_pid):
        # Copy parent page table entries to child without allocating frames; increment refcounts
        pass

    def read(self, pid, vpage):
        return self.frames[self.tables[pid][vpage]]

    def write(self, pid, vpage, value):
        # Mutate in place if refcount == 1, else clone to new frame and increment cow_copies
        pass
```

## Starter: standard

```python
class CowMemory:
    def __init__(self):
        pass

    def alloc(self, pid, vpage, value):
        pass

    def fork(self, parent_pid, child_pid):
        pass

    def read(self, pid, vpage):
        pass

    def write(self, pid, vpage, value):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _cow():
    m = get("CowMemory")()
    m.alloc("p1", 0, "alpha")
    m.alloc("p1", 1, "beta")
    frames_before = len(m.frames)
    m.fork("p1", "p2")
    frames_after_fork = len(m.frames)
    m.write("p2", 0, "ALPHA_CHILD")
    # p1 should still see "alpha", p2 sees "ALPHA_CHILD", page 1 stays shared!
    # Now p1 writes page 0 -> sole owner now, should NOT trigger a 2nd CoW copy!
    m.write("p1", 0, "ALPHA_PARENT")
    return (
        frames_before,
        frames_after_fork,
        m.cow_copies,
        m.read("p1", 0),
        m.read("p2", 0),
        m.read("p2", 1),
    )
expect("shares frames on fork, copies once on write, and avoids redundant copy for sole remaining owner", _cow, (2, 2, 1, "ALPHA_PARENT", "ALPHA_CHILD", "beta"))
```

## Hidden checks

```python
def _three_way():
    m = get("CowMemory")()
    m.alloc("p1", 0, "orig")
    m.fork("p1", "p2")
    m.fork("p1", "p3")
    m.write("p2", 0, "v2")
    m.write("p3", 0, "v3")
    return (m.cow_copies, m.read("p1", 0), m.read("p2", 0), m.read("p3", 0))
expect("handles 3-way shared page cleanly", _three_way, (2, "orig", "v2", "v3"))
```

## Solution

```python
class CowMemory:
    def __init__(self):
        self.next_frame = 0
        self.frames = {}
        self.refcount = {}
        self.tables = {}
        self.cow_copies = 0

    def alloc(self, pid, vpage, value):
        fid = self.next_frame
        self.next_frame += 1
        self.frames[fid] = value
        self.refcount[fid] = 1
        self.tables.setdefault(pid, {})[vpage] = fid

    def fork(self, parent_pid, child_pid):
        parent_tbl = self.tables.get(parent_pid, {})
        self.tables[child_pid] = dict(parent_tbl)
        for fid in parent_tbl.values():
            self.refcount[fid] += 1

    def read(self, pid, vpage):
        return self.frames[self.tables[pid][vpage]]

    def write(self, pid, vpage, value):
        fid = self.tables[pid][vpage]
        if self.refcount[fid] == 1:
            self.frames[fid] = value
            return
        self.refcount[fid] -= 1
        new_fid = self.next_frame
        self.next_frame += 1
        self.frames[new_fid] = value
        self.refcount[new_fid] = 1
        self.tables[pid][vpage] = new_fid
        self.cow_copies += 1
```

## Restored

Process forks now share frames instantly and copy only the exact pages that diverge on write.
