# Independent simulation and Madden 27 ratings foundation

October 10, 2026

## Public evidence versus our implementation

EA documents layered gameplay systems: situation-based playcalling, adaptive coaching, assignments and coverage rules, ratings matchups, behavioral traits, and physics-informed animation. Their precise source code, weights, decision timing, and proprietary model parameters are not published in those descriptions. Importing ratings does not import their engine or establish real football accuracy.

Sources:

- [EA gameplay deep dive](https://www.ea.com/games/madden-nfl/madden-nfl-26/news/madden-26-gridiron-notes-gameplay-deep-dive)
- [EA physics/animation description](https://www.ea.com/technology/news/boom-tech-ea-sports-madden-nfl-25)
- [Current ratings page](https://www.ea.com/games/madden-nfl/ratings), observed labeled Madden 27 Week 4. Freeze the label and capture timestamp rather than treating a mutable URL as a dataset version.
- [EA source access policy](https://www.ea.com/robots.txt): explicitly prohibits scraping/data mining without written authorization. No bulk collection implemented. The importer accepts an authorized export or self-authored data.

## Prepared now

- `supabase/migrations/202610100001_rating_snapshots.sql`: private source snapshots and per-player ratings with edition, source identity, snapshot label, capture date, authorization basis, and content hash. An RPC performs each roster import in one transaction and rejects changed content under an existing snapshot ID. Browser roles have no access to these tables.
- `scripts/ratings/import.mjs`: validates the complete JSON export before any network operation; default is a dry run. Explicit `--apply` sends one atomic RPC call using a server-only Supabase secret key. No dependency on a scraping service.
- `scripts/ratings/example.synthetic.json`: deliberately fictional players for exercising the pipeline. This is not real Madden data.
- Validation and mocked transport tests. The migration has not been applied to a hosted database because no Supabase project exists yet. SQL execution, RLS, and transaction behavior require integration verification after project creation.

## Create the hosted database

1. Create a project from the [Supabase dashboard](https://supabase.com/dashboard). Choose the account, region, and plan yourself.
2. Run the migration in its SQL editor (or use Supabase CLI migrations after linking the project). Verify browser roles cannot query these tables.
3. Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in your terminal environment. Do not post secret keys in chat or use `NEXT_PUBLIC_` for them. Environment files are ignored by Git.
4. Verify the dry run: `node scripts/ratings/import.mjs scripts/ratings/example.synthetic.json`.
5. For a disposable test project, explicitly add `--apply` to import the synthetic fixture. Repeat and verify the same snapshot is idempotent. Change its content under the same ID and verify rejection with no partial writes.
6. Obtain an export with permission for the intended use. Map its columns to the example contract, retaining original source rating codes and source player IDs. Use a new snapshot ID for each roster update. Avoid merging players by display name.

[Supabase API security](https://supabase.com/docs/guides/api/securing-your-api) explains grants and row-level security. Future authenticated libraries need owner-specific policies before becoming accessible to the Sandbox. No frontend database connection or secret has been added in this change.

## Connect another developer's machine to the shared project

Use the existing shared Supabase project. Ask its owner for organization access and
enter the project URL and an authorized secret key in your own ignored `.env.local`.
`.env.example` documents the required variable names without credentials. Never use
`NEXT_PUBLIC_` for the secret key. Do not rerun the table-creation migration if it
has already been applied to the shared database.

Node 22 or 24 can load the local configuration for the importer explicitly:

```sh
node --env-file=.env.local scripts/ratings/import.mjs scripts/ratings/example.synthetic.json
```

This is a dry run and does not verify the connection or write to Supabase. Use
`--apply` only when intentionally importing an authorized export; do not import the
synthetic fixture into the shared project unless the team agrees. The website
currently has no Supabase-backed retrieval path: `pnpm dev` still runs its local
workspace, and merely setting these variables does not enable cloud synchronization.

## Proposed engine, not a description of EA's private implementation

Build a headless, reproducible 2D engine independent of the webpage. A fixed timestep updates every player's state from the same prior world snapshot. Separate football responsibilities, perception/reaction delays, movement constraints, interaction outcomes, and rendering. Use a seeded random generator; save the seed, model version, scenario, and frozen ratings with every run.

A defensive agent can transition through alignment, key reading, backpedaling, carrying a receiver, breaking on the ball, pursuit, and tackling. An offensive agent can transition through release, route stem, break, settling in a window, catch attempt, and running after the catch. A QB policy evaluates progression targets and chooses among passing, waiting, scrambling, and throwing away. A user-controlled actor supplies commands to the same movement/action layer rather than replacing the opposing team's engine.

Movement ratings map to speed, acceleration, turn constraints, and fatigue. Decision ratings map to reaction delay or perceptual uncertainty. Skill ratings participate in contextual contests such as route-versus-coverage or catch-versus-deflection. Tendency traits control which action an agent favors; they are separate from execution quality. These mappings are our hypotheses and must be calibrated. Do not treat a 90 rating as a 90% success probability.

Example coverage contest: route skill, man coverage, leverage, cushion, existing velocities, and reaction delay influence whether a receiver creates space at a break. Compute movement and geometry before catch outcomes. Do not roll independent win/loss dice on every frame; resolve deliberate events such as release, route break, throw, contact, and catch opportunity.

The engine contract should accept scenario geometry, assignments, normalized profiles, model version, and seed. It should return player/ball trajectories, timestamped events with reasons, and metrics. The Sandbox sends input and renders this replay. Supabase stores data and runs; it does not update each player every frame. A browser worker is a suitable first execution environment; an external service can later implement the same contract.

## Sequence

1. Source permission, project creation, and a validated immutable Madden 27 import.
2. A versioned adapter from original ratings to our player profile and physical parameters. Preserve short/medium/deep route ratings separately; any combined UI rating needs an explicit mapping.
3. Seven-on-seven release/route/man/zone behavior, constrained perception, reaction delays, and logging. Verify known geometric and coaching scenarios.
4. Add QB reads, ball flight, and contested outcomes with measured calibration evidence.
5. Add eleven-player blocking, pass rush, run fits, and tackling.
6. Compare multiple seeded runs and test sensitivity to each rating. Calibrate against permitted tracking/film observations. NFL ratings alone cannot validate high-school athlete behavior; retain an independent high-school profile scale.

No simulation changes, UI changes, or cloud resources were deployed in this data-foundation step.
