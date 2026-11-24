// Browser-native and Node-compatible TypeScript compiler & mission harness.
// Runs strict TypeScript 5.9 typechecking against an in-memory virtual host,
// transpiles learner TypeScript to ES2022 JS, and runs both compile-time type
// checks (`expectType`, `expectTypeError`, `typecheck`) and runtime JS checks.
import ts from "typescript-browser";
import { runJsMission } from "../js/harness";
import type { RunResult } from "../python/harness";
import { LIB_DTS } from "./lib-dts";

export interface TsDiagnostic {
  code: number;
  message: string;
  line: number | null;
  isSyntax: boolean;
}

const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.None,
  strict: true,
  noImplicitAny: true,
  strictNullChecks: true,
  strictFunctionTypes: true,
  strictPropertyInitialization: true,
  noImplicitThis: true,
  alwaysStrict: true,
  types: [],
  skipLibCheck: true,
};

let cachedLibFile: ts.SourceFile | null = null;
function getLibSourceFile(): ts.SourceFile {
  if (!cachedLibFile) {
    cachedLibFile = ts.createSourceFile("lib.d.ts", LIB_DTS, ts.ScriptTarget.ES2022, true);
  }
  return cachedLibFile;
}

export function checkTsTypes(sourceCode: string, fileName = "main.ts"): TsDiagnostic[] {
  const userFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.ES2022, true);
  const libFile = getLibSourceFile();

  const host: ts.CompilerHost = {
    getSourceFile(name) {
      if (name === fileName) return userFile;
      if (name === "lib.d.ts") return libFile;
      return undefined;
    },
    writeFile() {},
    getCurrentDirectory: () => "",
    getDirectories: () => [],
    fileExists: (name) => name === fileName || name === "lib.d.ts",
    readFile: (name) => (name === fileName ? sourceCode : name === "lib.d.ts" ? LIB_DTS : undefined),
    getCanonicalFileName: (name) => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    getDefaultLibFileName: () => "lib.d.ts",
  };

  const program = ts.createProgram([fileName], COMPILER_OPTIONS, host);
  const diagnostics = ts.getPreEmitDiagnostics(program, userFile);

  const errors: TsDiagnostic[] = [];
  for (const diag of diagnostics) {
    if (diag.category !== ts.DiagnosticCategory.Error) continue;
    let line: number | null = null;
    if (diag.file && diag.start !== undefined) {
      line = diag.file.getLineAndCharacterOfPosition(diag.start).line + 1;
    }
    errors.push({
      code: diag.code,
      message: ts.flattenDiagnosticMessageText(diag.messageText, "\n"),
      line,
      isSyntax: diag.code >= 1000 && diag.code < 2000,
    });
  }
  return errors;
}

export function transpileTs(sourceCode: string): string {
  const out = ts.transpileModule(sourceCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
      removeComments: false,
    },
  });
  return out.outputText;
}

export async function runTsMission(userCode: string, checkCode: string, hiddenCode = ""): Promise<RunResult> {
  const diagnostics = checkTsTypes(userCode);
  if (diagnostics.length > 0) {
    const first = diagnostics[0];
    return {
      stdout: "",
      stdoutTruncated: false,
      error: {
        phase: first.isSyntax ? "syntax" : "runtime",
        type: `TS${first.code}`,
        message: first.message,
        line: first.line,
      },
      checks: [],
      events: [],
    };
  }

  const transpiled = transpileTs(userCode);
  const userLineCount = userCode.split("\n").length;

  return runJsMission(transpiled, checkCode, hiddenCode, {
    rawSource: userCode,
    extraHelpers: (record) => {
      const typecheck = (snippet: string) => {
        const combined = `${userCode}\n;\n${snippet}\n`;
        const allErrors = checkTsTypes(combined);
        const snippetErrors = allErrors.filter((e) => e.line === null || e.line > userLineCount);
        return {
          ok: allErrors.length === 0,
          errors: snippetErrors.length > 0 ? snippetErrors : allErrors,
        };
      };

      const expectType = (label: string, snippet: string) => {
        const res = typecheck(snippet);
        if (res.ok) {
          record(label, true);
        } else {
          const first = res.errors[0];
          record(label, false, first ? `TS${first.code}: ${first.message}` : "TypeScript typecheck failed.");
        }
      };

      const expectTypeError = (label: string, snippet: string, expectedCode?: number | RegExp) => {
        const res = typecheck(snippet);
        if (res.ok) {
          record(label, false, "expected a TypeScript compile-time error, but the code typechecked cleanly");
          return;
        }
        if (expectedCode === undefined) {
          record(label, true);
          return;
        }
        const matched = res.errors.some((e) =>
          typeof expectedCode === "number" ? e.code === expectedCode : expectedCode.test(`TS${e.code}: ${e.message}`),
        );
        if (matched) {
          record(label, true);
        } else {
          const got = res.errors.map((e) => `TS${e.code}: ${e.message}`).join("; ");
          record(label, false, `expected TypeScript error ${String(expectedCode)}, got ${got}`);
        }
      };

      return { typecheck, expectType, expectTypeError };
    },
  });
}
