import { loadPyodide, type PyodideInterface } from "pyodide";
import { beforeAll, expect, test } from "vitest";
import { HARNESS_PY, type RunResult } from "../src/python/harness";

let pyodide: PyodideInterface;

beforeAll(async () => {
  pyodide = await loadPyodide();
  pyodide.runPython(HARNESS_PY);
});

function run(code: string, checks = "", hidden = ""): RunResult {
  const runMission = pyodide.globals.get("run_mission");
  try {
    return JSON.parse(runMission(code, checks, hidden)) as RunResult;
  } finally {
    runMission.destroy();
  }
}

test("captures printed output", () => {
  expect(run('print("one")\nprint("two")').stdout).toBe("one\ntwo\n");
});

test("reports syntax errors with the line number and runs no checks", () => {
  const result = run('print("ok")\nprint("broken)\n', 'check("never runs", lambda: True)');
  expect(result.error).toMatchObject({ phase: "syntax", type: "SyntaxError", line: 2 });
  expect(result.checks).toEqual([]);
  expect(result.stdout).toBe("");
});

test("reports runtime errors on the learner's line, keeping earlier output", () => {
  const result = run('print("before")\nx = 1 / 0\n');
  expect(result.error).toMatchObject({ phase: "runtime", type: "ZeroDivisionError", line: 2 });
  expect(result.stdout).toBe("before\n");
});

test("explains a missing function instead of raising KeyError", () => {
  const result = run("", 'expect("f()", lambda: get("f")(), 1)');
  expect(result.checks[0]).toMatchObject({ passed: false, detail: "main.py doesn't define f yet." });
});

test("points errors raised inside learner functions at main.py", () => {
  const code = "def f(items):\n    return items[5]\n";
  const result = run(code, 'expect("f([])", lambda: get("f")([]), 1)');
  expect(result.checks[0].detail).toBe("IndexError on line 2: list index out of range");
});

test("nudges toward return when a function only prints", () => {
  const result = run("def f():\n    print(3)\n", 'expect("f()", lambda: get("f")(), 3)');
  expect(result.checks[0].detail).toContain("uses return, not print");
});

test("compares types, so a list is not accepted for a tuple", () => {
  const result = run("def f():\n    return [1, 2]\n", 'expect("f()", lambda: get("f")(), (1, 2))');
  expect(result.checks[0]).toMatchObject({ passed: false, detail: "Expected (1, 2), got [1, 2]." });
});

test("treats whole-number floats and ints as equal", () => {
  const result = run("def f():\n    return 24\n", 'expect("f()", lambda: get("f")(), 24.0)');
  expect(result.checks[0].passed).toBe(true);
});

test("marks hidden checks and their telemetry", () => {
  const result = run("def f():\n    return 1\n", 'expect("a", lambda: get("f")(), 1)', 'expect("b", lambda: get("f")(), 1)');
  expect(result.checks.map((c) => c.hidden)).toEqual([false, true]);
  expect(result.events.map((e) => e.data.hidden)).toEqual([false, true]);
});

test("tracked lists count reads by index, slice, and iteration", () => {
  const checks = `
data = tracked([4, 8, 15, 16, 23, 42])
expect_within("first", lambda: get("first")(data), 4, data, 1)
expect_within("total", lambda: get("total")(data), 108, data, 6)
expect_within("sliced", lambda: get("sliced")(data), 108, data, 6)
expect_within("has", lambda: get("has")(data), True, data, 3)
`;
  const code = [
    "def first(items):\n    return items[0]",
    "def total(items):\n    return sum(items)",
    "def sliced(items):\n    return sum(items[:3]) + sum(items[3:])",
    "def has(items):\n    return 15 in items",
  ].join("\n");
  const result = run(code, checks);
  expect(result.checks.map((c) => c.passed)).toEqual([true, true, true, true]);
  expect(result.events.map((e) => e.data.looks)).toEqual([1, 6, 6, 3]);
});

