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

export function explainError(type: string, language: Language = "python"): string {
  const table = language === "javascript" ? JS_EXPLANATIONS : PYTHON_EXPLANATIONS;
  return table[type] ?? "Read the message above, then look at the line it points to.";
}
