// Regions in play order. Each region's missions live in src/content/<id>/,
// and it opens once the previous region's last mission is done.
export interface Region {
  id: string;
  act: string;
  name: string;
  summary: string;
}

export const REGIONS: readonly Region[] = [
  { id: "act1", act: "Act I", name: "Kestrel Ridge", summary: "Python fundamentals" },
  { id: "act2", act: "Act II", name: "The survey office", summary: "Algorithms, sorting, and grid search" },
  { id: "act3", act: "Act III", name: "The relay line", summary: "Linux terminal, files, and shells" },
  { id: "act4", act: "Act IV", name: "The archive", summary: "Git branches, history, and recovery" },
  { id: "act5", act: "Act V", name: "The workshop", summary: "Object-oriented design and pytest" },
  { id: "act6", act: "Act VI", name: "The deep survey", summary: "Functional tools, data structures, and DP" },
  { id: "act7", act: "Act VII", name: "The exchange", summary: "HTTP clients, SQLite, and web APIs" },
  { id: "act8", act: "Act VIII", name: "The grid", summary: "Containers, CI/CD, and web security" },
  { id: "act9", act: "Act IX", name: "Your own outpost", summary: "Pub/sub architecture and capstone" },
  { id: "act10", act: "Act X", name: "The cipher room", summary: "Cryptography and authenticated channels" },
  { id: "act11", act: "Act XI", name: "The wire room", summary: "HTTP/1.1 protocol, concurrency, and crawling" },
  { id: "act12", act: "Act XII", name: "The cluster", summary: "Orchestration and distributed systems" },
  { id: "act13", act: "Act XIII", name: "The engine room", summary: "Memory management, parsers, and VMs" },
  { id: "act14", act: "Act XIV", name: "The storage vault", summary: "Storage engines, MVCC, and search" },
  { id: "act15", act: "Act XV", name: "The signal tower", summary: "Tokenization, RAG, and AI agents" },
];

export function regionMeta(id: string): Region {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}
