---
id: maintenance-js-query-string
language: javascript
title: Merge and normalize URL query parameters with URLSearchParams
system: Fetch bench
symbol: instrument
scene: tests
skills: js-web-apis
reviewSkill: js-web-apis
prerequisite: middleware-chain
---

## Briefing

Updating one filter or page parameter on an existing URL without dropping the other parameters is cleanest with JavaScript's `URL` and `URLSearchParams`.

## Objective

Write `withQuery(urlStr, updates)` returning the updated URL string: for each `[key, val]` in `Object.entries(updates)`, if `val === null || val === undefined` delete that parameter, otherwise `set(key, String(val))`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Parse with `const u = new URL(urlStr);`, mutate `u.searchParams`, and return `u.toString()`.

## Starter

```javascript
```

## Checks

```javascript
expect("sets new params, overwrites existing, and deletes null params", () => get("withQuery")("https://outpost.local/logs?level=info&page=1", { page: 2, level: null, site: "ridge" }), "https://outpost.local/logs?page=2&site=ridge");
```

## Hidden checks

```javascript
expect("removes query string when last parameter is deleted", () => get("withQuery")("https://outpost.local/logs?a=1", { a: undefined }), "https://outpost.local/logs");
```

## Solution

```javascript
function withQuery(urlStr, updates) {
  const u = new URL(urlStr);
  for (const [k, v] of Object.entries(updates ?? {})) {
    if (v === null || v === undefined) u.searchParams.delete(k);
    else u.searchParams.set(k, String(v));
  }
  return u.toString();
}
```

## Restored

URL query updates now merge and delete parameters cleanly without manual string hacking.
