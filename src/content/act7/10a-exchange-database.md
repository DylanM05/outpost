---
id: exchange-database
title: Exchange database
system: Exchange floor
symbol: controller
scene: tests
skills: sql, auth
---

## Briefing

Time to assemble the full **Supply Exchange API** with a real SQLite database. Start at the storage layer: create the three relational tables (`users`, `listings`, `orders`) with foreign keys and constraints, and wire up user registration and login backed by salted, stretched password hashes.

## Objective

Build an `ExchangeStore` class backed by a SQLite connection `conn` (password helpers `hash_password` and `verify_password` are provided in the starter):

- `__init__(self, conn)`:
  - Saves `self.conn = conn`, runs `PRAGMA foreign_keys = ON`, and creates three tables (with `CREATE TABLE IF NOT EXISTS`):
    1. `users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'operator')`
    2. `listings (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK (quantity >= 0))`
    3. `orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id), sku TEXT NOT NULL REFERENCES listings(sku), quantity INTEGER NOT NULL CHECK (quantity > 0))`
  - Commits.
- `register_user(self, username, password, role="operator")`:
  - Rejects empty `username` or `password` by returning `(False, "invalid credentials")`.
  - Hashes `password` with `hash_password(password)` and inserts into `users`.
  - On duplicate `username` (`sqlite3.IntegrityError`), rolls back and returns `(False, "username taken")`.
  - On success, commits and returns `(True, {"id": cur.lastrowid, "username": username, "role": role})`.
- `authenticate_user(self, username, password)`:
  - Looks up the user by `username`, checks `verify_password(password, password_hash)`, and returns `{"id": id, "username": username, "role": role}` if valid, or `None` otherwise.

```python
store = ExchangeStore(conn)
store.register_user("mara", "kestrel-99")     # (True, {"id": 1, "username": "mara", "role": "operator"})
store.authenticate_user("mara", "kestrel-99") # {"id": 1, "username": "mara", "role": "operator"}
store.authenticate_user("mara", "wrong")      # None
```

## Concept

Putting database setup and user queries inside a clean `ExchangeStore` class keeps SQL separated from HTTP routing. Notice what `register_user` and `authenticate_user` return: they **never** return `password_hash` — only safe public fields (`id`, `username`, `role`)!

## Hints

1. Enable `PRAGMA foreign_keys = ON` before creating the three tables.
2. In `register_user`, check `if not username or not password:` first, then hash and insert inside `try ... except sqlite3.IntegrityError:`.
3. In `authenticate_user`, fetch `(id, username, password_hash, role)`, return `None` if `row is None` or `not verify_password(password, row[2])`, otherwise return `{"id": row[0], "username": row[1], "role": row[3]}`.

## Starter: guided

```python
import hashlib
import hmac
import secrets
import sqlite3

ROUNDS = 1000


def _derive(password, salt):
    salt_bytes = salt.encode("utf-8")
    digest = hmac.new(salt_bytes, password.encode("utf-8"), hashlib.sha256).digest()
    for _ in range(ROUNDS):
        digest = hashlib.sha256(digest + salt_bytes).digest()
    return digest.hex()


def hash_password(password):
    salt = secrets.token_hex(16)
    return f"{salt}${_derive(password, salt)}"


def verify_password(password, stored):
    if not isinstance(stored, str) or "$" not in stored:
        return False
    parts = stored.split("$")
    if len(parts) != 2 or not parts[0] or not parts[1]:
        return False
    return hmac.compare_digest(_derive(password, parts[0]), parts[1])


class ExchangeStore:
    def __init__(self, conn):
        self.conn = conn
        self.conn.execute("PRAGMA foreign_keys = ON")
        # Create users, listings, and orders tables, then commit.

    def register_user(self, username, password, role="operator"):
        # Validate non-empty username/password, hash password, insert, handle IntegrityError.
        return (False, "not implemented")

    def authenticate_user(self, username, password):
        # Fetch user, verify password, return safe user dict or None.
        return None
```

## Starter: standard

```python
import hashlib
import hmac
import secrets
import sqlite3

ROUNDS = 1000


def _derive(password, salt):
    salt_bytes = salt.encode("utf-8")
    digest = hmac.new(salt_bytes, password.encode("utf-8"), hashlib.sha256).digest()
    for _ in range(ROUNDS):
        digest = hashlib.sha256(digest + salt_bytes).digest()
    return digest.hex()


def hash_password(password):
    salt = secrets.token_hex(16)
    return f"{salt}${_derive(password, salt)}"


def verify_password(password, stored):
    if not isinstance(stored, str) or "$" not in stored:
        return False
    parts = stored.split("$")
    if len(parts) != 2 or not parts[0] or not parts[1]:
        return False
    return hmac.compare_digest(_derive(password, parts[0]), parts[1])


class ExchangeStore:
    def __init__(self, conn):
        self.conn = conn

    def register_user(self, username, password, role="operator"):
        return (False, "not implemented")

    def authenticate_user(self, username, password):
        return None
```

