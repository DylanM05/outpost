import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { bracketMatching, HighlightStyle, indentOnInput, indentUnit, StreamLanguage, syntaxHighlighting } from "@codemirror/language";
import { Annotation, EditorState, Prec, StateEffect, StateField, type Extension } from "@codemirror/state";
import {
  Decoration,
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  type DecorationSet,
} from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { useEffect, useRef, type RefObject } from "react";
import type { Language } from "../content/parse";

interface Props {
  // Changing docKey starts a fresh editor state (and undo history).
  docKey: string;
  value: string;
  label: string;
  language?: Language;
  readOnly?: boolean;
  className?: string;
  errorLine: number | null;
  // Changes on every run, so the same error line is highlighted again after edits.
  runKey: unknown;
  onChange(code: string): void;
  onRun(): void;
  onSubmit(): void;
}

// Marks changes made from outside (switching missions, resetting code) so
// they aren't reported back as player edits.
const external = Annotation.define<boolean>();

const setErrorLine = StateEffect.define<number | null>();

const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(marks, tr) {
    if (tr.docChanged) marks = Decoration.none;
    for (const effect of tr.effects) {
      if (!effect.is(setErrorLine)) continue;
      const line = effect.value;
      marks =
        line !== null && line >= 1 && line <= tr.state.doc.lines
          ? Decoration.set([Decoration.line({ class: "cm-error-line" }).range(tr.state.doc.line(line).from)])
          : Decoration.none;
    }
    return marks;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const highlight = HighlightStyle.define([
  { tag: t.keyword, color: "var(--syntax-keyword)" },
  { tag: [t.string, t.special(t.string)], color: "var(--syntax-string)" },
  { tag: [t.number, t.bool, t.null], color: "var(--syntax-number)" },
  { tag: t.comment, color: "var(--syntax-comment)", fontStyle: "italic" },
  { tag: [t.function(t.definition(t.variableName)), t.function(t.variableName)], color: "var(--syntax-function)" },
  { tag: [t.operator, t.punctuation], color: "var(--screen-soft)" },
]);

const theme = EditorView.theme(
  {
    "&": { backgroundColor: "var(--screen)", color: "var(--screen-ink)", height: "100%" },
    ".cm-scroller": { fontFamily: "var(--mono)", fontSize: "15px", lineHeight: "1.6" },
    ".cm-content": { caretColor: "var(--signal)", padding: "12px 0" },
    ".cm-cursor": { borderLeftColor: "var(--signal)", borderLeftWidth: "2px" },
    ".cm-gutters": { backgroundColor: "var(--screen)", color: "var(--screen-soft)", border: "none" },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "var(--screen-raised)" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "var(--screen-selection) !important",
    },
    ".cm-error-line": { backgroundColor: "var(--screen-fault)", boxShadow: "inset 3px 0 0 var(--fault)" },
    "&.cm-focused": { outline: "none" },
    ".cm-matchingBracket": { backgroundColor: "var(--screen-selection)", color: "inherit" },
  },
  { dark: true },
);

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AS", "AND", "OR", "NOT", "IN", "IS", "NULL", "BETWEEN", "LIKE",
  "ORDER", "BY", "ASC", "DESC", "LIMIT", "OFFSET", "DISTINCT", "GROUP", "HAVING", "JOIN",
  "INNER", "LEFT", "RIGHT", "FULL", "OUTER", "CROSS", "ON", "USING", "UNION", "ALL",
  "INTERSECT", "EXCEPT", "EXISTS", "CASE", "WHEN", "THEN", "ELSE", "END", "WITH", "RECURSIVE",
  "OVER", "PARTITION", "ROWS", "RANGE", "UNBOUNDED", "PRECEDING", "FOLLOWING", "CURRENT", "ROW",
  "CREATE", "TABLE", "VIEW", "INDEX", "TRIGGER", "UNIQUE", "PRIMARY", "KEY", "FOREIGN",
  "REFERENCES", "DELETE", "CASCADE", "RESTRICT", "SET", "CHECK", "DEFAULT", "AUTOINCREMENT",
  "INSERT", "INTO", "VALUES", "UPDATE", "CONFLICT", "DO", "NOTHING", "EXCLUDED", "RETURNING",
  "DROP", "ALTER", "ADD", "COLUMN", "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION", "SAVEPOINT",
  "RELEASE", "TO", "RENAME", "VIRTUAL", "STRICT", "GENERATED", "ALWAYS", "STORED", "FILTER",
  "MATCH", "UNINDEXED", "AFTER", "BEFORE", "FOR", "EACH", "NEW", "OLD", "EXPLAIN", "QUERY",
  "PLAN", "PRAGMA", "IF", "TEMP", "TEMPORARY", "INTEGER", "INT", "TEXT", "REAL", "BLOB",
  "NUMERIC", "BOOLEAN", "TRUE", "FALSE",
]);

