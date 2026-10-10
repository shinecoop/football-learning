# Fieldwork

A local-first football classroom and a transparent seven-on-seven scenario sandbox. This expansion implements a bounded foundation from the **Visual Football Learning** outline dated October 7, 2026, while preserving the existing learning product.

**Current boundary:** a working scenario-testing and teaching tool, not a calibrated opponent predictor. No completion probabilities, NFL-derived player ratings, or claims of coach review are fabricated.

## Dark game workspace update

The app now uses centered **Learn / Sandbox / Glossary** navigation and a dark green gradient theme. In Sandbox, open **Game & player setup** to build a player library, assign offense/defense profiles, and save a named game snapshot. **Standard** applies baseline ratings to everyone. Players can be exported/imported separately; full workspace backups also include games and film metadata.

Each ready lesson has a **Game clips** tab with native video uploads, direct HTTPS video sources, camera selection, camera synchronization offsets, and manual timed highlights. Local videos live in IndexedDB, not JSON backups: retain originals and relink when changing devices. Automatic player tracking remains future work.

See [the redesign report](docs/dark-workspace-report.md) for delivered behavior, verification, boundaries, and next steps.

## Run

Use Node 22 (CI) or Node 24 and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. On this Codex host, `./scripts/dev-local.sh` uses the bundled runtime if Node/pnpm are not on PATH. It now resolves the repository from the script location instead of a stale generated directory.

| Command                                 | Purpose                                                        |
| --------------------------------------- | -------------------------------------------------------------- |
| `pnpm dev`                              | Development server                                             |
| `pnpm typecheck`                        | Generate Next route types and run strict TypeScript            |
| `pnpm lint`                             | Check source and test code                                     |
| `pnpm test`                             | Domain, movement, validation, migration, and persistence tests |
| `pnpm build`                            | Optimized production build                                     |
| `pnpm start`                            | Serve the built application                                    |
| `pnpm exec playwright install chromium` | Install the browser used by UI checks                          |
| `pnpm test:e2e`                         | Desktop and phone-emulated Chromium workflows                  |
| `pnpm test:e2e:ui`                      | Interactive browser test runner                                |

Browser tests reuse a development server locally. If none is running, run `pnpm build` first. In CI, they start the production build. Use `FIELDWORK_TEST_URL` only when pointing checks at an already-running test instance; the default is localhost:3000. Tests use isolated browser contexts and synthetic fixtures, not the user's live workspace.

## Where to go

