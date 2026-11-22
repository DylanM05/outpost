---
id: maintenance-fix-ws-accept
title: Fix a WebSocket handshake using SHA-256 instead of RFC 6455 SHA-1
system: Socket bench
symbol: instrument
scene: tests
skills: websockets
reviewSkill: websockets
prerequisite: ws-room-broker
---

## Briefing

Browsers are rejecting our WebSocket upgrade handshake because someone swapped RFC 6455's required `SHA-1` digest for `SHA-256`!

## Objective

Fix `compute_ws_accept(sec_key)` so it returns the exact RFC 6455 `Sec-WebSocket-Accept` header (`base64(sha1(sec_key.strip() + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Replace `hashlib.sha256` with `hashlib.sha1` and strip whitespace from `sec_key`.

## Starter

```python
import base64
import hashlib

WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


def compute_ws_accept(sec_key):
    return base64.b64encode(hashlib.sha256((sec_key + WS_GUID).encode("ascii")).digest()).decode("ascii")
```

## Checks

```python
expect("matches official RFC 6455 accept vector", lambda: get("compute_ws_accept")("dGhlIHNhbXBsZSBub25jZQ=="), "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=")
```

## Hidden checks

```python
expect("strips leading/trailing whitespace on key", lambda: get("compute_ws_accept")(" dGhlIHNhbXBsZSBub25jZQ== "), "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=")
```

## Solution

```python
import base64
import hashlib

WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


def compute_ws_accept(sec_key):
    raw = (sec_key.strip() + WS_GUID).encode("ascii")
    return base64.b64encode(hashlib.sha1(raw).digest()).decode("ascii")
```

## Restored

WebSocket handshakes now produce the exact RFC 6455 `Sec-WebSocket-Accept` proof.
