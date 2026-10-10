# Interface and player setup refinement

October 10, 2026 · branch `codex/dark-game-workspace`

The site now opens directly to Curriculum. The old dashboard component and its Overview navigation entry are removed. The lesson Overview tab remains because it contains the teaching material.

The palette now uses charcoal backgrounds, white headings and reading text, neutral secondary text, and selective blue, violet, and amber accents. Lesson reading sections no longer have filled background boxes. Incorrect answers use explicit error wording and red feedback; green is reserved for correct-answer feedback.

Player setup now offers 21 sliders in six groups: General, Receiving, Passing, Ballcarrier, Blocking, and Defense. These include speed, acceleration, change of direction, strength, awareness, stamina, catching, route running, release, throw power, throw accuracy, ball security, vision, breaking tackles, blocking, reaction, tackling, pursuit, and coverage. A profile can be offense, defense, or both, with free-text positions such as WR / CB. Two-way athletes can be assigned on both sides of the same saved game. Quarterback and center also accept profile snapshots for setup purposes while remaining alignment references in the existing preview.

Profiles retain their additional ratings in player exports/imports, workspace backups, and frozen game lineups. Older profiles and backups remain readable. Additional attributes default to 50 when editing legacy profiles. Reset player ratings resets all profile sliders; Standard resets the active preview's existing settings.

No simulation model was expanded. New attributes are baseline setup data for later model development. Existing movement and assignment behavior is retained.

## Verification

- Type checking, lint, and optimized production build.
- 54 unit tests, including expanded profile validation and two-way lineup snapshots.
- 26 desktop/phone browser checks, including home redirect, transparent lesson sections, red wrong-answer feedback, two-way assignments, saved additional ratings, player import, and existing game/video workflows.
- Visual checks of Curriculum, lesson reading, expanded player setup, and phone layout.

## Scroll concept — deferred

The requested yard-line scroll rail and animated section words have not been implemented. They are feasible for longer structured lesson walkthroughs. The rail should represent page reading progress, with named section markers that can jump to the relevant content. Animated words should supplement stable headings rather than replace them. Short pages do not need this treatment; mobile and reduced-motion modes should use a compact/static alternative. No extra-long layouts were created just to accommodate an effect.
