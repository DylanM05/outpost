---
id: exchange-endpoints
title: Exchange endpoints
system: Exchange floor
symbol: controller
scene: tests
skills: api-design, sql, auth
---

## Briefing

Now wire the first four HTTP endpoints of the **Supply Exchange API** on top of `ExchangeStore` and signed tokens: registering an operator, logging in for a Bearer token, listing all available supplies, and creating a new supply listing (authenticated operators only).

## Objective

Complete `ExchangeApp(conn, secret, now_fn)` (your `ExchangeStore`, `make_token`, and `verify_token` helpers are provided). `handle(self, request)` takes `{"method": str, "path": str, "headers": dict, "body": str}` and returns `{"status": int, "headers": {"Content-Type": "application/json"}, "body": <json str>}` for these four routes:

1. **`POST /register`**: JSON body `{"username": str, "password": str}` (optional `"role"`, defaults to `"operator"`).
   - `400` if invalid JSON or missing/empty username or password.
   - `409` if username already exists.
   - `201` with `{"id": ..., "username": ..., "role": ...}` on success.
2. **`POST /login`**: JSON body `{"username": str, "password": str}`.
   - `400` if invalid JSON or missing fields.
   - `401` if credentials are wrong.
   - `200` with `{"token": <signed token with claims {"uid": id, "sub": username, "role": role}, ttl=3600, now=self.now_fn()>}`.
3. **`GET /listings`**: public endpoint; returns `200` with a JSON list of `{"id": ..., "sku": ..., "name": ..., "quantity": ...}` ordered by `sku ASC`.
4. **`POST /listings`**: requires valid `Authorization: Bearer <token>` (`401` otherwise). JSON body `{"sku": str, "name": str, "quantity": int}` (`quantity >= 0`, non-empty `sku`/`name`; `400` if invalid).
   - `409` if `sku` already exists.
   - `201` with `{"id": ..., "sku": ..., "name": ..., "quantity": ...}` on success.

Any unknown route returns `404`.

## Concept

Notice how every layer we built snaps together cleanly:

- **HTTP status codes tell the story:** `201 Created` on new resources, `400 Bad Request` on bad input, `401 Unauthorized` on bad/missing auth, `409 Conflict` on duplicate unique keys, `404 Not Found` on unknown paths.
- **Passing `now_fn`** (defaulting to a clock function) makes token expiration 100% testable without sleeping!

## Hints

1. Write small helpers on `ExchangeApp`: `_json_resp(status, data)`, `_read_json(request)` (returns dict or `None`), and `_current_user(request)` (reads `Authorization: Bearer ...` and calls `verify_token(..., self.secret, self.now_fn())`).
2. Check `method` and `path = request["path"].split("?", 1)[0]` to route the four endpoints.
3. For `POST /listings`, catch `sqlite3.IntegrityError` on duplicate `sku` and return `409`.

## Starter: guided

```python
import base64
import hashlib
import hmac
import json
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


def make_token(claims, secret, ttl_seconds, now):
    body = dict(claims)
    body["exp"] = now + ttl_seconds
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    p = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    sig = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{p}.{sig}"


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    p, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims


class ExchangeStore:
    def __init__(self, conn):
        self.conn = conn
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'operator')"
        )
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS listings (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK (quantity >= 0))"
        )
        self.conn.commit()

    def register_user(self, username, password, role="operator"):
        if not username or not password:
            return (False, "invalid credentials")
        try:
            cur = self.conn.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", (username, hash_password(password), role))
            self.conn.commit()
            return (True, {"id": cur.lastrowid, "username": username, "role": role})
        except sqlite3.IntegrityError:
            self.conn.rollback()
            return (False, "username taken")

    def authenticate_user(self, username, password):
        row = self.conn.execute("SELECT id, username, password_hash, role FROM users WHERE username = ?", (username,)).fetchone()
        if row is None or not verify_password(password, row[2]):
            return None
        return {"id": row[0], "username": row[1], "role": row[3]}


class ExchangeApp:
    def __init__(self, conn, secret, now_fn=lambda: 1000):
        self.store = ExchangeStore(conn)
        self.conn = conn
        self.secret = secret
        self.now_fn = now_fn

    def _resp(self, status, data):
        return {"status": status, "headers": {"Content-Type": "application/json"}, "body": json.dumps(data)}

    def _read_json(self, request):
        try:
            data = json.loads(request.get("body", ""))
            return data if isinstance(data, dict) else None
        except (json.JSONDecodeError, TypeError):
            return None

    def _current_user(self, request):
        headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
        auth = headers.get("authorization", "")
        if not auth.startswith("Bearer "):
            return None
        return verify_token(auth[7:], self.secret, self.now_fn())

    def handle(self, request):
        method = request["method"].upper()
        path = request["path"].split("?", 1)[0]
        # Implement POST /register, POST /login, GET /listings, POST /listings, and 404 fallback.
        return self._resp(404, {"error": "not found"})
```

