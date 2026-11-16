// Drives the real relay machine in Node: setup, typing into the shell, checks,
// saving the home directory, and reset. Skipped until `npm run vm` has built
// the machine into public/vm.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkCode, loadWorkspaceCode, saveWorkspaceCode, setupCode, type CheckReply } from "../src/relay/checks";
import type { RelayMachine } from "../src/relay/machine";
import { machineBuilt, startMachine } from "./relay-support";

async function typeLine(machine: RelayMachine, line: string) {
  const prompt = machine.nextPrompt();
  machine.type(line + "\r");
  return prompt;
}

describe.skipIf(!machineBuilt)("relay machine", () => {
  let machine: RelayMachine;
  beforeAll(async () => {
    machine = await startMachine();
  }, 120_000);
  afterAll(() => machine?.destroy());

  it("runs code in the check agent", async () => {
    expect(await machine.call("result = sh('whoami') + ' ' + sh('pwd')")).toBe("ranger /home/ranger");
  });

  it("runs setup as the player and checks the result", async () => {
    await machine.call(setupCode("mkdir -p relay/logs\necho 'link up' > relay/logs/today.log"));
    const reply = await machine.call<CheckReply>(
      checkCode(
        'expect("today.log", read("~/relay/logs/today.log"), "link up\\n")\ncheck("owned by the player", owner("~/relay") == "ranger")',
        'check("a hidden check", is_dir("relay"))',
        "",
        "files",
      ),
    );
    expect(reply.error).toBeNull();
    expect(reply.checks.map((c) => [c.passed, c.hidden])).toEqual([[true, false], [true, false], [true, true]]);
    expect(reply.events[0].data).toMatchObject({ root: "~", cwd: "~", entries: [["relay", [["logs", [["today.log", null]]]]]] });
  });

  it("follows the shell's directory and history", async () => {
    expect(await typeLine(machine, "cd relay/logs")).toBe("/home/ranger/relay/logs");
    const reply = await machine.call<CheckReply>(
      checkCode('expect("cwd", cwd(), "~/relay/logs")\ncheck("ran cd", ran("cd"))\ncheck("no ls", not ran("ls"))', "", "", "console"),
    );
    expect(reply.checks.map((c) => c.passed)).toEqual([true, true, true]);
  });

  it("reports a failed expectation with what it found", async () => {
    const reply = await machine.call<CheckReply>(checkCode('expect("cwd", cwd(), "~", "Use cd to go home.")', "", "", "console"));
    expect(reply.checks[0]).toMatchObject({ passed: false, detail: "Expected '~', found '~/relay/logs'. Use cd to go home." });
  });

  it("saves and restores the workspace", async () => {
    const saved = await machine.call<string>(saveWorkspaceCode(1_000_000));
    await machine.reset();
    expect(await machine.call("result = exists('~/relay')")).toBe(false);
    await machine.call(loadWorkspaceCode(saved));
    await machine.restartShell();
    expect(await machine.call("result = [read('~/relay/logs/today.log'), owner('~/relay/logs'), 'cd relay/logs' in history()]")).toEqual([
      "link up\n",
      "ranger",
      true,
    ]);
  }, 60_000);

  // v86 answers some filesystem requests late; a late answer used to land in
  // the restored machine and hang it.
  it("survives a reset straight after reading files", async () => {
    for (let round = 0; round < 6; round++) {
      await machine.reset();
      await machine.call(setupCode("echo hi > note.txt"));
      await machine.restartShell();
      expect(await machine.call("result = [read('~/note.txt'), len(history())]")).toEqual(["hi\n", 0]);
    }
  }, 120_000);
});
