// Browser-native and Node-compatible JavaScript mission harness.
// Runs learner JavaScript in strict mode, captures console output and top-level
// declarations, and executes visible + hidden checks with the same RunResult
// shape used by the Python harness.
import type { CheckResult, RunError, RunResult } from "../python/harness";

const OUTPUT_LIMIT = 20_000;
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => (...fnArgs: unknown[]) => Promise<unknown>;

class MissingName extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingName";
  }
}

// Compute the exact line offset added by `new AsyncFunction(...)` in the current
// JS engine so runtime stack traces map back to 1-based editor lines.
let cachedLineOffset: number | null = null;
function getWrapperLineOffset(): number {
  if (cachedLineOffset !== null) return cachedLineOffset;
  try {
    const fn = new Function("throw new Error('__probe__');\n//# sourceURL=outpost-probe.js");
    fn();
  } catch (err) {
    const line = extractLineFromStack(err instanceof Error ? err.stack : "", "outpost-probe.js");
    if (line !== null) {
      // "throw new Error('__probe__');" is on line 1 of the body.
      cachedLineOffset = line - 1;
      return cachedLineOffset;
    }
  }
  cachedLineOffset = 2;
  return cachedLineOffset;
}

function extractLineFromStack(stack: string | undefined, sourceTag: string): number | null {
  if (!stack) return null;
  const escaped = sourceTag.replace(/\./g, "\\.");
  const tagged = new RegExp(`${escaped}:(\\d+):(\\d+)`);
  for (const rawLine of stack.split("\n")) {
    const match = rawLine.match(tagged);
    if (match) return Number(match[1]);
  }
  return null;
}

function userLineFromError(err: unknown, userLineCount: number, headerLines: number): number | null {
  if (!(err instanceof Error)) return null;
  const raw = extractLineFromStack(err.stack, "outpost-user.js");
  if (raw === null) return null;
  const adjusted = raw - getWrapperLineOffset() - headerLines;
  if (adjusted >= 1 && adjusted <= userLineCount) return adjusted;
  return null;
}

function formatValue(value: unknown, seen = new WeakSet<object>()): string {
  if (typeof value === "string") return value;
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    if (Array.isArray(value)) {
      return `[${value.map((v) => formatRepr(v, seen)).join(", ")}]`;
    }
    if (value instanceof Set) {
      return `Set(${value.size}) { ${[...value].map((v) => formatRepr(v, seen)).join(", ")} }`;
    }
    if (value instanceof Map) {
      const entries = [...value.entries()].map(([k, v]) => `${formatRepr(k, seen)} => ${formatRepr(v, seen)}`);
      return `Map(${value.size}) { ${entries.join(", ")} }`;
    }
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    const entries = Object.entries(value).map(([k, v]) => `${k}: ${formatRepr(v, seen)}`);
    return `{ ${entries.join(", ")} }`;
  }
  return String(value);
}

function formatRepr(value: unknown, seen = new WeakSet<object>()): string {
  if (typeof value === "string") return JSON.stringify(value);
  return formatValue(value, seen);
}

function shortRepr(value: unknown, limit = 120): string {
  const text = formatRepr(value);
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return Math.abs(a - b) < 1e-9;
  }
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set) || !(b instanceof Set) || a.size !== b.size) return false;
    for (const item of a) {
      let found = false;
      for (const other of b) {
        if (deepEqual(item, other)) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  }
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map) || !(b instanceof Map) || a.size !== b.size) return false;
    for (const [k, v] of a.entries()) {
      if (!b.has(k) || !deepEqual(v, b.get(k))) return false;
    }
    return true;
  }
  const protoA = Object.getPrototypeOf(a);
  const protoB = Object.getPrototypeOf(b);
  if (protoA !== protoB) return false;
  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(
    (k) =>
      Object.prototype.hasOwnProperty.call(b, k) &&
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}

