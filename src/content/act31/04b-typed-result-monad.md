---
id: ts-typed-result-monad
kind: code
language: typescript
title: Build a generic Result<T, E> discriminated union with mapResult and unwrapOr
system: Generic bay
symbol: equipment
scene: tests
skills: ts-generics-utilities, ts-narrowing-unions
---

## Briefing

Exceptions in TypeScript aren't tracked by the type system — any function can throw anything! Returning a generic discriminated union **`Result<T, E>`** makes both success values and failure modes explicit in the function signature.

## Objective

Define and implement:
1. `type Result<T, E = string> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };`
2. `function ok<T>(value: T): Result<T, never>` — returns `{ ok: true, value }`.
3. `function err<E>(error: E): Result<never, E>` — returns `{ ok: false, error }`.
4. `function mapResult<T, U, E>(res: Result<T, E>, fn: (value: T) => U): Result<U, E>`:
   - If `res.ok` is `true`, returns `ok(fn(res.value))`; otherwise returns `res` unchanged.
5. `function unwrapOr<T, E>(res: Result<T, E>, fallback: T): T`:
   - Returns `res.value` when `res.ok` is `true`, otherwise `fallback`.

## Concept

- Typing `ok<T>(value: T): Result<T, never>` lets an `ok(42)` value be assigned to `Result<number, ErrorCode>` for *any* error type `E`, because `never` is assignable to every type!
- Likewise `err<E>(error: E): Result<never, E>` is assignable to `Result<T, E>` for *any* success type `T`.

## Hints

1. `ok`: `return { ok: true, value };` and `err`: `return { ok: false, error };`.
2. In `mapResult`, `if (!res.ok) return res; return ok(fn(res.value));`.

## Starter: guided

```typescript
type Result<T, E = string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

function mapResult<T, U, E>(res: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  // Transform value on ok, pass through error on failure
  return res as unknown as Result<U, E>;
}

function unwrapOr<T, E>(res: Result<T, E>, fallback: T): T {
  return fallback;
}
```

## Starter: standard

```typescript
// Define Result<T, E = string>, ok, err, mapResult, and unwrapOr
```

## Starter: challenge

```typescript
```

## Checks

```javascript
expectType(
  "ok/err compose cleanly into typed Result<T, E> functions and mapResult preserves error type",
  `function _div(a: number, b: number): Result<number, "DIV_ZERO"> {
     return b === 0 ? err("DIV_ZERO") : ok(a / b);
   }
   const _r1: Result<string, "DIV_ZERO"> = mapResult(_div(10, 2), (n) => n.toFixed(1));
   const _val: string = unwrapOr(_r1, "0.0");`,
);

expectTypeError(
  "rejects reading .value before narrowing res.ok",
  "function _bad(r: Result<number, string>) { return r.value; }",
  2339,
);

expect("maps ok values and preserves err values untouched", () => {
  const okFn = get("ok");
  const errFn = get("err");
  const mapResult = get("mapResult");
  const unwrapOr = get("unwrapOr");
  const r1 = mapResult(okFn(21), (n) => n * 2);
  const r2 = mapResult(errFn("offline"), (n) => n * 2);
  return [r1, r2, unwrapOr(r1, 0), unwrapOr(r2, 99)];
}, [
  { ok: true, value: 42 },
  { ok: false, error: "offline" },
  42,
  99,
]);
```

## Hidden checks

```javascript
expect("mapResult does not invoke callback on err result", () => {
  let called = false;
  const res = get("mapResult")(get("err")("boom"), () => {
    called = true;
    return 1;
  });
  return [called, res];
}, [false, { ok: false, error: "boom" }]);
```

## Solution

```typescript
type Result<T, E = string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

function mapResult<T, U, E>(res: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (!res.ok) return res;
  return ok(fn(res.value));
}

function unwrapOr<T, E>(res: Result<T, E>, fallback: T): T {
  return res.ok ? res.value : fallback;
}
```

## Restored

Generic bay `Result<T, E>` primitives online — errors now travel through your type signatures explicitly without hidden exceptions.
