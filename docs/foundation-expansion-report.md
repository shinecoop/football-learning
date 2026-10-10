# Fieldwork - Foundation Expansion Report

October 8, 2026. Based on the project owner's Visual Football Learning outline dated October 7, 2026.

Implementation branch: `codex/visual-football-foundation`. Main is not a delivery target.

The existing Fieldwork classroom has been extended with a real seven-on-seven passing sandbox, film-informed opponent profiles, timed replay, and portable local work. The scope is deliberately bounded: a useful engine and workflow to review with coaches, rather than a full eleven-on-eleven predictor.

> WHAT IS READY: Draw a route, assign defensive responsibilities, set timing and movement assumptions, replay the result, compare three settings, and save the exact scenario for later review.

### What changed

- A new sandbox with seven offensive references and seven coverage defenders, Cover 0/1/2/3 presets, six concept templates, and eight formation layouts.

- Point-based route drawing, editable breaks, offensive/defensive dragging, keyboard/numeric alternatives, and atomic undo/redo.

- Global or individual defender ratings, receiver speed/release delay, QB release timing, and a hypothetical pressure deadline.

- Saved opponent profiles with film references, observation notes, confidence, and assumption spread.

- Saved scenarios with frozen profile assumptions and movement model identity; validated backup/import and legacy progress migration.

The original lessons, learning lab, designer, training, glossary, and progress system remain. Lesson content is marked pending coach review unless a review is actually attributed in data.

## From outline to working features

The core draw-configure-replay-learn loop is implemented alongside the existing classroom. The table separates working features from the remaining scope.

| Outline area | Delivered foundation | Explicit boundary |
| ------------ | -------------------- | ----------------- |

| Route editor | Point drawing, route library, draggable breaks, coordinate edits, undo/redo. | No continuous freehand smoothing or legal-formation validator. |

| Defensive response | Seven-defender man/zone/QB-reference assignments; custom zones, alignment, cushion. | No complete pattern-match, switch, bracket, or rush/protection engine. |

| Opponent profiles | Six anchored ratings, film-reference notes, confidence, presets, individual overrides. | No automatic film analysis or measured player grades. |

| Timing and replay | Receiver timing/speed, acceleration, reaction delay, turn limits, six-second replay. | Receiver braking/turning and defender technique remain simplified. |

| Windows and uncertainty | Release-frame nearest spacing and straight-lane clearance across three rating settings. | Not catch probability, throw advice, or a statistical confidence interval. |

| Saved work | Scenario snapshots, model identity, designer handoff, validated JSON backups/import. | Browser storage only; no team accounts or cloud synchronization. |

| Learning content | Existing shared lessons and quizzes retained; review status visible. | No coach review or learning-effectiveness pilot has occurred. |

| Validation foundation | Unit/browser checks, samples, review worksheet, pilot plan, CI workflow. | Held-out film comparison and business validation need people and evidence. |

### Try one useful workflow

Open /sandbox, choose Mesh and Cover 1, inspect the defensive assignments, set the QB release time, and show the release snapshot. Compare the three rating settings, add a coaching note, and save. Reload the scenario to revisit the same assumptions.

## What was checked and repaired

| Gate | Result | Evidence |
| ---- | ------ | -------- |

| Strict TypeScript | Passed | Next route type generation plus tsc --noEmit. |

| Lint | Passed | Current source and tests; generated archives/reports excluded. |

| Domain / persistence tests | 50 passed | Geometry, movement bounds, determinism, migration, validation, storage failures, and published samples. |

| Browser workflows | 18 passed | Desktop and phone-emulated Chromium across the core authoring and data workflows. |

| Production build | Passed | Optimized Next.js build completed. |

| Visual inspection | Completed | Actual desktop/phone captures reviewed; final capture session recorded no browser errors. |

| GitHub automation | Provided | Read-only CI workflow runs checks and browser tests against a production build. |

### Problems found and handled

- The local launcher still pointed at the old generated directory. It now resolves the current repository and can use the bundled runtime.

- Fast concept/coverage selection could reset a just-selected concept during a cold load. Controls now wait for local hydration, and template updates use current state.

- Drag movement needed one-step undo rather than a stack of pointer events. Gesture history is now grouped and tested for defenders and route breaks.

- Persistence needed stronger boundaries. Imports are validated, repeated merges do not duplicate totals, referenced profiles are protected, and unreadable stored data is not overwritten by ordinary edits.