// Extracts top-level declared identifiers (function, class, const, let, var)
// while skipping comments, strings, template literals, and nested blocks.
export function extractTopLevelNames(code: string): string[] {
  const names = new Set<string>();
  const cleaned = stripStringsAndComments(code);
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;

  let i = 0;
  const n = cleaned.length;
  const isIdentStart = (ch: string) => /[A-Za-z_$]/.test(ch);
  const isIdentPart = (ch: string) => /[A-Za-z0-9_$]/.test(ch);

  const readIdent = (start: number): [string, number] => {
    let p = start;
    while (p < n && isIdentPart(cleaned[p])) p++;
    return [cleaned.slice(start, p), p];
  };

  const skipWs = (start: number): number => {
    let p = start;
    while (p < n && /\s/.test(cleaned[p])) p++;
    return p;
  };

  while (i < n) {
    const ch = cleaned[i];
    if (ch === "{") {
      braceDepth++;
      i++;
      continue;
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      i++;
      continue;
    }
    if (ch === "(") {
      parenDepth++;
      i++;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      i++;
      continue;
    }
    if (ch === "[") {
      bracketDepth++;
      i++;
      continue;
    }
    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      i++;
      continue;
    }

    if (braceDepth === 0 && parenDepth === 0 && bracketDepth === 0 && isIdentStart(ch)) {
      const prev = i > 0 ? cleaned[i - 1] : "";
      const [word, nextPos] = readIdent(i);
      if (prev === ".") {
        i = nextPos;
        continue;
      }
      if (word === "function" || word === "class") {
        let p = skipWs(nextPos);
        if (word === "function" && cleaned[p] === "*") p = skipWs(p + 1);
        if (p < n && isIdentStart(cleaned[p])) {
          const [decl, after] = readIdent(p);
          if (decl) names.add(decl);
          i = after;
          continue;
        }
      } else if (word === "const" || word === "let" || word === "var") {
        let p = skipWs(nextPos);
        if (p < n && isIdentStart(cleaned[p])) {
          const [decl, after] = readIdent(p);
          if (decl) names.add(decl);
          i = after;
          continue;
        }
        // Simple destructuring: const { a, b: alias } = ... or const [a, b] = ...
        if (p < n && (cleaned[p] === "{" || cleaned[p] === "[")) {
          const open = cleaned[p];
          const close = open === "{" ? "}" : "]";
          let depth = 1;
          let q = p + 1;
          while (q < n && depth > 0) {
            if (cleaned[q] === open) depth++;
            else if (cleaned[q] === close) depth--;
            q++;
          }
          const inner = cleaned.slice(p + 1, q - 1);
          for (const part of inner.split(",")) {
            const trimmed = part.trim().replace(/^\.\.\./, "").split("=")[0].trim();
            const target = trimmed.includes(":") ? trimmed.split(":").pop()!.trim() : trimmed;
            if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(target)) names.add(target);
          }
          i = q;
          continue;
        }
      }
      i = nextPos;
      continue;
    }
    i++;
  }

  return [...names];
}

const REGEX_PREV_KEYWORDS = new Set([
  "return",
  "throw",
  "case",
  "in",
  "of",
  "typeof",
  "void",
  "delete",
  "await",
  "yield",
  "new",
  "else",
  "do",
]);

function canStartRegex(code: string, slashIndex: number): boolean {
  let p = slashIndex - 1;
  while (p >= 0 && /\s/.test(code[p])) p--;
  if (p < 0) return true;
  const ch = code[p];
  if ("([{,;:=!&|^~+-*%<>?".includes(ch)) return true;
  if (/[A-Za-z0-9_$]/.test(ch)) {
    let start = p;
    while (start > 0 && /[A-Za-z0-9_$]/.test(code[start - 1])) start--;
    return REGEX_PREV_KEYWORDS.has(code.slice(start, p + 1));
  }
  return false;
}

