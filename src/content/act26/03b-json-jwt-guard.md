---
id: json-jwt-guard
language: javascript
title: Sign and verify Base64URL JWT tokens with Web Crypto HMAC-SHA256
system: Schema deck
symbol: instrument
scene: tests
skills: js-validation-auth
---

## Briefing

Modern JavaScript (both browsers AND Node.js!) includes the standard **Web Crypto API** (`crypto.subtle`) — letting you sign and verify real **HS256 JSON Web Tokens (JWTs)** with Base64URL encoding and expiration checks right in pure JS!

## Concept

A compact JWT has three Base64URL segments (`header.payload.signature`):
- Header: `{"alg":"HS256","typ":"JWT"}`.
- Base64URL encoding: standard Base64 with `+` -> `-`, `/` -> `_`, and trailing `=` stripped.
- Signature: `HMAC-SHA256` over ASCII `"${encHeader}.${encPayload}"` using `crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])`.
- **`async signJwt(payload, secret)`:**
  - Encodes header and `payload` as UTF-8 JSON -> Base64URL, signs `"${h}.${p}"`, and returns `"${h}.${p}.${sig}"`.
- **`async verifyJwt(token, secret, nowSec)`:**
  - Splits `token` into 3 dot-separated parts (return `null` if malformed).
  - Verifies signature with `crypto.subtle.verify("HMAC", key, sigBytes, dataBytes)` (return `null` if invalid!).
  - Parses header (`header.alg === "HS256"`, else `null` — blocking `alg: none` attacks!) and payload JSON.
  - If `payload.exp !== undefined && nowSec >= payload.exp`: return `null` (expired!).
  - Return the verified `payload` object!

## Objective

Implement `async function signJwt(payload, secret)` and `async function verifyJwt(token, secret, nowSec)`.

## Hints

1. Convert `Uint8Array` <-> Base64URL safely with:
   ```javascript
   function toBase64Url(bytes) {
     let bin = "";
     for (const b of bytes) bin += String.fromCharCode(b);
     return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
   }
   function fromBase64Url(str) {
     const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
     const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
     return Uint8Array.from(bin, (c) => c.charCodeAt(0));
   }
   ```

## Starter: guided

```javascript
const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64Url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function signJwt(payload, secret) {
  // Encode header & payload, sign with crypto.subtle.sign, return "h.p.s".
}

async function verifyJwt(token, secret, nowSec) {
  // Verify 3 parts, Web Crypto HMAC signature, alg === "HS256", and exp > nowSec.
}
```

## Starter: standard

```javascript
async function signJwt(payload, secret) {
}

async function verifyJwt(token, secret, nowSec) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("signs and verifies valid HS256 JWT and rejects expired or tampered tokens", async () => {
  const token = await get("signJwt")({ sub: "ada", role: "ops", exp: 2000 }, "station-secret");
  const ok = await get("verifyJwt")(token, "station-secret", 1500);
  const expired = await get("verifyJwt")(token, "station-secret", 2000);
  const wrongKey = await get("verifyJwt")(token, "other-secret", 1500);
  const parts = token.split(".");
  const tampered = `${parts[0]}.${parts[1].slice(0, -1)}X.${parts[2]}`;
  const badSig = await get("verifyJwt")(tampered, "station-secret", 1500);
  return { dots: parts.length, ok, expired, wrongKey, badSig };
}, {
  dots: 3,
  ok: { sub: "ada", role: "ops", exp: 2000 },
  expired: null,
  wrongKey: null,
  badSig: null,
});
```

## Hidden checks

```javascript
await expect("rejects alg:none forgery and malformed tokens", async () => {
  const fakeHeader = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/=+$/, "");
  const fakeBody = btoa(JSON.stringify({ sub: "admin" })).replace(/=+$/, "");
  return [
    await get("verifyJwt")(`${fakeHeader}.${fakeBody}.`, "sec", 0),
    await get("verifyJwt")("not.a.valid.jwt.token", "sec", 0),
  ];
}, [null, null]);
```

## Solution

```javascript
const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64Url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signJwt(payload, secret) {
  const header = toBase64Url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = toBase64Url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${header}.${body}`;
  const key = await importHmacKey(secret);
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
  const sig = toBase64Url(new Uint8Array(sigBuf));
  return `${signingInput}.${sig}`;
}

async function verifyJwt(token, secret, nowSec) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, sigB64] = parts;
  try {
    const header = JSON.parse(dec.decode(fromBase64Url(headerB64)));
    if (header?.alg !== "HS256") return null;
    const sigBytes = fromBase64Url(sigB64);
    const key = await importHmacKey(secret);
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(`${headerB64}.${bodyB64}`));
    if (!valid) return null;
    const payload = JSON.parse(dec.decode(fromBase64Url(bodyB64)));
    if (payload.exp !== undefined && nowSec >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
```

## Restored

The schema deck now issues and verifies real Web Crypto HS256 JWTs with strict algorithm and expiry enforcement.