| Route                      | What it provides                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/`                        | Dashboard, curriculum, recent learning, and entry to the sandbox                                           |
| `/learn` and `/lesson/:id` | Shared data-driven lesson architecture                                                                     |
| `/simulator`               | Existing concept/coverage teaching lab with deterministic schematic assignments                            |
| `/sandbox`                 | New timed seven-on-seven scenario editor and replay                                                        |
| `/profiles`                | Saved opponent assumptions, film references, observation notes, and confidence                             |
| `/designer`                | Existing eleven-player formation/route designer; supported plays can be saved and opened in seven-on-seven |
| `/workspace`               | Export, validated import, merging/replacing backups, and original designer-play imports                    |
| `/training`                | Coverage recognition and conflict-defender exercises                                                       |
| `/glossary`                | Searchable football terminology                                                                            |

## New foundation

### Draw, configure, replay, inspect

The sandbox shows a quarterback, center, five eligible skill players, and seven coverage defenders. It supports eight spread-style formation layouts, six passing-concept templates, and Cover 0/1/2/3 presets. This is not a universal competition ruleset; the center is an alignment reference and there is no live rush.

- Draw connected route points on the field, drag breakpoints, use numeric or keyboard alternatives, choose library routes, and remove points/routes.
- Drag both offense and defense before playback. Undo/redo groups a drag into one edit.
- Configure defender alignment, cushion, man target, zone geometry/landmark, or QB reference responsibility independently.
- Use global ratings or individual defender overrides.
- Set each receiver's speed and release delay, QB release time, and a hypothetical pressure deadline.
- Play, pause, restart, scrub, change speed, flip offense, toggle labels/routes/zones/assignments, and inspect release-frame spacing.
- Compare lower, baseline, and higher defender ratings using the profile's selected spread.
- Save/load scenarios with opponent snapshots and movement model identity so later profile edits do not silently change saved assumptions.
- Open supported saved designer plays in the sandbox. I-formation plays stay available in the original designer but are not converted into this five-eligible-ID sandbox.

A point-based route editor is implemented; continuous freehand smoothing is not. Receivers follow piecewise straight paths. There is no ball-flight/catch model, contact, route legality validator, full pattern-match system, or simulated pass rush.

### Opponent profiles

Profiles store six bounded ratings: speed, acceleration, change of direction, reaction speed, man technique, and zone discipline. Each slider has an observable-behavior anchor and documented model effect. Lower/baseline/higher presets are illustrative assumptions, not measured grades.

Film observations store a label, timestamp, optional HTTP/HTTPS reference URL, and notes. The app records these references; it does not upload, fetch, play, or analyze film. Confidence and assumption spread are separate inputs. A confidence label does not calibrate the model.

A profile used by a saved scenario cannot be deleted until that reference is changed or the scenario is removed. The baseline profile remains available. Saved scenarios capture the exact assumptions they used, even when the current profile is later edited.

### Portable local work

The v2 workspace contains lesson progress, designer plays, opponent profiles, and saved scenarios. It reads existing `fieldwork:v1` data when no v2 snapshot is present. Migration retains progress and plays; the original legacy key is not deleted.

JSON is validated before import/save: versions, bounds, stable IDs, roster composition, route ownership, man targets, zone geometry, ratings, profile references, snapshots, and count limits. Imports are limited to 2 MB. Merge keeps earned lesson milestones and avoids multiplying training attempts when the same backup is imported again. Matching play/profile/scenario IDs use imported values. Replace requires an explicit acknowledgement in the UI.

If stored data is unreadable, ordinary edits do not overwrite it. A visible warning directs the user to restore a validated backup. If browser writes fail or quota is exhausted, current changes remain in memory and a warning asks the user to export before closing. Browser quotas, backup limits, and lack of cloud sync remain scale limits for this foundation.

## Existing classroom retained

The six passing concepts, nine coverage looks, foundational runs/protections/motion/personnel/formations, down-and-distance frameworks, search, glossary, quizzes, training, and local milestones remain. Planned curriculum entries are clearly labeled and have no fake teaching pages. Lesson content now displays **Coach review pending** unless review attribution is recorded in data; learner completion is separate from content review.

## Architecture

```text
src/domain/
  types.ts                  Existing football/lesson contracts + content review metadata
  sandbox.ts                Scenario, profile, rating definitions, preset adapters, designer conversion
  concepts.ts               Authored passing concepts and coverage teaching
  coverage.ts               Eleven-player schematic coverage models
  formations.ts             Formation/personnel geometry
  curriculum.ts             Centralized lessons, relationships, and roadmap
  runs.ts / glossary.ts     Other foundational football knowledge
src/lib/
  sandbox-engine.ts         Pure timed movement, release frames, and geometry observations
  workspace-codec.ts        Pure validation, migration, backup, and import contracts
  store.ts                  Client persistence adapter and event commands
  use-history.ts            Bounded undo/redo and atomic drag gestures
  use-animation.ts          Playback clock
  simulation.ts             Legacy schematic geometry and route library
src/components/
  field.tsx                 Shared SVG rendering; accepts externally computed positions
  sandbox.tsx               Sandbox state orchestration
  sandbox-toolbar.tsx       Template/formation/coverage controls
  sandbox-library.tsx       Saved scenario and designer-play library
  sandbox-route-editor.tsx  Point/library route editing
  sandbox-defense-editor.tsx Assignment/alignment/zone/individual rating editing
  sandbox-analysis.tsx      Timing, comparisons, and model inspection
  profile-editor.tsx        Reusable rating/evidence controls
  profiles.tsx              Profile library workflow
  workspace-data.tsx        Backup/import workflow
  lesson.tsx / learning.tsx  Existing classroom and dashboard
  designer.tsx              Existing designer + sandbox handoff