function stripStringsAndComments(code: string): string {
  const out: string[] = [];
  let i = 0;
  const n = code.length;
  while (i < n) {
    const ch = code[i];
    const next = code[i + 1];
    // Line comment
    if (ch === "/" && next === "/") {
      while (i < n && code[i] !== "\n") {
        out.push(" ");
        i++;
      }
      continue;
    }
    // Block comment
    if (ch === "/" && next === "*") {
      out.push("  ");
      i += 2;
      while (i < n && !(code[i] === "*" && code[i + 1] === "/")) {
        out.push(code[i] === "\n" ? "\n" : " ");
        i++;
      }
      if (i < n) {
        out.push("  ");
        i += 2;
      }
      continue;
    }
    // Regex literal (e.g. /\//g, /'/g, /[&<>"']/g)
    if (ch === "/" && canStartRegex(code, i)) {
      out.push(" ");
      i++;
      let inClass = false;
      while (i < n && code[i] !== "\n") {
        if (code[i] === "\\" && i + 1 < n) {
          out.push("  ");
          i += 2;
          continue;
        }
        if (code[i] === "[") inClass = true;
        else if (code[i] === "]") inClass = false;
        else if (code[i] === "/" && !inClass) {
          out.push(" ");
          i++;
          while (i < n && /[a-z]/i.test(code[i])) {
            out.push(" ");
            i++;
          }
          break;
        }
        out.push(" ");
        i++;
      }
      continue;
    }
    // String or template literal
    if (ch === "'" || ch === '"' || ch === "`") {
      const quote = ch;
      out.push(" ");
      i++;
      while (i < n && code[i] !== quote) {
        if (code[i] === "\\" && i + 1 < n) {
          out.push("  ");
          i += 2;
          continue;
        }
        out.push(code[i] === "\n" ? "\n" : " ");
        i++;
      }
      if (i < n) {
        out.push(" ");
        i++;
      }
      continue;
    }
    out.push(ch);
    i++;
  }
  return out.join("");
}

function makeOutputCollector() {
  const parts: string[] = [];
  let size = 0;
  let truncated = false;

  const write = (text: string) => {
    const room = OUTPUT_LIMIT - size;
    if (room > 0) {
      parts.push(text.slice(0, room));
      size += Math.min(text.length, room);
    }
    if (text.length > room) truncated = true;
  };

  const log = (...args: unknown[]) => {
    write(`${args.map((a) => formatValue(a)).join(" ")}\n`);
  };

  return {
    consoleObj: {
      log,
      info: log,
      warn: log,
      error: log,
      debug: log,
    },
    getValue: () => parts.join(""),
    isTruncated: () => truncated,
  };
}

function explainCheckError(err: unknown, userLineCount: number, headerLines: number): string {
  if (err instanceof MissingName) return err.message;
  if (err instanceof Error) {
    const line = userLineFromError(err, userLineCount, headerLines);
    const where = line ? ` on line ${line}` : "";
    if (err instanceof RangeError && /call stack/i.test(err.message)) {
      return `RangeError${where}: the function kept calling itself and overflowed the call stack.`;
    }
    return `${err.name}${where}: ${err.message}`;
  }
  return String(err);
}

