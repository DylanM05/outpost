---
id: maintenance-wire-tag-split
title: Pack and unpack Protobuf field-number and wire-type tags
system: Codec deck
symbol: instrument
scene: tests
skills: protobuf-grpc
reviewSkill: protobuf-grpc
prerequisite: grpc-deadline-router
---

## Briefing

Every Protobuf field starts with a single varint tag packing both the field number (upper bits) and the 3-bit wire type (`0..5`, lower 3 bits).

## Objective

Implement:
1. `pack_tag(field_number, wire_type)` returning `(field_number << 3) | wire_type` (raise `ValueError` if `field_number < 1` or `not (0 <= wire_type <= 7)`).
2. `unpack_tag(tag)` returning `(tag >> 3, tag & 0x07)` (raise `ValueError` if `field_number < 1`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Wire type occupies the lowest 3 bits (`tag & 0x07`), and `field_number` sits above it (`tag >> 3`).

## Starter

```python
```

## Checks

```python
expect("packs field 1 varint (0) -> 8 and field 2 len (2) -> 18", lambda: (get("pack_tag")(1, 0), get("pack_tag")(2, 2)), (8, 18))
expect("unpacks tag 18 -> (2, 2)", lambda: get("unpack_tag")(18), (2, 2))
```

## Hidden checks

```python
def _bad():
    errs = 0
    for fn, args in [(get("pack_tag"), (0, 0)), (get("pack_tag"), (1, 8)), (get("unpack_tag"), (2,))]:
        try:
            fn(*args)
        except ValueError:
            errs += 1
    return errs
expect("rejects field_number < 1 and wire_type > 7", _bad, 3)
```

## Solution

```python
def pack_tag(field_number, wire_type):
    if field_number < 1 or not (0 <= wire_type <= 7):
        raise ValueError("invalid field_number or wire_type")
    return (field_number << 3) | wire_type


def unpack_tag(tag):
    field_number = tag >> 3
    if field_number < 1:
        raise ValueError("field_number must be >= 1")
    return (field_number, tag & 0x07)
```

## Restored

Protobuf tag packing and unpacking now split field numbers and wire types cleanly.
