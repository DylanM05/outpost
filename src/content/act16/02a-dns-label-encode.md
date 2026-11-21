---
id: dns-label-encode
title: Encode and decode RFC 1035 DNS names
system: Name resolver
symbol: equipment
scene: tests
skills: transport-protocols
---

## Briefing

On the wire, DNS packets do NOT contain literal dots like `"relay.ridge.local"`. Instead, RFC 1035 encodes each label as a 1-byte length prefix followed by ASCII bytes, terminated by a `0x00` root byte!

## Concept

Example: `"relay.ridge.local"` encodes as:
`b"\x05relay\x05ridge\x05local\x00"`
- Each label must be `1..63` ASCII bytes (empty labels like `"a..b"` are invalid!).
- A trailing root dot (like `"relay.ridge.local."`) is optional and stripped before splitting.
- The encoded wire representation (including length bytes and trailing `0x00`) must not exceed `255` bytes.
- Decoding walks from index `0`: read length byte `L`; if `L == 0`, stop and return `".".join(labels)` (and verify there are no trailing garbage bytes — or accept `offset` cleanly!); if `L > 63` or `pos + L >= len(data)`, raise `ValueError`.

## Objective

Implement two functions:
1. `encode_qname(domain)` — encodes a domain name string (lowercased, optional single trailing `"."` stripped; `"."` or `""` encodes to `b"\x00"`). Raises `ValueError` on empty interior label (`"a..b"`), label length `> 63`, non-ASCII characters, or total wire length `> 255`.
2. `decode_qname(wire)` — decodes `bytes` back into a lowercase dot-joined domain string (returning `""` for root `b"\x00"`). Raises `ValueError` if truncated, missing the terminating `0x00`, containing trailing bytes after `0x00`, or having a label length `> 63`.

## Hints

1. In `encode_qname`, strip one optional trailing `"."`; if empty after that, return `b"\x00"`. Split on `"."`, verify each label is non-empty, ASCII, and `<= 63` bytes, and build `bytes([len(b)]) + b`.
2. In `decode_qname`, check `wire` isn't empty, advance `i` carefully, stop at `length == 0`, and confirm `i == len(wire)` after consuming the `0` byte.

## Starter: guided

```python
def encode_qname(domain):
    text = domain[:-1] if domain.endswith(".") else domain
    if not text:
        return b"\x00"
    out = bytearray()
    for label in text.split("."):
        # Validate label length (1..63) and ASCII, append length byte + lowercase bytes
        pass
    out.append(0)
    if len(out) > 255:
        raise ValueError("domain exceeds 255 wire bytes")
    return bytes(out)


def decode_qname(wire):
    if not isinstance(wire, (bytes, bytearray)) or not wire:
        raise ValueError("empty wire data")
    labels = []
    i = 0
    while i < len(wire):
        length = wire[i]
        i += 1
        if length == 0:
            if i != len(wire):
                raise ValueError("trailing bytes after root terminator")
            return ".".join(labels)
        # Validate length <= 63 and i + length <= len(wire), decode ASCII label
        break
    raise ValueError("unterminated QNAME")
```

## Starter: standard

```python
def encode_qname(domain):
    pass


def decode_qname(wire):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("encodes FQDN with length prefixes and null byte", lambda: get("encode_qname")("Relay.Ridge.Local."), b"\x05relay\x05ridge\x05local\x00")
expect("decodes wire QNAME back to dotted string", lambda: get("decode_qname")(b"\x05relay\x05ridge\x05local\x00"), "relay.ridge.local")
expect("root domain encodes and decodes cleanly", lambda: (get("encode_qname")("."), get("decode_qname")(b"\x00")), (b"\x00", ""))
```

## Hidden checks

```python
def _bad():
    for fn, arg in [
        ("encode_qname", "a..b"),
        ("encode_qname", "a" * 64 + ".local"),
        ("decode_qname", b"\x05abc"),
        ("decode_qname", b"\x01a\x00\x01"),
        ("decode_qname", b"\x40" + b"a" * 64 + b"\x00"),
    ]:
        try:
            get(fn)(arg)
            return False
        except ValueError:
            pass
    return True
expect("rejects malformed DNS labels and truncated wire frames", _bad, True)
```

## Solution

```python
def encode_qname(domain):
    if not isinstance(domain, str):
        raise ValueError("domain must be a string")
    text = domain[:-1] if domain.endswith(".") else domain
    if not text:
        return b"\x00"
    out = bytearray()
    for label in text.split("."):
        if not label or len(label) > 63 or not label.isascii():
            raise ValueError(f"invalid DNS label: {label!r}")
        raw = label.lower().encode("ascii")
        out.append(len(raw))
        out.extend(raw)
    out.append(0)
    if len(out) > 255:
        raise ValueError("QNAME exceeds 255 bytes")
    return bytes(out)


def decode_qname(wire):
    if not isinstance(wire, (bytes, bytearray)) or not wire:
        raise ValueError("wire QNAME must be non-empty bytes")
    labels = []
    i = 0
    n = len(wire)
    while i < n:
        length = wire[i]
        i += 1
        if length == 0:
            if i != n:
                raise ValueError("trailing bytes after QNAME terminator")
            return ".".join(labels)
        if length > 63 or i + length > n:
            raise ValueError("invalid or truncated DNS label")
        raw = wire[i : i + length]
        if not all(b < 128 for b in raw):
            raise ValueError("non-ASCII bytes in DNS label")
        labels.append(raw.decode("ascii").lower())
        i += length
    raise ValueError("missing root terminator")
```

## Restored

The resolver encodes and decodes RFC 1035 wire names cleanly while rejecting oversized or truncated labels.
