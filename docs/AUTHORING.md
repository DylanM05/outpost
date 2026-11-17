# Writing missions

Each mission is one Markdown file in a region folder: `src/content/act1/` for Kestrel Ridge, `src/content/act2/` for the survey office, `src/content/act3/` for the relay line. Regions are listed in play order in `src/content/regions.ts`, and each opens once the previous region's last mission is done. Run `npm test` after any change: it runs every reference solution and starter through the real Python harness, checks that every predict program prints what its file says, and plays every terminal mission on the relay machine.

A region ends with one mission marked `assessment: true`, in a system of its own. Passing it restores the rest of that region, but not other regions.

## Systems and file names

A **system** is one lamp on the schematic, and each system has two to four missions (repairs). The lamp lights when all of them are done.

File names set the order. The number is the system and the letter is the mission within it: `03a-read-gauges.md`, `03b-trace-the-readings.md`, `03c-convert-the-readings.md`. Consecutive files with the same `system` value form one system, so a system's missions must sit next to each other, and they must share the same `symbol`.

To add a mission to a system, give it the next letter. To add a system, give it a new number. Players' progress is keyed by `id`, so renaming files is safe, but changing an `id` after release isn't.

## Three kinds of mission

- **Code missions** (the default): the player writes a program, Run checks it against the examples, and Submit adds hidden tests.
- **Predict missions** (`kind: predict`): the player reads a program they can't run, types exactly what it prints, and checks the prediction. Use them to practice tracing code: variables changing, which branch runs, scope, loop order. Aim for programs where the obvious guess is wrong in one specific, teachable way.
- **Terminal missions** (`kind: terminal`): the player works in the relay terminal, a real Linux shell, and Check and Submit look at what they've done to the machine. See [Terminal missions](#terminal-missions).

## Code mission format

```markdown
---
id: restore-power            # unique, used in save data, so don't change it after release
title: Restore power
system: Battery bank         # the lamp on the schematic
symbol: equipment            # equipment | instrument | controller (lamp shape)
scene: tests                 # console | tests | drone | work | sort | calls | grid
skills: functions            # comma-separated ids from src/content/skills.ts
assessment: true             # optional; only for an act's final independent mission
---

## Briefing          story and why it matters (Markdown)
## Objective         exactly what to build, with an example
## Concept           the lesson; open by default at Guided support
## Hints             a numbered list, one hint per line, gentlest first
## Starter           code for every support level, or use the three below
## Starter: guided
## Starter: standard
## Starter: challenge
## Checks            Python run by Run and Submit
## Hidden checks     Python run by Submit only (optional)
## Solution          reference solution; must pass every check
## Restored          what happens in the world once it's fixed
```

Code sections hold one fenced code block. A `## ` heading can't appear inside a code block, because the parser splits sections on those headings.

If a support level's starter is missing, Standard falls back to Guided, and Challenge falls back to an empty file.

## Predict mission format

```markdown
---
id: trace-the-readings
kind: predict
title: Trace the readings
system: Gauges
symbol: instrument
scene: console
skills: variables, reading-code
---

## Briefing
## Objective
## Concept
## Hints
## Program          the code the player reads (one fenced block)
## Output           exactly what it prints; the tests confirm this
## Restored
```

Predictions are compared line by line. Trailing spaces and trailing blank lines are ignored. Capitals, spaces within a line, and blank lines in the middle all count. A wrong prediction shows which lines match, but never the real output: the hints carry the player from there.

## Check helpers

Checks run after the learner's program, with these names available:

| Name | What it is |
|---|---|
| `output` | Everything the program printed, as one string |
| `source` | The learner's code, as one string |
| `uses(*names)` | Whether the learner's code mentions any of these names, ignoring comments and strings. `uses("sorted", "sort")` catches `sorted()` and `.sort()` |
| `lines` | The printed output split into lines, with trailing spaces removed |
| `namespace` | The program's global variables |
| `get(name)` | A function or variable from the program; explains clearly if it isn't defined |
| `expect(label, fn, expected, hint="", **extra)` | Calls `fn`, compares the result with `expected`, and records a test. Types must match, though `24` equals `24.0`. Extra keyword arguments go to telemetry (the drone scene uses `moves=`) |
| `check(label, fn, hint="")` | Records a test that passes if `fn()` is truthy |
| `safe(fn)` | Calls `fn` and returns an object with `.value` and `.error` |
| `emit(kind, **data)` | Sends custom telemetry to the interface |

Any exception inside a test, including from the learner's code, fails that test with a message that points to the learner's line number. When a function returns `None` where a value was expected, `expect` suggests checking for `print` instead of `return`.

