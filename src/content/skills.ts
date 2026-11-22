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
    summary: "Read a repository's history with log, reflog, and bisect, name commits by their hashes, and look inside commits, trees, and blobs.",
  },
  "git-config": {
    name: "Configuring Git",
    summary: "Read and change Git's settings, and know which settings file wins when they disagree.",
  },
  branches: {
    name: "Branches",
    summary: "Create and switch branches, resolve merge and rebase conflicts, cherry-pick, squash, and work across worktrees.",
  },
  undoing: {
    name: "Undoing changes",
    summary: "Discard, unstage, stash, revert, reset, and recover work via reflog, knowing which operations are safe on shared history.",
  },
  remotes: {
    name: "Remotes",
    summary: "Connect repositories, fetch, pull, push branches and release tags, and share work through a shared repository.",
  },
  classes: {
    name: "Classes",
    summary: "Define classes with constructors and methods, make objects from them, and keep each object's data with it.",
  },
  encapsulation: {
    name: "Encapsulation and abstraction",
    summary: "Keep an object's data behind its methods, refuse bad changes with exceptions, and give a class a simple interface over its details.",
  },
  inheritance: {
    name: "Inheritance",
    summary: "Build child classes that reuse, extend, and override a parent's methods, and know when inheritance fits.",
  },
  polymorphism: {
    name: "Polymorphism",
    summary: "Treat different classes the same way through shared methods, and make objects print, compare, and sort with special methods.",
  },
  modules: {
    name: "Modules",
    summary: "Split a program into files, import from them, and write files that work as both a module and a program.",
  },
  testing: {
    name: "Testing",
    summary: "Write and run tests with pytest, test for errors, and let failing tests point to bugs.",
  },
  functional: {
    name: "Functional tools",
    summary: "Pass functions as values, write lambdas and comprehensions, avoid hidden mutations, and capture state in closures.",
  },
  "linear-structures": {
    name: "Stacks, queues, and linked lists",
    summary: "Build stacks, queues, and linked lists from scratch, and pick the structure whose ends fit the work.",
  },
  trees: {
    name: "Trees and tries",
    summary: "Build and traverse binary search trees and prefix tries for ordered lookups and prefix search.",
  },
  heaps: {
    name: "Heaps and priority queues",
    summary: "Build a binary min-heap and use heapq to pull the highest-priority item in logarithmic time.",
  },
  "shortest-paths": {
    name: "Weighted graphs and shortest paths",
    summary: "Represent networks with adjacency lists, traverse them with DFS, and find lowest-cost routes with Dijkstra's algorithm.",
  },
  "dynamic-programming": {
    name: "Dynamic programming",
    summary: "Eliminate repeated work with memoization and tables, and recognize when exact search becomes intractable.",
  },
  http: {
    name: "HTTP and JSON",
    summary: "Parse and serialize JSON, dissect URLs and query strings, work with HTTP methods, headers, and status codes, and handle pagination and retries.",
  },
  sql: {
    name: "SQL and databases",
    summary: "Design relational tables with constraints, write parameterized CRUD, aggregation, and join queries, index lookups, and keep updates atomic with transactions.",
  },
  "api-design": {
    name: "Building APIs",
    summary: "Route HTTP requests to handlers, validate JSON bodies, return accurate status codes, connect endpoints to SQLite storage, and verify webhooks.",
  },
  auth: {
    name: "Authentication and authorization",
    summary: "Hash passwords with salt, issue and verify signed tokens, parse Bearer headers, and enforce ownership and role rules.",
  },
  config: {
    name: "Configuration and secrets",
    summary: "Load and validate configuration from environment variables, fail fast on missing secrets, and scrub sensitive fields from logs.",
  },
  containers: {
    name: "Containers and deployment",
    summary: "Structure Dockerfiles for layer caching and non-root execution, validate service topologies, and expose health and readiness probes.",
  },
  observability: {
    name: "Logs, metrics, and CI",
    summary: "Emit structured JSON logs with request IDs, compute error rates and latency percentiles, and run dependency-ordered CI pipelines.",
  },
  security: {
    name: "Web security basics",
    summary: "Prevent path traversal, XSS, unsafe CORS, and brute-force abuse with strict validation, security headers, and rate limiting.",
  },
  reliability: {
    name: "Backups and incident response",
    summary: "Apply transactional database migrations, verify checksummed backups, and diagnose and repair production outages from telemetry.",
  },
  architecture: {
    name: "Planning, architecture, and pub/sub",
    summary: "Scope features against constraints, design event-driven pub/sub brokers with dead-letter queues, review generated code critically, and evolve live systems without breaking contracts.",
  },
  encoding: {
    name: "Bytes and encoding",
    summary: "Convert between text, raw bytes, binary, hex, and Base64, and combine byte streams with bitwise XOR and Hamming distance.",
  },
  "symmetric-crypto": {
    name: "Symmetric cryptography",
    summary: "Encrypt and decrypt with XOR, stream ciphers, key derivation, PKCS#7 padding, and CBC mode while avoiding nonce reuse and ECB leaks.",
  },
  "asymmetric-crypto": {
    name: "Hashing, key exchange, and AEAD",
    summary: "Use cryptographic hashes, Merkle trees, Diffie-Hellman key exchange, RSA modular math, Encrypt-then-MAC channels, and key rotation.",
  },
  "http-protocol": {
    name: "HTTP/1.1 wire protocol",
    summary: "Frame raw TCP byte streams into lines, parse HTTP/1.1 request lines, headers, Content-Length and chunked bodies, and serialize compliant wire responses.",
  },
  concurrency: {
    name: "Concurrency and coordination",
    summary: "Schedule cooperative tasks, enforce budgets and cancellation, coordinate bounded channels and worker pools, and avoid races and deadlocks with ordered locks.",
  },
  crawling: {
    name: "Web crawling and HTML parsing",
    summary: "Normalize URLs, parse HTML links safely, enforce same-origin and page limits, and crawl graphs concurrently without loops.",
  },
  orchestration: {
    name: "Orchestration and reconciliation",
    summary: "Write declarative control loops, schedule pods onto nodes with resource limits, manage rolling updates and rollbacks, and isolate services and secrets by namespace.",
  },
  "distributed-systems": {
    name: "Distributed systems",
    summary: "Route traffic with consistent hashing, coordinate leader leases with fencing tokens, enforce quorum reads/writes, compare vector clocks, and compact commit logs.",
  },
  "memory-management": {
    name: "Memory and garbage collection",
    summary: "Manage heap memory with bump arenas and coalescing free lists, track reference counts, spot cycles, and reclaim unreachable objects with mark-and-sweep and copying GC.",
  },
  parsing: {
    name: "Lexers, parsers, and ASTs",
    summary: "Tokenize source text, parse operator precedence and blocks into ASTs with recursive descent, and evaluate lexical scopes and closures.",
  },
  "bytecode-vm": {
    name: "Compilers and virtual machines",
    summary: "Fold constants, compile ASTs with jump backpatching into flat stack bytecode, and execute programs on a stack-based virtual machine.",
  },
  "storage-engines": {
    name: "Database storage engines",
    summary: "Build CRC-checked write-ahead logs, transactional crash recovery, Bloom filters, LSM-tree SSTables and compaction, LRU buffer pools, B-Trees, and MVCC snapshot isolation.",
  },
  "search-indexing": {
    name: "Full-text search and ranking",
    summary: "Build inverted and positional indexes for boolean and exact-phrase search, and rank matching documents with BM25.",
  },
  "tokenization-context": {
    name: "Tokenization and context windows",
    summary: "Perform byte-pair encoding merges, split documents into overlapping chunks, and pack prompts within strict token budgets.",
  },
  "vector-rag": {
    name: "Embeddings and RAG retrieval",
    summary: "Compute cosine similarity, search metadata-filtered vector indexes, fuse hybrid rankings with RRF, and audit grounded citations.",
  },
  "agent-loops": {
    name: "Tool-calling agents and guardrails",
    summary: "Validate tool schemas, run step-capped ReAct loops with repeat breakers, enforce permission sandboxes and injection delimiters, and evaluate agent suites.",
  },
  "ip-routing": {
    name: "IP addressing, CIDR, and routing",
    summary: "Convert IPv4 addresses to 32-bit integers, match CIDR subnets, route packets with longest-prefix match, and track stateful NAT mappings.",
  },
  "transport-protocols": {
    name: "DNS and transport protocols",
    summary: "Encode RFC 1035 DNS names, cache records with TTLs, compute Internet checksums, reassemble out-of-order TCP streams, and model AIMD congestion windows.",
  },
  "traffic-engineering": {
    name: "Load balancing and resilience",
    summary: "Shape traffic with token buckets, balance across healthy nodes with smooth weighted round-robin, isolate faults with circuit breakers, and schedule backoff retries.",
  },
  "stream-processing": {
    name: "Event streams and windowing",
    summary: "Aggregate event-time streams with tumbling and session windows, enforce watermarks for late data, and join time-series records with ASOF semantics.",
  },
  "analytical-storage": {
    name: "Columnar storage and sketches",
    summary: "Compress columns with dictionary and run-length encoding, prune row groups with min/max zone maps, and estimate stream frequencies and samples in bounded memory.",
  },
  "data-pipelines": {
    name: "ETL pipelines and anomaly detection",
    summary: "Coerce schemas with dead-letter routing, deduplicate CDC upserts, schedule minimal DAG backfills, and detect rolling Z-score anomalies.",
  },
  "cpu-scheduling": {
    name: "CPU scheduling and deadlock avoidance",
    summary: "Schedule processes with Round-Robin, SRTF, and MLFQ, prevent priority inversion with inheritance, and check safe execution sequences with Banker's algorithm.",
  },
  "virtual-memory": {
    name: "Virtual memory and paging",
    summary: "Translate multi-level virtual addresses with permission checks, evict pages with the Clock algorithm, and isolate forked memory using Copy-on-Write.",
  },
  "os-filesystems": {
    name: "Inode filesystems and allocators",
    summary: "Allocate contiguous extents via disk bitmaps, separate directory links from reference-counted inodes, split and coalesce binary buddy blocks, and resolve symlinks safely.",
  },
  "financial-ledgers": {
    name: "Double-entry ledgers and money math",
    summary: "Eliminate floating-point money drift with integer minor units, split amounts without losing pennies, enforce balanced double-entry journals, and reconcile statements.",
  },
  "event-sourcing": {
    name: "Event sourcing and sagas",
    summary: "Enforce optimistic concurrency on append-only event streams, accelerate replay with snapshots, guard retries with idempotency keys, and roll back failed workflows via compensating sagas.",
  },
  "matching-engines": {
    name: "Order books and settlement",
    summary: "Match bids and asks by strict price-time priority, handle partial fills and cancellations, compute spreads and VWAP, and settle trades atomically.",
  },
  "spatial-geometry": {
    name: "2D geometry and raycasting",
    summary: "Compute vector projections and segment distances, detect AABB/circle collisions, rasterize Bresenham lines, and intersect 2D rays with segments and grids.",
  },
  "spatial-indexing": {
    name: "Spatial hashing and Quadtrees",
    summary: "Partition 2D space with uniform spatial hash grids and recursive Quadtrees for fast broad-phase range and radius queries.",
  },
  "simulation-pathfinding": {
    name: "Fixed-step physics and A* pathfinding",
    summary: "Advance bounded 2D bodies with deterministic fixed timesteps, compute A* heuristic paths around obstacles, and steer agents with collision avoidance.",
  },
  "object-storage": {
    name: "Object storage and signed uploads",
    summary: "Deduplicate content-addressed blobs, assemble multipart uploads, issue and verify time-limited HMAC presigned URLs, and apply lifecycle tiering rules.",
  },
  "http-streaming": {
    name: "Byte-range streaming and media",
    summary: "Parse HTTP Range headers into 206/416 responses, sniff MIME types safely from magic bytes, and generate adaptive HLS playlists.",
  },
  "cdn-caching": {
    name: "CDN edge caching and invalidation",
    summary: "Enforce Cache-Control freshness and s-maxage precedence, invalidate objects by surrogate tags, and coalesce concurrent misses with an origin shield.",
  },
  "cloud-iam-vpc": {
    name: "Cloud IAM and VPC networking",
    summary: "Evaluate explicit-deny-wins IAM policies, enforce stateful VPC security group rules, and carve non-overlapping CIDR subnets.",
  },
  "infra-as-code": {
    name: "Infrastructure as Code and drift",
    summary: "Order declarative resource graphs, compute create/update/replace/destroy plans, detect live drift, and guard state with distributed locks.",
  },
  "cloud-runtime": {
    name: "Autoscaling, queues, and serverless",
    summary: "Scale replica pools with cooldown hysteresis, deliver messages with SQS visibility timeouts and DLQs, and route serverless invocations across warm containers.",
  },
  "tabular-wrangling": {
    name: "Tabular DataFrames and joins",
    summary: "Filter and aggregate structured datasets, perform inner and left hash joins, impute missing data, and reshape tables with pivot and melt.",
  },
  "applied-statistics": {
    name: "Descriptive stats and A/B testing",
    summary: "Compute quantiles, IQR fences, Pearson correlation, two-proportion Z-tests, and bootstrap confidence intervals while spotting Simpson's paradox.",
  },
  "forecasting-cohorts": {
    name: "Regression, forecasting, and cohorts",
    summary: "Fit ordinary least squares regression lines with R-squared, smooth time series with EWMA, and construct retention cohort matrices.",
  },
  websockets: {
    name: "WebSocket handshakes and framing",
    summary: "Compute RFC 6455 Sec-WebSocket-Accept handshakes, encode and unmask binary frames, and route real-time broadcasts across presence rooms.",
  },
  "protobuf-grpc": {
    name: "Protobuf binary encoding and gRPC",
    summary: "Encode LEB128 varints and ZigZag signed integers, serialize tagged Protobuf messages, frame gRPC payloads, and enforce RPC deadlines.",
  },
  "graphql-batching": {
    name: "GraphQL execution and DataLoader",
    summary: "Parse nested GraphQL selection sets, resolve fields with depth limits and partial errors, and eliminate N+1 queries with DataLoader batching.",
  },
  "js-fundamentals": {
    name: "JavaScript fundamentals and arrays",
    summary: "Master JavaScript strict equality, let/const scoping, template literals, destructuring, spread immutability, and map/filter/reduce pipelines.",
  },
  "js-closures-classes": {
    name: "JavaScript closures, classes, and patterns",
    summary: "Build stateful closure factories, ES6 classes with private state, throttling and memoization wrappers, and immutable deep-merge helpers.",
  },
  "js-async": {
    name: "JavaScript event loop and async/await",
    summary: "Trace microtask vs. macrotask scheduling, compose Promises with async/await and retries, and bound async concurrency pools.",
  },
  "js-web-apis": {
    name: "JavaScript HTTP, routing, and middleware",
    summary: "Build URLs with URLSearchParams, wrap fetch with typed error handling, match Express-style route parameters, and compose async middleware chains.",
  },
  "js-validation-auth": {
    name: "JavaScript runtime validation and caching",
    summary: "Compose Zod-style runtime schema validators, encode/verify Base64URL JWT payloads, and cache API responses with LRU TTL eviction.",
  },
  "js-reactive-ui": {
    name: "Reactive stores, signals, and rendering",
    summary: "Build immutable state stores with selectors, reactive computed signals, XSS-safe virtual DOM HTML rendering, and client-side hash routers.",
  },
} as const;

export type SkillId = keyof typeof SKILLS;

export function isSkillId(value: string): value is SkillId {
  return Object.hasOwn(SKILLS, value);
}
