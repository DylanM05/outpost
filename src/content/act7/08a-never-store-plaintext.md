---
id: never-store-plaintext
kind: predict
title: Never store plaintext
system: Gatehouse
symbol: controller
scene: console
skills: auth, reading-code
---

## Briefing

Every operator on the exchange has a password, and the cardinal rule of authentication is simple: **never store a plaintext password** — and never store a plain, unsalted hash either. If two operators pick the same password, an unsalted hash stores identical strings for both, exposing them to precomputed lookup tables. Adding a unique random **salt** per user makes the same password hash to two completely different digests. Trace what happens here.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

Password hashing mixes a password with a per-user **salt** and stretches it through many rounds of hashing (in production, with dedicated functions like `scrypt`, `argon2`, or `hashlib.pbkdf2_hmac`; here with iterated HMAC-SHA256 so it runs identically in the browser):

```python
digest = hmac.new(salt.encode(), password.encode(), hashlib.sha256).digest()
for _ in range(rounds):
    digest = hashlib.sha256(digest + salt.encode()).digest()
```

- Same password + same salt -> **identical** digest (so login can verify the password!).
- Same password + different salt -> **completely different** digest (so identical passwords never look alike in the database!).
- Repeating the hash many rounds slows down offline brute-force guesses if a database backup ever leaks.

## Hints

1. `h1` and `h2` hash the *same* password `"winter"` with *different* salts (`"salt-a"` vs `"salt-b"`).
2. `h3` hashes `"winter"` with `"salt-a"` again — same password and same salt as `h1`!
3. `h4` hashes `"summer"` with `"salt-a"`. A SHA-256 hex digest is always 64 characters long.

## Program

```python
import hashlib
import hmac


def derive(password, salt):
    salt_bytes = salt.encode("utf-8")
    digest = hmac.new(salt_bytes, password.encode("utf-8"), hashlib.sha256).digest()
    for _ in range(100):
        digest = hashlib.sha256(digest + salt_bytes).digest()
    return digest.hex()


h1 = derive("winter", "salt-a")
h2 = derive("winter", "salt-b")
h3 = derive("winter", "salt-a")
h4 = derive("summer", "salt-a")

print(h1 == h2)
print(h1 == h3)
print(h1 == h4)
print(len(h1))
```

## Output

```text
False
True
False
64
```

## Restored

You traced how salting separates identical passwords while staying deterministic when verifying with the user's stored salt.