- Archived source copies and generated browser reports were entering quality checks. Their directories and local Finder metadata are now excluded appropriately.

## What the simulation actually means

The movement engine is deterministic and assignment-based. It runs fixed 0.05-second steps for six seconds. Geometry uses an illustrative 53 1/3-yard width and a 50-yard viewport; it is not tracking-derived player motion.

| Input | Implemented effect | What is not established |
| ----- | ------------------ | ----------------------- |

| Speed / acceleration | Bounded movement and ramp to a configured speed cap. | Measured athletic ability or age-specific calibration. |

| Change of direction | A turning-rate limit for defender pursuit. | Real footwork, braking, contact, or collision mechanics. |

| Reaction speed | Delay before responding to a perceived receiver position. | A validated cognitive/reaction grade from film. |

| Man technique | A pursuit offset relative to the assigned receiver. | Full leverage, release, trail, bracket, or switch technique. |

| Zone discipline | Landmark weight blended with the nearest route near the zone. | Complete pattern-match distribution or communication rules. |

| Receiver and QB timing | Route distance over time, receiver release delay, QB snapshot time. | Ball flight, throw placement, catch ability, or interception reach. |

### Use the window numbers as geometry

Nearest gap is the receiver's distance to the nearest defender. Lane gap is the closest defender's distance to a straight QB-to-receiver segment in the chosen frame. The pressure deadline is a hypothetical clock; no rusher is simulated.

Lower/baseline/higher comparisons shift all six defender rating values together and clamp them at 0/100. Higher ratings need not improve every result. The range across these three cases is not an exhaustive uncertainty envelope or a confidence interval.

> PRODUCT PROMISE: A practical teaching and scenario-testing tool with visible assumptions. Opponent accuracy, completion probabilities, and coach validation are not claimed.

## A base that can be extended cleanly

Football data, timed movement, rendering, playback, editing history, and storage are separated. Additional lessons can still be added to centralized curriculum data rather than new page components.

| Area | Where to extend | Contract |
| ---- | --------------- | -------- |

| Scenario/profile data | domain/sandbox.ts | Stable IDs, seven-player adapter, timing, ratings, observations, and saved assumptions. |

| Movement | lib/sandbox-engine.ts | Pure replay output, model identity, fixed time steps, bounded positions, geometry observations. |

| Validation/storage | lib/workspace-codec.ts; lib/store.ts | Schema validation and v1 migration before persistence; visible failure states. |

| Editing/rendering | components/sandbox-*.tsx; field.tsx | Reusable controls and SVG position overrides; keyboard/numeric alternatives. |

| Learning/review | domain/curriculum.ts; types.ts | Existing lessons plus review attribution separate from learner completion. |

| Examples and checks | examples/; tests/; .github/workflows/ | Importable synthetic files, regression fixtures, desktop/phone checks, automated gates. |

### Local setup

### Data limits to plan around

Backups include progress, plays, profiles, observations, and saved scenarios. Imports are limited to 2 MB and schema count limits. Browser quotas can be reached; in-memory changes are exportable when browser writes fail. Multi-device/team synchronization and robust recovery of malformed historical files require further work.

## The next milestone needs evidence

| Priority | Next milestone | What is needed |
| -------- | -------------- | -------------- |

| 1 | Coach review of a small teaching set | Target age/level and practice ruleset; a coach to review man/zone duties, terminology, and concept explanations. |

| 2 | Movement validation and calibration | Permitted clips with coverage call, alignment, route breaks, snap/release timing, and defender response; separate held-out examples. |

| 3 | Richer football rules | Reviewed leverage, handoff, match, bracket, rotation, receiver-turning, and ball-flight rules with regression fixtures. |

| 4 | Team workflow and persistence | Pilot evidence that local exports are insufficient; then design accounts, shared storage, and event-level progress history. |

| 5 | Business/AI expansion | Demonstrated repeat use and teaching value before subscriptions or AI explanations layered on simulation output. |

### Materials to send next

- The player age group and intended seven-on-seven format or ruleset.

- A coach reviewer, preferably a small three-coach pilot with different systems represented.

- A small set of film examples you are permitted to use, with the call, timestamp, and expected responsibilities annotated.

- If available, permitted coordinate annotations at a known time base for calibration. Ordinary play-by-play does not supply the needed trajectories.

No coach, permitted film batch, tracking calibration, or dataset license was supplied during this implementation. Those are genuine dependencies for the next validation phase, not reasons to delay this working foundation.

### References and scope
