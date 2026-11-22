---
id: stack-and-heap
kind: predict
title: Stack frames versus heap objects
system: Heap bay
symbol: equipment
scene: console
skills: memory-management, reading-code
---

## Briefing

Every running program divides memory into two regions:
- The **stack**: fast, LIFO frames pushed when a function starts and automatically popped when it returns.
- The **heap**: dynamically allocated objects that outlive the function that created them — referenced by pointers/handles stored on the stack!

## Objective

Trace this tiny stack-and-heap simulator and predict **every line it prints**.

## Concept

When a function creates an object on the heap (`addr = alloc(...)`) and returns `addr`, the stack frame disappears — **the heap object stays alive** as long as someone still holds `addr`! If a language doesn't have garbage collection and nobody ever calls `free(addr)` after dropping the last reference, that heap slot becomes a **memory leak**.

## Hints

1. `make_packet` allocates at address `0` and `1`, then its stack frame pops — leaving `stack` empty except for the returned handle `0`.
2. Notice address `1` was allocated inside `make_packet` and its pointer was never returned — it's now an unreachable leak on the heap!
3. Look carefully at `len(heap)` vs `reachable`: both addresses `0` and `1` sit in `heap`, while only `0` is in `stack`.

## Program

```python
heap = {}
stack = []
next_addr = 0


def alloc(value):
    global next_addr
    addr = next_addr
    next_addr += 1
    heap[addr] = value
    return addr


def make_packet():
    frame = [alloc("HDR"), alloc("TMP")]
    print("in-call", len(frame), len(heap))
    return frame[0]


handle = make_packet()
stack.append(handle)
print("after-call", stack, heap[stack[0]])
leaked = sorted(addr for addr in heap if addr not in stack)
print("leaked", leaked)
```

## Output

```text
in-call 2 2
after-call [0] HDR
leaked [1]
```

## Restored

Stack frames clean up automatically on return; heap allocations live until freed or garbage-collected.
