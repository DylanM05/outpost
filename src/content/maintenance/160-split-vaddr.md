---
id: maintenance-split-vaddr
title: Split virtual addresses into VPN and page offset
system: Page vault
symbol: equipment
scene: tests
skills: virtual-memory
reviewSkill: virtual-memory
prerequisite: cow-fork
---

## Briefing

Given an architecture's page-offset bit width (e.g. `12` bits for 4 KiB pages), the MMU splits every virtual address into its Virtual Page Number (`vpn`) and in-page `offset` with two bitwise ops.

## Objective

Write `split_vaddr(vaddr, offset_bits)` where `vaddr >= 0` and `offset_bits >= 1` (raise `ValueError` otherwise).

Return `(vpn, offset)` where:
- `vpn = vaddr >> offset_bits`
- `offset = vaddr & ((1 << offset_bits) - 1)`

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `vaddr >= 0` and `offset_bits >= 1`.
2. For 4 KiB pages (`offset_bits = 12`), `0x12345` splits into `vpn = 0x12`, `offset = 0x345`.

## Starter

```python
```

## Checks

```python
expect("splits 4 KiB paged virtual address", lambda: get("split_vaddr")(0x12345, 12), (0x12, 0x345))
expect("splits 256-byte paged address", lambda: get("split_vaddr")(0x04FF, 8), (0x04, 0xFF))
```

## Hidden checks

```python
def _bad():
    for args in [(-1, 12), (100, 0)]:
        try:
            get("split_vaddr")(*args)
            return False
        except ValueError:
            pass
    return True
expect("invalid vaddr or offset_bits raises ValueError", _bad, True)
```

## Solution

```python
def split_vaddr(vaddr, offset_bits):
    if vaddr < 0 or offset_bits < 1:
        raise ValueError("vaddr must be >= 0 and offset_bits >= 1")
    mask = (1 << offset_bits) - 1
    return (vaddr >> offset_bits, vaddr & mask)
```

## Restored

Virtual addresses split cleanly into page numbers and offsets for any power-of-two page size.