const SQL_FUNCTIONS = new Set([
  "COUNT", "SUM", "AVG", "MIN", "MAX", "ROUND", "COALESCE", "IFNULL", "NULLIF", "ABS",
  "LOWER", "UPPER", "LENGTH", "SUBSTR", "TRIM", "REPLACE", "GROUP_CONCAT", "CAST",
  "ROW_NUMBER", "RANK", "DENSE_RANK", "LAG", "LEAD", "FIRST_VALUE", "LAST_VALUE", "NTILE",
  "JSON_EXTRACT", "JSON_EACH", "JSON_TYPE", "JSON_ARRAY_LENGTH",
]);

const sqlLanguage = StreamLanguage.define<{ inBlockComment: boolean }>({
  startState: () => ({ inBlockComment: false }),
  token(stream, state) {
    if (state.inBlockComment) {
      if (stream.skipTo("*/")) {
        stream.pos += 2;
        state.inBlockComment = false;
      } else {
        stream.skipToEnd();
      }
      return "comment";
    }
    if (stream.eatSpace()) return null;
    if (stream.match("--")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("/*")) {
      state.inBlockComment = true;
      return "comment";
    }
    if (stream.peek() === "'" || stream.peek() === '"') {
      const quote = stream.next()!;
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === quote) {
          if (stream.peek() === quote) stream.next();
          else break;
        }
      }
      return quote === "'" ? "string" : "variableName";
    }
    if (stream.match(/^\d+(\.\d+)?/)) return "number";
    if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
      const upper = stream.current().toUpperCase();
      if (SQL_KEYWORDS.has(upper)) return "keyword";
      if (SQL_FUNCTIONS.has(upper)) return "function";
      return "variableName";
    }
    if (stream.match(/^[=<>!+\-*/|%,.;()]+/)) return "operator";
    stream.next();
    return null;
  },
});

function createState(doc: string, props: RefObject<Props>): EditorState {
  const lang = props.current.language ?? "python";
  const twoSpace = lang === "javascript" || lang === "typescript" || lang === "sql";
  const langExt =
    lang === "javascript"
      ? javascript()
      : lang === "typescript"
        ? javascript({ typescript: true })
        : lang === "sql"
          ? sqlLanguage
          : python();
  const extensions: Extension[] = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    drawSelection(),
    history(),
    indentOnInput(),
    bracketMatching(),
    indentUnit.of(twoSpace ? "  " : "    "),
    EditorState.tabSize.of(twoSpace ? 2 : 4),
    langExt,
    syntaxHighlighting(highlight),
    theme,
    errorLineField,
    Prec.highest(
      keymap.of([
        { key: "Mod-Enter", run: () => (props.current.onRun(), true) },
        { key: "Mod-Shift-Enter", run: () => (props.current.onSubmit(), true) },
      ]),
    ),
    // Tab indents. Pressing Escape first lets Tab move focus out of the editor.
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.contentAttributes.of({ "aria-label": props.current.label }),
    EditorState.readOnly.of(props.current.readOnly ?? false),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !update.transactions.some((tr) => tr.annotation(external))) {
        props.current.onChange(update.state.doc.toString());
      }
    }),
  ];
  return EditorState.create({ doc, extensions });
}

export function CodeEditor(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const editor = new EditorView({ parent: host.current!, state: createState(latest.current.value, latest) });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    editor.setState(createState(latest.current.value, latest));
    // A new mission's code starts at the top, not where the last one was scrolled to.
    editor.dispatch({ effects: EditorView.scrollIntoView(0, { y: "start" }) });
  }, [props.docKey]);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const doc = editor.state.doc.toString();
    if (doc !== props.value) {
      editor.dispatch({ changes: { from: 0, to: doc.length, insert: props.value }, annotations: external.of(true) });
    }
  }, [props.value]);

  useEffect(() => {
    view.current?.dispatch({ effects: setErrorLine.of(props.errorLine) });
  }, [props.errorLine, props.runKey]);

  return <div className={props.className ? `editor ${props.className}` : "editor"} ref={host} />;
}