## Starter: challenge

```python
import hashlib
import hmac
import secrets
import sqlite3

ROUNDS = 1000


def _derive(password, salt):
    salt_bytes = salt.encode("utf-8")
    digest = hmac.new(salt_bytes, password.encode("utf-8"), hashlib.sha256).digest()
    for _ in range(ROUNDS):
        digest = hashlib.sha256(digest + salt_bytes).digest()
    return digest.hex()


def hash_password(password):
    salt = secrets.token_hex(16)
    return f"{salt}${_derive(password, salt)}"


def verify_password(password, stored):
    if not isinstance(stored, str) or "$" not in stored:
        return False
    parts = stored.split("$")
    if len(parts) != 2 or not parts[0] or not parts[1]:
        return False
    return hmac.compare_digest(_derive(password, parts[0]), parts[1])
```

## Checks

```python
import sqlite3 as _sq

conn = _sq.connect(":memory:")
store = get("ExchangeStore")(conn)
expect("register_user creates user 1", lambda: store.register_user("mara", "kestrel-99"), (True, {"id": 1, "username": "mara", "role": "operator"}))
expect("duplicate username rejected", lambda: store.register_user("mara", "other")[0], False)
expect("authenticate_user succeeds with right password", lambda: store.authenticate_user("mara", "kestrel-99"), {"id": 1, "username": "mara", "role": "operator"})
expect("authenticate_user rejects wrong password", lambda: store.authenticate_user("mara", "wrong"), None)
check(
    "database never stores plaintext password",
    lambda: "kestrel-99" not in conn.execute("SELECT password_hash FROM users WHERE username='mara'").fetchone()[0],
)
```

## Hidden checks

```python
expect("empty username rejected", lambda: store.register_user("", "abc")[0], False)
expect("empty password rejected", lambda: store.register_user("ines", "")[0], False)
expect("unknown user returns None", lambda: store.authenticate_user("ghost", "pw"), None)

def _fk_check():
    try:
        conn.execute("INSERT INTO orders (user_id, sku, quantity) VALUES (999, 'NOPE', 1)")
        return False
    except _sq.IntegrityError:
        return True

check("orders table enforces foreign keys", _fk_check, "Run PRAGMA foreign_keys = ON and add REFERENCES on user_id and sku.")
```

## Solution

```python
import hashlib
import hmac
import secrets
import sqlite3

ROUNDS = 1000


def _derive(password, salt):
    salt_bytes = salt.encode("utf-8")
    digest = hmac.new(salt_bytes, password.encode("utf-8"), hashlib.sha256).digest()
    for _ in range(ROUNDS):
        digest = hashlib.sha256(digest + salt_bytes).digest()
    return digest.hex()


def hash_password(password):
    salt = secrets.token_hex(16)
    return f"{salt}${_derive(password, salt)}"


def verify_password(password, stored):
    if not isinstance(stored, str) or "$" not in stored:
        return False
    parts = stored.split("$")
    if len(parts) != 2 or not parts[0] or not parts[1]:
        return False
    return hmac.compare_digest(_derive(password, parts[0]), parts[1])


class ExchangeStore:
    def __init__(self, conn):
        self.conn = conn
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'operator'
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS listings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sku TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity >= 0)
            )
            """
        )
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                sku TEXT NOT NULL REFERENCES listings(sku),
                quantity INTEGER NOT NULL CHECK (quantity > 0)
            )
            """
        )
        self.conn.commit()

    def register_user(self, username, password, role="operator"):
        if not username or not password:
            return (False, "invalid credentials")
        pw_hash = hash_password(password)
        try:
            cur = self.conn.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                (username, pw_hash, role),
            )
            self.conn.commit()
            return (True, {"id": cur.lastrowid, "username": username, "role": role})
        except sqlite3.IntegrityError:
            self.conn.rollback()
            return (False, "username taken")

    def authenticate_user(self, username, password):
        row = self.conn.execute(
            "SELECT id, username, password_hash, role FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        if row is None or not verify_password(password, row[2]):
            return None
        return {"id": row[0], "username": row[1], "role": row[3]}
```

## Restored

The exchange's relational schema and salted user store are online, ready for HTTP endpoints on top.
