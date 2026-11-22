---
id: maintenance-js-route-params
language: javascript
title: Extract Express-style :param values from a URL path
system: Router rack
symbol: equipment
scene: tests
skills: js-web-apis
reviewSkill: js-web-apis
prerequisite: middleware-chain
---

## Briefing

Dynamic HTTP routes like `"/sites/:site/drones/:id"` match incoming pathnames segment by segment and decode URL-encoded parameters.

## Objective

Write `extractParams(pattern, pathname)` returning a params object `{ name: decodedValue }` if `pathname` matches `pattern`, or `null` if segment counts or literal segments differ.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Split both strings with `.split("/").filter(Boolean)` and use `decodeURIComponent` on `:param` captures.

## Starter

```javascript
```

## Checks

```javascript
expect("extracts decoded named params", () => get("extractParams")("/sites/:site/drones/:id", "/sites/north%20ridge/drones/k7"), { site: "north ridge", id: "k7" });
expect("returns null when literal segment mismatches", () => get("extractParams")("/sites/:site", "/users/ada"), null);
```

## Hidden checks

```javascript
expect("returns null on different segment counts", () => get("extractParams")("/a/:b", "/a/1/2"), null);
```

## Solution

```javascript
function extractParams(pattern, pathname) {
  const pSegs = pattern.split("/").filter(Boolean);
  const aSegs = pathname.split("/").filter(Boolean);
  if (pSegs.length !== aSegs.length) return null;
  const params = {};
  for (let i = 0; i < pSegs.length; i++) {
    if (pSegs[i].startsWith(":")) params[pSegs[i].slice(1)] = decodeURIComponent(aSegs[i]);
    else if (pSegs[i] !== aSegs[i]) return null;
  }
  return params;
}
```

## Restored

Express-style path matching now extracts and decodes route parameters accurately.
