---
id: maintenance-escape-html
title: Escape untrusted HTML badges
system: Shield wall
symbol: controller
scene: tests
skills: security
reviewSkill: security
prerequisite: rate-limiter
---

## Briefing

Station notes are rendered into HTML status badges. Untrusted text containing `<script>` or quotes (`" onclick="..."`) can inject live JavaScript into every operator's browser unless escaped properly.

## Objective

Write `render_badge(label, value)` returning:

```html
<span class="badge" data-label="{safe_label}">{safe_value}</span>
```

where both `label` and `value` have `&`, `<`, `>`, `"`, and `'` HTML-escaped (for example using `html.escape(..., quote=True)`).

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Python's standard library has `html.escape(text, quote=True)`.
2. Escape both the attribute (`label`) and the element body (`value`).

## Starter

```python
```

## Checks

```python
expect(
    "escapes script tags and quotes",
    lambda: get("render_badge")('a"b', "<script>alert(1)</script>"),
    '<span class="badge" data-label="a&quot;b">&lt;script&gt;alert(1)&lt;/script&gt;</span>',
)
expect(
    "plain text renders cleanly",
    lambda: get("render_badge")("power", "OK"),
    '<span class="badge" data-label="power">OK</span>',
)
```

## Hidden checks

```python
check(
    "escapes ampersands and single quotes",
    lambda: "&amp;" in get("render_badge")("a&b", "it's") and ("&#x27;" in get("render_badge")("a&b", "it's") or "&apos;" in get("render_badge")("a&b", "it's")),
)
```

## Solution

```python
import html


def render_badge(label, value):
    safe_label = html.escape(str(label), quote=True)
    safe_value = html.escape(str(value), quote=True)
    return f'<span class="badge" data-label="{safe_label}">{safe_value}</span>'
```

## Restored

Untrusted station notes display safely as plain text without ever breaking out of an attribute or running script tags.
