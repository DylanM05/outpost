---
id: maintenance-hash-chain
title: Verify a tamper-evident hash chain
system: Hash vault
symbol: instrument
scene: tests
skills: asymmetric-crypto
reviewSkill: asymmetric-crypto
prerequisite: key-rotation
---

## Briefing

Audit logs chain every entry's SHA-256 hash to the previous entry's hash (`hash = sha256(prev_hash + ":" + data)`), starting from `"0" * 64`. Editing any historical entry breaks every hash after it!

## Objective

Write `verify_chain(entries)` where `entries` is a list of `{"prev": str, "data": str, "hash": str}` dicts:

- Return `True` if `entries` is empty.
- Entry `0` must have `prev == "0" * 64`; every entry `i > 0` must have `prev == entries[i - 1]["hash"]`.
- Every entry's `"hash"` must match `hashlib.sha256(f"{entry['prev']}:{entry['data']}".encode("utf-8")).hexdigest()` (compared with `hmac.compare_digest`).
- Return `True` if every link holds, else `False`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Start `expected_prev = "0" * 64`.
2. For each entry, check `entry["prev"] == expected_prev` and `hmac.compare_digest(computed, entry["hash"])`, then update `expected_prev = entry["hash"]`.

## Starter

```python
```

## Checks

```python
import hashlib
def mk(items):
    prev = "0" * 64
    chain = []
    for d in items:
        h = hashlib.sha256(f"{prev}:{d}".encode()).hexdigest()
        chain.append({"prev": prev, "data": d, "hash": h})
        prev = h
    return chain

good = mk(["boot", "key-rotate", "deploy"])
expect("valid chain verifies True", lambda: get("verify_chain")(good), True)
tampered = [dict(e) for e in good]
tampered[1]["data"] = "forged"
expect("tampered middle entry verifies False", lambda: get("verify_chain")(tampered), False)
```

## Hidden checks

```python
expect("empty chain verifies True", lambda: get("verify_chain")([]), True)
import hashlib
bad_genesis = [{"prev": "1" * 64, "data": "x", "hash": hashlib.sha256(("1" * 64 + ":x").encode()).hexdigest()}]
expect("wrong genesis prev verifies False", lambda: get("verify_chain")(bad_genesis), False)
```

## Solution

```python
import hashlib
import hmac


def verify_chain(entries):
    expected_prev = "0" * 64
    for entry in entries:
        if entry.get("prev") != expected_prev:
            return False
        want = hashlib.sha256(f"{expected_prev}:{entry.get('data', '')}".encode("utf-8")).hexdigest()
        got = entry.get("hash")
        if not isinstance(got, str) or not hmac.compare_digest(want, got):
            return False
        expected_prev = got
    return True
```

## Restored

Tampering with any historical audit log record breaks the hash chain immediately.
