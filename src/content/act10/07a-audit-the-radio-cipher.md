---
id: audit-the-radio-cipher
kind: code
title: Audit and rebuild the radio cipher
system: Cipher audit
symbol: controller
scene: tests
skills: encoding, symmetric-crypto, asymmetric-crypto
assessment: true
---

## Briefing

Valley Station's legacy encrypted radio link failed security review with **four critical flaws**:
1. It derived its key directly from a single SHA-256 of the passphrase with no salt or rounds, and reused the same key for encryption and MAC.
2. It reused a fixed nonce across messages, exposing plaintexts via two-time-pad XOR.
3. It had no replay protection, allowing an eavesdropper to re-broadcast an old `"RELEASE FUEL"` packet and trigger it twice.
4. It had no key-ID support, making key rotation impossible without downtime.

This is the final independent mission for **The cipher room**. Build a clean, hardened `SecureRadioLink` from scratch.

## Objective

Implement a class `SecureRadioLink`:

- `__init__(self, initial_kid, passphrase, salt, rounds=200)`:
  - Derive a 32-byte master key from `(passphrase, salt, rounds)` (iterated HMAC-SHA256) and split it into distinct `enc_key` and `mac_key` subkeys for `initial_kid`.
  - Set `self.active_kid = initial_kid`.
  - Track used outbound nonces (auto-generating a fresh unique `bytes` nonce per `send`, e.g. 12-byte counter or random `secrets.token_bytes(12)`) AND seen inbound `(kid, nonce)` pairs for replay protection.
- `rotate_key(self, new_kid, passphrase, salt, rounds=200)`:
  - Derive and register a new key pair under `new_kid` (raise `ValueError` if `new_kid` already exists or was revoked) and make `new_kid` active.
- `revoke_key(self, kid)`:
  - Revoke a non-active key (raise `ValueError` if `kid == self.active_kid`).
- `send(self, plaintext, aad=b"")`:
  - Accepts `plaintext` (`bytes` or `str`, UTF-8) and `aad` (`bytes`).
  - Generates a fresh unique nonce (`>= 12` bytes), encrypts with the active key's `enc_key` (counter-mode stream cipher), and computes a 32-byte HMAC-SHA256 tag over `kid`, `aad`, `nonce`, and `ciphertext` (length-prefixed so boundaries are unambiguous).
  - Returns a transport-safe Base64/JSON string **or** dict — specifically return a JSON string with keys `"kid"`, `"nonce"` (hex), `"ciphertext"` (hex), and `"tag"` (hex).
- `receive(self, wire_frame, aad=b"")`:
  - Parses the JSON wire frame and decodes hex fields (raising `ValueError` on malformed frames, unknown/revoked `kid`, or bad hex).
  - Verifies the HMAC-SHA256 tag in constant time (`hmac.compare_digest`) **before** decrypting or recording the nonce.
  - Rejects replayed `(kid, nonce)` pairs with `ValueError`.
  - Records `(kid, nonce)` as seen, decrypts, and returns the original plaintext `bytes`.

## Concept

This independent mission brings together the entire cipher room:
- UTF-8 / hex / JSON transport framing (`Byte decoder`)
- Salted iterated KDF (`Stream bench`)
- Unique per-message nonces & counter-mode stream encryption (`Cipher wheel`, `Stream bench`)
- Separate `enc_key` / `mac_key` + Encrypt-then-MAC with constant-time `hmac.compare_digest` + replay tracking + versioned key rotation (`Key exchange`)

## Hints

1. Use `secrets.token_bytes(12)` (or a monotonic 12-byte counter mixed with random bytes) so two identical `send(b"PING")` calls always yield completely different ciphertexts and nonces.
2. Verify the MAC **before** checking/recording replay or decrypting, and check `(kid, nonce) in self._seen_inbound` before accepting.
3. Make sure two separate `SecureRadioLink` instances initialized with the same `(kid, passphrase, salt, rounds)` derive the exact same `enc_key` and `mac_key` so `receiver.receive(sender.send(...))` works cleanly!

## Starter: guided

```python
```

## Starter: standard

```python
```

## Starter: challenge

```python
```

## Checks

```python
import json

Link = get("SecureRadioLink")
alice = Link("k1", "ridge-winter-pass", b"salt-2026", rounds=50)
bob = Link("k1", "ridge-winter-pass", b"salt-2026", rounds=50)

f1 = alice.send(b"RELEASE 100L FUEL", aad=b"KR->VALLEY")
f2 = alice.send(b"RELEASE 100L FUEL", aad=b"KR->VALLEY")

check("wire frames are JSON strings with distinct nonces and ciphertexts", lambda: isinstance(f1, str) and f1 != f2 and json.loads(f1)["nonce"] != json.loads(f2)["nonce"])
expect("bob decrypts valid frame", lambda: bob.receive(f1, aad=b"KR->VALLEY"), b"RELEASE 100L FUEL")

def blocks_replay():
    try:
        bob.receive(f1, aad=b"KR->VALLEY")
        return False
    except ValueError:
        return True
check("replaying an already-accepted frame raises ValueError", blocks_replay)

def blocks_tamper():
    obj = json.loads(f2)
    ct = bytearray.fromhex(obj["ciphertext"])
    ct[0] ^= 0xFF
    obj["ciphertext"] = ct.hex()
    try:
        bob.receive(json.dumps(obj), aad=b"KR->VALLEY")
        return False
    except ValueError:
        return True
check("tampered ciphertext is rejected before decrypting", blocks_tamper)

def blocks_aad_swap():
    try:
        bob.receive(f2, aad=b"KR->WRONG")
        return False
    except ValueError:
        return True
check("mismatched AAD is rejected", blocks_aad_swap)
```

## Hidden checks

