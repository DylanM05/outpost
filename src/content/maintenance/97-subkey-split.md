---
id: maintenance-subkey-split
title: Domain-separated subkey derivation
system: Key exchange
symbol: controller
scene: tests
skills: asymmetric-crypto
reviewSkill: asymmetric-crypto
prerequisite: key-rotation
---

## Briefing

Never reuse a single raw master key for both encryption and MAC authentication — derive distinct purpose-bound subkeys with domain separation labels.

## Objective

Write `derive_subkeys(master_key, purposes)` where `master_key` is `bytes` (raise `ValueError` if empty) and `purposes` is a list of strings (e.g. `["enc", "mac", "iv"]`). Return a dict mapping each `purpose` to its 32-byte subkey:
```python
hmac.new(master_key, purpose.encode("utf-8"), hashlib.sha256).digest()
```

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate `if not master_key: raise ValueError(...)`.
2. Return `{p: hmac.new(master_key, p.encode("utf-8"), hashlib.sha256).digest() for p in purposes}`.

## Starter

```python
```

## Checks

```python
keys = get("derive_subkeys")(b"master-secret", ["enc", "mac"])
check("produces distinct 32-byte subkeys per purpose", lambda: len(keys["enc"]) == 32 and len(keys["mac"]) == 32 and keys["enc"] != keys["mac"])
```

## Hidden checks

```python
def empty_master():
    try:
        get("derive_subkeys")(b"", ["enc"])
        return False
    except ValueError:
        return True
check("empty master key raises ValueError", empty_master)
```

## Solution

```python
import hashlib
import hmac


def derive_subkeys(master_key, purposes):
    if not isinstance(master_key, bytes) or not master_key:
        raise ValueError("master_key must be non-empty bytes")
    return {
        purpose: hmac.new(master_key, purpose.encode("utf-8"), hashlib.sha256).digest()
        for purpose in purposes
    }
```

## Restored

Encryption and authentication keys now stay cleanly separated under distinct domain labels.
