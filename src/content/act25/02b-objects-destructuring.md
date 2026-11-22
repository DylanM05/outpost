---
id: objects-destructuring
language: javascript
title: Merge configs safely with destructuring, rest/spread, and optional chaining
system: Array rack
symbol: equipment
scene: tests
skills: js-fundamentals
---

## Briefing

JavaScript APIs pass option bags everywhere. **Destructuring with defaults**, **rest/spread** (`{ ...base, ...override }`), and **optional chaining** (`cfg?.network?.port ?? 8080`) let you extract nested fields and produce updated copies without mutating caller objects or crashing on `undefined` properties.

## Concept

Implement two functions:
1. `readEndpoint(config)`:
   - Safely navigates `config?.network?.host` (default `"localhost"`) and `config?.network?.port` (default `8080`, preserving `0` if explicitly given via `??`!) and `config?.tls` (default `false`).
   - Returns `` `${tls ? "https" : "http"}://${host}:${port}` ``.
2. `patchUser(user, updates)`:
   - Extracts and **strips** any sensitive `"password"` or `"role"` keys from `updates` (ignoring attempts to overwrite them!) using object destructuring with rest: `const { password, role, ...safeUpdates } = updates;`.
   - Returns a **new** object `{ ...user, ...safeUpdates, updatedCount: (user.updatedCount ?? 0) + 1 }` without mutating `user` or `updates`!

## Objective

Implement `readEndpoint(config)` and `patchUser(user, updates)`.

## Hints

1. `const { password: _p, role: _r, ...safeUpdates } = updates ?? {};` cleanly drops disallowed keys in one line!

## Starter: guided

```javascript
function readEndpoint(config) {
  const host = config?.network?.host ?? "localhost";
  const port = config?.network?.port ?? 8080;
  const tls = config?.tls ?? false;
  return `${tls ? "https" : "http"}://${host}:${port}`;
}

function patchUser(user, updates) {
  // Strip password and role from updates using rest destructuring, return new object with incremented updatedCount.
}
```

## Starter: standard

```javascript
function readEndpoint(config) {
}

function patchUser(user, updates) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("uses defaults when nested properties are missing", () => get("readEndpoint")(null), "http://localhost:8080");
expect("reads nested TLS host and port", () => get("readEndpoint")({ tls: true, network: { host: "ridge.local", port: 443 } }), "https://ridge.local:443");
expect("strips protected fields and does not mutate original user", () => {
  const orig = { id: 1, name: "Ada", role: "operator", updatedCount: 2 };
  const next = get("patchUser")(orig, { name: "Grace", role: "admin", password: "hack", email: "g@outpost.io" });
  return { orig, next };
}, {
  orig: { id: 1, name: "Ada", role: "operator", updatedCount: 2 },
  next: { id: 1, name: "Grace", role: "operator", email: "g@outpost.io", updatedCount: 3 },
});
```

## Hidden checks

```javascript
expect("initializes updatedCount to 1 when missing", () => get("patchUser")({ id: 2 }, { name: "Lin" }), { id: 2, name: "Lin", updatedCount: 1 });
expect("preserves port 0 via nullish coalescing", () => get("readEndpoint")({ network: { port: 0 } }), "http://localhost:0");
```

## Solution

```javascript
function readEndpoint(config) {
  const host = config?.network?.host ?? "localhost";
  const port = config?.network?.port ?? 8080;
  const tls = config?.tls ?? false;
  return `${tls ? "https" : "http"}://${host}:${port}`;
}

function patchUser(user, updates) {
  const { password: _password, role: _role, ...safeUpdates } = updates ?? {};
  return {
    ...user,
    ...safeUpdates,
    updatedCount: (user.updatedCount ?? 0) + 1,
  };
}
```

## Restored

The array rack now handles nested config options and immutable object patches cleanly.
