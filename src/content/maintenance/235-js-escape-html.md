---
id: maintenance-js-escape-html
language: javascript
title: Escape untrusted strings before rendering inside HTML
system: Render rail
symbol: controller
scene: tests
skills: js-reactive-ui
reviewSkill: js-reactive-ui
prerequisite: lru-fetch-cache
---

## Briefing

Interpolating user input directly into HTML templates lets attackers inject `<script>` tags or break out of quoted attributes.

## Objective

Write `escapeHtml(text)` replacing `&` with `&amp;`, `<` with `&lt;`, `>` with `&gt;`, `"` with `&quot;`, and `'` with `&#39;`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Always replace `&` FIRST (or use a single regex `text.replace(/[&<>"']/g, (ch) => MAP[ch])`) so you don't double-escape `&lt;` into `&amp;lt;`!

## Starter

```javascript
```

## Checks

```javascript
expect("escapes all five HTML-unsafe characters without double-escaping", () => get("escapeHtml")(`<a href="x" title='a&b'>`), "&lt;a href=&quot;x&quot; title=&#39;a&amp;b&#39;&gt;");
```

## Hidden checks

```javascript
expect("leaves plain text untouched", () => get("escapeHtml")("Kestrel Ridge 42"), "Kestrel Ridge 42");
```

## Solution

```javascript
const ESC_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ESC_MAP[ch]);
}
```

## Restored

HTML escaping now neutralizes every special character in a single regex pass.