## Starter: standard

```python
import base64
import hashlib
import hmac
import json
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


def make_token(claims, secret, ttl_seconds, now):
    body = dict(claims)
    body["exp"] = now + ttl_seconds
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    p = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    sig = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{p}.{sig}"


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    p, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims


class ExchangeStore:
    def __init__(self, conn):
        self.conn = conn
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'operator')"
        )
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS listings (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK (quantity >= 0))"
        )
        self.conn.commit()

    def register_user(self, username, password, role="operator"):
        if not username or not password:
            return (False, "invalid credentials")
        try:
            cur = self.conn.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", (username, hash_password(password), role))
            self.conn.commit()
            return (True, {"id": cur.lastrowid, "username": username, "role": role})
        except sqlite3.IntegrityError:
            self.conn.rollback()
            return (False, "username taken")

    def authenticate_user(self, username, password):
        row = self.conn.execute("SELECT id, username, password_hash, role FROM users WHERE username = ?", (username,)).fetchone()
        if row is None or not verify_password(password, row[2]):
            return None
        return {"id": row[0], "username": row[1], "role": row[3]}


class ExchangeApp:
    def __init__(self, conn, secret, now_fn=lambda: 1000):
        self.store = ExchangeStore(conn)
        self.conn = conn
        self.secret = secret
        self.now_fn = now_fn

    def handle(self, request):
        return {"status": 404, "headers": {"Content-Type": "application/json"}, "body": '{"error":"not found"}'}
```

## Starter: challenge

```python
import base64
import hashlib
import hmac
import json
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


def make_token(claims, secret, ttl_seconds, now):
    body = dict(claims)
    body["exp"] = now + ttl_seconds
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    p = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    sig = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{p}.{sig}"


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    p, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims


class ExchangeStore:
    def __init__(self, conn):
        self.conn = conn
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'operator')"
        )
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS listings (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK (quantity >= 0))"
        )
        self.conn.commit()

    def register_user(self, username, password, role="operator"):
        if not username or not password:
            return (False, "invalid credentials")
        try:
            cur = self.conn.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", (username, hash_password(password), role))
            self.conn.commit()
            return (True, {"id": cur.lastrowid, "username": username, "role": role})
        except sqlite3.IntegrityError:
            self.conn.rollback()
            return (False, "username taken")

    def authenticate_user(self, username, password):
        row = self.conn.execute("SELECT id, username, password_hash, role FROM users WHERE username = ?", (username,)).fetchone()
        if row is None or not verify_password(password, row[2]):
            return None
        return {"id": row[0], "username": row[1], "role": row[3]}
```

## Checks

```python
import json as _json, sqlite3 as _sq

clock = [1000]
conn = _sq.connect(":memory:")
app = get("ExchangeApp")(conn, "exchange-secret", now_fn=lambda: clock[0])

def _call(method, path, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = app.handle({"method": method, "path": path, "headers": headers, "body": "" if body is None else _json.dumps(body)})
    return resp["status"], (_json.loads(resp["body"]) if resp["body"] else None)

expect("POST /register returns 201", lambda: _call("POST", "/register", {"username": "mara", "password": "pw"}), (201, {"id": 1, "username": "mara", "role": "operator"}))
expect("duplicate POST /register returns 409", lambda: _call("POST", "/register", {"username": "mara", "password": "pw"})[0], 409)
expect("bad login returns 401", lambda: _call("POST", "/login", {"username": "mara", "password": "wrong"})[0], 401)

login_status, login_body = _call("POST", "/login", {"username": "mara", "password": "pw"})
expect("valid login returns 200 with token", lambda: (login_status, isinstance((login_body or {}).get("token"), str)), (200, True))
tok = (login_body or {}).get("token", "")

expect("POST /listings without token returns 401", lambda: _call("POST", "/listings", {"sku": "FUEL", "name": "Fuel", "quantity": 10})[0], 401)
expect("POST /listings with token returns 201", lambda: _call("POST", "/listings", {"sku": "FUEL", "name": "Fuel", "quantity": 10}, token=tok), (201, {"id": 1, "sku": "FUEL", "name": "Fuel", "quantity": 10}))
expect("GET /listings returns sorted listings", lambda: _call("GET", "/listings"), (200, [{"id": 1, "sku": "FUEL", "name": "Fuel", "quantity": 10}]))
```

## Hidden checks

```python
expect("duplicate SKU returns 409", lambda: _call("POST", "/listings", {"sku": "FUEL", "name": "Dup", "quantity": 2}, token=tok)[0], 409)
expect("negative quantity returns 400", lambda: _call("POST", "/listings", {"sku": "ROPE", "name": "Rope", "quantity": -1}, token=tok)[0], 400)
expect("POST /listings with second SKU", lambda: _call("POST", "/listings", {"sku": "AXE", "name": "Ice axe", "quantity": 3}, token=tok)[0], 201)
expect("GET /listings is sorted by sku ASC", lambda: [x["sku"] for x in _call("GET", "/listings")[1]], ["AXE", "FUEL"])

clock[0] = 5000  # past 1000 + 3600 expiry
expect("expired token rejected on POST /listings with 401", lambda: _call("POST", "/listings", {"sku": "LAMP", "name": "Lamp", "quantity": 1}, token=tok)[0], 401)
expect("unknown path returns 404", lambda: _call("GET", "/nope")[0], 404)
```

