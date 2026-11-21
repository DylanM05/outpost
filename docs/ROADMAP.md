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

- **The workshop follows Learn OOP's order**: clean code, classes, encapsulation, abstraction, inheritance, and polymorphism (47 lessons in six chapters), in 27 editor missions across nine systems, including the gaps Act I left: default and keyword arguments, `raise`, and objects as references. Learn OOP stays in the browser, and so do these chapters. Modules, packages, and pytest aren't in Learn OOP; Boot.dev meets them in its guided projects on the learner's own machine. Here they're three systems on the relay terminal, ending with an independent mission that extends fleet control and its tests.

- **The deep survey follows Learn Functional Programming's practical tools and Learn Data Structures & Algorithms (parts I & II)**: first-class functions, `lambda`, comprehensions, pure functions, closures, and memoization decorators; then stacks, queues, linked lists, in-place quicksort with middle-pivot partitioning, binary search trees (insert, search, range queries, delete), prefix tries, binary min-heaps and `heapq`, adjacency-list graphs and DFS, Dijkstra's weighted shortest paths (including a guided fuel-aware grid planner), top-down and bottom-up dynamic programming, and P vs NP / TSP heuristics — 34 missions across eleven systems in the browser, ending with an independent optimization mission.

- **The exchange follows Learn HTTP Clients, Learn SQL, and Learn HTTP Servers**: JSON parsing and validation, URL dissection, HTTP headers/status codes/pagination/retries; real in-browser SQLite 3 tables, constraints, parameterized CRUD (with SQL injection contrast), `GROUP BY`/`HAVING`, subqueries, normalization and foreign keys, `INNER`/`LEFT` joins, indexes (`EXPLAIN QUERY PLAN`), and atomic transactions; HTTP routing, JSON validation, salted HMAC-SHA256 password hashing, HMAC-signed Bearer tokens, `401` vs `403` authorization, signed idempotent webhooks, and `ETag`/`304` caching — 31 missions across eleven systems, with a guided Supply Exchange API and an independent settlement-bridge finale.

- **The grid follows Learn Docker, Learn CI/CD, and Learn Web Security**: 12-factor config validation and recursive secret redaction, Dockerfile layer-cache and security auditing, Compose topology and cycle validation, structured JSON logging and RED metrics (`5xx` rate, `p50`/`p95`), OWASP defenses (path traversal, XSS escaping, security headers, strict CORS, sliding-window rate limiting), Kahn's topological CI pipeline runner, transactional SQLite schema migrations, SHA-256 verified backups and daily/weekly retention, `/healthz` vs `/readyz` probes, a guided production gateway wrapper, and an independent incident-response finale — 20 missions across eight systems.

These notes cover structure and pacing only. Outpost's lessons and missions are its own.

## The acts

Each act is a region of the world, with a guided build in the middle and an independent mission at the end.

| Act | Region | Teaches | Guided build | Independent mission |
|---|---|---|---|---|
| I | Kestrel Ridge | Python fundamentals: output, errors, variables, types, functions, scope, decisions, loops, lists, strings, dictionaries, sets, debugging, exceptions | (folded into missions) | Restart the outpost *(built: 39 missions)* |
| II | The survey office | Algorithms I: complexity, searching, sorting, recursion, hashing, grid search | Route planner for the drone survey | Plan the survey within a work budget *(built: 29 missions)* |
| III | The relay line | The command line, files and folders, reading and searching files, running Python from the shell, input and output, permissions | `logscan`, a command-line tool that summarizes logs from files or pipes | Bring the line online *(built: 43 missions)* |
| IV | The archive | Git: repositories, commits, history, branches, merging, rebasing, undoing, remotes, ignoring files | Version `logscan` and ship a change through the archive | Recover the archive from a repository's history *(built: 44 missions)* |
| V | The workshop | Clean code, classes, encapsulation, abstraction, inheritance, polymorphism, special methods, modules, testing with pytest | Fleet control for the drones | Extend fleet control and its tests *(built: 35 missions)* |
| VI | The deep survey | Functional tools, stacks, queues, linked lists, quicksort, BSTs, tries, heaps, graphs/DFS, Dijkstra's shortest paths, dynamic programming, P vs NP | Fuel-aware route planner | Make a slow planner fast enough without changing its answers *(built: 34 missions)* |
| VII | The exchange | HTTP, JSON, SQL, building an API, authentication, webhooks | Supply exchange API with a database | Connect two settlements' services *(built: 31 missions)* |
| VIII | The grid | Deployment, containers, configuration, logs, CI, security basics, backups | Deploy and monitor the exchange | Diagnose and fix a production outage *(built: 20 missions)* |
| IX | Your own outpost | Planning, scoping, documentation, using AI tools responsibly | — | A capstone you design and build, followed by a change request |