export async function runJsMission(userCode: string, checkCode: string, hiddenCode = ""): Promise<RunResult> {
  const collector = makeOutputCollector();
  const result: RunResult = {
    stdout: "",
    stdoutTruncated: false,
    error: null,
    checks: [],
    events: [],
  };

  const userLines = userCode.split("\n").length;
  const headerLines = 1; // `"use strict";\n`
  const declared = extractTopLevelNames(userCode);
  const exportsObj: Record<string, unknown> = {};
  const captureLines = declared
    .map((name) => `try { if (typeof ${name} !== "undefined") __ns[${JSON.stringify(name)}] = ${name}; } catch {}`)
    .join("\n");

  const wrappedUser = `"use strict";\n${userCode}\n;const __ns = {};\n${captureLines}\nreturn __ns;\n//# sourceURL=outpost-user.js`;

  // Track short setTimeout callbacks scheduled by user code (e.g. event loop predict missions)
  // so they complete deterministically before capturing final stdout.
  const pendingTimers = new Set<Promise<void>>();
  const trackedSetTimeout = (cb: (...args: unknown[]) => void, ms = 0, ...args: unknown[]) => {
    let resolveTimer!: () => void;
    const p = new Promise<void>((res) => {
      resolveTimer = res;
    });
    pendingTimers.add(p);
    const delay = Math.max(0, Math.min(Number(ms) || 0, 200));
    return setTimeout(() => {
      try {
        cb(...args);
      } catch (err) {
        if (!result.error) {
          result.error = {
            phase: "runtime",
            type: err instanceof Error ? err.name : "Error",
            message: err instanceof Error ? err.message : String(err),
            line: userLineFromError(err, userLines, headerLines),
          };
        }
      } finally {
        pendingTimers.delete(p);
        resolveTimer();
      }
    }, delay);
  };

  let compiledUser: ((...args: unknown[]) => Promise<unknown>) | null = null;
  try {
    compiledUser = new AsyncFunction("console", "exports", "setTimeout", wrappedUser);
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    result.error = {
      phase: "syntax",
      type: e.name || "SyntaxError",
      message: e.message,
      line: userLineFromError(e, userLines, headerLines),
    };
    return result;
  }

  let namespace: Record<string, unknown> = {};
  try {
    const captured = (await compiledUser(collector.consoleObj, exportsObj, trackedSetTimeout)) as Record<string, unknown>;
    // Drain any microtasks + tracked timers scheduled during top-level execution
    for (let guard = 0; guard < 50 && pendingTimers.size > 0; guard++) {
      await Promise.all([...pendingTimers]);
    }
    await Promise.resolve();
    namespace = { ...captured, ...exportsObj };
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    const runErr: RunError = {
      phase: "runtime",
      type: e.name || "Error",
      message: e.message,
      line: userLineFromError(e, userLines, headerLines),
    };
    result.error = runErr;
  }

  result.stdout = collector.getValue();
  result.stdoutTruncated = collector.isTruncated();
  if (result.error !== null) return result;

  // Run visible and hidden checks with a silent console so test calls don't pollute stdout.
  const silentCollector = makeOutputCollector();
  const lines = result.stdout === "" ? [] : result.stdout.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");

  const runCheckBlock = async (code: string, hidden: boolean) => {
    if (!code.trim()) return;
    const pendingChecks: Promise<void>[] = [];

    const record = (label: string, passed: boolean, detail = "") => {
      const entry: CheckResult = { label, passed: Boolean(passed), detail, hidden };
      result.checks.push(entry);
    };

    const get = (name: string): unknown => {
      if (!Object.prototype.hasOwnProperty.call(namespace, name)) {
        throw new MissingName(`"${name}" isn't defined yet.`);
      }
      return namespace[name];
    };

    const check = (label: string, condition: boolean, detail = "") => {
      record(label, Boolean(condition), condition ? "" : detail);
    };

    const expect = (label: string, fnOrValue: unknown, expected: unknown): Promise<void> | void => {
      const evaluate = async () => {
        try {
          const got = typeof fnOrValue === "function" ? await (fnOrValue as () => unknown)() : await fnOrValue;
          if (deepEqual(got, expected)) {
            record(label, true);
          } else {
            record(label, false, `expected ${shortRepr(expected)}, got ${shortRepr(got)}`);
          }
        } catch (err) {
          record(label, false, explainCheckError(err, userLines, headerLines));
        }
      };
      const p = evaluate();
      pendingChecks.push(p);
      return p;
    };

    const expectThrows = (
      label: string,
      fn: () => unknown,
      expectedType?: string | RegExp,
    ): Promise<void> | void => {
      const evaluate = async () => {
        try {
          await fn();
          record(label, false, "expected an error to be thrown, but none was thrown");
        } catch (err) {
          if (err instanceof MissingName) {
            record(label, false, err.message);
            return;
          }
          if (!expectedType) {
            record(label, true);
            return;
          }
          const name = err instanceof Error ? err.name : typeof err;
          const msg = err instanceof Error ? err.message : String(err);
          const ok =
            typeof expectedType === "string" ? name === expectedType : expectedType.test(`${name}: ${msg}`);
          record(label, ok, ok ? "" : `expected ${String(expectedType)}, got ${name}: ${msg}`);
        }
      };
      const p = evaluate();
      pendingChecks.push(p);
      return p;
    };

    const checkFn = new AsyncFunction(
      "output",
      "lines",
      "source",
      "namespace",
      "get",
      "check",
      "expect",
      "expectThrows",
      "deepEqual",
      "console",
      `"use strict";\n${code}`,
    );

    try {
      await checkFn(
        result.stdout,
        lines,
        userCode,
        namespace,
        get,
        check,
        expect,
        expectThrows,
        deepEqual,
        silentCollector.consoleObj,
      );
      await Promise.all(pendingChecks);
    } catch (err) {
      await Promise.all(pendingChecks);
      record("Finish the mission checks", false, explainCheckError(err, userLines, headerLines));
    }
  };

  await runCheckBlock(checkCode, false);
  await runCheckBlock(hiddenCode, true);

  return result;
}
