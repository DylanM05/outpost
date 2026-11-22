---
id: maintenance-js-base64url
language: javascript
title: Encode and decode JSON objects with URL-safe Base64URL
system: Schema deck
symbol: instrument
scene: tests
skills: js-validation-auth
reviewSkill: js-validation-auth
prerequisite: json-jwt-guard
---

## Briefing

JWT headers and payloads must be safe inside URLs and HTTP headers, so they use **Base64URL** (`+` -> `-`, `/` -> `_`, and no trailing `=` padding).

## Objective

Implement `encodeJsonB64Url(obj)` and `decodeJsonB64Url(str)` round-tripping plain JSON objects (including Unicode text via `TextEncoder`/`TextDecoder`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Convert UTF-8 bytes via `new TextEncoder().encode(JSON.stringify(obj))`, Base64-encode with `btoa`, replace `+`/`/`/`=`, and reverse on decode!

## Starter

```javascript
```

## Checks

```javascript
expect("produces URL-safe Base64 without padding and round-trips UTF-8 JSON", () => {
  const encoded = get("encodeJsonB64Url")({ user: "Ada", note: "café ✓" });
  const decoded = get("decodeJsonB64Url")(encoded);
  return { noPad: !encoded.includes("="), noUnsafe: !/[+/]/.test(encoded), decoded };
}, { noPad: true, noUnsafe: true, decoded: { user: "Ada", note: "café ✓" } });
```

## Hidden checks

```javascript
expect("round-trips nested arrays and numbers", () => get("decodeJsonB64Url")(get("encodeJsonB64Url")({ ids: [1, 2, 3], ok: true })), { ids: [1, 2, 3], ok: true });
```

## Solution

```javascript
const _te = new TextEncoder();
const _td = new TextDecoder();

function encodeJsonB64Url(obj) {
  const bytes = _te.encode(JSON.stringify(obj));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeJsonB64Url(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(_td.decode(bytes));
}
```

## Restored

Base64URL JSON codecs now encode Unicode payloads safely without URL-breaking characters.
