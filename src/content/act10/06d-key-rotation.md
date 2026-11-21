---
id: key-rotation
kind: code
title: Versioned key rotation
system: Key exchange
symbol: controller
scene: tests
skills: asymmetric-crypto
---

## Briefing

Long-lived keys eventually need to be rotated — on a schedule or after an operator leaves. If you simply overwrite the old key, every message still in flight or stored in the archive becomes unreadable!

Real services solve this with a **key ring**: tag every sealed envelope with a **key ID (`kid`)**, always encrypt new messages with the latest active key, keep retired keys around to decrypt older envelopes, and allow revoking compromised keys immediately.

## Objective

Write a class `KeyRing`:

- `__init__(self, initial_kid, initial_key)` — registers `(initial_kid, initial_key)` (`kid: str`, `key: bytes`) and sets `self.active_kid = initial_kid`.
- `rotate(self, new_kid, new_key)` — adds a new key (raise `ValueError` if `new_kid` already exists or was revoked) and switches `self.active_kid = new_kid`. Previous keys remain usable for decryption.
- `revoke(self, kid)` — removes `kid` so envelopes using it can no longer be opened (raise `ValueError` if trying to revoke `self.active_kid` — rotate first!).
- `seal(self, nonce, plaintext)` — encrypts and MACs `plaintext` under `self.active_kid` (binding `kid` into the MAC as AAD so an attacker cannot swap key IDs!), returning `{"kid": self.active_kid, "nonce": nonce, "ciphertext": ..., "tag": ...}`.
- `open(self, envelope)` — looks up `envelope["kid"]` (raising `ValueError` if unknown or revoked), verifies the HMAC tag in constant time (binding `kid`!), and decrypts to `bytes`.

## Concept

Notice the two subtle operational rules of real key rotation:
1. **Bind `kid` into the MAC:** otherwise an attacker could rewrite `"kid": "k2"` to `"kid": "k1"` on an envelope.
2. **Rotate before revoking:** never revoke the active signing/encryption key while traffic is still using it — first rotate to `k2`, drain or re-encrypt old items, then revoke `k1`.

## Hints

1. Store a dict `self._channels = {initial_kid: ...}` (each with its own derived `enc_key` and `mac_key`) plus `self._revoked = set()`.
2. Pass `kid.encode("utf-8")` as the AAD when sealing and opening so the key ID itself is authenticated.

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


class KeyRing:
    def __init__(self, initial_kid, initial_key):
        self._keys = {}
        self._revoked = set()
        self._add_key(initial_kid, initial_key)
        self.active_kid = initial_kid

    def _add_key(self, kid, master):
        self._keys[kid] = (
            hmac.new(master, b"enc", hashlib.sha256).digest(),
            hmac.new(master, b"mac", hashlib.sha256).digest(),
        )

    def rotate(self, new_kid, new_key):
        # TODO: reject duplicate/revoked kid, add key, update self.active_kid
        pass

    def revoke(self, kid):
        # TODO: forbid revoking active_kid; remove from _keys and record in _revoked
        pass

    def seal(self, nonce, plaintext):
        # TODO: seal under self.active_kid with kid bound into HMAC
        pass

    def open(self, envelope):
        # TODO: look up kid, verify HMAC with kid bound, decrypt
        pass
```

## Starter: standard

```python
import hashlib
import hmac


class KeyRing:
    def __init__(self, initial_kid, initial_key):
        pass

    def rotate(self, new_kid, new_key):
        pass

    def revoke(self, kid):
        pass

    def seal(self, nonce, plaintext):
        pass

    def open(self, envelope):
        pass
```

## Starter: challenge

```python
```

## Checks

```python
KR = get("KeyRing")
ring = KR("k1", b"winter-key-1")
env1 = ring.seal(b"n1", b"old dispatch")
ring.rotate("k2", b"winter-key-2")
env2 = ring.seal(b"n2", b"new dispatch")

expect("new envelopes use rotated active_kid", lambda: (env1["kid"], env2["kid"]), ("k1", "k2"))
expect("both old and new envelopes open after rotation", lambda: (ring.open(env1), ring.open(env2)), (b"old dispatch", b"new dispatch"))

ring.revoke("k1")
def k1_revoked():
    try:
        ring.open(env1)
        return False
    except ValueError:
        return True
check("revoked key can no longer open old envelopes", k1_revoked)
expect("active key still opens new envelopes", lambda: ring.open(env2), b"new dispatch")
```

## Hidden checks

```python
KR = get("KeyRing")
ring = KR("k1", b"secret-1")
def cant_revoke_active():
    try:
        ring.revoke("k1")
        return False
    except ValueError:
        return True
check("revoking active_kid raises ValueError", cant_revoke_active)
ring.rotate("k2", b"secret-2")
ring.revoke("k1")
def cant_reuse_revoked():
    try:
        ring.rotate("k1", b"secret-3")
        return False
    except ValueError:
        return True
check("re-adding a revoked kid raises ValueError", cant_reuse_revoked)
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


class KeyRing:
    def __init__(self, initial_kid, initial_key):
        self._keys = {}
        self._revoked = set()
        self._add_key(initial_kid, initial_key)
        self.active_kid = initial_kid

    def _add_key(self, kid, master):
        self._keys[kid] = (
            hmac.new(master, b"enc", hashlib.sha256).digest(),
            hmac.new(master, b"mac", hashlib.sha256).digest(),
        )

    def rotate(self, new_kid, new_key):
        if new_kid in self._keys or new_kid in self._revoked:
            raise ValueError(f"kid already used: {new_kid}")
        self._add_key(new_kid, new_key)
        self.active_kid = new_kid

    def revoke(self, kid):
        if kid == self.active_kid:
            raise ValueError("rotate before revoking active key")
        self._keys.pop(kid, None)
        self._revoked.add(kid)

    def _mac(self, mac_key, kid, nonce, ciphertext):
        aad = kid.encode("utf-8")
        body = len(aad).to_bytes(4, "big") + aad + nonce + ciphertext
        return hmac.new(mac_key, body, hashlib.sha256).digest()

    def seal(self, nonce, plaintext):
        kid = self.active_kid
        enc_key, mac_key = self._keys[kid]
        ciphertext = _stream_xor(enc_key, nonce, plaintext)
        tag = self._mac(mac_key, kid, nonce, ciphertext)
        return {"kid": kid, "nonce": nonce, "ciphertext": ciphertext, "tag": tag}

    def open(self, envelope):
        if not isinstance(envelope, dict):
            raise ValueError("invalid envelope")
        kid = envelope.get("kid")
        nonce = envelope.get("nonce")
        ciphertext = envelope.get("ciphertext")
        tag = envelope.get("tag")
        if kid not in self._keys or not (isinstance(nonce, bytes) and isinstance(ciphertext, bytes) and isinstance(tag, bytes)):
            raise ValueError("unknown key or malformed envelope")
        enc_key, mac_key = self._keys[kid]
        expected = self._mac(mac_key, kid, nonce, ciphertext)
        if not hmac.compare_digest(expected, tag):
            raise ValueError("authentication failed")
        return _stream_xor(enc_key, nonce, ciphertext)
```

## Restored

The cipher room can rotate keys mid-winter without dropping a single in-flight dispatch, and revoke retired keys on command.