The algorithms regions are planned in detail in [ALGORITHMS.md](ALGORITHMS.md). Algorithms I comes second because it builds directly on Act I and runs in the browser on the existing engine. Boot.dev moves learners to a local setup straight after Python, so swapping Acts II and III is the alternative if getting off the browser early matters more.

From Act III on, missions need a real environment, not an imitation of one. The relay terminal provides it in the browser: v86 emulates a 32-bit PC running Alpine Linux with bash, coreutils, nano, man pages, Python, and Git, and a check agent on the machine's second serial port sets up and checks each mission. Nothing has to be installed, every player gets the same machine, and a mistake can always be undone with Start over. Git (Act IV) runs on the same machine, with remotes as folders on it.

Learners still need to work on their own computers eventually. A later chapter can take them there: install Python and Git, configure a shell, and do one job locally. That's where a small `outpost` command-line tool, which runs a mission's checks on the player's machine and reports back, would come in.

## Learning loop now implemented

Act I has 39 campaign missions, Act II 29, Act III 43, Act IV 44, Act V 35, Act VI 34, Act VII 31, and Act VIII 20, plus 21 maintenance calls: three variants each for functions, decisions, loops, lists, dictionaries, recursion, and hashing. Calls are scheduled after gaps, rotate tasks, and add retention evidence without blocking campaign progress.

Support adapts per skill: onboarding sets the starting level, a clean solve gives the next mission for that skill less scaffolding, and a struggle gives it more. Stuck players are offered a more complete starting point. Existing saves remain compatible. See [LEARNING.md](LEARNING.md) for the exact rules and their limitations.

## Next steps

1. **Playtest the learning loop** with three to five beginners, including an unfamiliar problem about a week later. Use the result to revise the content, the schedule, and the support thresholds.
2. **Build your own outpost (Act IX)**: the capstone act — planning, scoping, architecture/documentation, responsible use of AI/code review tools, building an end-to-end capstone service from a specification, and handling a follow-up change request.
3. **Finish the maintenance pools.** Lists, recursion, and hashing have them. Searching, sorting, and grid search don't yet, and neither does any skill from the relay line on: terminal missions can be maintenance calls, but none are written.
4. **Add deliberate modification missions** between reading code and creating programs. Two maintenance variants already ask players to change existing code.
5. **Measure confidence against performance** through optional pre-submit confidence judgments.
6. **Extend maintenance coverage** to the remaining skills, with varied tasks that assess transfer instead of answer recall.
7. **Add placement through demonstrated work.**
8. **Make `pytest` faster for players.** Starting pytest on the emulated machine takes about 4 seconds on an idle computer, about twice that the first time in each mission (probably because the emulator's compiled code starts empty after every restore; warming pytest into the saved state didn't help), and 15 seconds or more when the computer is busy. Nearly all of it is importing pytest. Checks already avoid it by forking the check agent, which has pytest loaded. The player's own `pytest` command could do the same: a small `pytest` in `/usr/local/bin` that hands its arguments, folder, environment, and terminal to the agent over a Unix socket, so a forked, already-loaded pytest runs in the player's terminal as the player. Ctrl+C then has to reach the forked process too.
9. **Extend the archive with Learn Git 2's topics**: merge and rebase conflicts, stash, revert, reflog, cherry-pick, bisect, and tags. Conflicts matter most; the others can follow.
10. **Before a public release:** accessibility review (including xterm.js's screen reader mode for the terminal), content versioning, a contributor guide, and optional accounts/server-side progress for shared hosting. The relay machine redistributes Alpine Linux packages, most of them GPL-licensed, so a public release needs a written source offer or links to the exact package sources, alongside v86's BSD and SeaBIOS's LGPL notices.