```

Rendering, domain knowledge, movement logic, playback, editing history, and storage remain separate. Hundreds of additional lessons can be added through curriculum data rather than new page components.

## Coordinate and movement contracts

All diagrams use normalized `(x,y)` in `0..100`, with offense attacking toward decreasing y and LOS at y=70. Legacy lessons remain schematic. The sandbox explicitly maps x to an illustrative 53 1/3-yard width and y to a 50-yard viewport for its distance calculations. These are not tracking-derived player coordinates.

Movement model: `assignment-movement-v1`, six seconds, fixed 0.05-second steps.

| Rating r (0..100)   | Model parameter                                     |
| ------------------- | --------------------------------------------------- |
| Speed               | Cap = `5.2 + 0.036*r` illustrative yd/s             |
| Acceleration        | `2.2 + 0.055*r` illustrative yd/s²                  |
| Change of direction | Turning cap = `1.1 + 0.034*r` rad/s                 |
| Reaction            | Delay = `0.65 - 0.005*r` seconds                    |
| Man technique       | Pursuit offset = `2.5 - 0.021*r` illustrative yards |
| Zone discipline     | Landmark weight = `0.18 + 0.006*r`                  |

Receivers use their speed setting, release delay, and a common illustrative acceleration. Man defenders pursue the delayed assigned receiver position with the configured offset. Zone defenders blend a landmark with the nearest eligible threat in or near the displayed box. A QB reference assignment follows the static QB alignment; scrambling is not modeled. Defender turning and speed are bounded, but braking, collision, and realistic leverage technique remain simplified.

Nearest gap measures receiver-to-closest-defender distance. Lane gap measures the closest defender's distance to the straight QB-to-receiver segment in that frame. Neither is a completion probability or a calibrated “open receiver” label. Three comparison cases shift all six defender rating values together, including individual overrides, and clamp at 0/100. Their range is not a confidence interval or an exhaustive uncertainty envelope.

## Extend the project

- **Lesson:** add a stable `Lesson` record to `curriculum.ts` with sections, relationships, quiz, kind, and entity ID. Keep `status: 'planned'` until content is meaningful. If recording a coach review, add reviewer attribution and date in `contentReview`; do not invent it.
- **Passing concept:** add normalized routes, assignments, coaching points, system-specific progression caveats, interactions, and limitations to `concepts.ts`. Important matchups need authored teaching, not broad fallback certainty.
- **Coverage:** add coherent alignment/assignments/zones to `coverage.ts`. New sandbox coverages also need explicit seven-defender adapters and schema/engine tests. Do not label landmark following as a complete match rule engine.
- **Formation:** add the eleven-player layout to `formations.ts`; only add it to `SANDBOX_FORMATIONS` when the C/QB/X/H/Y/Z/RB adapter is valid.
- **Run/protection:** use the existing data contracts in `runs.ts`. Front landmark remapping is still illustrative; complete blocking/exchange rules need a separate reviewed engine.
- **Movement:** change pure rules in `sandbox-engine.ts`, add fixtures and invariants, and increment model identity when behavior changes. Keep old model support or reject unsupported archived versions explicitly.
- **Persistence:** extend `WorkspaceData`, parsers, migration, and UI together. Authentication/cloud storage can replace the adapter; it should not require rewriting football knowledge or SVG rendering.

## Samples and review materials

- `examples/workspace-backup.json`: a valid synthetic workspace for importing through Workspace Data.
- `examples/designer-play.json`: an original-format designer export for the single-play importer.
- `examples/opponent-profile.json` and `examples/sandbox-scenario.json`: domain examples for developers; these are not full workspace backups by themselves.
- `docs/coach-review-checklist.md`: review responsibilities before claiming coaching validation.
- `docs/pilot-plan.md`: a small three-coach validation plan and requested materials.
- `docs/foundation-expansion-report.md` and `output/pdf/fieldwork-foundation-report-2026-10-08.pdf`: implementation handoff, limitations, and next steps.
- `outputs/foundation-v2/`: actual desktop/phone browser captures.

Sample scenarios/profiles are labeled synthetic and contain no real film measurements or fabricated completed lessons.

## Verification

Local checks cover 50 unit/domain/persistence tests and 18 browser workflow checks across desktop and phone-emulated Chromium, plus strict TypeScript, lint, and an optimized build. The browser suite includes route drawing, gesture undo, playback, saved snapshots, defender rules, timing, profile notes, export/import, repeated merges, designer handoff, migration, rapid selections, route rendering, and overflow checks. Safari and physical-device validation remain future work.

`.github/workflows/ci.yml` repeats the checks against a production build with a read-only GitHub token. It does not deploy the website, modify `main`, fetch film, or call a paid AI service. Generated reports, archived source copies, and scratch outputs are excluded from source checks. Local Finder metadata is ignored and untracked without deleting the local files.

## Next steps that require people or evidence

1. Have football coaches review the man/zone responsibilities, terminology, and the classroom content. All existing lessons remain pending review.
2. Supply permitted film examples with the coverage call, alignment, route timing, and observed defender reactions. Use separate held-out examples to assess transfer; do not copy NFL player ability into youth/high-school defaults.
3. Calibrate movement and refine leverage, zone distribution, receiver turning, and ball flight before making opponent-specific recommendations.
4. Add match coverage and eleven-on-eleven blocking/rush interactions only behind reviewed rules and tests.
5. Consider team/cloud storage and subscriptions after coaches demonstrate recurring teaching value. AI-written explanations should remain downstream of reliable simulation outputs.

Reference: [NFL Football Operations - performance tracking](https://operations.nfl.com/game-operations-logistics/technology/performance-tracking-data-next-gen-stats). This project does not ingest NFL tracking data or assume any dataset license. Browser test setup follows the [official Playwright configuration documentation](https://playwright.dev/docs/test-configuration).
