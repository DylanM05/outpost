---
id: merkle-proof
kind: code
title: Verify a Merkle inclusion proof
system: Hash vault
symbol: instrument
scene: tests
skills: asymmetric-crypto
---

## Briefing

A drone only has the 32-byte Merkle root of a 10,000-chunk map — not the other 9,999 chunks. To prove that a single chunk belongs to the archive, the station sends the chunk plus a **Merkle proof**: just the $\log_2 N$ sibling hashes along the path up to the root!

## Objective

Write `verify_merkle_proof(chunk, proof, expected_root)`:

- `chunk` is `bytes` (or `str`, encoded as UTF-8). Start with `current = sha256(chunk).hexdigest()`.
- `proof` is a list of `(side, sibling_hex)` tuples, from leaf level up to the root:
  - If `side == "L"`, the sibling goes on the **left**: `current = sha256((sibling_hex + current).encode("ascii")).hexdigest()`.
  - If `side == "R"`, the sibling goes on the **right**: `current = sha256((current + sibling_hex).encode("ascii")).hexdigest()`.
  - For any other `side` value, return `False`.
- Return `True` iff the final `current` matches `expected_root` (using `hmac.compare_digest`), else `False`.

## Concept

Why does `side` (`"L"` vs `"R"`) matter? Because hash concatenation is **not commutative**: `sha256(A + B) != sha256(B + A)`! Knowing whether each sibling sat on the left or right lets the verifier reconstruct the exact root in $O(\log N)$ hashes — only 20 hashes to verify a chunk inside a million-chunk archive.

## Hints

1. Start with `current = hashlib.sha256(raw).hexdigest()`.
2. Loop `for side, sibling in proof:` concatenating `sibling + current` for `"L"` and `current + sibling` for `"R"`.
3. Finish with `hmac.compare_digest(current, expected_root)` (guarding `isinstance(expected_root, str)`).

## Starter: guided

```python
import hashlib
import hmac


def verify_merkle_proof(chunk, proof, expected_root):
    raw = chunk.encode("utf-8") if isinstance(chunk, str) else chunk
    current = hashlib.sha256(raw).hexdigest()
    for side, sibling in proof:
        if side == "L":
            # TODO: hash sibling + current
            pass
        elif side == "R":
            # TODO: hash current + sibling
            pass
        else:
            return False
    return isinstance(expected_root, str) and hmac.compare_digest(current, expected_root)
```

## Starter: standard

```python
import hashlib
import hmac


def verify_merkle_proof(chunk, proof, expected_root):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
import hashlib
def sha(b):
    return hashlib.sha256(b).hexdigest()

h0, h1, h2, h3 = [sha(x) for x in (b"c0", b"c1", b"c2", b"c3")]
p01 = sha((h0 + h1).encode())
p23 = sha((h2 + h3).encode())
root = sha((p01 + p23).encode())

proof_for_c2 = [("R", h3), ("L", p01)]
expect("valid proof for c2 verifies True", lambda: get("verify_merkle_proof")(b"c2", proof_for_c2, root), True)
expect("tampered chunk fails verification", lambda: get("verify_merkle_proof")(b"c2-tampered", proof_for_c2, root), False)
expect("swapped L/R side fails verification", lambda: get("verify_merkle_proof")(b"c2", [("L", h3), ("L", p01)], root), False)
```

## Hidden checks

```python
import hashlib
h0 = hashlib.sha256(b"solo").hexdigest()
expect("empty proof verifies single-leaf tree", lambda: get("verify_merkle_proof")(b"solo", [], h0), True)
expect("invalid side returns False", lambda: get("verify_merkle_proof")(b"solo", [("X", h0)], h0), False)
```

## Solution

```python
import hashlib
import hmac


def verify_merkle_proof(chunk, proof, expected_root):
    if not isinstance(expected_root, str):
        return False
    raw = chunk.encode("utf-8") if isinstance(chunk, str) else chunk
    current = hashlib.sha256(raw).hexdigest()
    for side, sibling in proof:
        if side == "L":
            current = hashlib.sha256((sibling + current).encode("ascii")).hexdigest()
        elif side == "R":
            current = hashlib.sha256((current + sibling).encode("ascii")).hexdigest()
        else:
            return False
    return hmac.compare_digest(current, expected_root)
```

## Restored

Drones can now verify any single map tile against the station's Merkle root in a handful of hashes.