test("a right answer over budget fails with the read count", () => {
  const checks = `
data = tracked(list(range(100)))
expect_within("find(99)", lambda: get("find")(data, 99), 99, data, 10, "Try halving.")
`;
  const result = run("def find(items, x):\n    return items.index(x)", checks);
  expect(result.checks[0]).toMatchObject({
    passed: false,
    detail: "Right answer, but it read 100 items. The budget for 100 items is 10. Try halving.",
  });
  expect(result.events[0]).toMatchObject({ kind: "work", data: { size: 100, looks: 100, budget: 10, passed: false } });
});

test("long values are shortened in failure messages", () => {
  const result = run("def f():\n    return list(range(1000))", 'expect("f()", lambda: get("f")(), [])');
  expect(result.checks[0].detail.length).toBeLessThan(200);
  expect(result.checks[0].detail).toContain("…");
});

test("caps runaway output", () => {
  const result = run('for i in range(100000):\n    print("spam")\n');
  expect(result.stdoutTruncated).toBe(true);
  expect(result.stdout.length).toBe(20_000);
});

test("doesn't let output printed during checks reach the console", () => {
  const result = run('def f():\n    print("inside")\n    return 1\nprint("top level")\n', 'expect("f()", lambda: get("f")(), 1)');
  expect(result.stdout).toBe("top level\n");
});

test("recorded lists keep one frame per swap, skipping the halfway state", () => {
  const checks = `
data = tracked([3, 1, 2], record=True)
expect_sorted("sort", lambda: get("sort_in_place")(data), data, [1, 2, 3])
`;
  const code = `
def sort_in_place(a):
    a[0], a[1] = a[1], a[0]
    a[1], a[2] = a[2], a[1]
`;
  const result = run(code, checks);
  expect(result.checks[0]).toMatchObject({ passed: true });
  expect(result.events[0]).toMatchObject({ kind: "sort", data: { frames: [[3, 1, 2], [1, 3, 2], [1, 2, 3]] } });
});

test("in-place sort checks explain a returned copy and an over-budget sort", () => {
  const checks = `
data = tracked([2, 1])
expect_sorted("copy", lambda: get("copy_sort")(data), data, [1, 2])
big = tracked(list(range(50)))
expect_sorted("slow", lambda: get("slow_sort")(big), big, list(range(50)), 60, "Stop early.")
`;
  const code = `
def copy_sort(a):
    return sorted(a)

def slow_sort(a):
    for _ in range(len(a)):
        for i in range(len(a) - 1):
            if a[i] > a[i + 1]:
                a[i], a[i + 1] = a[i + 1], a[i]
`;
  const [copy, slow] = run(code, checks).checks;
  expect(copy.passed).toBe(false);
  expect(copy.detail).toContain("this sort has to change the list it was given");
  expect(slow).toMatchObject({ passed: false });
  expect(slow.detail).toMatch(/^Sorted correctly, but it read 4,900 items\. The budget for 50 items is 60\. Stop early\.$/);
});

test("uses() finds names in code but not in comments or strings", () => {
  const checks = `
check("sorted", lambda: uses("sorted"))
check("sort", lambda: uses("sort"))
`;
  const [sortedCheck, sortCheck] = run('# never call sort()\nlabel = "sort"\nx = sorted([2, 1])', checks).checks;
  expect(sortedCheck.passed).toBe(true);
  expect(sortCheck.passed).toBe(false);
});

test("recursive checks record each call with its depth and result", () => {
  const code = "def total(xs):\n    if not xs:\n        return 0\n    return xs[0] + total(xs[1:])\n";
  const result = run(code, 'expect_recursive("total([5, 6])", "total", ([5, 6],), 11)');
  expect(result.checks[0]).toMatchObject({ passed: true });
  expect(result.events[0]).toMatchObject({
    kind: "calls",
    data: {
      total: 3,
      calls: [
        { depth: 0, call: "total([5, 6])", result: "11", error: false },
        { depth: 1, call: "total([6])", result: "6", error: false },
        { depth: 2, call: "total([])", result: "0", error: false },
      ],
    },
  });
});

