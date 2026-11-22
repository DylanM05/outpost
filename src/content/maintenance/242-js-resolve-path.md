---
id: maintenance-js-resolve-path
language: javascript
title: Resolve relative CommonJS module specifiers into normalized .js paths
system: Module loader
symbol: controller
scene: tests
skills: js-testing-tooling
reviewSkill: js-testing-tooling
prerequisite: dependency-graph-bundler
---

## Briefing

A virtual CommonJS module loader needs `resolveModulePath(fromDir, specifier)` to normalize relative imports (`"./util"`, `"../shared/math.js"`) and absolute imports (`"/core/index"`) into canonical `"/.../*.js"` keys.

## Objective

Implement `resolveModulePath(fromDir, specifier)` so it resolves `.` and `..` path segments against `fromDir` (when `specifier` does not start with `"/"`) and appends `".js"` if the normalized path does not already end with `".js"`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Combine `const raw = specifier.startsWith("/") ? specifier : \`\${fromDir}/\${specifier}\``, split on `"/"`, process `"."` and `".."` with a stack, prefix `"/"`, and ensure it ends with `".js"`.

## Starter

```javascript
function resolveModulePath(fromDir, specifier) {
  // Normalize segments and ensure .js extension
}
```

## Checks

```javascript
expect("normalizes relative and absolute module specifiers with automatic .js extension", () => {
  const resolveModulePath = get("resolveModulePath");
  return [
    resolveModulePath("/app/routes", "./users"),
    resolveModulePath("/app/routes", "../lib/auth.js"),
    resolveModulePath("/app/routes/nested", "../../config"),
    resolveModulePath("/app/routes", "/root/entry"),
  ];
}, [
  "/app/routes/users.js",
  "/app/lib/auth.js",
  "/app/config.js",
  "/root/entry.js",
]);
```

## Hidden checks

```javascript
expect("clamps extra .. segments at root /", () => {
  const resolveModulePath = get("resolveModulePath");
  return resolveModulePath("/a", "../../../top");
}, "/top.js");
```

## Solution

```javascript
function resolveModulePath(fromDir, specifier) {
  const raw = specifier.startsWith("/") ? specifier : `${fromDir}/${specifier}`;
  const parts = [];
  for (const seg of raw.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  const normalized = "/" + parts.join("/");
  return normalized.endsWith(".js") ? normalized : `${normalized}.js`;
}
```

## Restored

Virtual module specifiers now normalize relative segments and extensions consistently.