Inside a loop, pass the loop variables through the lambda's call rather than relying on late binding. This is fine because `expect` calls the lambda immediately:

```python
for battery, mode in [(95, "full"), (45, "saver")]:
    expect(f"power_mode({battery})", lambda: get("power_mode")(battery), mode)
```

### Work budgets

For algorithms, a right answer isn't enough: it has to come from a reasonable amount of work. Wrap the input in `tracked(...)`, a list that counts how many items code reads from it, and check with `expect_within`:

```python
archive = tracked(list(range(0, 3_000_000, 3)))
expect_within(
    "find_marker(1,000,000 codes, 1500000)",
    lambda: get("find_marker")(archive, 1_500_000),
    500_000,      # the expected answer
    archive,      # the tracked list to count
    40,           # the most reads allowed
    "Halve the range on every step instead of checking codes one by one.",
)
```

A read by index counts one, a slice counts every item it copies, and anything that iterates (`for`, `in`, `sum`, `sorted`, `.index`) counts each item it visits. Strings in a tracked list also count each letter that's iterated over, so `sorted(label)` on a five-letter label costs five reads. A right answer over budget fails with "Right answer, but it read 500,001 items." Use `scene: work` to show each budget test on the work meter.

Build the expected answer from a plain list before wrapping it, or computing the answer in the check will count reads too. Keep slow solutions under the 5-second limit, so they fail on the budget with a clear message instead of timing out: a million reads takes about a second in the browser.

### Grids

`tracked_grid(rows)` makes a grid from a list of strings, one per row, that counts every cell read (by index, or by looping over a row) and remembers the order cells were first read. Reading a whole row, `grid[r]`, is free. Check with `expect_grid(label, fn, expected, grid, budget=None, hint="", accept=None)`, which works like `expect`, fails a right answer that reads more than `budget` cells, and sends the grid, the read order, and the result to the grid scene. With `scene: grid`, each visible test's map replays, cells lighting up in the order the code read them, with any route the code returned drawn on top. `#` draws as a crevasse, `~` as thin ice, and letters and digits are labelled. Maps up to 2,500 cells are drawn.

Keep the big map in a visible test when the lesson is about it, as Measure the ice does: a recursive flood fill passes the small maps and fails the 50 by 50 one on Run, which is the point.

### When more than one answer is right, within a budget

Pass `accept=` to `expect` or `expect_within`: a function that takes the learner's result and returns whether it's right. `expected` then becomes a short description of a right answer, for the failure message: "Got (-1, -1), which isn't two different crates adding up to 75."

```python
expect_within("lift_pair(2,000 crates, 500007)", lambda: get("lift_pair")(aisle, 500007),
              "two different crates adding up to 500007", aisle, 6000, hint, accept=fits(big, 500007))
```

### Counting comparisons

Reads can't follow work done on copies: once code slices a tracked list, the slices are plain lists. Sorts and merges copy constantly, so measure them in comparisons instead. `compared(values)` returns a list of whole numbers that count every `<`, `<=`, `>`, and `>=` they take part in, however they're copied or moved. Check with `expect_comparisons(label, fn, expected, size, budget, hint="")`, which works like `expect_within` and shows on the work meter in comparisons.

```python
archive = compared(plain)
expect_comparisons("merge_sort(1,200 readings)", lambda: get("merge_sort")(archive), sorted(plain), 1200, 30000, "Split the list in half.")
```

Equality isn't counted, so `==` in checks costs nothing. Anything computed from `compared` values before the check, such as `sorted(archive)` as the expected answer, is counted and then reset when the check starts.

### Sorting in place

For sorts that change the list they're given, use `expect_sorted(label, fn, data, expected, budget=None, hint="")`. It passes when `data`, a tracked list, ends up equal to `expected`, within `budget` reads if one is given. A function that returns a sorted copy instead gets told that this sort has to change the list itself.

`tracked(items, record=True)` also records a frame after every write that leaves the list holding its original items in a new order: one frame per swap, or per item dropped into place by insertion sort, skipping the halfway states. With `scene: sort`, the first recorded test is replayed as sorting bars, and any tests with a budget appear on the work meter. Record only small lists (10 to 20 items); frames stop after 300.

When a mission is about writing a sort by hand, check `not uses("sorted", "sort")` and say why in the hint.

### Recursion

`expect_recursive(label, name, args, expected, hint="", recurse=True)` calls the learner's function `name(*args)` and compares the result, like `expect`. While it runs, every call the function makes to itself is recorded: its depth, arguments, and result. With `scene: calls`, the visible tests show as a call tree beside the board. With `recurse=True`, a right answer from a function that never called itself fails, so pass `recurse=False` for base-case inputs such as an empty list.

