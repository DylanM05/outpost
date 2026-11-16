# Algorithms

**Goal:** a player who finishes the algorithms regions can estimate how a solution's work grows with its input, choose a data structure for the job, implement the standard searches, sorts, and graph traversals, and recognize when a new problem is one of them in disguise.

## Where it fits

Two regions, split by what they need:

- **Algorithms I, the survey office**, directly after Act I. Complexity, searching, sorting, recursion, hashing, and grid search. It uses only functions, lists, and dictionaries, and runs in the browser on the existing engine, so it can be built before the local runner the tools act needs.
- **Algorithms II, the deep survey**, after the workshop act teaches classes. Linked lists, stacks and queues, trees, heaps, weighted shortest paths, dynamic programming, and problems with no known fast solution.

Boot.dev puts its data structures and algorithms course after object-oriented and functional programming. Splitting it lets players start thinking algorithmically while Act I is fresh, and holds back the data structures that need classes.

**Recommended order:** Algorithms I as Act II, then the relay line (local tools and Git). Boot.dev moves learners to a local setup straight after Python, so this delays that by one region. In exchange, it builds directly on Act I and needs no new infrastructure.

## Algorithms I: the survey office

The survey office maps the ridge for the drones and the supply runs. Its archive is enormous, its samples are unsorted, and its route planner was lost with the last engineer.

Each system follows Act I's pattern: a predict mission to trace the idea, then missions that modify and build, with hidden tests at sizes where a slow approach fails.

| System | Teaches | Missions |
|---|---|---|
| Survey desk | Counting work, growth rates, Big-O names | Predict how many times nested loops run. Count steps as the input doubles. Find the loop that makes a report quadratic. |
| Map archive | Linear and binary search | Find a marker, counting the looks. Binary search sorted elevations within a look budget. Find the first marker above a height (boundary search). |
| Sample sorter | Simple sorts, `sorted()` with `key=` | Selection sort, counting swaps. Insertion sort on nearly sorted samples. Sort crates by weight, then by label. |
| Cave survey | Recursion | Predict a recursive call trace. Total the depth of nested chambers. Flatten a nested manifest. Fix a missing base case. |
| Merge yard | Divide and conquer | Merge two sorted lists. Merge sort. Compare its work with insertion sort at 10,000 items. |
| Index vault | Hashing for speed | Find duplicates with a set instead of nested loops. Find two crates that exactly fill the lift. Group labels that are anagrams. |
| Ridge map | Grids and flood fill | Neighbors with bounds checks. Flood-fill a thin-ice region. Count separate ice sheets. |
| Drone routes | Breadth-first search | Trace the search ring by ring. Shortest route length. Rebuild the route. |
| Survey core | Independent mission | Plan the survey: visit markers in order on the shortest route, within a work budget. |

New skills: complexity, searching, sorting, recursion, hashing, and grid search. Recursion and hashing have maintenance pools so far.

## Status

**Built:** the whole region, with its own tab and board: nine systems and twenty-nine missions.

- **Survey desk:** count the checks (predict), fix the slow report, biggest climb.
- **Map archive:** halve the search (predict), search the archive, find the snow line.
- **Sample sorter**, following Boot.dev's sorting chapter (bubble sort first, then insertion sort): one pass (predict a bubble pass and the swap idiom), sort the samples (bubble sort that stops after a pass with no swaps, checked on 1,500 sorted samples), stragglers (insertion sort on nearly sorted samples, where bubble sort reads 50 times the budget), and loading order (`sorted()` with a key function returning a tuple, and negating a number to reverse one part of the order).
- **Cave survey** (recursion): down and back (predict a descent and its return, and a recursive return value), rope total (first plus the rest, with no loops allowed), fix the relay (a base case that odd numbers skip past, debugged from the call tree), and count the crystals (nested lists of any depth, where loops alone can't do the job).
- **Merge yard** (divide and conquer): zip the logs (predict a merge with two positions, and list concatenation), merge the logs (merge two sorted lists in at most one comparison per item), merge sort (with the call tree showing the splits, and a comparison budget that insertion sort misses 12 times over), and merge every station (merge hundreds of sorted logs in pairs, the same shape as merge sort, instead of onto a growing pile).

- **Index vault** (hashing): file by number (predict a five-drawer hash table, with a collision), spot the duplicate (a set replaces the pair loop), fill the lift (two-sum with a dictionary of positions, the solar array's lift problem at 2,000 crates), and scrambled labels (group anagrams under a tuple key, and why a list can't be a key).

- **Ridge map** (grids and flood fill): look around (predict neighbors with bounds checks and `for dr, dc in STEPS`), measure the ice (flood fill with a found set and a list to explore; the recursive version fails on a 50 by 50 map), and count the sheets (connected components with one shared found set).
- **Drone routes** (breadth-first search): ripples (predict a breadth-first search with `deque`, ring by ring), route length (the flood fill with `pop()` gives wrong distances; `popleft()` fixes it), and trace the route (rebuild the path with `came_from`).
- **Survey core**, the independent mission: plan the survey. Find the pad and numbered markers on an unseen map, then chain shortest-route searches between them, within a work budget.

Quicksort, which Boot.dev also covers, is left for Algorithms II alongside partitioning and randomness.

Kestrel Ridge was expanded first so the survey office doesn't introduce Python along with the algorithms: looping by position, `range(a, b)`, `break` and `continue`, changing a list in place, comparing neighbors, slicing, nested loops, grids, and the pair loop are all taught before the region opens.

**Engine work done:**

- **Work counted, not timed.** Browser timing is noisy, but counts are exact and easy to explain. `tracked(...)` lists count every read, and `expect_within` fails a right answer that reads too much: "Right answer, but it read 500,001 items. The budget for 1,000,000 items is 40." See [AUTHORING.md](AUTHORING.md#work-budgets).
- **A work meter** in the side panel shows reads against the budget for each test.
- **Sorting bars** replay each swap or insertion of the first test rack, with a slider to step through it. Reads stand in for comparisons, since every comparison reads two items.
- **Comparison counting** for sorts and merges, which copy lists in ways read counts can't follow.
- **A call tree** for recursion missions: every call, indented under its caller, with its result, so the base case and the unwinding are visible.
- **A check that a sort is written by hand**, by looking for `sorted` and `sort` in the learner's code, outside comments and strings.
- **Large hidden inputs** sized so slow solutions fail on the budget, not the 5-second limit.

- **A grid scene** for the ridge map and drone routes: the map, cells lighting up in the order the code read them, and the route drawn on top.

**Still to build:**

- **Maintenance pools** for searching, sorting, and grid search. Lists by position, recursion, and hashing have theirs.
- **Growth checks** that run a solution at n, 2n, and 4n and report the ratio: "doubling the input quadrupled the work, which is quadratic growth." Budgets cover this for now.

## Algorithms II: the deep survey (sketch)

Linked lists and stacks (undo history for the terminal), queues (drone dispatch), binary search trees (an elevation index), heaps (repairs by priority), Dijkstra's algorithm (fuel-weighted routes), dynamic programming (the cheapest supply plan, then memoization), and the traveling-salesman problem as an introduction to problems where nobody knows a fast exact answer, and where good-enough heuristics come in.

Independent mission: an existing route planner times out on the full map. Make it fast enough without changing its answers.
