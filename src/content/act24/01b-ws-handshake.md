---
id: ws-handshake
title: Perform RFC 6455 WebSocket HTTP upgrade handshakes
system: Socket bench
symbol: instrument
scene: tests
skills: websockets
---

## Briefing

Every WebSocket connection begins as a standard HTTP/1.1 `GET` request asking to `Upgrade: websocket`. To prove the server speaks RFC 6455 (and prevent proxy cache confusion), it concatenates the client's `Sec-WebSocket-Key` with a fixed RFC magic GUID, hashes with SHA-1, and returns Base64 in `Sec-WebSocket-Accept` with status `101 Switching Protocols`.

## Concept

RFC 6455 GUID: `"258EAFA5-E914-47DA-95CA-C5AB0DC85B11"`.
1. **`websocket_accept(sec_key)`:**
   - Compute `base64.b64encode(hashlib.sha1((sec_key.strip() + GUID).encode("ascii")).digest()).decode("ascii")`.
2. **`handle_ws_upgrade(headers)`:**
   - Look up headers case-insensitively!
   - Validate all four requirements:
     - `upgrade` (lowercased) == `"websocket"`
     - `"upgrade"` appears as a comma-separated token in `connection` (lowercased, stripped)
     - `sec-websocket-version` == `"13"`
     - `sec-websocket-key` is present and non-empty (stripped)
   - If valid: return `(101, {"Upgrade": "websocket", "Connection": "Upgrade", "Sec-WebSocket-Accept": websocket_accept(key)})`.
   - If invalid: return `(400, {"Content-Type": "text/plain"})`.

## Objective

Implement `websocket_accept(sec_key)` and `handle_ws_upgrade(headers)`.

## Hints

1. Note browsers often send `Connection: keep-alive, Upgrade` — split `connection` on `","` and check `"upgrade" in [t.strip().lower() for t in conn.split(",")]`!
2. The famous RFC 6455 test vector: `websocket_accept("dGhlIHNhbXBsZSBub25jZQ==")` MUST equal `"s3pPLMBiTxaQ9kYGzzhZRbK+xOo="`!

## Starter: guided

```python
import base64
import hashlib

WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


def websocket_accept(sec_key):
    raw = (sec_key.strip() + WS_GUID).encode("ascii")
    return base64.b64encode(hashlib.sha1(raw).digest()).decode("ascii")


def handle_ws_upgrade(headers):
    # Normalize headers case-insensitively, verify Upgrade/Connection/Version/Key, return (101, ...) or (400, ...).
    pass
```

## Starter: standard

```python
import base64
import hashlib


def websocket_accept(sec_key):
    pass


def handle_ws_upgrade(headers):
    pass
```

## Starter: challenge

```python
```

## Checks

```python
expect("matches official RFC 6455 Sec-WebSocket-Accept test vector", lambda: get("websocket_accept")("dGhlIHNhbXBsZSBub25jZQ=="), "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=")

def _valid_upgrade():
    hdrs = {
        "Upgrade": "websocket",
        "Connection": "keep-alive, Upgrade",
        "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
        "Sec-WebSocket-Version": "13",
    }
    return get("handle_ws_upgrade")(hdrs)
expect("returns 101 Switching Protocols with Sec-WebSocket-Accept", _valid_upgrade, (
    101,
    {
        "Upgrade": "websocket",
        "Connection": "Upgrade",
        "Sec-WebSocket-Accept": "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=",
    },
))
```

## Hidden checks

```python
expect("rejects wrong WebSocket version with 400", lambda: get("handle_ws_upgrade")({
    "upgrade": "websocket",
    "connection": "Upgrade",
    "sec-websocket-key": "abc",
    "sec-websocket-version": "8",
})[0], 400)
expect("rejects missing key with 400", lambda: get("handle_ws_upgrade")({
    "upgrade": "websocket",
    "connection": "Upgrade",
    "sec-websocket-version": "13",
})[0], 400)
```

## Solution

```python
import base64
import hashlib

WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


def websocket_accept(sec_key):
    raw = (sec_key.strip() + WS_GUID).encode("ascii")
    return base64.b64encode(hashlib.sha1(raw).digest()).decode("ascii")


def handle_ws_upgrade(headers):
    lower = {k.lower(): v for k, v in headers.items()}
    upgrade = lower.get("upgrade", "").strip().lower()
    conn_tokens = [t.strip().lower() for t in lower.get("connection", "").split(",")]
    version = lower.get("sec-websocket-version", "").strip()
    key = lower.get("sec-websocket-key", "").strip()
    if upgrade != "websocket" or "upgrade" not in conn_tokens or version != "13" or not key:
        return (400, {"Content-Type": "text/plain"})
    return (
        101,
        {
            "Upgrade": "websocket",
            "Connection": "Upgrade",
            "Sec-WebSocket-Accept": websocket_accept(key),
        },
    )
```

## Restored

The socket bench now completes RFC 6455 HTTP-to-WebSocket upgrades accurately.
