# Fieldwork

A working, local-first American football learning platform built with Next.js App Router, React, strict TypeScript, Tailwind CSS, and a reusable SVG field engine. The visual language is intentionally independent of the supplied category-card reference.

## Run

Requires Node 20.9+ and pnpm (or npm). From the project root:

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Standard npm equivalents also work (`npm install`, `npm run dev`). The checked-in pnpm lockfile is the reproducible dependency source.

| Command          | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `pnpm dev`       | Development server                               |
| `pnpm typecheck` | Strict TypeScript checks                         |
| `pnpm lint`      | Next.js + TypeScript ESLint                      |
| `pnpm test`      | Domain, geometry, and curriculum integrity tests |
| `pnpm build`     | Optimized production build                       |
| `pnpm start`     | Serve an existing production build               |

The current host supplies Node and pnpm as bundled executables rather than global commands. If using this same Codex host, run `./scripts/dev-local.sh`; it sets the bundled paths before starting the app. The app itself does not require those host-specific paths.

## Current product

- Dashboard, centralized curriculum, all 14 major categories, global search, searchable glossary, recent lessons, and local activity milestones.
- Six passing concepts: Four Verticals, Mesh, Sail/Flood, Smash, Dagger, Stick.
- Nine defensive looks: Cover 0, Cover 1, Robber, Cover 2, Tampa 2, Cover 3, Buzz, introductory spot-drop Quarters, and Cover 6.
- All 54 passing/coverage combinations update the diagram, assignments, key defender, teaching explanation, and QB notes. Eight signature matchups have individually authored explanations. Other combinations use conservative family-level teaching, not invented predictions.
- Passing lab with player selection, pre-snap dragging and keyboard movement, routes, zones, assignments, flip, play/pause/restart, speed, timeline, and QB/defense views.
- Five run foundations and five front landmarks; clickable blocks, pullers, climbs, and back paths. Inside Zone and Power have distinct authored assignments.
- Protection foundations, separate Big on Big and Full Slide diagrams, and a six-man Half Slide example with Mike identification and a predefined Mike-plus-apex pressure.
- Three pre-snap motion lessons with traveling and bumping defensive responses.
- Four personnel packages, notation introduction, and nine formation diagrams.
- Eight down-and-distance frameworks; no rigid universal run/pass prescriptions.
- Coverage identification and conflict-defender training, with locked answers, feedback, retries, and persisted attempts.
- Designer: choose a formation, adjust players by drag/keyboard/numeric input, assign all 13 route-library types, clear routes, flip, rename, save/load/delete locally, export JSON.

Future curriculum is metadata marked `planned`. These entries have no placeholder teaching sections and are not linked as available lessons.

## Architecture

```text
src/app/                    Next root layout, icon, responsive design tokens
  [[...slug]]/page.tsx       Route validation + metadata; one application renderer
src/domain/
  types.ts                  Football and curriculum contracts
  concepts.ts               Route geometry and passing teaching
  coverage.ts               Alignments, assignments, zones
  formations.ts             Player alignment and personnel composition
  runs.ts                   Fronts, blocks, protection, motion
  curriculum.ts             Lessons, relationships, category metadata, roadmap
  glossary.ts               Centralized definitions
src/lib/
  simulation.ts             Pure path interpolation, transforms, route generation
  use-animation.ts          Playback clock only
  store.ts                  Versioned local persistence adapter
src/components/
  application.tsx           Navigation and global search
  learning.tsx              Dashboard, curriculum, glossary
  lesson.tsx                Reusable lesson renderer and knowledge checks
  passing-lab.tsx            Concept/coverage interaction and teaching views
  foundation-lab.tsx         Other teaching diagrams
  field.tsx                 SVG rendering and accessible input handling
  designer.tsx              Route authoring and saved-play workflows
  training.tsx              Exercise state and answer feedback
  ui.tsx                    Shared controls and presentation components
```

Football knowledge is in domain data, geometry logic is pure, playback is a separate hook, the field only renders assignments, and persistence is behind a small store boundary. Authentication/cloud storage can replace the adapter without rewriting lessons or the SVG.

Domain interfaces include CurriculumCategory, Lesson, Concept, Formation, PersonnelPackage, Player, PlayerAlignment, Route, RouteWaypoint, Coverage, CoverageAssignment, CoverageZone, DefensiveFront, Defender, Motion, Protection, BlockingAssignment, RunConcept, TeachingPoint, CoverageInteraction, ConceptVariation, QuizQuestion, Scenario, and UserProgress.

## Coordinate system

Every diagram uses normalized `x: 0..100`, `y: 0..100`. `(0,0)` is the top left, the offense attacks toward decreasing y, and the line of scrimmage is y=70. Alignments are usually y=72 or deeper. The viewport shows a schematic partial field; positions are not tracking data or calibrated real-world measurements. For orientation, the LOS is displayed at the illustrative 30-yard line.

Route waypoints are actual geometry, not route names alone. `samplePath` interpolates by total path distance through turns. A dragged alignment offsets the entire route and clamps it within the display. Flip mirrors x around 50. Defender motion either follows a specified receiver or moves to the assigned landmark. There is no reactive defensive AI. Paths run on a shared schematic clock; realistic acceleration, collisions, and individual route timing are future work.

## Add content

### Lesson

Add a `Lesson` record to `curriculum.ts` with a stable ID, valid category, kind, sections, relevant relationships, and optional quiz. For interactive kinds, provide an `entityId` pointing to a domain object. The shared lesson page renders only relevant sections. No new page component is needed. Set `status: 'planned'` until real teaching is ready.

