---
id: refcount-heap
kind: code
title: Reference counting and cyclic leaks
system: Collector bay
symbol: controller
scene: tests
skills: memory-management
---

## Briefing

CPython's primary memory manager is **reference counting**: every heap object carries an integer `refcount`. Whenever a pointer to it is added, `refcount += 1`; whenever a pointer is dropped, `refcount -= 1` — and the instant `refcount` hits `0`, the object is freed immediately and decrements every child it pointed to!

## Objective

Write a class `RefCountHeap`:

- `__init__(self)` initializes storage for live objects (`id -> {"rc": int, "children": list[str]}`).
- `alloc(self, obj_id)` — allocates a new object with `rc = 1` (owned by the caller's stack reference) and `children = []`. Raise `ValueError` if `obj_id` is already live.
- `link(self, parent_id, child_id)` — appends `child_id` to `parent_id`'s children and increments `child_id`'s `rc += 1` (both must be live, else raise `KeyError`).
- `inc_ref(self, obj_id)` — increments `obj_id`'s `rc += 1` (raise `KeyError` if not live).
- `dec_ref(self, obj_id)` — decrements `obj_id`'s `rc -= 1`. If `rc == 0`:
  - Remove `obj_id` from the heap **first** (so a self-reference or cycle can't infinitely recurse!)
  - Recursively call `dec_ref(child)` for every `child` still live in the heap.
- `refcount(self, obj_id)` — returns current `rc` (or `0` if freed/not live).
- `live(self)` — returns sorted list of currently live object IDs.

## Concept

Watch what happens in the test when `A` links to `B` and `B` links back to `A`, and then the caller drops both stack handles (`dec_ref("A")` and `dec_ref("B")`):
- `A` drops from `rc=2` to `rc=1` (because `B` still points to `A`!).
- `B` drops from `rc=2` to `rc=1` (because `A` still points to `B`!).
- **Neither reaches `0`!** That's why Python pairs reference counting with a **cyclic garbage collector** (next mission!).

## Hints

1. In `dec_ref`, remove `obj = self._objs.pop(obj_id)` *before* looping over `obj["children"]`!
2. Only call `self.dec_ref(child)` if `child in self._objs`.

## Starter: guided

```python
class RefCountHeap:
    def __init__(self):
        self._objs = {}

    def alloc(self, obj_id):
        if obj_id in self._objs:
            raise ValueError(f"already allocated: {obj_id}")
        self._objs[obj_id] = {"rc": 1, "children": []}

    def link(self, parent_id, child_id):
        self._objs[parent_id]["children"].append(child_id)
        self._objs[child_id]["rc"] += 1

    def inc_ref(self, obj_id):
        self._objs[obj_id]["rc"] += 1

    def dec_ref(self, obj_id):
        # TODO: decrement rc; when 0, pop from _objs and recursively dec_ref live children
        pass

    def refcount(self, obj_id):
        return self._objs[obj_id]["rc"] if obj_id in self._objs else 0

    def live(self):
        return sorted(self._objs)
```

## Starter: standard

```python
class RefCountHeap:
    def __init__(self):
        pass

    def alloc(self, obj_id):
        pass

    def link(self, parent_id, child_id):
        pass

    def inc_ref(self, obj_id):
        pass

    def dec_ref(self, obj_id):
        pass

    def refcount(self, obj_id):
        pass

    def live(self):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
RC = get("RefCountHeap")
def test_cascade_and_cycle_leak():
    h = RC()
    h.alloc("root")
    h.alloc("child")
    h.alloc("leaf")
    h.link("root", "child")
    h.link("child", "leaf")
    # Drop stack refs to child and leaf; root still keeps the chain alive
    h.dec_ref("child")
    h.dec_ref("leaf")
    alive_while_rooted = h.live()
    # Drop root -> entire chain frees immediately!
    h.dec_ref("root")
    after_cascade = h.live()

    # Now create a cycle A <-> B and drop both stack refs -> leaks under pure refcounting!
    h.alloc("A")
    h.alloc("B")
    h.link("A", "B")
    h.link("B", "A")
    h.dec_ref("A")
    h.dec_ref("B")
    return (alive_while_rooted, after_cascade, h.live(), h.refcount("A"), h.refcount("B"))

expect(
    "cascades frees on acyclic graphs and demonstrates cyclic leak",
    test_cascade_and_cycle_leak,
    (["child", "leaf", "root"], [], ["A", "B"], 1, 1),
)
```

## Hidden checks

```python
RC = get("RefCountHeap")
def test_shared_child():
    h = RC()
    h.alloc("p1")
    h.alloc("p2")
    h.alloc("shared")
    h.link("p1", "shared")
    h.link("p2", "shared")
    h.dec_ref("shared")   # rc=2
    h.dec_ref("p1")       # p1 freed -> shared rc=1 (still alive!)
    mid = (h.live(), h.refcount("shared"))
    h.dec_ref("p2")       # p2 freed -> shared rc=0 (freed!)
    return (mid, h.live())

expect("shared child stays alive until last parent drops", test_shared_child, ((["p2", "shared"], 1), []))
```

## Solution

```python
class RefCountHeap:
    def __init__(self):
        self._objs = {}

    def alloc(self, obj_id):
        if obj_id in self._objs:
            raise ValueError(f"already allocated: {obj_id}")
        self._objs[obj_id] = {"rc": 1, "children": []}

    def link(self, parent_id, child_id):
        if parent_id not in self._objs or child_id not in self._objs:
            raise KeyError("unknown object")
        self._objs[parent_id]["children"].append(child_id)
        self._objs[child_id]["rc"] += 1

    def inc_ref(self, obj_id):
        self._objs[obj_id]["rc"] += 1

    def dec_ref(self, obj_id):
        if obj_id not in self._objs:
            return
        self._objs[obj_id]["rc"] -= 1
        if self._objs[obj_id]["rc"] == 0:
            obj = self._objs.pop(obj_id)
            for child in obj["children"]:
                if child in self._objs:
                    self.dec_ref(child)

    def refcount(self, obj_id):
        return self._objs[obj_id]["rc"] if obj_id in self._objs else 0

    def live(self):
        return sorted(self._objs)
```

## Restored

Reference counting frees acyclic graphs instantly — and exposed the exact cyclic leak that mark-and-sweep GC was invented to cure.
