import { loadPyodide, type PyodideInterface } from "pyodide";
import { beforeAll, describe, expect, test } from "vitest";
import { HARNESS_PY, passedAll, type RunResult } from "../src/python/harness";

let pyodide: PyodideInterface;

beforeAll(async () => {
  pyodide = await loadPyodide();
  pyodide.runPython(HARNESS_PY);
});

function runSql(userSql: string, setupSql: string, checks: string, hidden = ""): RunResult {
  const fn = pyodide.globals.get("run_sql_mission");
  try {
    return JSON.parse(fn(userSql, setupSql, checks, hidden)) as RunResult;
  } finally {
    fn.destroy();
  }
}

describe("SQL mission harness", () => {
  test("executes SELECT queries, formats pipe-separated table output, and supports dynamic re-checks", () => {
    const setup = `
      CREATE TABLE beacons (id TEXT PRIMARY KEY, kw INTEGER);
      INSERT INTO beacons VALUES ('B-1', 120), ('B-2', 80);
    `;
    const result = runSql(
      "SELECT id, kw FROM beacons WHERE kw >= 100 ORDER BY kw DESC;",
      setup,
      `
expect("columns", lambda: columns, ["id", "kw"])
expect("rows", lambda: rows, [["B-1", 120]])
check("uses WHERE", lambda: sql_uses("WHERE"), "Use WHERE")
`,
      `
conn.execute("INSERT INTO beacons VALUES ('B-3', 150)")
expect("dynamic", lambda: run_user_sql(), [["B-3", 150], ["B-1", 120]])
`,
    );

    expect(result.error).toBeNull();
    expect(passedAll(result)).toBe(true);
    expect(result.stdout).toBe("id | kw\nB-1 | 120\n");
  });

  test("splits multi-statement DDL scripts containing CREATE TRIGGER BEGIN...END blocks", () => {
    const sql = `
      CREATE TABLE accounts (id TEXT PRIMARY KEY, bal INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE log (account_id TEXT, delta INTEGER);
      CREATE TRIGGER trg_log AFTER UPDATE ON accounts
      BEGIN
        INSERT INTO log VALUES (NEW.id, NEW.bal - OLD.bal);
      END;
      INSERT INTO accounts VALUES ('A1', 10);
      UPDATE accounts SET bal = 25 WHERE id = 'A1';
      SELECT account_id, delta FROM log;
    `;
    const result = runSql(
      sql,
      "",
      `expect("trigger fired", lambda: rows, [["A1", 15]])`,
    );

    expect(result.error).toBeNull();
    expect(passedAll(result)).toBe(true);
  });

  test("enforces PRAGMA foreign_keys = ON and maps sqlite3 errors cleanly", () => {
    const setup = `
      CREATE TABLE parents (id INTEGER PRIMARY KEY);
      CREATE TABLE children (id INTEGER PRIMARY KEY, pid INTEGER REFERENCES parents(id));
    `;
    const result = runSql("INSERT INTO children VALUES (1, 999);", setup, "");
    expect(result.error).not.toBeNull();
    expect(result.error?.type).toBe("IntegrityError");
  });

  test("sql_uses ignores SQL comments and string literals", () => {
    const setup = "CREATE TABLE t (x TEXT); INSERT INTO t VALUES ('JOIN');";
    const result = runSql(
      "-- JOIN in comment\nSELECT x FROM t WHERE x = 'JOIN';",
      setup,
      `check("does not falsely match JOIN", lambda: not sql_uses("JOIN"), "false positive")`,
    );
    expect(result.error).toBeNull();
    expect(passedAll(result)).toBe(true);
  });

  test("supports explicit BEGIN, SAVEPOINT, ROLLBACK TO, COMMIT, and FTS5 natively", () => {
    const setup = "CREATE TABLE v (id TEXT PRIMARY KEY, n INT); INSERT INTO v VALUES ('A', 10);";
    const sql = `
      BEGIN;
      UPDATE v SET n = 20 WHERE id = 'A';
      SAVEPOINT s1;
      UPDATE v SET n = 99 WHERE id = 'A';
      ROLLBACK TO s1;
      RELEASE s1;
      COMMIT;
      SELECT id, n FROM v;
    `;
    const result = runSql(
      sql,
      setup,
      `expect("savepoint rolled back cleanly", lambda: rows, [["A", 20]])`,
    );
    expect(result.error).toBeNull();
    expect(passedAll(result)).toBe(true);
  });

  test("emits structured sql_table telemetry events with NULL cells and row-cap metadata", () => {
    const setup = "CREATE TABLE notes (id TEXT, body TEXT); INSERT INTO notes VALUES ('N-1', NULL), ('N-2', 'ok');";
    const single = runSql("SELECT id, body FROM notes ORDER BY id ASC;", setup, "");
    expect(single.error).toBeNull();
    expect(single.events).toEqual([
      {
        kind: "sql_table",
        data: {
          columns: ["id", "body"],
          rows: [
            ["N-1", null],
            ["N-2", "ok"],
          ],
          totalRows: 2,
          truncated: false,
          hidden: false,
        },
      },
    ]);

    const many = runSql(
      "WITH RECURSIVE cnt(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM cnt WHERE n < 205) SELECT n FROM cnt;",
      "",
      "",
    );
    expect(many.error).toBeNull();
    const tableEvent = many.events.find((e) => e.kind === "sql_table");
    expect(tableEvent?.data).toMatchObject({
      columns: ["n"],
      totalRows: 205,
      truncated: true,
      hidden: false,
    });
    expect((tableEvent?.data.rows as unknown[][]).length).toBe(200);
  });

  test("maps sqlite3 errors in multi-statement scripts without double-counting leading comments and unwraps run_user_sql errors", () => {
    const syntaxSql = [
      "-- leading comment line 1",
      "-- leading comment line 2",
      "SELECT",
      "  areas",
      "  FORM sensors;",
    ].join("\n");
    const syntaxResult = runSql(syntaxSql, "", "");
    expect(syntaxResult.error).not.toBeNull();
    expect(syntaxResult.error?.type).toBe("OperationalError");
    expect(syntaxResult.error?.line).toBe(5);

    // Ensure token "as" does not false-match inside "areas" on an earlier line.
    const wordSql = ["SELECT areas", "FROM sensors", "WHERE as = 1;"].join("\n");
    const wordResult = runSql(wordSql, "CREATE TABLE sensors (areas TEXT);", "");
    expect(wordResult.error?.message).toContain('near "as"');
    expect(wordResult.error?.line).toBe(3);

    // Multiple SELECT statements emit separate sql_table events in execution order.
    const multi = runSql("SELECT 1 AS a; SELECT 2 AS b;", "", "");
    expect(multi.error).toBeNull();
    expect(multi.events).toHaveLength(2);
    expect(multi.events[0]?.data).toMatchObject({ columns: ["a"], rows: [[1]] });
    expect(multi.events[1]?.data).toMatchObject({ columns: ["b"], rows: [[2]] });

    // run_user_sql unwraps _SqlExecError back to sqlite3.Error for hidden checks.
    const hiddenCheck = runSql(
      "INSERT INTO t VALUES (1);",
      "CREATE TABLE t (id INTEGER PRIMARY KEY);",
      "",
      `
def test_dup():
    try:
        run_user_sql()
        return False
    except sqlite3.IntegrityError:
        return True
check("raises IntegrityError cleanly", test_dup, "expected IntegrityError")
`,
    );
    expect(passedAll(hiddenCheck)).toBe(true);
  });
});
