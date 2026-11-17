# Roadmap

**Goal:** a player who finishes Outpost can take an unfamiliar problem, build a working solution, test it, deploy it, and explain their decisions, with documentation available but no step-by-step tutorial.

## What Boot.dev's progression suggests

Boot.dev's Backend path is 17 courses and 8 projects, about 540 hours in their catalog, and they say most beginners take about a year. Patterns worth borrowing:

- **Functions come early**, before conditionals, loops, and data structures. Act I follows this.
- **Debugging starts in the second lesson.** Unit tests arrive in the fifth chapter, with Run checking some tests and Submit checking all of them.
- **Learners leave the browser after the first course.** Linux, a local setup, and the first guided command-line project come straight after Python. Learn Linux is 66 lessons in seven chapters. The first four run in a terminal in the browser, and the rest on your own machine. Learn Git, 64 lessons in eleven chapters, runs on your own machine from the start.
- **There's a guided project after every one or two courses**, then personal projects and a capstone that learners build themselves.
- **Lessons are small.** Their Python course has 167 lessons across 15 chapters, which is far more practice per concept than Act I has today.

- **Loops and lists get the most room.** Boot.dev spends 38 lessons on them (14 on loops, 24 on lists), introducing `range` first, then indexing and length, updating by position, neighbors ("Find the Increase"), and slicing. Kestrel Ridge gives them five systems and 17 missions in the same order, then adds nested loops and grids, which the survey office relies on.

- **The relay line follows Learn Linux's order**: the command line, filesystems, programs, input and output, the local command line, and permissions. It runs all of it in the browser on a real, emulated Linux machine, in 43 missions across thirteen systems. Running Python from the shell is folded in where it fits, and the region builds a command-line tool in place of Boot.dev's BookBot.

- **The archive follows Learn Git's order**: setup, repositories, internals, config, branching, merge, rebase, reset, remotes, GitHub, and `.gitignore`, in 44 missions across thirteen systems, on the same emulated machine. Remotes are bare repositories in `/srv/archive`, so Learn Git's GitHub chapter becomes a shared archive the valley and the ridge both push to: clone, push, pull, a refused push, and pushing a branch for review. Pull requests are described rather than practised. The guided build puts `logscan` under version control and takes a change through a branch to the archive. Learn Git 2's topics (merge and rebase conflicts, stash, revert, reflog, cherry-pick, bisect, tags) aren't covered yet.

These notes cover structure and pacing only. Outpost's lessons and missions are its own.

## The acts

Each act is a region of the world, with a guided build in the middle and an independent mission at the end.

| Act | Region | Teaches | Guided build | Independent mission |
|---|---|---|---|---|
| I | Kestrel Ridge | Python fundamentals: output, errors, variables, types, functions, scope, decisions, loops, lists, strings, dictionaries, sets, debugging, exceptions | (folded into missions) | Restart the outpost *(built: 39 missions)* |
| II | The survey office | Algorithms I: complexity, searching, sorting, recursion, hashing, grid search | Route planner for the drone survey | Plan the survey within a work budget *(built: 29 missions)* |
| III | The relay line | The command line, files and folders, reading and searching files, running Python from the shell, input and output, permissions | `logscan`, a command-line tool that summarizes logs from files or pipes | Bring the line online *(built: 43 missions)* |
| IV | The archive | Git: repositories, commits, history, branches, merging, rebasing, undoing, remotes, ignoring files | Version `logscan` and ship a change through the archive | Recover the archive from a repository's history *(built: 44 missions)* |
| V | The workshop | Classes, modules, testing with pytest, refactoring, reading unfamiliar code | Drone fleet control system | Extend a codebase you didn't write |
| VI | The deep survey | Algorithms II: linked lists, stacks, queues, trees, heaps, weighted shortest paths, dynamic programming | Fuel-aware route planner | Make a slow planner fast enough without changing its answers |
| VII | The exchange | HTTP, JSON, SQL, building an API, authentication | Supply exchange API with a database | Connect two settlements' services |
| VIII | The grid | Deployment, containers, configuration, logs, CI, security basics, backups | Deploy and monitor the exchange | Diagnose and fix a production outage |
| IX | Your own outpost | Planning, scoping, documentation, using AI tools responsibly | — | A capstone you design and build, followed by a change request |

The algorithms regions are planned in detail in [ALGORITHMS.md](ALGORITHMS.md). Algorithms I comes second because it builds directly on Act I and runs in the browser on the existing engine. Boot.dev moves learners to a local setup straight after Python, so swapping Acts II and III is the alternative if getting off the browser early matters more.

From Act III on, missions need a real environment, not an imitation of one. The relay terminal provides it in the browser: v86 emulates a 32-bit PC running Alpine Linux with bash, coreutils, nano, man pages, Python, and Git, and a check agent on the machine's second serial port sets up and checks each mission. Nothing has to be installed, every player gets the same machine, and a mistake can always be undone with Start over. Git (Act IV) runs on the same machine, with remotes as folders on it.

Learners still need to work on their own computers eventually. A later chapter can take them there: install Python and Git, configure a shell, and do one job locally. That's where a small `outpost` command-line tool, which runs a mission's checks on the player's machine and reports back, would come in.

## Learning loop now implemented

Act I has 39 campaign missions, Act II 29, Act III 43, and Act IV 44, plus 21 maintenance calls: three variants each for functions, decisions, loops, lists, dictionaries, recursion, and hashing. Calls are scheduled after gaps, rotate tasks, and add retention evidence without blocking campaign progress.

Support adapts per skill: onboarding sets the starting level, a clean solve gives the next mission for that skill less scaffolding, and a struggle gives it more. Stuck players are offered a more complete starting point. Existing saves remain compatible. See [LEARNING.md](LEARNING.md) for the exact rules and their limitations.

## Next steps

1. **Playtest the learning loop** with three to five beginners, including an unfamiliar problem about a week later. Use the result to revise the content, the schedule, and the support thresholds.
2. **Build the workshop (Act V)**: classes, modules, testing with pytest, and reading unfamiliar code. Boot.dev follows Learn Git with a guided project and then object-oriented programming. Git from Act IV can carry on there: projects in the workshop can live in repositories on the relay machine.
3. **Finish the maintenance pools.** Lists, recursion, and hashing have them. Searching, sorting, and grid search don't yet, and neither does any relay line or archive skill: terminal missions can be maintenance calls, but none are written.
4. **Add deliberate modification missions** between reading code and creating programs. Two maintenance variants already ask players to change existing code.
5. **Measure confidence against performance** through optional pre-submit confidence judgments.
6. **Extend maintenance coverage** to the remaining skills, with varied tasks that assess transfer instead of answer recall.
7. **Add placement through demonstrated work.**
8. **Extend the archive with Learn Git 2's topics**: merge and rebase conflicts, stash, revert, reflog, cherry-pick, bisect, and tags. Conflicts matter most; the others can follow.
9. **Before a public release:** accessibility review (including xterm.js's screen reader mode for the terminal), content versioning, a contributor guide, and optional accounts/server-side progress for shared hosting. The relay machine redistributes Alpine Linux packages, most of them GPL-licensed, so a public release needs a written source offer or links to the exact package sources, alongside v86's BSD and SeaBIOS's LGPL notices.
