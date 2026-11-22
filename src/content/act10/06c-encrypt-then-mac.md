---
id: encrypt-then-mac
kind: code
title: Build an Encrypt-then-MAC channel
system: Key exchange
symbol: controller
scene: tests
skills: asymmetric-crypto, symmetric-crypto
---

## Briefing

Now put everything together in a guided build: an **Authenticated Encryption (Encrypt-then-MAC)** radio channel!

Remember the four rules that prevent real-world cryptographic breaks:
1. **Separate keys:** derive distinct `enc_key` and `mac_key` from the master secret (never use the same key for both!).
2. **Unique nonces:** reject encrypting twice with the same nonce.
3. **Encrypt-then-MAC:** compute the HMAC tag over `nonce + associated_data + ciphertext` (including the nonce and any unencrypted header/routing metadata!).
4. **Verify before decrypt:** check the tag in constant time (`hmac.compare_digest`) **first**, raising `ValueError` immediately on any mismatch without ever returning decrypted bytes.

## Objective

Write a class `AuthenticatedChannel`:

- `__init__(self, master_key)` — `master_key` is `bytes`. Derive two independent 32-byte subkeys:
  - `enc_key = hmac.new(master_key, b"enc", hashlib.sha256).digest()`
  - `mac_key = hmac.new(master_key, b"mac", hashlib.sha256).digest()`
  Keep a `set` of nonces already used for encryption (`self._used_nonces`).
- `seal(self, nonce, plaintext, aad=b"")` — accepts `bytes` arguments.
  - If `not nonce` or `nonce in self._used_nonces`, raise `ValueError`.
  - Record `nonce` in `self._used_nonces`.
  - Encrypt `plaintext` using counter-mode SHA-256 keystream (`sha256(enc_key + nonce + counter.to_bytes(4, "big"))`).
  - Compute 32-byte tag `hmac.new(mac_key, len(aad).to_bytes(4, "big") + aad + nonce + ciphertext, hashlib.sha256).digest()`.
  - Return `{"nonce": nonce, "ciphertext": ciphertext, "tag": tag}`.
- `open(self, packet, aad=b"")` — accepts `packet` dict (`nonce`, `ciphertext`, `tag`) and `aad: bytes`.
  - Recompute the expected tag over `len(aad).to_bytes(4, "big") + aad + nonce + ciphertext` and compare with `hmac.compare_digest`.
  - If the tag does not match (or any field is missing/not `bytes`), raise `ValueError` **without** decrypting.
  - Otherwise decrypt and return the original `plaintext` bytes.

## Concept

Why length-prefix `aad` (`len(aad).to_bytes(4, "big") + aad + nonce + ciphertext`)?

Without framing, `aad=b"ab", nonce=b"cd"` and `aad=b"a", nonce=b"bcd"` would concatenate to the identical bytes `b"abcd"`! Length-prefixing eliminates ambiguity between fields, and binding `aad` (Associated Data, like sender/receiver callsigns) ensures nobody can tamper with the unencrypted envelope either.

## Hints

1. Derive `self._enc_key` and `self._mac_key` in `__init__` using `hmac.new(master_key, b"enc", hashlib.sha256).digest()` and `b"mac"`.
2. Reuse the exact counter-mode `_stream_xor(key, nonce, data)` helper for both `seal` and `open`.
3. In `open`, validate the tag with `hmac.compare_digest(expected, tag)` *before* calling `_stream_xor`.

## Starter: guided

```python
import hashlib
import hmac


def _stream_xor(key, nonce, data):
    buf = bytearray()
    counter = 0
    while len(buf) < len(data):
        buf.extend(hashlib.sha256(key + nonce + counter.to_bytes(4, "big")).digest())
        counter += 1
    return bytes(d ^ k for d, k in zip(data, buf))


class AuthenticatedChannel:
    def __init__(self, master_key):
        self._enc_key = hmac.new(master_key, b"enc", hashlib.sha256).digest()
        self._mac_key = hmac.new(master_key, b"mac", hashlib.sha256).digest()
        self._used_nonces = set()

    def _tag(self, nonce, ciphertext, aad):
        body = len(aad).to_bytes(4, "big") + aad + nonce + ciphertext
        return hmac.new(self._mac_key, body, hashlib.sha256).digest()

    def seal(self, nonce, plaintext, aad=b""):
        # TODO: reject empty or reused nonce, encrypt plaintext, compute tag, return dict
        pass

    def open(self, packet, aad=b""):
        # TODO: verify tag with hmac.compare_digest before decrypting
        pass
```

