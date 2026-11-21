# Learning strategy

Outpost should help learners solve unfamiliar problems with documentation available, then explain and maintain their solutions. Completing content and developing that capability are related but different outcomes.

## Evidence and design choices

Retrieval practice and spacing are the basis for maintenance calls. Roediger and Karpicke's experiments found benefits of retrieval for delayed retention of prose material. Cepeda and colleagues found that useful spacing depends on the intended retention interval. These findings motivate the design; neither establishes that Outpost's exact schedule improves programming ability.

Sources:
- Roediger & Karpicke (2006), [Test-Enhanced Learning](https://doi.org/10.1111/j.1467-9280.2006.01693.x).
- Cepeda et al. (2008), [Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention](https://escholarship.org/uc/item/0kp5q19x).

The intervals and thresholds below are product hypotheses to test with learners. Do not describe them as a scientifically optimal algorithm or a mastery guarantee.

## Implemented: maintenance calls

Kestrel Ridge has 39 campaign missions, the survey office 29, the relay line 43, the archive 56, the workshop 35, the deep survey 34, the exchange 31, the grid 20, your own outpost 8, the cipher room 21, the wire room 20, the cluster 16, the engine room 17, the storage vault 15, the signal tower 15, the packet floor 14, and the telemetry lab 13 (426 campaign missions total). One hundred fifty-six maintenance tasks provide three variants each across all 52 browser-code skills spanning Acts I, II, and V–XVII. Terminal skills (Acts III–IV Linux/Git and Act V pytest) can follow once playtesting validates the review cadence. A prerequisite mission unlocks each pool so calls do not require concepts the player has not encountered.

The first call becomes due one day after the prerequisite's first completion. Old saves use their original completion timestamps. Passing the capstone can unlock calls through restored prerequisites, but those automatic restorations do not themselves count as skill evidence.

Calls appear in a separate queue, oldest due first, without naming the target concept in the problem. They use fixed Challenge support, an empty editor for creation tasks, and existing code for debugging/modification tasks. They do not show the teaching lesson. Documentation and Run remain available. Hints are available immediately and never remove earlier achievements.

After completion:
- A pass with no hints and at most two submissions advances the next gap to 3, then 7, then 21 days. Further clean successes keep the gap at 21 days.
- A hinted pass or a pass after three or more submissions resets the next gap to one day and clears the independent baseline for the next retention assessment.
- Each completed call rotates to the next authored task. After three variants, tasks repeat. This limited pool is an explicit constraint, not unlimited novelty.
- Failed or abandoned attempts stay available, with drafts, hints and attempt counts preserved. They are not silently marked complete.
- Dates are measured from actual completion. Returning late does not create a backlog of missed repetitions.
- The global support choice does not change review difficulty; a player can request hints or return to teaching missions instead.

Run is formative feedback and is not counted as Submit. Consequently, independent evidence here means no recorded hints and few submissions, not a closed-book exam or proof that no external solution was used. The game uses the device clock and local saves, and is not a credentialing system.

## Implemented: adaptive support

Heavy scaffolding helps beginners but slows down learners who are past it (the expertise-reversal effect), so support fades per skill instead of staying at one global level.

- Onboarding sets the starting level for every skill.
- A **clean solve** (no hints, at most two submissions) gives the next mission for each of its skills one level less support: Guided, then Standard, then Challenge.
- A **struggle** (two or more hints, or four or more submissions before passing) gives the next mission one level more support. Anything in between leaves the level alone.
- Only code missions move support. Support is about how much code you're given to write, and tracing a program cleanly in a predict mission says little about writing one. Terminal missions have no starter code, so they don't move it either. Their lessons follow the same open-or-collapsed rule. Their completions count as skill evidence under the same rules as every other mission, so a player whose level for a skill is Guided records practice even though a terminal mission gives no code to start from. Revisit this in playtesting.
- A mission's lesson opens by default at Guided, and at Standard the first time through a mission, since every mission introduces one new idea. At Challenge, and when replaying a mission at Standard, it starts collapsed, one click away.
- A mission with several skills uses the most supportive of their levels, so it's never harder to start than its least-practiced part. A mission's own completions don't count toward its level, so a replay starts where the original did.
- Missions restored by passing the final mission don't count either way.
- The briefing says when and why the level moved ("You solved Restore power without help, so this mission gives you less to start from"). The Skills panel shows which skills have moved.
- After three failed submissions, a mission offers a more complete starting point for that mission only. Switching replaces the player's code, and undo in the editor brings it back. A switched mission still records the level it was finished at, so a Guided finish counts as practice.
- The Support menu defaults to Adaptive. Choosing a fixed level overrides adaptation for every mission, and choosing Adaptive again returns to the per-skill levels.

The thresholds are guesses to tune in playtesting. A typo or one failed test never moves the level: it takes a whole mission's outcome.

## Implemented: optional pre-submit confidence calibration

On Standard, Challenge, predict, assessment, and maintenance submissions, players see an optional three-choice toggle (`Unsure`, `Fairly sure`, `Certain`) beside Submit. Leaving it unset never blocks submitting, and clicking an active option clears it.

When a rating is chosen, the submission outcome (pass or fail) is recorded in `confidenceLog` alongside the rating. Once at least one rating exists, the Skills dialog displays a **Calibration** card showing pass rates per confidence level and a brief reflective note (for instance, flagging overconfidence when `Certain` submissions frequently fail, or underconfidence when `Unsure` submissions usually pass). Confidence is never used for unlocks, support changes, or skill evidence, and is framed strictly as a private self-check rather than a grade. Old saves without `confidenceLog` remain compatible.

## Skill evidence

- **Practiced:** completed with guided support, hints, or a heavily retried maintenance attempt.
- **Demonstrated:** completed a related mission at Standard or Challenge without hints. Maintenance additionally requires at most two submissions.
- **Retained:** a clean maintenance success at least seven elapsed days after earlier independent evidence. A supported maintenance result clears that baseline; later independent evidence establishes a new one.

Retained records a historical achievement. It does not expire or imply permanent mastery. Calls continue after retention is recorded. The capstone earns evidence only for its explicitly tagged skills, not everything it unlocks.

Campaign restoration never depends on waiting days for a review. The earlier proposal to require every skill to be retained before game completion would create a calendar gate and currently cannot work for skills without review pools. Keep world completion and learning evidence distinct. Design any eventual graduation requirement around a broader independent project and delayed transfer assessment, informed by playtesting.

## Next changes, in order

1. Playtest the review loop and adaptive support, and expand review coverage based on observed gaps. Add variants before repeated exposure becomes answer memorization.
2. Strengthen the read → modify → make progression. This release includes two maintenance tasks with existing code; the campaign still needs a deliberate modification stage for each major concept.
3. Evaluate pre-submit confidence calibration during playtests to ensure the optional toggle stays unobtrusive and helpful.
4. Validate transfer before expanding into a local development environment.

## Playtest protocol

Recruit three to five beginners or tutorial-dependent learners for an initial usability study. This sample can reveal confusing instructions and recurring obstacles, but cannot establish causal learning gains.

Observe a teaching sequence, then offer an unfamiliar application problem. Record whether it was solved, hints and submissions used, misconceptions, and whether the learner can explain the result. Invite them back about a week later with a new problem assessing the same skill. Do not reuse a reviewed task as the only outcome measure.

Ask whether they knew what to try next and whether the difficulty felt productive. Check that the no-hints label does not discourage help seeking. Use findings to revise tasks, scaffolding, and scheduling. Completion rate, minutes played, and streaks are insufficient outcome measures on their own.
