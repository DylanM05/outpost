---
id: who-may-change-it
title: Who may change it
system: Gatehouse
symbol: controller
scene: tests
skills: auth, api-design
---

## Briefing

**Authentication** asks "who are you?" (`401 Unauthorized` if we can't tell). **Authorization** asks "are you allowed to do this?" (`403 Forbidden` if we know who you are, and the answer is no). Operators on the exchange may cancel their *own* supply orders, and admins may cancel *any* order — nobody else may touch another operator's order.

## Objective

Write two functions (your token verifier is provided in the starter):

1. `authenticate(request, secret, now)`:
   - Reads the `Authorization` header (case-insensitive) from `request.get("headers", {})`.
   - Must start with `"Bearer "` followed by a valid token verified by `verify_token(token, secret, now)`.
   - Returns the verified `claims` dict, or `None` if missing, malformed, invalid, or expired.
2. `authorize_order_action(request, order_owner, secret, now)`:
   - Calls `authenticate(request, secret, now)`.
   - If not authenticated, returns `(401, {"error": "unauthorized"})`.
   - If `claims.get("role") == "admin"` or `claims.get("sub") == order_owner`, returns `(200, claims)`.
   - Otherwise returns `(403, {"error": "forbidden"})`.

```python
# Mara tries to cancel Ines's order (Mara is role="operator"):
authorize_order_action(mara_req, "ines", SECRET, now=100)  # (403, {"error": "forbidden"})
# Missing Authorization header:
authorize_order_action(anon_req, "ines", SECRET, now=100)  # (401, {"error": "unauthorized"})
```

## Concept

Never blur `401` and `403`:

- **`401 Unauthorized`** really means *unauthenticated*: no token, bad format (e.g. missing `"Bearer "`), bad signature, or expired token. The client needs to log in again.
- **`403 Forbidden`** means *authenticated, but not permitted*: we know you are Mara, and Mara doesn't own Ines's order and isn't an admin. Logging in again won't change that.

Always check ownership against the **verified token's `sub` claim** — never against a `user_id` field that the client sent in the request body!

## Hints

1. Lowercase header keys first: `headers = {k.lower(): v for k, v in request.get("headers", {}).items()}`.
2. Check `auth = headers.get("authorization", "")` and `if not auth.startswith("Bearer "): return None`, then `token = auth[len("Bearer "):]`.
3. In `authorize_order_action`, return `401` when `claims is None`, `200` when `claims.get("role") == "admin" or claims.get("sub") == order_owner`, and `403` otherwise.

## Starter: guided

```python
import base64
import hashlib
import hmac
import json


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    payload_b64, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        claims = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims


def authenticate(request, secret, now):
    headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
    auth = headers.get("authorization", "")
    # Require "Bearer <token>" and verify with verify_token.
    return None


def authorize_order_action(request, order_owner, secret, now):
    claims = authenticate(request, secret, now)
    # Return 401 if None, 200 if admin or owner, 403 otherwise.
    return (401, {"error": "unauthorized"})
```

## Starter: standard

```python
import base64
import hashlib
import hmac
import json


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    payload_b64, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        claims = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims


def authenticate(request, secret, now):
    return None


def authorize_order_action(request, order_owner, secret, now):
    return (401, {"error": "unauthorized"})
```

## Starter: challenge

```python
import base64
import hashlib
import hmac
import json


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    payload_b64, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        claims = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims
```

## Checks

```python
import base64 as _b64, hashlib as _hl, hmac as _hm, json as _json

SECRET = "ridge-secret"

def _mint(claims):
    raw = _json.dumps(claims, sort_keys=True, separators=(",", ":")).encode()
    p = _b64.urlsafe_b64encode(raw).decode().rstrip("=")
    s = _hm.new(SECRET.encode(), p.encode(), _hl.sha256).hexdigest()
    return f"{p}.{s}"

mara_tok = _mint({"sub": "mara", "role": "operator", "exp": 500})
admin_tok = _mint({"sub": "chief", "role": "admin", "exp": 500})

expect("missing header returns 401", lambda: get("authorize_order_action")({"headers": {}}, "ines", SECRET, 100)[0], 401)
expect("owner allowed (200)", lambda: get("authorize_order_action")({"headers": {"Authorization": f"Bearer {mara_tok}"}}, "mara", SECRET, 100)[0], 200)
expect("non-owner operator denied with 403", lambda: get("authorize_order_action")({"headers": {"Authorization": f"Bearer {mara_tok}"}}, "ines", SECRET, 100)[0], 403)
expect("admin allowed on another user's order (200)", lambda: get("authorize_order_action")({"headers": {"Authorization": f"Bearer {admin_tok}"}}, "ines", SECRET, 100)[0], 200)
```

## Hidden checks

```python
expect("expired token returns 401, not 403", lambda: get("authorize_order_action")({"headers": {"Authorization": f"Bearer {mara_tok}"}}, "mara", SECRET, 600)[0], 401)
expect("non-Bearer scheme rejected with 401", lambda: get("authorize_order_action")({"headers": {"Authorization": f"Basic {mara_tok}"}}, "mara", SECRET, 100)[0], 401)
expect("lowercase authorization header works", lambda: get("authorize_order_action")({"headers": {"authorization": f"Bearer {mara_tok}"}}, "mara", SECRET, 100)[0], 200)
```

## Solution

```python
import base64
import hashlib
import hmac
import json


def verify_token(token, secret, now):
    if not isinstance(token, str) or token.count(".") != 1:
        return None
    payload_b64, sig = token.split(".")
    expected = hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        claims = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(claims, dict) or claims.get("exp", 0) <= now:
        return None
    return claims


def authenticate(request, secret, now):
    headers = {k.lower(): v for k, v in request.get("headers", {}).items()}
    auth = headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[len("Bearer "):]
    return verify_token(token, secret, now)


def authorize_order_action(request, order_owner, secret, now):
    claims = authenticate(request, secret, now)
    if claims is None:
        return (401, {"error": "unauthorized"})
    if claims.get("role") == "admin" or claims.get("sub") == order_owner:
        return (200, claims)
    return (403, {"error": "forbidden"})
```

## Restored

The gatehouse now enforces both authentication (`401`) and ownership/role authorization (`403`) on every protected order.
