---
id: zod-validator
language: javascript
title: Build a composable Zod-style runtime schema validator
system: Schema deck
symbol: instrument
scene: tests
skills: js-validation-auth
---

## Briefing

Because JavaScript has no runtime type enforcement on incoming JSON payloads, libraries like **Zod** let you declare tiny composable schemas (`z.object({ name: z.string().min(2), port: z.number().min(1) })`) that return `{ ok: true, data }` or `{ ok: false, errors }`!

## Concept

Implement a mini schema builder object `z` with:
- `z.string()`: validates `typeof val === "string"`, supports chaining `.min(n)` (`val.length >= n`).
- `z.number()`: validates `typeof val === "number" && !Number.isNaN(val)`, supports chaining `.min(n)` (`val >= n`) and `.max(n)` (`val <= n`).
- `z.boolean()`: validates `typeof val === "boolean"`.
- `z.object(shape)`: validates plain non-null non-array object and checks every `[field, schema]` in `shape`, **stripping unknown extra keys** from the returned `data` and prefixing nested errors with `field` (e.g. `"port: must be >= 1"`).
- Every schema supports `.optional()` (accepts `undefined` without error) AND `.safeParse(value)` returning `{ ok: true, data }` or `{ ok: false, errors: string[] }`!

## Objective

Implement the `z` schema builder (`string`, `number`, `boolean`, `object`, `.min`, `.max`, `.optional`, `.safeParse`).

## Hints

1. Keep schema builders immutable or wrap a `validate(val) -> { ok, data, errors }` closure inside a tiny `makeSchema(fn)` helper that attaches `.optional()` and `.safeParse(val)`!

## Starter: guided

```javascript
function makeSchema(validate) {
  return {
    safeParse(value) {
      return validate(value);
    },
    optional() {
      return makeSchema((value) => (value === undefined ? { ok: true, data: undefined } : validate(value)));
    },
  };
}

const z = {
  string() {
    // Support .min(n), .optional(), .safeParse(v).
  },
  number() {
    // Support .min(n), .max(n), .optional(), .safeParse(v).
  },
  boolean() {
    return makeSchema((v) => (typeof v === "boolean" ? { ok: true, data: v } : { ok: false, errors: ["expected boolean"] }));
  },
  object(shape) {
    // Validate plain object, run each field schema, strip unknown keys, collect prefixed errors.
  },
};
```

## Starter: standard

```javascript
const z = {
  string() {},
  number() {},
  boolean() {},
  object(shape) {},
};
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("parses valid nested object, handles optional fields, and strips unknown keys", () => {
  const z = get("z");
  const cfgSchema = z.object({
    host: z.string().min(2),
    port: z.number().min(1).max(65535),
    tls: z.boolean().optional(),
  });
  return cfgSchema.safeParse({ host: "ridge", port: 443, extra: "stripped" });
}, { ok: true, data: { host: "ridge", port: 443 } });

expect("collects all field errors on invalid input", () => {
  const z = get("z");
  const cfgSchema = z.object({
    host: z.string().min(3),
    port: z.number().min(1).max(100),
  });
  const res = cfgSchema.safeParse({ host: "a", port: 200 });
  return { ok: res.ok, count: res.errors.length, hasHost: res.errors.some((e) => e.startsWith("host:")), hasPort: res.errors.some((e) => e.startsWith("port:")) };
}, { ok: false, count: 2, hasHost: true, hasPort: true });
```

## Hidden checks

```javascript
expect("rejects NaN for z.number() and arrays for z.object()", () => {
  const z = get("z");
  return [
    z.number().safeParse(NaN).ok,
    z.object({ a: z.number() }).safeParse([]).ok,
    z.object({ a: z.number() }).safeParse(null).ok,
  ];
}, [false, false, false]);
```

## Solution

```javascript
function makeSchema(validate, extras = {}) {
  return {
    safeParse(value) {
      return validate(value);
    },
    optional() {
      return makeSchema((value) => (value === undefined ? { ok: true, data: undefined } : validate(value)));
    },
    ...extras,
  };
}

function stringSchema(minLen = null) {
  return makeSchema(
    (v) => {
      if (typeof v !== "string") return { ok: false, errors: ["expected string"] };
      if (minLen !== null && v.length < minLen) return { ok: false, errors: [`length must be >= ${minLen}`] };
      return { ok: true, data: v };
    },
    { min: (n) => stringSchema(n) },
  );
}

function numberSchema(minVal = null, maxVal = null) {
  return makeSchema(
    (v) => {
      if (typeof v !== "number" || Number.isNaN(v)) return { ok: false, errors: ["expected number"] };
      if (minVal !== null && v < minVal) return { ok: false, errors: [`must be >= ${minVal}`] };
      if (maxVal !== null && v > maxVal) return { ok: false, errors: [`must be <= ${maxVal}`] };
      return { ok: true, data: v };
    },
    {
      min: (n) => numberSchema(n, maxVal),
      max: (n) => numberSchema(minVal, n),
    },
  );
}

const z = {
  string: () => stringSchema(),
  number: () => numberSchema(),
  boolean: () =>
    makeSchema((v) => (typeof v === "boolean" ? { ok: true, data: v } : { ok: false, errors: ["expected boolean"] })),
  object(shape) {
    return makeSchema((v) => {
      if (v === null || typeof v !== "object" || Array.isArray(v)) {
        return { ok: false, errors: ["expected object"] };
      }
      const data = {};
      const errors = [];
      for (const [key, fieldSchema] of Object.entries(shape)) {
        const res = fieldSchema.safeParse(v[key]);
        if (res.ok) {
          if (res.data !== undefined) data[key] = res.data;
        } else {
          for (const msg of res.errors) errors.push(`${key}: ${msg}`);
        }
      }
      return errors.length ? { ok: false, errors } : { ok: true, data };
    });
  },
};
```

## Restored

The schema deck now validates untrusted JSON payloads at runtime with composable Zod-style schemas.