The recorder is a plain function rather than a class with `__call__`, which matters in the browser. Python runs calls between plain functions without growing the browser's stack, so runaway recursion ends in a RecursionError. Recursion through a class's `__call__` grows the stack and can crash the interpreter before Python's limit of 1,000 calls. If learner code does that anyway, the runner replaces the worker and reports a RecursionError. Keep the recursion depth in tests well under 1,000; each recorded call adds a frame.

### When more than one answer is right

Compare properties instead of exact values. `07b-bring-it-home.md` defines a small helper in its checks that flies the player's route, then checks that it lands on the pad and is as short as possible. Helpers defined in `## Checks` are also available in `## Hidden checks`. Use `emit("reading", ...)` to send the result to the telemetry panel, and `check(...)` to record the test.

## Terminal missions

The relay terminal is a small Alpine Linux machine emulated in the page (see `vm/`). The player is the user `ranger`, with the home folder `/home/ranger` and the sudo password `outpost`. Each time a terminal mission opens, the machine goes back to a clean saved state, the mission's setup runs, and a fresh login shell starts. Or, if the player has been here before, their saved home folder and `/srv` come back instead of the setup.

```markdown
---
id: grep-the-faults
kind: terminal
title: Grep for the faults
system: Log store
symbol: instrument
scene: files                 # files: a live map of the home folder; repo: a Git repository's history; console: no panel
skills: reading-files
---

## Briefing
## Objective
## Concept
## Hints
## Root setup        bash, run as root first (optional): users, files in /srv
## Setup             bash, run as the player in ~ (optional), with set -e
## Report            a question, then a fenced text block with the answer (optional)
## Checks            Python, run in the machine as root
## Hidden checks     Python, run by Submit only (optional)
## Solution          the commands that solve it, one per line, typed into the shell
## Restored
```

With a `## Report`, the bench shows an answer box under the terminal, and `answer()` returns what's in it. Use it for missions about finding something out, like the line `grep` matched or the code in a hidden file.

`scene: repo` draws a Git repository beside the terminal, refreshed after every command: its commits as a graph across every branch, branch and remote-tracking labels, HEAD, and the staged, changed, and untracked files. It shows the repository the terminal is in, or, while the terminal isn't in one, the one named by `repo: ~/tools` in the front matter. Use `scene: console` instead for a report whose answer the panel would show before the player has done anything, such as a commit's hash or the branch HEAD is on. When the answer only appears once they've run the command the mission teaches, as in Fetch from the valley, keep the panel: watching it change is part of the lesson.

### Checks run in the machine

Checks are Python, run by the check agent as root, so they can read anything. These helpers come with them (`src/relay/checks.ts`):

| Helper | Gives |
|---|---|
| `run(command, cwd="~", input=None)` | Runs bash as the player. Returns `.out`, `.err`, and `.code`. `root=True` runs as root. |
| `sh(command)` | What a command prints, without its final newline |
| `read(path)`, `exists(path)`, `is_file(path)`, `is_dir(path)`, `listing(path)` | Files, with `~` and relative paths from home. `read` and `listing` give `None` when there's nothing there. |
| `mode(path)`, `owner(path)` | Permissions as `ls -l` shows them (`"rw-r--r--"`), and the owner's name; `None` when there's nothing there |
| `cwd()` | The terminal's directory, written with `~` |
| `history()`, `commands()`, `ran(program)`, `calls(program)`, `assigned(name)` | What the player typed: lines, programs, whether one ran, each run's arguments, a shell variable's values |
| `answer()` | The report box, trimmed, without quotes or backticks around it |
| `check(label, passed, hint)`, `expect(label, got, expected, hint, accept=None, reveal=True)` | Record a check. `got` and `passed` may be functions, and an exception becomes a failed check. `reveal=False` keeps the expected answer out of the failure message. |

For Git, these read a repository as the player, and give `None` or an empty list when there isn't one. The repository is a folder, `~/tools`, or a bare one, `/srv/archive/tools.git`:

| Helper | Gives |
|---|---|
| `git(args, repo="~")` | What a git command prints |
| `is_repo(path)` | Whether `path` is the top folder of a repository |
| `rev(repo, ref="HEAD")` | The full hash a branch, hash, or `HEAD~1` names |
| `commits(repo, ref="HEAD")` | The commits reachable from `ref`, newest first: dicts with `hash`, `parents`, `author`, `committer`, `message` (its first line) |
| `latest(repo, ref="HEAD")` | The newest of those, or one whose fields are empty when there are no commits, so `latest(repo)["message"]` is safe |
| `branch(repo)`, `branches(repo, remote=False)` | The branch HEAD is on (`None` when detached), and every local or remote-tracking branch |
| `tracked(repo, ref="HEAD")`, `show(repo, ref, path)` | The files in a commit, and one file as a commit has it (`ref=""` for the staging area) |
| `status(repo)`, `staged(repo)`, `changed(repo)`, `untracked(repo)` | `git status --short` lines, and the files in each state |
| `config(key, repo="~", scope=None, all=False)` | A setting as Git sees it from `repo`, or only from `scope` (`"global"`, `"local"`, `"system"`); every value with `all=True` |
| `git_calls(subcommand)` | The arguments of each `git <subcommand>` the player ran, skipping git's own options like `--no-pager` |

