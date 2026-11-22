---
id: fetch-wrapper
language: javascript
title: Build a resilient JSON fetch client with HTTP error checking
system: Fetch bench
symbol: instrument
scene: tests
skills: js-web-apis
---

## Briefing

`fetch()` has a famous sharp edge: it ONLY rejects on network errors — a `404 Not Found` or `500 Internal Server Error` resolves cleanly with `response.ok === false`! Production JS clients wrap `fetch` to attach base URLs, query parameters, JSON headers, and automatic `HttpError` throws on non-2xx responses.

## Concept

Implement `createApiClient(baseUrl, fetchImpl)`:
- `fetchImpl(url, init)` is an injected fetch-like async function returning `{ ok, status, json: async () => data }`.
- Returns `{ async get(path, query = {}), async post(path, body) }`:
  - Build the full URL with `new URL(path, baseUrl)` (if `query` has keys, append each non-null/non-undefined `[k, String(v)]` via `url.searchParams.set(k, String(v))`).
  - For `get`: call `fetchImpl(url.toString(), { method: "GET", headers: { Accept: "application/json" } })`.
  - For `post`: call `fetchImpl(url.toString(), { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body) })`.
  - Parse `const data = await res.json()`.
  - If `!res.ok`: throw an `Error` with `err.name = "HttpError"`, `err.status = res.status`, and `err.message = data?.error ?? \`HTTP ${res.status}\``!
  - Otherwise return `data`.

## Objective

Implement `createApiClient(baseUrl, fetchImpl)` returning `{ get, post }`.

## Hints

1. Use `const url = new URL(path, baseUrl);` and skip `null`/`undefined` query params so `get("/items", { q: "solar", page: undefined })` produces `"/items?q=solar"`.

## Starter: guided

```javascript
function createApiClient(baseUrl, fetchImpl) {
  async function request(method, path, { query = {}, body } = {}) {
    const url = new URL(path, baseUrl);
    for (const [k, v] of Object.entries(query)) {
      if (v !== null && v !== undefined) url.searchParams.set(k, String(v));
    }
    // Call fetchImpl, parse res.json(), throw HttpError when !res.ok, else return data.
  }

  return {
    get: (path, query) => request("GET", path, { query }),
    post: (path, body) => request("POST", path, { body }),
  };
}
```

## Starter: standard

```javascript
function createApiClient(baseUrl, fetchImpl) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
await expect("sends GET with query params and POST with JSON body", async () => {
  const seen = [];
  const fakeFetch = async (url, init) => {
    seen.push({ url, method: init.method, body: init.body ?? null, ct: init.headers["Content-Type"] ?? null });
    return { ok: true, status: 200, json: async () => ({ saved: true }) };
  };
  const api = get("createApiClient")("https://api.outpost.local", fakeFetch);
  await api.get("/sensors", { site: "north", skip: undefined });
  const postRes = await api.post("/sensors", { id: 7 });
  return { seen, postRes };
}, {
  seen: [
    { url: "https://api.outpost.local/sensors?site=north", method: "GET", body: null, ct: null },
    { url: "https://api.outpost.local/sensors", method: "POST", body: '{"id":7}', ct: "application/json" },
  ],
  postRes: { saved: true },
});

await expectThrows("throws HttpError on 404 response", async () => {
  const fakeFetch = async () => ({ ok: false, status: 404, json: async () => ({ error: "not found" }) });
  const api = get("createApiClient")("https://api.outpost.local", fakeFetch);
  await api.get("/missing");
}, "HttpError");
```

## Hidden checks

```javascript
await expect("attaches status code on thrown HttpError", async () => {
  const fakeFetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  const api = get("createApiClient")("https://api.outpost.local", fakeFetch);
  try {
    await api.get("/down");
    return null;
  } catch (err) {
    return { name: err.name, status: err.status, message: err.message };
  }
}, { name: "HttpError", status: 503, message: "HTTP 503" });
```

## Solution

```javascript
function createApiClient(baseUrl, fetchImpl) {
  async function request(method, path, { query = {}, body } = {}) {
    const url = new URL(path, baseUrl);
    for (const [k, v] of Object.entries(query)) {
      if (v !== null && v !== undefined) {
        url.searchParams.set(k, String(v));
      }
    }
    const headers = { Accept: "application/json" };
    const init = { method, headers };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    const res = await fetchImpl(url.toString(), init);
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data?.error ?? `HTTP ${res.status}`);
      err.name = "HttpError";
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    get: (path, query) => request("GET", path, { query }),
    post: (path, body) => request("POST", path, { body }),
  };
}
```

## Restored

The fetch bench now wraps HTTP requests with clean query construction and explicit non-2xx error handling.
