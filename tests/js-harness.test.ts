import { describe, expect, test } from "vitest";
import { deepEqual, extractTopLevelNames, runJsMission } from "../src/js/harness";
import { passedAll } from "../src/python/harness";

describe("JavaScript harness", () => {
  test("extracts top-level declarations while ignoring nested blocks, strings, and comments", () => {
    const code = `
      // function ignoredComment() {}
      const greeting = "function fake() {}";
      let count = 1;
      function add(a, b) {
        const inner = a + b;
        return inner;
      }
      async function fetchIt() {}
      class Drone {
        fly() { const nested = 1; return nested; }
      }
      const { x, y: renamed } = { x: 1, y: 2 };
    `;
    expect(extractTopLevelNames(code).sort()).toEqual(["Drone", "add", "count", "fetchIt", "greeting", "renamed", "x"]);
  });

  test("captures console.log output and passes sync & async checks", async () => {
    const user = `
      console.log("booting", 42);
      function double(n) { return n * 2; }
      async function later(x) { return await Promise.resolve(x + 1); }
    `;
    const checks = `
      check("printed boot line", lines[0] === "booting 42");
      expect("double(5) === 10", () => get("double")(5), 10);
      await expect("async later(9) === 10", () => get("later")(9), 10);
    `;
    const hidden = `
      expect("double(0) === 0", () => get("double")(0), 0);
    `;
    const res = await runJsMission(user, checks, hidden);
    expect(res.error).toBeNull();
    expect(res.stdout).toBe("booting 42\n");
    expect(res.checks).toHaveLength(4);
    expect(res.checks[3].hidden).toBe(true);
    expect(passedAll(res)).toBe(true);
  });

  test("reports syntax errors cleanly", async () => {
    const res = await runJsMission("function broken( {", 'expect("x", () => 1, 1);');
    expect(res.error?.phase).toBe("syntax");
    expect(res.error?.type).toBe("SyntaxError");
    expect(passedAll(res)).toBe(false);
  });

  test("reports runtime errors with 1-based editor line numbers", async () => {
    const user = `const a = 1;\nconst b = 2;\nmissingVar.boom();\n`;
    const res = await runJsMission(user, "");
    expect(res.error?.phase).toBe("runtime");
    expect(res.error?.type).toBe("ReferenceError");
    expect(res.error?.line).toBe(3);
  });

  test("supports expectThrows and helpful MissingName messages", async () => {
    const user = `
      function divide(a, b) {
        if (b === 0) throw new RangeError("division by zero");
        return a / b;
      }
    `;
    const checks = `
      expectThrows("throws RangeError on zero", () => get("divide")(1, 0), "RangeError");
      expect("missing function reports clearly", () => get("nope")(), 1);
    `;
    const res = await runJsMission(user, checks);
    expect(res.error).toBeNull();
    expect(res.checks[0].passed).toBe(true);
    expect(res.checks[1].passed).toBe(false);
    expect(res.checks[1].detail).toContain('"nope" isn\'t defined yet');
  });

  test("drains microtasks and short setTimeout macrotasks deterministically for predict missions", async () => {
    const program = `
      console.log("sync 1");
      setTimeout(() => console.log("macro"), 0);
      Promise.resolve().then(() => console.log("micro"));
      console.log("sync 2");
    `;
    const res = await runJsMission(program, "");
    expect(res.error).toBeNull();
    expect(res.stdout).toBe("sync 1\nsync 2\nmicro\nmacro\n");
  });

  test("extracts top-level declarations after regex literals containing quotes or escaped slashes", () => {
    const code = `
      function clean(s) {
        return s.replace(/\\//g, "_").replace(/'/g, "&#39;");
      }
      function afterRegex() { return 1; }
      class AfterClass {}
    `;
    expect(extractTopLevelNames(code).sort()).toEqual(["AfterClass", "afterRegex", "clean"]);
  });

  test("deepEqual handles floats, nested objects, arrays, Sets, and Maps", () => {
    expect(deepEqual(0.1 + 0.2, 0.3)).toBe(true);
    expect(deepEqual({ a: [1, 2], b: new Set([3, 4]) }, { b: new Set([4, 3]), a: [1, 2] })).toBe(true);
    expect(deepEqual(new Map([["k", 1]]), new Map([["k", 2]]))).toBe(false);
  });
});
