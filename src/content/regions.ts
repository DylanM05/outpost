// Tracks group regions into independent learning paths. The first region of
// every track is open from day one, so players can start on either path or
// jump back and forth freely without losing their place.
export type TrackId = "python" | "javascript";

export interface Track {
  id: TrackId;
  name: string;
  shortName: string;
  summary: string;
}

export const TRACKS: readonly Track[] = [
  {
    id: "python",
    name: "Python & Systems",
    shortName: "Python",
    summary: "Python fundamentals, Linux, Git, algorithms, backend APIs, distributed systems, and infrastructure.",
  },
  {
    id: "javascript",
    name: "JavaScript",
    shortName: "JS",
    summary: "Modern JavaScript from fundamentals and closures through async concurrency, APIs, and reactive apps.",
  },
];

// Regions in play order within their track. Each region's missions live in
// src/content/<id>/, and a region opens once the previous region in the same
// track is done.
export interface Region {
  id: string;
  track: TrackId;
  act: string;
  name: string;
  summary: string;
}

export const REGIONS: readonly Region[] = [
  { id: "act1", track: "python", act: "Act I", name: "Kestrel Ridge", summary: "Python fundamentals" },
  { id: "act2", track: "python", act: "Act II", name: "The survey office", summary: "Algorithms, sorting, and grid search" },
  { id: "act3", track: "python", act: "Act III", name: "The relay line", summary: "Linux terminal, files, and shells" },
  { id: "act4", track: "python", act: "Act IV", name: "The archive", summary: "Git branches, history, and recovery" },
  { id: "act5", track: "python", act: "Act V", name: "The workshop", summary: "Object-oriented design and pytest" },
  { id: "act6", track: "python", act: "Act VI", name: "The deep survey", summary: "Functional tools, data structures, and DP" },
  { id: "act7", track: "python", act: "Act VII", name: "The exchange", summary: "HTTP clients, SQLite, and web APIs" },
  { id: "act8", track: "python", act: "Act VIII", name: "The grid", summary: "Containers, CI/CD, and web security" },
  { id: "act9", track: "python", act: "Act IX", name: "Your own outpost", summary: "Pub/sub architecture and capstone" },
  { id: "act10", track: "python", act: "Act X", name: "The cipher room", summary: "Cryptography and authenticated channels" },
  { id: "act11", track: "python", act: "Act XI", name: "The wire room", summary: "HTTP/1.1 protocol, concurrency, and crawling" },
  { id: "act12", track: "python", act: "Act XII", name: "The cluster", summary: "Orchestration and distributed systems" },
  { id: "act13", track: "python", act: "Act XIII", name: "The engine room", summary: "Memory management, parsers, and VMs" },
  { id: "act14", track: "python", act: "Act XIV", name: "The storage vault", summary: "Storage engines, MVCC, and search" },
  { id: "act15", track: "python", act: "Act XV", name: "The signal tower", summary: "Tokenization, RAG, and AI agents" },
  { id: "act16", track: "python", act: "Act XVI", name: "The packet floor", summary: "IP routing, TCP/DNS, and traffic shaping" },
  { id: "act17", track: "python", act: "Act XVII", name: "The telemetry lab", summary: "Stream windows, columnar storage, and ETL" },
  { id: "act18", track: "python", act: "Act XVIII", name: "The iron room", summary: "OS scheduling, virtual memory, and inodes" },
  { id: "act19", track: "python", act: "Act XIX", name: "The ledger house", summary: "Double-entry ledgers, sagas, and order books" },
  { id: "act20", track: "python", act: "Act XX", name: "The observatory", summary: "2D geometry, spatial indexes, physics, and A*" },
  { id: "act21", track: "python", act: "Act XXI", name: "The media depot", summary: "Object storage, HTTP streaming, and CDNs" },
  { id: "act22", track: "python", act: "Act XXII", name: "The cloud foundry", summary: "Cloud IAM, VPCs, IaC plans, and autoscaling" },
  { id: "act23", track: "python", act: "Act XXIII", name: "The analytics hall", summary: "Tabular DataFrames, A/B stats, and forecasting" },
  { id: "act24", track: "python", act: "Act XXIV", name: "The protocol spire", summary: "WebSockets, Protobuf/gRPC, and GraphQL" },
  { id: "act25", track: "javascript", act: "JS I", name: "The script annex", summary: "JavaScript: arrays, closures, classes, and async" },
  { id: "act26", track: "javascript", act: "JS II", name: "The module bay", summary: "Fetch, Express routing, schemas, and reactive stores" },
];

export function regionMeta(id: string): Region {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}

export function trackMeta(id: TrackId): Track {
  return TRACKS.find((t) => t.id === id) ?? TRACKS[0];
}

export function trackOfRegion(regionId: string): TrackId {
  return regionMeta(regionId).track;
}

export function regionsInTrack(track: TrackId): Region[] {
  return REGIONS.filter((r) => r.track === track);
}
