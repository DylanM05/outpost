---
id: build-mini-kernel
title: Build an end-to-end mini OS kernel
system: Kernel audit
symbol: controller
scene: tests
assessment: true
skills: cpu-scheduling, virtual-memory, os-filesystems
---

## Briefing

Bring the entire iron room online by assembling `MiniKernel` — combining a Multi-Level Feedback Queue scheduler, Copy-on-Write per-process virtual memory, and a Unix-style reference-counted inode filesystem into one working microkernel!

## Concept

Your `MiniKernel(quanta=[2, 4])` integrates three subsystems:
1. **MLFQ Scheduler:**
   - `spawn(pid, burst)`: enqueue `pid` at priority level `0` with `burst` ticks and an empty virtual page table.
   - `tick()`: execute ONE MLFQ slice (pick highest-priority non-empty queue, run `ran = min(quanta[lvl], rem[pid])`, advance `self.time += ran`, demote one level if `rem > 0` and full quantum was used), returning `(pid, level, ran, self.time)` (or `None` when idle).
2. **Copy-on-Write Virtual Memory:**
   - `alloc_page(pid, vpage, value)`: allocate a fresh physical frame (`refcount = 1`) mapped to `(pid, vpage)`.
   - `fork(parent_pid, child_pid, child_burst)`: spawn `child_pid` at level `0` with `child_burst` AND share every mapped physical frame from `parent_pid` (incrementing frame `refcount`s with zero immediate copies!).
   - `read_page(pid, vpage)`: return frame data.
   - `write_page(pid, vpage, value)`: mutate in place if `refcount == 1`; otherwise CoW-clone to a fresh frame, decrement old `refcount`, and increment `self.cow_copies += 1`!
3. **Inode Filesystem:**
   - `create_file(name, data="")`, `link_file(existing, new_name)`, `read_file(name)`, `write_file(name, data)`, `unlink_file(name)`, `stat_file(name)` (`{"ino", "nlink", "size"}`) with standard `FileExistsError` / `FileNotFoundError` and `nlink == 0` reclamation!

## Objective

Implement `MiniKernel(quanta=(2, 4))` exposing all methods above plus `self.cow_copies` and `self.inodes`.

## Hints

1. Keep each subsystem's state cleanly separated on `self` (`queues`/`rem`/`time`, `frames`/`refcount`/`tables`/`cow_copies`, `dir_entries`/`inodes`/`next_ino`).
2. In `fork()`, check `parent_pid in self.tables` (raise `KeyError` if unknown), enqueue `child_pid` at level `0`, copy the page table dict, and bump each frame's `refcount`.

## Starter: guided

```python
from collections import deque


class MiniKernel:
    def __init__(self, quanta=(2, 4)):
        self.quanta = list(quanta)
        self.queues = [deque() for _ in self.quanta]
        self.rem = {}
        self.time = 0
        self.next_frame = 0
        self.frames = {}
        self.refcount = {}
        self.tables = {}
        self.cow_copies = 0
        self.next_ino = 1
        self.dir_entries = {}
        self.inodes = {}

    def spawn(self, pid, burst):
        pass

    def tick(self):
        return None

    def alloc_page(self, pid, vpage, value):
        pass

    def fork(self, parent_pid, child_pid, child_burst):
        pass

    def read_page(self, pid, vpage):
        pass

    def write_page(self, pid, vpage, value):
        pass

    def create_file(self, name, data=""):
        pass

    def link_file(self, existing, new_name):
        pass

    def read_file(self, name):
        pass

    def write_file(self, name, data):
        pass

    def unlink_file(self, name):
        pass

    def stat_file(self, name):
        pass
```

## Starter: standard

```python
from collections import deque


class MiniKernel:
    def __init__(self, quanta=(2, 4)):
        pass

    def spawn(self, pid, burst):
        pass

    def tick(self):
        pass

    def alloc_page(self, pid, vpage, value):
        pass

    def fork(self, parent_pid, child_pid, child_burst):
        pass

    def read_page(self, pid, vpage):
        pass

    def write_page(self, pid, vpage, value):
        pass

    def create_file(self, name, data=""):
        pass

    def link_file(self, existing, new_name):
        pass

    def read_file(self, name):
        pass

    def write_file(self, name, data):
        pass

    def unlink_file(self, name):
        pass

    def stat_file(self, name):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
def _kernel():
    k = get("MiniKernel")(quanta=[2, 4])
    k.spawn("init", 5)
    k.alloc_page("init", 0, "boot")
    k.alloc_page("init", 1, "cfg")
    k.fork("init", "worker", 1)
    k.write_page("worker", 0, "worker-mem")

    t1 = k.tick()  # init runs 2 at lvl 0 -> demotes to lvl 1
    t2 = k.tick()  # worker runs 1 at lvl 0 -> finishes!
    t3 = k.tick()  # init runs 3 at lvl 1 -> finishes!

    k.create_file("notes", "v1")
    k.link_file("notes", "notes.bak")
    k.write_file("notes.bak", "v2")
    k.unlink_file("notes")
    st = k.stat_file("notes.bak")
    content = k.read_file("notes.bak")
    k.unlink_file("notes.bak")

    return (
        [t1, t2, t3],
        k.cow_copies,
        k.read_page("init", 0),
        k.read_page("worker", 0),
        k.read_page("worker", 1),
        st,
        content,
        len(k.inodes),
    )
expect("coordinates MLFQ scheduling, CoW memory forks, and hard-linked inodes", _kernel, (
    [("init", 0, 2, 2), ("worker", 0, 1, 3), ("init", 1, 3, 6)],
    1,
    "boot",
    "worker-mem",
    "cfg",
    {"ino": 1, "nlink": 1, "size": 2},
    "v2",
    0,
))
```