## Starter: standard

```python
import hashlib
import hmac


class AuthenticatedChannel:
    def __init__(self, master_key):
        pass

    def seal(self, nonce, plaintext, aad=b""):
        pass

    def open(self, packet, aad=b""):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
Chan = get("AuthenticatedChannel")
sender = Chan(b"shared-master-secret")
receiver = Chan(b"shared-master-secret")
pkt = sender.seal(b"nonce-0001", b"SEND 100 CRATES", aad=b"KR->VALLEY")
expect("receiver opens valid packet", lambda: receiver.open(pkt, aad=b"KR->VALLEY"), b"SEND 100 CRATES")

def detects_bitflip():
    bad = dict(pkt, ciphertext=bytes([pkt["ciphertext"][0] ^ 1]) + pkt["ciphertext"][1:])
    try:
        receiver.open(bad, aad=b"KR->VALLEY")
        return False
    except ValueError:
        return True
check("1-bit ciphertext tamper raises ValueError", detects_bitflip)

def detects_aad_tamper():
    try:
        receiver.open(pkt, aad=b"KR->NORTH")
        return False
    except ValueError:
        return True
check("tampered AAD header raises ValueError", detects_aad_tamper)

def blocks_nonce_reuse():
    try:
        sender.seal(b"nonce-0001", b"SECOND MESSAGE")
        return False
    except ValueError:
        return True
check("reusing a nonce on seal raises ValueError", blocks_nonce_reuse)
```

## Hidden checks

```python
Chan = get("AuthenticatedChannel")
c1 = Chan(b"key-one")
c2 = Chan(b"key-two")
pkt = c1.seal(b"n1", b"secret")
def wrong_key():
    try:
        c2.open(pkt)
        return False
    except ValueError:
        return True
check("wrong key fails tag verification", wrong_key)
def bad_tag_type():
    try:
        c1.open({"nonce": b"n1", "ciphertext": b"x", "tag": "not-bytes"})
        return False
    except ValueError:
        return True
check("non-bytes tag raises ValueError", bad_tag_type)
```

## Solution

```python
import hashlib
import hmac


def _stream_xor(key, nonce, data):
    buf = bytearray()
    counter = 0
    while len(buf) < len(data):
        buf.extend(hashlib.sha256(key + nonce + counter.to_bytes(4, "big")).digest())
        counter += 1
    return bytes(d ^ k for d, k in zip(data, buf))


class AuthenticatedChannel:
    def __init__(self, master_key):
        self._enc_key = hmac.new(master_key, b"enc", hashlib.sha256).digest()
        self._mac_key = hmac.new(master_key, b"mac", hashlib.sha256).digest()
        self._used_nonces = set()

    def _tag(self, nonce, ciphertext, aad):
        body = len(aad).to_bytes(4, "big") + aad + nonce + ciphertext
        return hmac.new(self._mac_key, body, hashlib.sha256).digest()

    def seal(self, nonce, plaintext, aad=b""):
        if not isinstance(nonce, bytes) or not nonce or nonce in self._used_nonces:
            raise ValueError("nonce must be non-empty and unique")
        self._used_nonces.add(nonce)
        ciphertext = _stream_xor(self._enc_key, nonce, plaintext)
        tag = self._tag(nonce, ciphertext, aad)
        return {"nonce": nonce, "ciphertext": ciphertext, "tag": tag}

    def open(self, packet, aad=b""):
        if not isinstance(packet, dict):
            raise ValueError("invalid packet")
        nonce = packet.get("nonce")
        ciphertext = packet.get("ciphertext")
        tag = packet.get("tag")
        if not (isinstance(nonce, bytes) and isinstance(ciphertext, bytes) and isinstance(tag, bytes)):
            raise ValueError("malformed packet fields")
        expected = self._tag(nonce, ciphertext, aad)
        if not hmac.compare_digest(expected, tag):
            raise ValueError("authentication failed")
        return _stream_xor(self._enc_key, nonce, ciphertext)
```

## Restored

One flipped bit in the ciphertext, nonce, or AAD header now stops the packet dead at the MAC check before decryption even begins.
