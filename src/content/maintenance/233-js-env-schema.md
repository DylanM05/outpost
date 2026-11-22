---
id: maintenance-js-env-schema
language: javascript
title: Parse and validate environment variables into typed JS config
system: Schema deck
symbol: instrument
scene: tests
skills: js-validation-auth
reviewSkill: js-validation-auth
prerequisite: json-jwt-guard
---

## Briefing

`process.env` hands JavaScript strings for everything (`"8080"`, `"true"`). Failing fast on startup with strict coercion prevents subtle runtime bugs.

## Objective

Write `parseEnv(env)` expecting:
- `PORT`: optional integer string (default `3000`); must be a strict integer in `1..65535`.
- `DEBUG`: optional `"true"` or `"false"` (case-insensitive, default `false`).
- `API_KEY`: required non-empty trimmed string.
Return `{ ok: true, data: { port, debug, apiKey } }` or `{ ok: false, errors: [...] }` collecting every violation.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Validate integer strings with `/^\d+$/.test(rawPort)` before calling `Number(rawPort)` so `"8080abc"` or `"3.5"` is rejected cleanly!

## Starter

```javascript
```

## Checks

```javascript
expect("parses valid env strings into typed values", () => get("parseEnv")({ PORT: "8080", DEBUG: "TRUE", API_KEY: " secret " }), {
  ok: true,
  data: { port: 8080, debug: true, apiKey: "secret" },
});
expect("collects missing API_KEY and invalid PORT errors", () => {
  const res = get("parseEnv")({ PORT: "99999", DEBUG: "maybe" });
  return { ok: res.ok, count: res.errors.length };
}, { ok: false, count: 3 });
```

## Hidden checks

```javascript
expect("applies defaults for omitted PORT and DEBUG", () => get("parseEnv")({ API_KEY: "k" }), {
  ok: true,
  data: { port: 3000, debug: false, apiKey: "k" },
});
```

## Solution

```javascript
function parseEnv(env) {
  const errors = [];
  let port = 3000;
  if (env.PORT !== undefined && env.PORT !== "") {
    if (!/^\d+$/.test(String(env.PORT))) {
      errors.push("PORT must be an integer");
    } else {
      port = Number(env.PORT);
      if (port < 1 || port > 65535) errors.push("PORT must be in 1..65535");
    }
  }
  let debug = false;
  if (env.DEBUG !== undefined && env.DEBUG !== "") {
    const low = String(env.DEBUG).toLowerCase();
    if (low === "true") debug = true;
    else if (low === "false") debug = false;
    else errors.push("DEBUG must be 'true' or 'false'");
  }
  const apiKey = typeof env.API_KEY === "string" ? env.API_KEY.trim() : "";
  if (!apiKey) errors.push("API_KEY is required");

  return errors.length ? { ok: false, errors } : { ok: true, data: { port, debug, apiKey } };
}
```

## Restored

Environment config parsing now coerces types strictly and surfaces every startup error together.
