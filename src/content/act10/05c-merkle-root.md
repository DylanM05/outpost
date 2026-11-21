---
id: merkle-root
kind: code
title: Build a Merkle tree root
system: Hash vault
symbol: instrument
scene: tests
skills: asymmetric-crypto
---

## Briefing

When Kestrel Ridge syncs a 1,000-chunk archive with Valley Station, hashing everything into one flat digest tells you *something* changed, but not *which* chunk. A **Merkle tree** hashes each chunk as a leaf, then repeatedly hashes pairs of digests upward until a single **Merkle root** summarizes the entire dataset.

## Objective

Write `merkle_root(chunks)` where `chunks` is a list of `bytes` (or `str`, encoded as UTF-8):

- If `chunks` is empty, return `hashlib.sha256(b"").hexdigest()`.
- Otherwise, compute the leaf level: `level = [sha256(raw).hexdigest() for raw in chunks]`.
- While `len(level) > 1`:
  - If `len(level)` is odd, duplicate the last hash (`level.append(level[-1])`).
  - Pair up consecutive hashes `(left, right)` and compute each parent hash as:
    ```python
    hashlib.sha256((left + right).encode("ascii")).hexdigest()
    ```
- Return the single remaining root hex string `level[0]`.

## Concept

A Merkle tree turns $N$ chunks into a binary tree of height $\lceil \log_2 N \rceil$:

```text
          root = H(H01 + H23)
           /               \
    H01 = H(H0+H1)     H23 = H(H2+H3)
       /      \           /      \
     H0       H1        H2       H3
```

Change even **one single bit** in any chunk, and every hash along its path to the root changes — making tampering instantly detectable while letting peers compare subtrees to pinpoint the exact differing chunk.

## Hints

1. Handle `if not chunks: return hashlib.sha256(b"").hexdigest()` first.
2. Remember to duplicate `level[-1]` when `len(level) % 2 == 1` *before* pairing `range(0, len(level), 2)`.
3. For a single chunk `[b"only"]`, `len(level)` is already `1`, so return its leaf hash directly without pairing it!

## Starter: guided

```python
import hashlib


def _h(data):
    raw = data.encode("utf-8") if isinstance(data, str) else data
    return hashlib.sha256(raw).hexdigest()


def merkle_root(chunks):
    if not chunks:
        return hashlib.sha256(b"").hexdigest()
    level = [_h(c) for c in chunks]
    while len(level) > 1:
        if len(level) % 2 == 1:
            level.append(level[-1])
        # TODO: hash each pair (level[i] + level[i+1]) into next_level
        break
    return level[0]
```

## Starter: standard

```python
import hashlib


def merkle_root(chunks):
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

h0, h1, h2 = sha(b"a"), sha(b"b"), sha(b"c")
p01 = sha((h0 + h1).encode())
p22 = sha((h2 + h2).encode())
root3 = sha((p01 + p22).encode())

expect("empty list returns sha256(b'')", lambda: get("merkle_root")([]), sha(b""))
expect("single chunk returns its own hash", lambda: get("merkle_root")([b"a"]), h0)
expect("three chunks duplicate the odd leaf", lambda: get("merkle_root")([b"a", b"b", b"c"]), root3)
```

## Hidden checks

```python
r1 = get("merkle_root")([b"log1", b"log2", b"log3", b"log4"])
r2 = get("merkle_root")([b"log1", b"log2", b"log3!", b"log4"])
check("flipping one byte changes the root", lambda: r1 != r2 and len(r1) == 64)
expect("accepts str chunks as UTF-8", lambda: get("merkle_root")(["a", "b", "c"]), get("merkle_root")([b"a", b"b", b"c"]))
```

## Solution

```python
import hashlib


def _sha(data):
    raw = data.encode("utf-8") if isinstance(data, str) else data
    return hashlib.sha256(raw).hexdigest()


def merkle_root(chunks):
    if not chunks:
        return hashlib.sha256(b"").hexdigest()
    level = [_sha(c) for c in chunks]
    while len(level) > 1:
        if len(level) % 2 == 1:
            level.append(level[-1])
        level = [
            hashlib.sha256((level[i] + level[i + 1]).encode("ascii")).hexdigest()
            for i in range(0, len(level), 2)
        ]
    return level[0]
```

## Restored

Any archive of arbitrary size now collapses into a single tamper-evident 64-hex-character Merkle root.
