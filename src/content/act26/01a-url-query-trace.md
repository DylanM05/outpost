---
id: url-query-trace
kind: predict
language: javascript
title: Trace URL and URLSearchParams normalization in JavaScript
system: Fetch bench
symbol: instrument
scene: console
skills: js-web-apis, reading-code
---

## Briefing

Building query strings with manual string concatenation breaks on spaces, `&`, and `?`. Modern JavaScript ships the standard `URL` and `URLSearchParams` APIs in both browsers and Node.js.

## Objective

Trace the `URL` and `URLSearchParams` snippet below and predict **every line it prints**.

## Concept

- `new URL("/api/logs?level=info", "https://ridge.local")` resolves relative paths cleanly against a base origin.
- `u.searchParams.set("page", "2")` adds or replaces a parameter; `u.searchParams.append("tag", "b")` keeps multiple values for the same key!
- `u.searchParams.getAll("tag")` returns an array of all values for `"tag"`.

## Hints

1. Check `u.pathname` (`"/api/logs"`).
2. `u.searchParams.set("level", "warn")` replaces `"info"` with `"warn"`.
3. `u.searchParams.append("tag", "a")` followed by `"b"` produces `"a,b"` when joined with `","`.

## Program

```javascript
const u = new URL("/api/logs?level=info", "https://ridge.local");
u.searchParams.set("level", "warn");
u.searchParams.append("tag", "a");
u.searchParams.append("tag", "b");

console.log(u.pathname);
console.log(u.searchParams.get("level"));
console.log(u.searchParams.getAll("tag").join(","));
console.log(u.search);
```

## Output

```text
/api/logs
warn
a,b
?level=warn&tag=a&tag=b
```

## Restored

You traced how standard `URL` and `URLSearchParams` normalize paths and multi-value query parameters.