Prefer checking the machine over checking history: whether the file is in the right place, whether the program prints the right thing. History tells you *how*, and is right for missions about a command itself (`echo`, `cd`, `history`), but players reach the same state in many ways.

Setup scripts can use a few shell functions:

| Function | Does |
|---|---|
| `player_git` | Makes the Git settings from Sign your work: `user.name` Ranger, `user.email` ranger@kestrel.ridge, `init.defaultBranch` main. It also sets `pull.rebase` to `false`, which When a push is refused explains, so a pull between branches that have both moved on merges instead of stopping with an error. Player setup only: as root, it would leave a `.gitconfig` that root owns. |
| `commit_as "Mara Okafor" "2026-11-03 09:12" "Lower the beacon power"` | Commits what's staged as that person, at that time (UTC) |
| `as_crew "Ines Varga" "2026-11-04 10:00" git merge -q --no-edit retune` | Runs any Git command as that person, at that time. Set `COMMITTER` to record someone else as the committer. |

Commits made with them have the same hashes for every player, so a check or report can name one. Build the history once, read the hashes, and write them in. To give the player a remote, make `/srv/archive` theirs in the root setup and put bare repositories there in the player setup; `/srv` is saved with their files.

Hardcode expected answers instead of computing them from files the player can change. A player who empties a log shouldn't make "0" the right answer. Where the check has to run the player's program on other input, write that input to `/tmp`.

### Solutions are typed

The tests reset the machine, run the setup, type each solution line into the real shell and wait for the next prompt, then require every check to pass. Before the solution, at least one check must fail. A heredoc (`cat > file <<'EOF'` ... `EOF`) is typed as one command. Players edit in `nano` and read in `less`, but the tests can't, so a solution uses an unattended equivalent with a comment saying so: `sed -i` or `printf` for an edit, `less file | grep ...` for reading (`less` prints the file when its output isn't a terminal), and `echo outpost | sudo -S -p "" ...` for `sudo`. Git opens `less` and `nano` too: use `git --no-pager log`, `git commit -m`, and `--no-edit` for merges and pulls.

`npm run vm` rebuilds the machine after changes to `vm/` or the relay stages of the `Dockerfile`. The tests skip terminal missions until it has been built.

## Guidelines

- **Test the boundaries in hidden checks.** Equal-to cases, empty lists, single items, and inputs that catch a `return` inside a loop.
- **Make each starter fail.** The content tests enforce this, so a starter can't accidentally solve the mission.
- **Teach one new idea per mission**, and reuse earlier ones. An assessment can introduce a small tool (as `split()` does) if the Concept section explains it.
- **Write the Restored text as a consequence in the world**, not as praise.
- **Content is trusted.** Mission Markdown is rendered as HTML without sanitizing, which is fine for files shipped with the game. Community-written missions would need sanitizing first.

## Maintenance calls

Write review tasks in `src/content/maintenance/`, using the same Markdown sections and checks as code missions. Add two front-matter fields:

```yaml
reviewSkill: functions
prerequisite: restore-power
```

`reviewSkill` must be a known skill and appear in `skills`. Give each pool at least three genuinely different tasks with the same prerequisite. File ordering sets the rotation within each pool. Keep ordering stable once released: saves store the round number and active mission ID. This first release tags only the primary assessed skill to avoid awarding evidence for incidental concepts.

Maintenance does not add campaign lamps, unlock the next campaign repair, or get auto-completed by the capstone. Use the existing campaign system name for context. Do not set `assessment: true`.

Creation tasks use an empty fenced `## Starter`; debugging and modification tasks can provide the existing faulty or outdated program. Do not include scaffolding that gives away the intended solution. Requirements must be complete enough to solve without a lesson; hidden checks must only test stated requirements. Give supportive progressive hints. The required Concept section is not displayed during maintenance.

The scheduler handles dates, repeated attempts, and rotating variants. All review reference solutions and all starters run through the same Python content tests as campaign missions. Scheduler and rendering tests cover saves and the review interface. See [LEARNING.md](LEARNING.md) for exact evidence rules, current coverage, and limits.
