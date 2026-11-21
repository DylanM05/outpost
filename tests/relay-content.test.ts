// Plays every terminal mission on the real relay machine: after setup alone
// some check must fail, and after typing the solution's commands into the
// shell (and giving the report's answer) every check must pass, hidden ones
// included. Skipped until `npm run vm` has built the machine.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { allMissions } from "../src/content";
import { checkCode, setupCode, type CheckReply } from "../src/relay/checks";
import type { RelayMachine } from "../src/relay/machine";
import { machineBuilt, startMachine } from "./relay-support";

const terminalMissions = allMissions.filter((m) => m.kind === "terminal");

// The solution is the commands, one per line; comment lines are notes. A
// heredoc (cat > file <<'EOF' ... EOF) is typed as one command.
function commandsOf(solution: string): string[] {
  const commands: string[] = [];
  let heredoc: { end: string; lines: string[] } | null = null;
  for (const line of solution.split("\n")) {
    if (heredoc) {
      heredoc.lines.push(line);
      if (line === heredoc.end) {
        commands.push(heredoc.lines.join("\r"));
        heredoc = null;
      }
      continue;
    }
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const start = line.match(/<<-?\s*'?(\w+)'?/);
    if (start) heredoc = { end: start[1], lines: [line] };
    else commands.push(line);
  }
  return commands;
}

describe.skipIf(!machineBuilt)("terminal missions on the relay machine", () => {
  let machine: RelayMachine;
  beforeAll(async () => {
    machine = await startMachine();
  }, 120_000);
  afterAll(() => machine?.destroy());

  async function prepare(mission: (typeof terminalMissions)[number]) {
    await machine.reset();
    await machine.resize(100, 30);
    if (mission.rootSetup.trim()) await machine.call(setupCode(mission.rootSetup, true));
    if (mission.setup.trim()) await machine.call(setupCode(mission.setup));
    await machine.restartShell();
  }

  async function checks(mission: (typeof terminalMissions)[number], answer: string) {
    const reply = await machine.call<CheckReply>(checkCode(mission.checks, mission.hiddenChecks, answer, mission.scene));
    expect(reply.error).toBeNull();
    return reply.checks;
  }

  it.each(terminalMissions.map((m) => [m.id, m] as const))("%s", async (_, mission) => {
    await prepare(mission);
    const untouched = await checks(mission, "");
    expect(untouched.length).toBeGreaterThan(0);
    expect(untouched.some((c) => !c.passed), "some check should fail before any work").toBe(true);

    for (const line of commandsOf(mission.solution)) {
      // pytest takes seconds under emulation, and much longer on a busy host.
      const prompt = machine.nextPrompt(120_000);
      machine.type(line + "\r");
      await prompt;
    }
    const solved = await checks(mission, mission.report?.answer ?? "");
    expect(solved.filter((c) => !c.passed)).toEqual([]);
  }, 300_000);
});
