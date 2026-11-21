---
id: read-the-status
kind: predict
title: Read the status
system: Client desk
symbol: instrument
scene: console
skills: http, reading-code
---

## Briefing

Every HTTP response comes back with a three-digit **status code**, a map of **headers**, and an optional **body**. Clients decide what to do next by reading the status code class first: `2xx` succeeded, `4xx` means the request itself had a problem, and `5xx` means the server ran into trouble. Trace how the client desk classifies four responses from Valley Station.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

HTTP status codes fall into five classes by their first digit:

- **2xx (Success):** `200 OK`, `201 Created`, `204 No Content`.
- **3xx (Redirect / Cache):** `301 Moved`, `304 Not Modified`.
- **4xx (Client Error):** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `429 Too Many Requests`.
- **5xx (Server Error):** `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`.

HTTP header names are **case-insensitive** (`Content-Type` and `content-type` mean the same header), so well-behaved clients normalize header keys to lowercase when looking them up.

## Hints

1. `classify(status)` checks `200 <= status < 300`, `400 <= status < 500`, and `500 <= status < 600`.
2. Note the special case for `429` before the generic `4xx` check!
3. Header lookup lowercases the keys before reading `"content-type"`.

## Program

```python
def classify(status):
    if 200 <= status < 300:
        return "ok"
    if status == 429 or 500 <= status < 600:
        return "retry"
    if 400 <= status < 500:
        return "client-error"
    return "other"


def is_json(headers):
    lower = {k.lower(): v for k, v in headers.items()}
    return "application/json" in lower.get("content-type", "")


for code in [201, 404, 429, 503]:
    print(code, classify(code))

print(is_json({"Content-Type": "application/json; charset=utf-8"}))
print(is_json({"Content-Type": "text/plain"}))
```

## Output

```text
201 ok
404 client-error
429 retry
503 retry
True
False
```

## Restored

You read the status classes and case-insensitive headers the way every real HTTP client does.
