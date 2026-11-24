import { describe, expect, test } from "vitest";
import { passedAll } from "../src/python/harness";
import { checkTsTypes, runTsMission } from "../src/ts/harness";

describe("TypeScript compiler & mission harness", () => {
  test("reports strict TypeScript errors with exact 1-based line numbers", async () => {
    const code = [
      "const ok: number = 42;",
      "const bad: number = 'oops';",
    ].join("\n");
    const result = await runTsMission(code, "");
    expect(result.error).not.toBeNull();
    expect(result.error?.type).toBe("TS2322");
    expect(result.error?.line).toBe(2);
  });

  test("rejects implicit any parameters under strict mode", () => {
    const diags = checkTsTypes("function add(a, b) { return a + b; }");
    expect(diags.some((d) => d.code === 7006)).toBe(true);
  });

  test("runs both compile-time expectType/expectTypeError and runtime checks", async () => {
    const code = `
      interface Sensor {
        readonly id: string;
        reading: number;
      }
      function doubleReading(s: Sensor): number {
        return s.reading * 2;
      }
    `;
    const checks = `
      expectType("accepts valid Sensor", "const _s: Sensor = { id: 'S-1', reading: 10 }; const _n: number = doubleReading(_s);");
      expectTypeError("blocks mutating readonly id", "const _s: Sensor = { id: 'S-1', reading: 10 }; _s.id = 'S-2';", 2540);
      expect("runtime doubleReading", () => get("doubleReading")({ id: "S-1", reading: 12 }), 24);
    `;
    const result = await runTsMission(code, checks);
    expect(result.error).toBeNull();
    expect(passedAll(result)).toBe(true);
    expect(result.checks).toHaveLength(3);
  });

  test("fails expectTypeError when code unexpectedly compiles cleanly", async () => {
    const code = "interface Loose { id: string; }";
    const checks = `expectTypeError("should reject mutation", "const _x: Loose = { id: 'a' }; _x.id = 'b';", 2540);`;
    const result = await runTsMission(code, checks);
    expect(result.error).toBeNull();
    expect(passedAll(result)).toBe(false);
  });
});