### Passing concept

Add a concept definition in `concepts.ts`: normalized route waypoints, player assignments, coaching points, common progression, limitations, relationships, and variations. Each supported coverage gets a `CoverageInteraction`. The family-level builder provides cautious fallback teaching, but important new matchups should receive individually authored records in `authored`, including a valid key-defender ID, stress area, alternate defender responses, and a limitation.

### Coverage

Add a definition in `coverage.ts` with an alignment for all eleven defenders, zone responsibility geometry, shell, and summary. The current factory assigns four down rushers and zone/man rules; specialize assignments for coverages with different rush or match structures. Every defender ID referenced by a zone or teaching interaction must exist. Do not imply a full match implementation when only spot-drop landmarks exist.

### Formation or personnel

Add eleven players in `formations.ts`: five OL, QB, and five eligible skill players. Reuse the shared line. Keep formation distribution separate from personnel counts. `personnelFormation` preserves existing roles where possible and adjusts package composition. Player labels are stable IDs; their position is explicit data.

### Run concept

Add a `RunConcept` in `runs.ts` with a back path, read/key, and blocking assignments (`block`, `combo`, `climb`, `pull`). Front selection changes terminal landmarks through `blocksAgainstFront`. A production rule engine should replace this illustrative allocation with covered/uncovered rules, declarations, combination ownership, and technique-specific adjustments.

### Protection

Add a `Protection` to `protections` in `runs.ts`, including blocks, rushers, declared Mike, and any pressure-specific assignment set. Connect a lesson’s entity ID. The current pressure selector is intentionally limited to the authored Half Slide example; other protections show their own base assignments.

## Persistence and progress

`store.ts` exposes a React external store and event-based commands. Browser storage key: `fieldwork:v1`. Snapshot contains a versioned UserProgress and SavedPlay list. Server rendering uses an empty stable snapshot; the client hydrates saved data once, and listens for cross-tab storage changes. If storage is unavailable, changes remain in memory for the current session.

Completion is an explicit user choice. Recognition is earned through a correct quiz or training answer. Understanding records exploring key ideas or assignments; coverage interaction records changing the defensive look; QB reads records opening QB teaching. These are transparent activity milestones, not a mastery certification or fabricated percentage. Correct quiz milestones remain earned on later retries. Dashboard category progress counts explicit completions.

No backend, login, network storage, or invented performance statistics are included. Local data belongs to this browser profile and can be lost when browser storage is cleared. JSON export is available for saved-play portability; JSON import and full progress export are future work.

## Accuracy and teaching boundaries

The content describes common implementations with explicit terminology caveats. Progressions are not universal. Motion is evidence, not proof. Quarters varies by system; this version does not execute match quarters or rip/liz rules. Cover 6 is quarter-quarter to the left and a half to the right in this teaching example, not a claim about every strength declaration.

The field’s passing coverage examples show eleven defenders. Run/protection diagrams deliberately isolate the seven-player front and omit secondary defenders not relevant to that lesson. The Half Slide pressure has six rushers; a free rusher can result from the distribution of responsibility even with six protectors. The back scans M then A, but cannot block both at once. Stunt exchanges and live protection redeclarations are not simulated.

The personnel and formation modules use authentic composition and spacing, but the designer does not validate eligible numbering, seven players on the line, receiver coverage, shift/set legality, or forward-motion rules. Offensive players can be adjusted only before playback. Static personnel/formation diagrams expose only meaningful label/flip controls.

Coaching references consulted for foundational distinctions:

- [USA Football — Mesh from North Central College](https://blogs.usafootball.com/blog/7735/play-of-the-day-mesh-from-north-central-college)
- [USA Football — Saban’s pattern-match Cover 3](https://blogs.usafootball.com/blog/5615/blank)
- [USA Football — Cover 2 Read](https://blogs.usafootball.com/blog/7073/%5BPodcast%5D%20Trends%20day%20Week%2014%20-%20Constraints%2C%20RPO%27s%2C%20Tricks%20%26%20QB%20Progressions)
- [Slide Protection Schemes and Technique](https://smartfootball.com/wp-content/uploads/2012/04/slidePROTECTION.pdf)

The scenarios and prose are original schematic teaching, not quoted playbooks or guarantees about outcomes. A qualified coach should review expanded rule systems before publishing a coaching curriculum.

## Verification and expansion

Domain tests verify route interpolation, duplicate waypoints, flips, route offset after alignment changes, bounds for the entire route library, unique curriculum IDs, every concept/coverage key defender, eleven-player formations and passing defenses, correct personnel composition, man tracking, front targets, free-rusher assignments, and the absence of fake content in roadmap entries.

Browser verification covers desktop and phone layouts, navigation, search, coverage/QB/defense selection, playback/restart, keyboard movement, designer route assignment/save/reload/load/flip/delete, training feedback, and Half Slide pressure inspection. See `outputs/verification.md` for the final recorded checks.

Recommended next steps:

1. Have a coach review the authored passing matchups and protection declarations.
2. Add per-route timing, explicit zone reactions, and well-tested match assignment rules.
3. Replace run landmark remapping with a front-aware combination/blocking rule engine.
4. Add scenario variety, a larger question bank, and delayed recognition checks.
5. Add full progress export/import and optional authenticated storage behind the adapter.
6. Expand planned lessons only when meaningful teaching and valid interactions exist.
