---
id: maintenance-ts-partial-merge
language: typescript
title: Merge partial configuration overrides into a Readonly<T> object without mutating the base
system: Utility deck
symbol: controller
scene: tests
skills: ts-generics-utilities
reviewSkill: ts-generics-utilities
prerequisite: ts-typed-event-bus
---

## Briefing

Write a generic `mergeConfig<T extends object>(defaults: T, overrides: Partial<T>): Readonly<T>` helper that ignores `undefined` values in `overrides` so explicit `undefined` keys never wipe out valid defaults!

## Objective

Implement `mergeConfig<T extends object>(defaults: T, overrides: Partial<T>): Readonly<T>` returning a fresh object with defined keys from `overrides` layered over `defaults`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Start with `const out = { ...defaults };`, then iterate `for (const key of Object.keys(overrides) as (keyof T)[])` and copy only when `overrides[key] !== undefined`.

## Starter

```typescript
// Implement mergeConfig<T extends object>(defaults: T, overrides: Partial<T>): Readonly<T>
```

## Checks

```javascript
expectType(
  "returns Readonly<T> matching defaults shape",
  "const _cfg: Readonly<{ host: string; port: number }> = mergeConfig({ host: 'a', port: 80 }, { port: 443 });",
);
expectTypeError(
  "rejects unknown override property",
  "mergeConfig({ host: 'a', port: 80 }, { bogus: true });",
  2353,
);
expect("merges overrides while ignoring undefined values and preserving defaults", () => {
  const base = { host: "ridge", port: 80, tls: false };
  const merged = get("mergeConfig")(base, { port: 443, host: undefined });
  return [merged, base.port];
}, [{ host: "ridge", port: 443, tls: false }, 80]);
```

## Hidden checks

```javascript
expect("preserves falsy defined overrides like 0 and false", () =>
  get("mergeConfig")({ retries: 3, tls: true }, { retries: 0, tls: false }),
  { retries: 0, tls: false },
);
```

## Solution

```typescript
function mergeConfig<T extends object>(defaults: T, overrides: Partial<T>): Readonly<T> {
  const out: T = { ...defaults };
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const val = overrides[key];
    if (val !== undefined) {
      out[key] = val;
    }
  }
  return out;
}
```

## Restored

Utility deck config merger restored.
