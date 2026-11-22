---
id: vdom-render
language: javascript
title: Render virtual DOM trees to XSS-safe HTML strings
system: Render rail
symbol: controller
scene: tests
skills: js-reactive-ui
---

## Briefing

Server-Side Rendering (SSR) in React, Preact, and Vue turns lightweight virtual DOM objects (`h("div", { class: "card" }, "Hello")`) into HTML strings while automatically escaping text and attribute values to prevent Cross-Site Scripting (XSS)!

## Concept

1. **`h(tag, props, ...children)`:**
   - Returns `{ tag, props: props ?? {}, children: children.flat(Infinity) }`.
2. **`renderToString(node)`:**
   - Escape helper for `&` (`&amp;`), `<` (`&lt;`), `>` (`&gt;`), `"` (`&quot;`), `'` (`&#39;`).
   - If `node === null || node === undefined || typeof node === "boolean"`: return `""` (React-style conditional rendering `{show && h(...)}`!).
   - If `typeof node === "string" || typeof node === "number"`: return `escapeHtml(String(node))`.
   - If `typeof node.tag === "function"` (function component!): invoke `node.tag({ ...node.props, children: node.children })` and render its returned VNode!
   - Otherwise render an HTML element:
     - Sort `Object.keys(node.props)` alphabetically for deterministic output:
       - If value is `false`, `null`, or `undefined`: omit attribute!
       - If value is `true`: emit boolean attribute name alone (e.g. `disabled`).
       - Otherwise emit `key="${escapeHtml(String(val))}"`.
     - Self-closing void tags (`"br"`, `"hr"`, `"img"`, `"input"`): emit `<tag attrs />` (or `<tag />` if no attrs).
     - Normal tags: emit `<tag attrs>${childrenHtml}</tag>`.

## Objective

Implement `h(tag, props, ...children)` and `renderToString(node)`.

## Hints

1. Flattening children with `.flat(Infinity)` lets callers pass nested arrays from `.map(...)` right into `h("ul", null, items.map(...))`!

## Starter: guided

```javascript
const VOID_TAGS = new Set(["br", "hr", "img", "input"]);

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function h(tag, props, ...children) {
  return { tag, props: props ?? {}, children: children.flat(Infinity) };
}

function renderToString(node) {
  // Handle null/boolean, text/number, function components, sorted attrs, void tags, and children.
}
```

## Starter: standard

```javascript
function h(tag, props, ...children) {}
function renderToString(node) {}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
expect("renders nested elements, arrays, components, and escapes XSS", () => {
  const h = get("h");
  const Badge = ({ label }) => h("span", { class: "badge" }, label);
  const tree = h(
    "section",
    { id: "main", hidden: false },
    h(Badge, { label: "<script>alert(1)</script>" }),
    false && h("p", null, "ignored"),
    h("input", { disabled: true, type: "text", value: 'a"b' }),
  );
  return get("renderToString")(tree);
}, '<section id="main"><span class="badge">&lt;script&gt;alert(1)&lt;/script&gt;</span><input disabled type="text" value="a&quot;b" /></section>');
```

## Hidden checks

```javascript
expect("renders mapped child arrays and numbers cleanly", () => {
  const h = get("h");
  return get("renderToString")(h("ul", null, [1, 2].map((n) => h("li", null, n))));
}, "<ul><li>1</li><li>2</li></ul>");
```

## Solution

```javascript
const VOID_TAGS = new Set(["br", "hr", "img", "input"]);

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function h(tag, props, ...children) {
  return { tag, props: props ?? {}, children: children.flat(Infinity) };
}

function renderToString(node) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return escapeHtml(String(node));
  if (Array.isArray(node)) return node.map(renderToString).join("");
  if (typeof node.tag === "function") {
    return renderToString(node.tag({ ...node.props, children: node.children }));
  }

  const attrs = [];
  for (const key of Object.keys(node.props ?? {}).sort()) {
    const val = node.props[key];
    if (val === false || val === null || val === undefined) continue;
    if (val === true) attrs.push(key);
    else attrs.push(`${key}="${escapeHtml(String(val))}"`);
  }
  const attrStr = attrs.length ? ` ${attrs.join(" ")}` : "";
  if (VOID_TAGS.has(node.tag)) return `<${node.tag}${attrStr} />`;
  const inner = (node.children ?? []).map(renderToString).join("");
  return `<${node.tag}${attrStr}>${inner}</${node.tag}>`;
}
```

## Restored

The render rail now compiles virtual DOM trees and function components into XSS-safe HTML strings.
