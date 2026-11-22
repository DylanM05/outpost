// Missions are authored as Markdown files; see docs/AUTHORING.md for the format.
import { isSkillId, type SkillId } from "./skills";

export const SUPPORT_LEVELS = ["guided", "standard", "challenge"] as const;
export type SupportLevel = (typeof SUPPORT_LEVELS)[number];

export const LANGUAGES = ["python", "javascript"] as const;
export type Language = (typeof LANGUAGES)[number];

// code: write a program that passes tests. predict: read a program and type
// exactly what it prints, without running it. terminal: work in the relay
// terminal, a real Linux shell, until the machine is in the right state.
const KINDS = ["code", "predict", "terminal"] as const;
export type MissionKind = (typeof KINDS)[number];

const SCENES = ["console", "tests", "drone", "work", "sort", "calls", "grid", "files", "repo"] as const;
export type Scene = (typeof SCENES)[number];

const SYMBOLS = ["equipment", "instrument", "controller"] as const;
export type SchematicSymbol = (typeof SYMBOLS)[number];

export interface Mission {
  id: string;
  // The region folder the mission was loaded from; empty for maintenance calls.
  region: string;
  kind: MissionKind;
  language: Language;
  title: string;
  system: string;
  symbol: SchematicSymbol;
  scene: Scene;
  skills: SkillId[];
  assessment: boolean;
  reviewSkill?: SkillId;
  prerequisite?: string;
  briefing: string;
  objective: string;
  concept: string;
  hints: string[];
  restored: string;
  // code missions
  starters: Record<SupportLevel, string>;
  checks: string;
  hiddenChecks: string;
  solution: string;
  // predict missions: the program to read, and what the author says it prints
  // (the content tests confirm the two agree)
  program: string;
  expectedOutput: string;
  // terminal missions: bash scripts that build the scene before the player
  // starts, one run as root and then one as the player; the commands that
  // solve it are the solution. A report is a question the player answers
  // from what they find.
  rootSetup: string;
  setup: string;
  report: Report | null;
  // The Git repository the repo scene shows while the terminal isn't inside
  // one, such as "~/tools"; empty for none.
  repo: string;
}

export interface Report {
  question: string;
  answer: string;
}

// A system is a lamp on the schematic. Its missions are consecutive files.
export interface System {
  name: string;
  region: string;
  symbol: SchematicSymbol;
  missions: Mission[];
}

function oneOf<T extends string>(options: readonly T[], value: string): value is T {
  return (options as readonly string[]).includes(value);
}

