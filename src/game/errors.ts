import type { Language } from "../content/parse";

// Plain-language follow-ups for the errors beginners meet most often.
const PYTHON_EXPLANATIONS: Record<string, string> = {
  SyntaxError:
    "Python couldn't read this line, so none of your program ran. Look for a missing quote, bracket, or colon on this line or the one before it.",
  IndentationError:
    "The spaces at the start of a line don't match what Python expects. Lines inside a function, if, or loop must be indented by the same amount.",
  TabError: "This line mixes tabs and spaces for indentation. Use spaces only.",
  NameError:
    "Python doesn't recognize a name. Check the spelling, and make sure the variable or function is created before this line uses it.",
  TypeError:
    "An operation got the wrong kind of value, such as adding text to a number, or calling a function with the wrong number of arguments.",
  ZeroDivisionError: "The code divided by zero. Check what the divisor can be, including when a list is empty.",
  KeyError: "The code looked up a dictionary key that isn't there. Use in to check whether a key exists first.",
  IndexError: "The code asked for a list position that doesn't exist. Positions start at 0 and end one before the length.",
  AttributeError: "The code used a method or property that this kind of value doesn't have. Check the spelling and the value's type.",
  ValueError: "A value had the right type, but not a usable value, such as int() on text that isn't a number.",
  OSError: "input() isn't available in missions. Your functions get their data from the tests instead.",
  RecursionError:
    "A function kept calling itself and never reached a base case that stops it. Check that every call moves closer to the base case, and that the base case catches every way of getting there.",
  SystemExit: "Remove the call to exit() so the tests can run.",
};

const JS_EXPLANATIONS: Record<string, string> = {
  SyntaxError:
    "JavaScript couldn't parse this code, so none of your program ran. Look for a missing brace, parenthesis, quote, or comma nearby.",
  ReferenceError:
    "JavaScript doesn't recognize a variable or function name. Check the spelling and make sure it is declared with const, let, or function before use.",
  TypeError:
    "A value wasn't the type expected — for example, reading a property of undefined/null, reassigning a const, or calling something that isn't a function.",
  RangeError:
    "A value was outside its valid range, or a recursive function overflowed the call stack without reaching a base case.",
  URIError: "A URI encoding or decoding function received malformed characters.",
};

const SQL_EXPLANATIONS: Record<string, string> = {
  OperationalError:
    "SQLite couldn't run this query. Check table and column names, commas between columns, keywords, and matching quotes or parentheses.",
  IntegrityError:
    "A table constraint failed — such as a duplicate PRIMARY KEY or UNIQUE value, a missing NOT NULL value, a failed CHECK constraint, or a FOREIGN KEY that doesn't match a parent row.",
  ProgrammingError:
    "SQLite couldn't bind or execute the statement as written. Check statement syntax and semicolon separators.",
  DataError: "A value had the wrong type or range for this SQL operation.",
  InterfaceError: "A parameter or value passed to SQLite wasn't a supported SQL type.",
};

const TS_EXPLANATIONS: Record<string, string> = {
  ...JS_EXPLANATIONS,
  TS2322: "Type mismatch: the value you assigned or returned doesn't match the declared TypeScript type.",
  TS2345: "Argument type mismatch: a function received a value whose type doesn't satisfy its parameter annotation.",
  TS2339: "Property doesn't exist on this type. Check the spelling, interface fields, or narrow a union type first.",
  TS7006: "Implicit `any`: add an explicit type annotation to this parameter under strict TypeScript.",
  TS2304: "Unknown identifier or type name. Check spelling and make sure the type/variable is declared before use.",
  TS18047: "This value could be `null`. Narrow it with an `if (x !== null)` check or nullish coalescing (`??`) first.",
  TS18048: "This value could be `undefined`. Check for `undefined` before reading properties or calling methods.",
  TS2531: "Object is possibly `null`. Narrow the value before accessing properties on it.",
  TS2532: "Object is possibly `undefined`. Narrow the value or use optional chaining (`?.`) first.",
  TS2367: "TypeScript proved this comparison can never be true because the two types don't overlap.",
  TS2741: "A required property is missing from this object literal.",
  TS2353: "An unknown excess property was passed to an object literal matching a known interface/type.",
  TS2540: "Cannot assign to a `readonly` property — create a new object instead of mutating it in place.",
  TS2366: "This function lacks an ending `return` statement for at least one branch.",
  TS2554: "Wrong number of arguments passed to a function.",
  TS2344: "The type argument doesn't satisfy the generic `extends` constraint.",
};

export function explainError(type: string, language: Language = "python"): string {
  const table =
    language === "javascript"
      ? JS_EXPLANATIONS
      : language === "typescript"
        ? TS_EXPLANATIONS
        : language === "sql"
          ? SQL_EXPLANATIONS
          : PYTHON_EXPLANATIONS;
  return table[type] ?? "Read the message above, then look at the line it points to.";
}
