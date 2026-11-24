---
id: maintenance-ts-fix-exhaustive-switch
language: typescript
title: Fix a non-exhaustive discriminated union switch that fails the never guard
system: Union rack
symbol: equipment
scene: tests
skills: ts-narrowing-unions
reviewSkill: ts-narrowing-unions
prerequisite: ts-assertion-functions
---

## Briefing

Someone added `{ kind: "sleep"; minutes: number }` to `DroneAction`, and now `describeAction(a)` fails to compile at `assertNever(a)`!

## Objective

Add the missing `"sleep"` branch returning `` `sleep:${a.minutes}m` `` so `describeAction` compiles cleanly and handles every variant exhaustively.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Add `case "sleep": return \`sleep:\${a.minutes}m\`;` before `default: return assertNever(a);`.

## Starter

```typescript
type DroneAction =
  | { kind: "hover" }
  | { kind: "move"; dist: number }
  | { kind: "sleep"; minutes: number };

function assertNever(x: never): never {
  throw new Error(`Unhandled: ${JSON.stringify(x)}`);
}

function describeAction(a: DroneAction): string {
  switch (a.kind) {
    case "hover":
      return "hover";
    case "move":
      return `move:${a.dist}`;
    default:
      return assertNever(a);
  }
}
```

## Checks

```javascript
expectType("accepts all DroneAction variants", "const _s: string = describeAction({ kind: 'sleep', minutes: 5 });");
expect("formats hover, move, and sleep", () => [
  get("describeAction")({ kind: "hover" }),
  get("describeAction")({ kind: "move", dist: 12 }),
  get("describeAction")({ kind: "sleep", minutes: 5 }),
], ["hover", "move:12", "sleep:5m"]);
```

## Hidden checks

```javascript
expectThrows("assertNever throws on invalid runtime variant", () => get("assertNever")({ kind: "bad" }), "Error");
```

## Solution

```typescript
type DroneAction =
  | { kind: "hover" }
  | { kind: "move"; dist: number }
  | { kind: "sleep"; minutes: number };

function assertNever(x: never): never {
  throw new Error(`Unhandled: ${JSON.stringify(x)}`);
}

function describeAction(a: DroneAction): string {
  switch (a.kind) {
    case "hover":
      return "hover";
    case "move":
      return `move:${a.dist}`;
    case "sleep":
      return `sleep:${a.minutes}m`;
    default:
      return assertNever(a);
  }
}
```

## Restored

Union rack switch statement restored — every `DroneAction` variant is handled exhaustively.