```python
import json

Link = get("SecureRadioLink")
alice = Link("k1", "pass-1", b"salt-1", rounds=40)
bob = Link("k1", "pass-1", b"salt-1", rounds=40)

old_frame = alice.send("from k1")
alice.rotate_key("k2", "pass-2", b"salt-2", rounds=40)
bob.rotate_key("k2", "pass-2", b"salt-2", rounds=40)
new_frame = alice.send("from k2")

expect("both old and new keys work across rotation", lambda: (bob.receive(old_frame), bob.receive(new_frame)), (b"from k1", b"from k2"))

# Tampered frame must NOT poison the replay cache if an attacker modifies a tag before legit packet arrives
valid_f = alice.send(b"real order")
bad_obj = json.loads(valid_f)
bad_obj["tag"] = "00" * 32
try:
    bob.receive(json.dumps(bad_obj))
except ValueError:
    pass
expect("failed tampered packet does not block the legitimate packet", lambda: bob.receive(valid_f), b"real order")

# Revoking old key blocks frames under k1
old_frame2 = Link("k1", "pass-1", b"salt-1", rounds=40).send(b"late k1")
bob.revoke_key("k1")
def k1_blocked():
    try:
        bob.receive(old_frame2)
        return False
    except ValueError:
        return True
check("revoked key is rejected", k1_blocked)

# Salt matters: same passphrase + different salt cannot decrypt
other_salt = Link("k1", "pass-1", b"salt-OTHER", rounds=40)
def salt_matters():
    try:
        other_salt.receive(old_frame2)
        return False
    except ValueError:
        return True
check("different salt produces incompatible keys", salt_matters)
```

## Solution

```python
import hashlib
import hmac
import json
import secrets


def _derive_master(passphrase, salt, rounds):
    if rounds < 1:
        raise ValueError("rounds must be >= 1")
    secret = passphrase.encode("utf-8") if isinstance(passphrase, str) else passphrase
    key = hmac.new(salt, secret, hashlib.sha256).digest()
    for _ in range(rounds - 1):
        key = hmac.new(key, secret + salt, hashlib.sha256).digest()
    return key


def _stream_xor(key, nonce, data):
    buf = bytearray()
    counter = 0
    while len(buf) < len(data):
        buf.extend(hashlib.sha256(key + nonce + counter.to_bytes(4, "big")).digest())
        counter += 1
    return bytes(d ^ k for d, k in zip(data, buf))


class SecureRadioLink:
    def __init__(self, initial_kid, passphrase, salt, rounds=200):
        self._keys = {}
        self._revoked = set()
        self._used_out = set()
        self._seen_in = set()
        self._register(initial_kid, passphrase, salt, rounds)
        self.active_kid = initial_kid

    def _register(self, kid, passphrase, salt, rounds):
        master = _derive_master(passphrase, salt, rounds)
        self._keys[kid] = (
            hmac.new(master, b"enc", hashlib.sha256).digest(),
            hmac.new(master, b"mac", hashlib.sha256).digest(),
        )

    def rotate_key(self, new_kid, passphrase, salt, rounds=200):
        if new_kid in self._keys or new_kid in self._revoked:
            raise ValueError(f"kid already used: {new_kid}")
        self._register(new_kid, passphrase, salt, rounds)
        self.active_kid = new_kid

    def revoke_key(self, kid):
        if kid == self.active_kid:
            raise ValueError("cannot revoke active key")
        self._keys.pop(kid, None)
        self._revoked.add(kid)

    def _compute_tag(self, mac_key, kid, aad, nonce, ciphertext):
        kb = kid.encode("utf-8")
        parts = [
            len(kb).to_bytes(4, "big"), kb,
            len(aad).to_bytes(4, "big"), aad,
            len(nonce).to_bytes(4, "big"), nonce,
            ciphertext,
        ]
        return hmac.new(mac_key, b"".join(parts), hashlib.sha256).digest()

    def send(self, plaintext, aad=b""):
        raw = plaintext.encode("utf-8") if isinstance(plaintext, str) else plaintext
        kid = self.active_kid
        enc_key, mac_key = self._keys[kid]
        nonce = secrets.token_bytes(16)
        while (kid, nonce) in self._used_out:
            nonce = secrets.token_bytes(16)
        self._used_out.add((kid, nonce))
        ciphertext = _stream_xor(enc_key, nonce, raw)
        tag = self._compute_tag(mac_key, kid, aad, nonce, ciphertext)
        return json.dumps({
            "kid": kid,
            "nonce": nonce.hex(),
            "ciphertext": ciphertext.hex(),
            "tag": tag.hex(),
        })

    def receive(self, wire_frame, aad=b""):
        try:
            obj = json.loads(wire_frame)
            kid = obj["kid"]
            nonce = bytes.fromhex(obj["nonce"])
            ciphertext = bytes.fromhex(obj["ciphertext"])
            tag = bytes.fromhex(obj["tag"])
        except Exception as exc:
            raise ValueError("malformed wire frame") from exc
        if kid not in self._keys or len(nonce) < 12:
            raise ValueError("unknown key or invalid nonce")
        enc_key, mac_key = self._keys[kid]
        expected = self._compute_tag(mac_key, kid, aad, nonce, ciphertext)
        if not hmac.compare_digest(expected, tag):
            raise ValueError("authentication failed")
        if (kid, nonce) in self._seen_in:
            raise ValueError("replayed frame")
        self._seen_in.add((kid, nonce))
        return _stream_xor(enc_key, nonce, ciphertext)
```

## Restored

The cipher room's radio link is hardened end to end: salted key derivation, separated encryption and MAC subkeys, unique nonces, constant-time Encrypt-then-MAC verification, replay defense, and zero-downtime key rotation.
