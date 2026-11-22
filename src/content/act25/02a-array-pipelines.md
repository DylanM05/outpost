---
id: array-pipelines
language: javascript
title: Transform sensor logs with map, filter, reduce, and safe sort
system: Array rack
symbol: equipment
scene: tests
skills: js-fundamentals
---

## Briefing

JavaScript's array methods (`filter`, `map`, `reduce`, `toSorted`) form the backbone of everyday JS code — with one infamous gotcha: `arr.sort()` mutates the array **in place** AND sorts numbers **alphabetically** (`[10, 2]` stays `[10, 2]`!) unless you pass a numeric comparator `(a, b) => a - b` on a copy!

## Concept

Write `summarizeReadings(records)` where `records` is an array of `{ id, site, watts, active }`:
1. Keep ONLY records where `active === true` and `typeof watts === "number" && watts > 0` (do NOT mutate `records`!).
2. Compute:
   - `totalWatts`: sum of `watts` across active positive records (0 if none).
   - `topIds`: IDs of those surviving records sorted by `watts` **descending**, breaking ties by `id` ascending (`a.id.localeCompare(b.id)`).
   - `bySite`: object mapping each `site` to its total `watts` sum using `reduce`.
3. Return `{ totalWatts, topIds, bySite }`.

## Objective

Implement `summarizeReadings(records)` without mutating the input array.

## Hints

1. Always copy before sorting (`[...filtered].sort(...)` or `filtered.toSorted(...)`) and always supply an explicit comparator `(a, b) => b.watts - a.watts || a.id.localeCompare(b.id)`.

## Starter: guided

```javascript
function summarizeReadings(records) {
  const valid = records.filter((r) => r.active === true && typeof r.watts === "number" && r.watts > 0);
  const totalWatts = valid.reduce((sum, r) => sum + r.watts, 0);
  // Build topIds (sorted by watts desc, id asc) and bySite object.
}
```

## Starter: standard

```javascript
function summarizeReadings(records) {
}
```

## Starter: challenge

```javascript
```

## Checks

```javascript
const sample = [
  { id: "s2", site: "north", watts: 100, active: true },
  { id: "s1", site: "north", watts: 20, active: true },
  { id: "s3", site: "south", watts: 100, active: true },
  { id: "s4", site: "south", watts: 500, active: false },
  { id: "s5", site: "north", watts: -10, active: true },
];
const snap = JSON.stringify(sample);
expect("filters, sums, groups, and sorts numerically without mutating input", () => {
  const res = get("summarizeReadings")(sample);
  return { res, unchanged: JSON.stringify(sample) === snap };
}, {
  res: {
    totalWatts: 220,
    topIds: ["s2", "s3", "s1"],
    bySite: { north: 120, south: 100 },
  },
  unchanged: true,
});
```

## Hidden checks

```javascript
expect("handles empty input cleanly", () => get("summarizeReadings")([]), {
  totalWatts: 0,
  topIds: [],
  bySite: {},
});
expect("sorts multi-digit watts numerically (9 < 10 < 100)", () => get("summarizeReadings")([
  { id: "a", site: "x", watts: 9, active: true },
  { id: "b", site: "x", watts: 100, active: true },
  { id: "c", site: "x", watts: 10, active: true },
]).topIds, ["b", "c", "a"]);
```

## Solution

```javascript
function summarizeReadings(records) {
  const valid = records.filter((r) => r.active === true && typeof r.watts === "number" && r.watts > 0);
  const totalWatts = valid.reduce((sum, r) => sum + r.watts, 0);
  const topIds = [...valid]
    .sort((a, b) => b.watts - a.watts || a.id.localeCompare(b.id))
    .map((r) => r.id);
  const bySite = valid.reduce((acc, r) => {
    acc[r.site] = (acc[r.site] ?? 0) + r.watts;
    return acc;
  }, {});
  return { totalWatts, topIds, bySite };
}
```

## Restored

The array rack now processes telemetry through clean, immutable functional JavaScript pipelines.