## Solution

```python
import base64
import hashlib
import hmac
import json
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


def make_token(claims, secret, ttl_seconds, now):
    body = dict(claims)
    body["exp"] = now + ttl_seconds
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    p = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    sig = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{p}.{sig}"


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    p, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), p.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims


class ExchangeStore:
    def __init__(self, conn):
        self.conn = conn
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'operator')"
        )
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS listings (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK (quantity >= 0))"
        )
        self.conn.commit()

    def register_user(self, username, password, role="operator"):
        if not username or not password:
            return (False, "invalid credentials")
        try:
            cur = self.conn.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", (username, hash_password(password), role))
            self.conn.commit()
            return (True, {"id": cur.lastrowid, "username": username, "role": role})
        except sqlite3.IntegrityError:
            self.conn.rollback()
            return (False, "username taken")

    def authenticate_user(self, username, password):
        row = self.conn.execute("SELECT id, username, password_hash, role FROM users WHERE username = ?", (username,)).fetchone()
        if row is None or not verify_password(password, row[2]):
            return None
        return {"id": row[0], "username": row[1], "role": row[3]}


class ExchangeApp:
    def __init__(self, conn, secret, now_fn=lambda: 1000):
        self.store = ExchangeStore(conn)
        self.conn = conn
        self.secret = secret
        self.now_fn = now_fn

    def _resp(self, status, data):
        return {"status": status, "headers": {"Content-Type": "application/json"}, "body": json.dumps(data)}

    def _read_json(self, request):
        try:
            data = json.loads(request.get("body", ""))
            return data if isinstance(data, dict) else None
        except (json.JSONDecodeError, TypeError):
            return None

    def _current_user(self, request):
        headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
        auth = headers.get("authorization", "")
        if not auth.startswith("Bearer "):
            return None
        return verify_token(auth[7:], self.secret, self.now_fn())

    def handle(self, request):
        method = request["method"].upper()
        path = request["path"].split("?", 1)[0]

        if method == "POST" and path == "/register":
            body = self._read_json(request)
            if not body or not isinstance(body.get("username"), str) or not isinstance(body.get("password"), str):
                return self._resp(400, {"error": "invalid body"})
            if not body["username"] or not body["password"]:
                return self._resp(400, {"error": "username and password required"})
            role = body.get("role", "operator")
            ok, result = self.store.register_user(body["username"], body["password"], role)
            if not ok:
                return self._resp(409, {"error": result})
            return self._resp(201, result)

        if method == "POST" and path == "/login":
            body = self._read_json(request)
            if not body or not isinstance(body.get("username"), str) or not isinstance(body.get("password"), str):
                return self._resp(400, {"error": "invalid body"})
            user = self.store.authenticate_user(body["username"], body["password"])
            if user is None:
                return self._resp(401, {"error": "invalid credentials"})
            token = make_token(
                {"uid": user["id"], "sub": user["username"], "role": user["role"]},
                self.secret,
                3600,
                self.now_fn(),
            )
            return self._resp(200, {"token": token})

        if method == "GET" and path == "/listings":
            rows = self.conn.execute(
                "SELECT id, sku, name, quantity FROM listings ORDER BY sku ASC"
            ).fetchall()
            return self._resp(
                200,
                [{"id": r[0], "sku": r[1], "name": r[2], "quantity": r[3]} for r in rows],
            )

        if method == "POST" and path == "/listings":
            if self._current_user(request) is None:
                return self._resp(401, {"error": "unauthorized"})
            body = self._read_json(request)
            if not body:
                return self._resp(400, {"error": "invalid body"})
            sku = body.get("sku")
            name = body.get("name")
            qty = body.get("quantity")
            if (
                not isinstance(sku, str)
                or not sku
                or not isinstance(name, str)
                or not name
                or isinstance(qty, bool)
                or not isinstance(qty, int)
                or qty < 0
            ):
                return self._resp(400, {"error": "invalid listing"})
            try:
                cur = self.conn.execute(
                    "INSERT INTO listings (sku, name, quantity) VALUES (?, ?, ?)",
                    (sku, name, qty),
                )
                self.conn.commit()
                return self._resp(201, {"id": cur.lastrowid, "sku": sku, "name": name, "quantity": qty})
            except sqlite3.IntegrityError:
                self.conn.rollback()
                return self._resp(409, {"error": "sku already exists"})

        return self._resp(404, {"error": "not found"})
```

## Restored

Operators can register, authenticate with signed Bearer tokens, publish new supply listings, and read the sorted catalog.