## Hidden checks

```python
def _sole_owner_write():
    k = get("MiniKernel")()
    k.spawn("p1", 2)
    k.alloc_page("p1", 0, "a")
    k.write_page("p1", 0, "b")
    return (k.cow_copies, k.read_page("p1", 0), k.tick(), k.tick())
expect("sole owner writes without CoW copy and idle tick returns None", _sole_owner_write, (0, "b", ("p1", 0, 2, 2), None))
```

## Solution

```python
from collections import deque


class MiniKernel:
    def __init__(self, quanta=(2, 4)):
        if not quanta or any(q < 1 for q in quanta):
            raise ValueError("quanta must be positive")
        self.quanta = list(quanta)
        self.queues = [deque() for _ in self.quanta]
        self.rem = {}
        self.time = 0
        self.next_frame = 0
        self.frames = {}
        self.refcount = {}
        self.tables = {}
        self.cow_copies = 0
        self.next_ino = 1
        self.dir_entries = {}
        self.inodes = {}

    def spawn(self, pid, burst):
        if burst < 1:
            raise ValueError("burst must be >= 1")
        self.rem[pid] = burst
        self.tables.setdefault(pid, {})
        self.queues[0].append(pid)

    def tick(self):
        level = None
        for idx, q in enumerate(self.queues):
            if q:
                level = idx
                break
        if level is None:
            return None
        pid = self.queues[level].popleft()
        quantum = self.quanta[level]
        ran = min(quantum, self.rem[pid])
        self.time += ran
        self.rem[pid] -= ran
        if self.rem[pid] > 0:
            next_lvl = min(level + 1, len(self.quanta) - 1) if ran == quantum else level
            self.queues[next_lvl].append(pid)
        return (pid, level, ran, self.time)

    def alloc_page(self, pid, vpage, value):
        fid = self.next_frame
        self.next_frame += 1
        self.frames[fid] = value
        self.refcount[fid] = 1
        self.tables.setdefault(pid, {})[vpage] = fid

    def fork(self, parent_pid, child_pid, child_burst):
        if parent_pid not in self.tables:
            raise KeyError(parent_pid)
        self.spawn(child_pid, child_burst)
        self.tables[child_pid] = dict(self.tables[parent_pid])
        for fid in self.tables[child_pid].values():
            self.refcount[fid] += 1

    def read_page(self, pid, vpage):
        return self.frames[self.tables[pid][vpage]]

    def write_page(self, pid, vpage, value):
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

    def create_file(self, name, data=""):
        if name in self.dir_entries:
            raise FileExistsError(name)
        ino = self.next_ino
        self.next_ino += 1
        self.inodes[ino] = {"data": data, "nlink": 1}
        self.dir_entries[name] = ino
        return ino

    def link_file(self, existing, new_name):
        if existing not in self.dir_entries:
            raise FileNotFoundError(existing)
        if new_name in self.dir_entries:
            raise FileExistsError(new_name)
        ino = self.dir_entries[existing]
        self.dir_entries[new_name] = ino
        self.inodes[ino]["nlink"] += 1

    def read_file(self, name):
        if name not in self.dir_entries:
            raise FileNotFoundError(name)
        return self.inodes[self.dir_entries[name]]["data"]

    def write_file(self, name, data):
        if name not in self.dir_entries:
            raise FileNotFoundError(name)
        self.inodes[self.dir_entries[name]]["data"] = data

    def unlink_file(self, name):
        if name not in self.dir_entries:
            raise FileNotFoundError(name)
        ino = self.dir_entries.pop(name)
        self.inodes[ino]["nlink"] -= 1
        if self.inodes[ino]["nlink"] == 0:
            del self.inodes[ino]

    def stat_file(self, name):
        if name not in self.dir_entries:
            raise FileNotFoundError(name)
        ino = self.dir_entries[name]
        inode = self.inodes[ino]
        return {"ino": ino, "nlink": inode["nlink"], "size": len(inode["data"])}
```

## Restored

The iron room's mini kernel schedules processes with MLFQ, isolates forked memory via Copy-on-Write, and manages files through reference-counted inodes.
