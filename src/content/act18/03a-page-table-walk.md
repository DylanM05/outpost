---
id: page-table-walk
title: Walk a two-level virtual page table with permissions
system: Page vault
symbol: equipment
scene: tests
skills: virtual-memory
---

## Briefing

Every process believes it owns contiguous RAM from `0x0000` upward. The CPU's Memory Management Unit (MMU) splits each virtual address into a **page directory index**, **page table index**, and **page offset**, checks read/write/user permission bits, and yields the physical address — or raises a hardware fault!

## Concept

Use a clean 16-bit virtual address layout (`page_size = 256` bytes, so 8-bit offset):
- `dir_idx = (vaddr >> 12) & 0xF` (top 4 bits)
- `tbl_idx = (vaddr >> 8) & 0xF` (middle 4 bits)
- `offset = vaddr & 0xFF` (bottom 8 bits)

`page_dir` maps `dir_idx -> table_dict`, where `table_dict` maps `tbl_idx -> entry_dict`:
`{"frame": int, "present": bool, "writable": bool, "user": bool}`.

Checks in order:
1. Validate `0 <= vaddr <= 0xFFFF` (else `ValueError`).
2. Look up `entry`; if directory, table entry, or `entry["present"]` is missing/False -> raise `LookupError("page fault")`.
3. If `is_user` is `True` and `not entry["user"]` -> raise `PermissionError("supervisor page")`.
4. If `is_write` is `True` and `not entry["writable"]` -> raise `PermissionError("read-only page")`.
5. Return `(entry["frame"] << 8) | offset`!

## Objective

Write `translate_address(page_dir, vaddr, is_write=False, is_user=True)` implementing the two-level walk and permission checks above.

## Hints

1. Extract `dir_idx = (vaddr >> 12) & 0xF`, `tbl_idx = (vaddr >> 8) & 0xF`, `offset = vaddr & 0xFF`.
2. Check presence first (`LookupError`), then privilege (`is_user and not entry["user"]`), then write permission (`is_write and not entry["writable"]`).

## Starter: guided

```python
def translate_address(page_dir, vaddr, is_write=False, is_user=True):
    if not (0 <= vaddr <= 0xFFFF):
        raise ValueError("virtual address out of 16-bit range")
    dir_idx = (vaddr >> 12) & 0xF
    tbl_idx = (vaddr >> 8) & 0xF
    offset = vaddr & 0xFF
    table = page_dir.get(dir_idx)
    entry = table.get(tbl_idx) if table else None
    # Check present, user privilege, writable permission, then return (frame << 8) | offset
    return 0
```

## Starter: standard

```python
def translate_address(page_dir, vaddr, is_write=False, is_user=True):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
def _walk():
    pd = {
        0x2: {
            0xA: {"frame": 0x7, "present": True, "writable": True, "user": True},
            0xB: {"frame": 0x9, "present": True, "writable": False, "user": True},
            0xC: {"frame": 0x1, "present": True, "writable": True, "user": False},
        }
    }
    fn = get("translate_address")
    ok_rw = fn(pd, 0x2A34, is_write=True, is_user=True)
    ok_kernel = fn(pd, 0x2C10, is_write=True, is_user=False)
    return (ok_rw, ok_kernel)
expect("translates valid user and kernel addresses", _walk, (0x0734, 0x0110))

def _faults():
    pd = {0x2: {0xB: {"frame": 0x9, "present": True, "writable": False, "user": True}, 0xC: {"frame": 0x1, "present": True, "writable": True, "user": False}}}
    fn = get("translate_address")
    got = []
    for args in [(0x3000, False, True), (0x2B00, True, True), (0x2C00, False, True)]:
        try:
            fn(pd, *args)
            got.append("ok")
        except LookupError:
            got.append("page_fault")
        except PermissionError:
            got.append("perm_error")
    return got
expect("raises LookupError on missing page and PermissionError on write/user violation", _faults, ["page_fault", "perm_error", "perm_error"])
```

## Hidden checks

```python
def _not_present():
    pd = {0: {0: {"frame": 3, "present": False, "writable": True, "user": True}}}
    try:
        get("translate_address")(pd, 0x0010)
        return False
    except LookupError:
        return True
expect("non-present entry raises LookupError", _not_present, True)
```

## Solution

```python
def translate_address(page_dir, vaddr, is_write=False, is_user=True):
    if not (0 <= vaddr <= 0xFFFF):
        raise ValueError("virtual address out of 16-bit range")
    dir_idx = (vaddr >> 12) & 0xF
    tbl_idx = (vaddr >> 8) & 0xF
    offset = vaddr & 0xFF
    table = page_dir.get(dir_idx)
    entry = table.get(tbl_idx) if table else None
    if not entry or not entry.get("present"):
        raise LookupError("page fault")
    if is_user and not entry.get("user"):
        raise PermissionError("supervisor-only page")
    if is_write and not entry.get("writable"):
        raise PermissionError("read-only page")
    return (entry["frame"] << 8) | offset
```

## Restored

The MMU walks two-level page tables cleanly and stops unmapped, read-only, and kernel-space violations cold.
