export const SKILLS = {
  output: { name: "Printing output", summary: "Run a program and show text with print()." },
  "reading-code": { name: "Reading code", summary: "Trace a program by hand and predict exactly what it prints." },
  "syntax-errors": { name: "Syntax errors", summary: "Read a SyntaxError and fix the line it points to." },
  variables: { name: "Variables and arithmetic", summary: "Store values, calculate with them, and format them with f-strings." },
  types: { name: "Types and conversion", summary: "Tell numbers and text apart, and convert between them with int(), float(), and str()." },
  functions: { name: "Functions", summary: "Define functions with parameters, return results, and build functions from other functions." },
  conditionals: { name: "Decisions", summary: "Choose between outcomes with if, elif, else, and, or, and not, including boundary cases." },
  loops: { name: "Loops", summary: "Repeat work with for and while, and keep track of state while looping." },
  lists: {
    name: "Lists",
    summary: "Build, search, and filter lists, work through them by position, slice them, and store grids as lists of lists.",
  },
  strings: { name: "Working with text", summary: "Clean, split, and compare strings to pull out the parts you need." },
  dictionaries: { name: "Dictionaries", summary: "Store, update, and loop over values by key." },
  sets: { name: "Sets", summary: "Remove duplicates and compare collections with set operations." },
  debugging: { name: "Debugging", summary: "Find why working-looking code gives wrong answers, and fix the cause." },
  errors: { name: "Handling errors", summary: "Use try and except to keep a program running when an operation fails." },
  complexity: {
    name: "Measuring work",
    summary: "Estimate how a program's work grows with its input, and replace loops that grow faster than they need to.",
  },
  searching: {
    name: "Searching",
    summary: "Find items in sorted data with binary search, reading only a handful of them.",
  },
  recursion: {
    name: "Recursion",
    summary: "Write functions that call themselves on a smaller part of the problem, with a base case that stops them, including on nested data.",
  },
  hashing: {
    name: "Hashing",
    summary: "Use sets and dictionaries as hash tables to replace searches with constant-time lookups, and choose keys that can be hashed.",
  },
  graphs: {
    name: "Grid search",
    summary: "Explore grids with flood fill and breadth-first search, count connected regions, and find and rebuild shortest routes.",
  },
  sorting: {
    name: "Sorting",
    summary: "Write simple sorts, know when each one is fast, and sort real records with sorted() and a key.",
  },
  shell: {
    name: "The command line",
    summary: "Run commands with arguments in a shell, keep values in shell variables, and reuse earlier commands from the history.",
  },
  filesystem: {
    name: "Files and folders",
    summary: "Find your way around the filesystem with pwd, ls, cd, and paths, and create, move, copy, and remove files and folders.",
  },
  "reading-files": {
    name: "Reading and searching files",
    summary: "Read files with cat, head, tail, and less, search inside them with grep, and track them down with find.",
  },
  programs: {
    name: "Running programs",
    summary: "Run Python programs from the terminal, write and edit them with nano, make them executable, and control them with environment variables and PATH.",
  },
  streams: {
    name: "Input and output",
    summary: "Give programs options and arguments, read exit codes, send output and errors to files, and connect programs with pipes, from the shell and from Python.",
  },
  permissions: {
    name: "Permissions",
    summary: "Read who owns a file and who may use it, change permissions with chmod, and act as root with sudo, sparingly.",
  },
  commits: {
    name: "Commits",
    summary: "Turn a folder into a Git repository, see what changed with status and diff, stage and commit changes, and keep files out with .gitignore.",
  },
  "git-history": {
    name: "Reading history",
    summary: "Read a repository's history with log, name commits by their hashes, and look inside commits, trees, and blobs.",
  },
  "git-config": {
    name: "Configuring Git",
    summary: "Read and change Git's settings, and know which settings file wins when they disagree.",
  },
  branches: {
    name: "Branches",
    summary: "Create and switch branches, and bring work back together with merge and rebase.",
  },
  undoing: {
    name: "Undoing changes",
    summary: "Discard, unstage, and uncommit work with restore and reset, knowing what each one throws away.",
  },
  remotes: {
    name: "Remotes",
    summary: "Connect repositories, fetch, pull, and push, and share work through a shared repository.",
  },
} as const;

export type SkillId = keyof typeof SKILLS;

export function isSkillId(value: string): value is SkillId {
  return Object.hasOwn(SKILLS, value);
}