test("a right answer without recursion fails, and runaway recursion is explained", () => {
  const loop = run("def total(xs):\n    return sum(xs)\n", 'expect_recursive("total([1])", "total", ([1],), 1)');
  expect(loop.checks[0].passed).toBe(false);
  expect(loop.checks[0].detail).toContain("total never called itself");

  const runaway = run("def down(n):\n    if n == 0:\n        return 0\n    return down(n - 2)\n", 'expect_recursive("down(3)", "down", (3,), 0)');
  expect(runaway.checks[0].detail).toBe(
    "RecursionError on line 4: the function kept calling itself and never reached a base case that stops it.",
  );
  expect(runaway.events[0].data).toMatchObject({ error: expect.any(String) });
  expect((runaway.events[0].data.calls as unknown[]).length).toBe(60);
});

test("compared numbers count comparisons through copies and slices", () => {
  const checks = `
data = compared([5, 1, 4, 2, 3])
expect_comparisons("sort", lambda: get("my_sort")(data), [1, 2, 3, 4, 5], 5, 4, "Fewer.")
`;
  const code = `
def my_sort(items):
    items = items[:]
    for i in range(1, len(items)):
        j = i
        while j > 0 and items[j - 1] > items[j]:
            items[j - 1], items[j] = items[j], items[j - 1]
            j -= 1
    return items
`;
  const result = run(code, checks);
  expect(result.checks[0]).toMatchObject({ passed: false });
  expect(result.checks[0].detail).toMatch(/^Right answer, but it made \d+ comparisons\. The budget for 5 items is 4\. Fewer\.$/);
  expect(result.events[0]).toMatchObject({ kind: "work", data: { unit: "comparisons", budget: 4, passed: false } });
});

test("accept= approves any right answer and describes one when it fails", () => {
  const checks = `
expect("pair", lambda: get("pair")(), "two numbers adding up to 5", accept=lambda p: sum(p) == 5)
expect("bad", lambda: get("bad")(), "two numbers adding up to 5", "Try again.", accept=lambda p: sum(p) == 5)
`;
  const [good, bad] = run("def pair():\n    return (2, 3)\n\ndef bad():\n    return (1, 1)\n", checks).checks;
  expect(good).toMatchObject({ passed: true, detail: "" });
  expect(bad).toMatchObject({ passed: false, detail: "Got (1, 1), which isn't two numbers adding up to 5. Try again." });
});

test("strings in a tracked list count the letters iterated over", () => {
  const checks = `
words = tracked(["tea", "eat"])
expect_within("keys", lambda: get("keys")(words), [("a", "e", "t"), ("a", "e", "t")], words, 7)
expect_within("first", lambda: get("first")(words), "tea", words, 1)
`;
  const code = "def keys(words):\n    return [tuple(sorted(w)) for w in words]\n\ndef first(words):\n    return words[0]\n";
  const [keys, first] = run(code, checks).checks;
  expect(keys).toMatchObject({ passed: false, detail: "Right answer, but it read 8 items. The budget for 2 items is 7." });
  expect(first).toMatchObject({ passed: true });
});

test("tracked grids count cell reads and remember the order cells were read", () => {
  const checks = `
grid = tracked_grid(["ab", "cd"])
expect_grid("scan", lambda: get("scan")(grid), "acbd", grid, budget=3)
`;
  const code = "def scan(grid):\n    out = ''\n    for c in range(2):\n        for r in range(2):\n            out += grid[r][c]\n    return out\n";
  const result = run(code, checks);
  expect(result.checks[0]).toMatchObject({ passed: false, detail: "Right answer, but it read 4 cells. The budget for 4 cells is 3." });
  expect(result.events[0]).toMatchObject({
    kind: "grid",
    data: { rows: ["ab", "cd"], order: [[0, 0], [1, 0], [0, 1], [1, 1]], result: "acbd", looks: 4 },
  });
  expect(result.events[1]).toMatchObject({ kind: "work", data: { unit: "cell reads", looks: 4, budget: 3 } });
});

test("non-finite floats like inf and nan serialize to valid JSON", () => {
  const result = run("def broken():\n    return float('inf')\n", 'expect("broken()", lambda: get("broken")(), 0)');
  expect(result.error).toBeNull();
  expect(result.checks[0].passed).toBe(false);
  expect(result.events[0].data.got).toBe("inf");
});
