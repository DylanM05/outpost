---
id: ts-assertion-functions
kind: code
language: typescript
title: Narrow types by throwing with TypeScript assertion functions (asserts val is T)
system: Guard gate
symbol: instrument
scene: tests
skills: ts-narrowing-unions
---

## Briefing

Sometimes you don't want an `if (...)` branch — you want to assert an invariant and throw immediately if it fails, while telling TypeScript that every line *after* the assertion can rely on the narrowed type!

## Objective

Define and implement:
1. `function assertDefined<T>(val: T | null | undefined, label: string): asserts val is T`:
   - If `val === null || val === undefined`, throw `new Error(\`Missing required value: \${label}\`)`.
2. `interface EndpointConfig { host?: string | null; port?: number | null; }`
3. `function buildEndpointUrl(cfg: EndpointConfig): string`:
   - Uses `assertDefined(cfg.host, "host")` and `assertDefined(cfg.port, "port")`.
   - Returns `` `https://${cfg.host}:${cfg.port}` `` (with `cfg.host` narrowed to `string` and `cfg.port` narrowed to `number`!).

## Concept

- An assertion signature `: asserts val is T` informs TypeScript that if the function returns normally (without throwing), `val` is guaranteed to have type `T` for the rest of the current scope.
- Unlike `val!` (non-null assertion operator), an `asserts` function actually enforces the check at runtime so bugs fail loudly with a clear message instead of silently propagating `undefined`.

## Hints

1. Write `function assertDefined<T>(val: T | null | undefined, label: string): asserts val is T { if (val === null || val === undefined) throw new Error(\`Missing required value: \${label}\`); }`.
2. Call `assertDefined(cfg.host, "host"); assertDefined(cfg.port, "port");` in `buildEndpointUrl` — notice you don't need `!` afterwards!

## Starter: guided

```typescript
interface EndpointConfig {
  host?: string | null;
  port?: number | null;
}

function assertDefined<T>(val: T | null | undefined, label: string): asserts val is T {
  // Throw Error(`Missing required value: ${label}`) when val is null or undefined
}

function buildEndpointUrl(cfg: EndpointConfig): string {
  // Use assertDefined on cfg.host and cfg.port, then return `https://${cfg.host}:${cfg.port}`
  return "";
}
```

## Starter: standard

```typescript
// Define EndpointConfig, assertDefined<T>(...): asserts val is T, and buildEndpointUrl(cfg)
```

## Starter: challenge

```typescript
```

## Checks

```javascript
expectType(
  "assertDefined narrows nullable values for subsequent lines",
  "function _check(x: string | null): number { assertDefined(x, 'x'); return x.length; }",
);

expect("builds URL when host and port are present", () =>
  get("buildEndpointUrl")({ host: "ridge.local", port: 8443 }),
  "https://ridge.local:8443",
);

expectThrows(
  "throws descriptive Error when host is missing",
  () => get("buildEndpointUrl")({ port: 443 }),
  /Missing required value: host/,
);

expectThrows(
  "throws descriptive Error when port is null",
  () => get("buildEndpointUrl")({ host: "ridge.local", port: null }),
  /Missing required value: port/,
);
```

## Hidden checks

```javascript
expect("allows falsy-but-defined values like 0 or empty string in assertDefined", () => {
  const assertDefined = get("assertDefined");
  assertDefined(0, "zero");
  assertDefined("", "empty");
  assertDefined(false, "flag");
  return true;
}, true);
```

## Solution

```typescript
interface EndpointConfig {
  host?: string | null;
  port?: number | null;
}

function assertDefined<T>(val: T | null | undefined, label: string): asserts val is T {
  if (val === null || val === undefined) {
    throw new Error(`Missing required value: ${label}`);
  }
}

function buildEndpointUrl(cfg: EndpointConfig): string {
  assertDefined(cfg.host, "host");
  assertDefined(cfg.port, "port");
  return `https://${cfg.host}:${cfg.port}`;
}
```

## Restored

Guard gate assertion functions online — missing configuration values fail loudly at runtime while narrowing cleanly at compile time.
