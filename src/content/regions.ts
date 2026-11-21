// Regions in play order. Each region's missions live in src/content/<id>/,
// and it opens once the previous region's last mission is done.
export interface Region {
  id: string;
  name: string;
}

export const REGIONS: readonly Region[] = [
  { id: "act1", name: "Kestrel Ridge" },
  { id: "act2", name: "The survey office" },
  { id: "act3", name: "The relay line" },
  { id: "act4", name: "The archive" },
  { id: "act5", name: "The workshop" },
  { id: "act6", name: "The deep survey" },
  { id: "act7", name: "The exchange" },
  { id: "act8", name: "The grid" },
  { id: "act9", name: "Your own outpost" },
  { id: "act10", name: "The cipher room" },
  { id: "act11", name: "The wire room" },
  { id: "act12", name: "The cluster" },
  { id: "act13", name: "The engine room" },
  { id: "act14", name: "The storage vault" },
];
