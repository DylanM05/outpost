---
id: maintenance-ts-strict-null-format
language: typescript
title: Format optional crew badges safely under strictNullChecks
system: Type bench
symbol: instrument
scene: tests
skills: ts-fundamentals
reviewSkill: ts-fundamentals
prerequisite: ts-strict-interfaces-readonly
---

## Briefing

Format a `CrewMember` (`{ readonly id: string; callsign?: string | null }`) into `"<id> (<callsign>)"` when `callsign` is a non-empty string, or just `"<id>"` when `callsign` is `null`, `undefined`, or empty.

## Objective

Define `interface CrewMember { readonly id: string; callsign?: string | null; }` and implement `formatBadge(member: CrewMember): string`.

## Concept

Try this maintenance call using what you remember. You can use documentation. If you need a reminder, reveal a hint; a fresh call will return sooner for more practice.

## Hints

1. Trim or check `member.callsign` for truthiness: `return member.callsign ? \`\${member.id} (\${member.callsign})\` : member.id;`.

## Starter

```typescript
// Define interface CrewMember and formatBadge(member)
```

## Checks

```javascript
expectType("accepts optional or null callsign", "const _a: string = formatBadge({ id: 'C-1' }); const _b: string = formatBadge({ id: 'C-2', callsign: null });");
expect("formats present and absent callsigns", () => [
  get("formatBadge")({ id: "C-1", callsign: "Kestrel" }),
  get("formatBadge")({ id: "C-2", callsign: null }),
  get("formatBadge")({ id: "C-3" }),
], ["C-1 (Kestrel)", "C-2", "C-3"]);
```

## Hidden checks

```javascript
expectTypeError("forbids reassigning readonly id", "const _m: CrewMember = { id: 'C-1' }; _m.id = 'C-9';", 2540);
expect("omits empty string callsign", () => get("formatBadge")({ id: "C-4", callsign: "" }), "C-4");
```

## Solution

```typescript
interface CrewMember {
  readonly id: string;
  callsign?: string | null;
}

function formatBadge(member: CrewMember): string {
  return member.callsign ? `${member.id} (${member.callsign})` : member.id;
}
```

## Restored

Type bench badge formatter restored under strict null checks.