export function parseMission(source: string, file: string, region = ""): Mission {
  const fail = (message: string): never => {
    throw new Error(`${file}: ${message}`);
  };

  const text = source.replace(/\r\n/g, "\n");
  const front = text.match(/^---\n([\s\S]*?)\n---\n/) ?? fail("missing front matter between --- lines");
  const meta = new Map<string, string>();
  for (const line of front[1].split("\n")) {
    if (!line.trim()) continue;
    const pair = line.match(/^(\w+):\s*(.*)$/) ?? fail(`can't read front matter line "${line}"`);
    meta.set(pair[1], pair[2].trim());
  }
  const field = (key: string) => meta.get(key) ?? fail(`front matter needs "${key}"`);

  // Sections start at "## Heading". Headings can't appear inside code blocks.
  const sections = new Map<string, string>();
  for (const part of text.slice(front[0].length).split(/^## /m).slice(1)) {
    const end = part.indexOf("\n");
    const name = (end === -1 ? part : part.slice(0, end)).trim().toLowerCase();
    sections.set(name, end === -1 ? "" : part.slice(end + 1).trim());
  }
  const prose = (name: string) => sections.get(name) ?? fail(`missing "## ${name}" section`);
  const code = (name: string) => {
    const block = prose(name).match(/^```[\w-]*\n([\s\S]*?)^```/m) ?? fail(`"## ${name}" needs a fenced code block`);
    return block[1];
  };
  const optionalCode = (name: string) => (sections.has(name) ? code(name) : null);

  const kind = meta.get("kind") ?? "code";
  if (!oneOf(KINDS, kind)) fail(`kind must be one of ${KINDS.join(", ")}`);

  const language = meta.get("language") ?? "python";
  if (!oneOf(LANGUAGES, language)) fail(`language must be one of ${LANGUAGES.join(", ")}`);

  const skills = field("skills").split(",").map((s) => s.trim());
  for (const skill of skills) if (!isSkillId(skill)) fail(`unknown skill "${skill}"`);

  const scene = field("scene");
  if (!oneOf(SCENES, scene)) fail(`scene must be one of ${SCENES.join(", ")}`);
  const symbol = field("symbol");
  if (!oneOf(SYMBOLS, symbol)) fail(`symbol must be one of ${SYMBOLS.join(", ")}`);

  const hints = [...prose("hints").matchAll(/^\d+\.\s+(.+)$/gm)].map((m) => m[1].trim());
  if (hints.length === 0) fail(`"## hints" needs a numbered list`);

  const reviewSkill = meta.get("reviewSkill");
  if (reviewSkill && !isSkillId(reviewSkill)) fail(`unknown review skill "${reviewSkill}"`);
  if (reviewSkill && !skills.includes(reviewSkill)) fail("review skill must appear in skills");
  if (reviewSkill && !meta.get("prerequisite")) fail("review needs a prerequisite mission id");

  const common = {
    id: field("id"),
    region,
    kind: kind as MissionKind,
    language: language as Language,
    title: field("title"),
    system: field("system"),
    symbol: symbol as SchematicSymbol,
    scene: scene as Scene,
    skills: skills as SkillId[],
    assessment: meta.get("assessment") === "true",
    reviewSkill: reviewSkill as SkillId | undefined,
    prerequisite: meta.get("prerequisite"),
    briefing: prose("briefing"),
    objective: prose("objective"),
    concept: prose("concept"),
    hints,
    restored: prose("restored"),
  };

  const noTerminal = { rootSetup: "", setup: "", report: null, repo: "" };

  if (kind === "predict") {
    return {
      ...common,
      ...noTerminal,
      starters: { guided: "", standard: "", challenge: "" },
      checks: "",
      hiddenChecks: "",
      solution: "",
      program: code("program"),
      expectedOutput: code("output"),
    };
  }

  if (kind === "terminal") {
    const report = sections.get("report");
    const question = report?.split(/^```/m)[0].trim();
    if (report !== undefined && !question) fail(`"## report" needs a question before its code block`);
    return {
      ...common,
      starters: { guided: "", standard: "", challenge: "" },
      checks: code("checks"),
      hiddenChecks: optionalCode("hidden checks") ?? "",
      solution: code("solution"),
      program: "",
      expectedOutput: "",
      rootSetup: optionalCode("root setup") ?? "",
      setup: optionalCode("setup") ?? "",
      report: report === undefined ? null : { question: question!, answer: code("report").trim() },
      repo: meta.get("repo") ?? "",
    };
  }

  const shared = optionalCode("starter");
  const guided = optionalCode("starter: guided") ?? shared ?? fail(`needs "## Starter" or "## Starter: guided"`);
  return {
    ...common,
    starters: {
      guided,
      standard: optionalCode("starter: standard") ?? shared ?? guided,
      challenge: optionalCode("starter: challenge") ?? shared ?? "",
    },
    checks: code("checks"),
    hiddenChecks: optionalCode("hidden checks") ?? "",
    solution: code("solution"),
    program: "",
    expectedOutput: "",
    ...noTerminal,
  };
}

export function groupSystems(missions: Mission[]): System[] {
  const systems: System[] = [];
  for (const mission of missions) {
    const last = systems.at(-1);
    if (last?.name === mission.system) {
      if (last.symbol !== mission.symbol) {
        throw new Error(`${mission.id}: symbol "${mission.symbol}" differs from the rest of ${mission.system}`);
      }
      last.missions.push(mission);
    } else if (systems.some((s) => s.name === mission.system)) {
      throw new Error(`${mission.id}: missions for ${mission.system} must be next to each other`);
    } else {
      systems.push({ name: mission.system, region: mission.region, symbol: mission.symbol, missions: [mission] });
    }
  }
  return systems;
}
