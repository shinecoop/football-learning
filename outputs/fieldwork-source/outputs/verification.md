# Fieldwork — verification

Completed October 2, 2026. The development app is running at http://localhost:3000.

## Automated checks

- Strict TypeScript: passed.
- ESLint: passed with no warnings.
- Vitest: 14 domain tests passed.
- Next.js optimized production build: passed.

The tests cover interpolation, route boundaries, moved-player route geometry, double flips, all 54 passing matchups’ valid key defenders, unique lesson IDs, eleven-player passing defenses and offensive formations, personnel composition, man tracking, front landmark allocation, the Half Slide free-rusher model, and roadmap integrity.

## Browser checks

Checked in the Codex browser at desktop widths (1440 and 1280), the intermediate 742-pixel layout, and a 390-pixel phone viewport.

- Dashboard renders and category navigation works.
- Mobile navigation opens, visits the curriculum, and closes. Hidden sidebar links are removed from the mobile accessibility tree.
- Global search finds Half Slide and distinguishes a planned adjustment lesson.
- Glossary deep links filter to Mike; searching and following Banjo updates the same-page filter correctly.
- Simulator changes Smash/Cover 2 to Sail/Cover 3 and updates shell, key defender, teaching, assignments, and diagram.
- QB and defensive teaching views display their relevant content.
- Player inspection shows the selected apex’s curl/flat responsibility.
- Playback advances the timeline; restart returns it to zero.
- Scrubbing to the end places Smash’s Y at the actual route endpoint (y=26).
- Speed selection and routes/zones toggles update their state.
- Keyboard movement adjusts a focused offensive player.
- Physical dragging in the designer moves X from x=12 to approximately x=17.4, with the coordinate editor updating.
- Designer assigns go/out routes, renames a play, and saves it.
- Reloading and loading restores both routes and X’s edited x=18 alignment.
- Flip changes x=18 to x=82; flipping back restores it.
- Deleting the test play removes it from the saved list.
- Coverage training correctly identifies the post-snap Cover 3 diagram and records a correct attempt.
- Conflict training accepts CBR for Smash/Cover 2, then explains the high-low.
- A lesson knowledge check records a correct answer; explicit completion and quiz milestones survive reload. Completion was then undone through the UI.
- Half Slide’s pressure selection shows M accounted for by RB and A as the free rusher; selecting RB explains the scan.
- Power switches to Bear and exposes LG’s pulling assignment.
- Diagnostic motion switches to a bump response and animates the lateral motion, with “evidence, not proof” teaching.
- 12 personnel uses a static formation diagram with meaningful label/flip controls.
- 3rd & Long shows its strategic framework.
- Phone glossary/personnel pages have matching viewport and document widths (390px), without horizontal page overflow.
- No browser console errors were recorded in the final fresh preview.

## Honest boundaries

The app is a working foundation, not a physics model or complete coaching rulebook. Passing defenses use deterministic man assignments or zone landmarks. Run-front changes adjust simplified target landmarks. Full match coverage, stunt exchanges, legal formation validation, per-player timing, authentication, and cloud sync remain future work. Planned curriculum is clearly labeled and has no fake lesson content.

The preview’s five activity records and two training attempts came from the verification actions above; no completion was fabricated. Browser data starts empty in a new profile.

See README.md in the source bundle for setup, architecture, coordinate contracts, content extension instructions, coaching references, and limitations.
