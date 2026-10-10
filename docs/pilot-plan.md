# Small coaching pilot

The next useful milestone is a coach-reviewed teaching pilot, not a bigger list of simulated plays or an accuracy claim.

## Materials to supply

- The target player age/level and the intended seven-on-seven practice ruleset.
- A football coach who can specify and review man and spot-drop responsibility rules. Three coaches give a better first pilot than one person's terminology alone.
- A small batch of permitted practice/film examples. For each, include the coverage call, concept, pre-snap alignment, route breaks/depths, snap/release timing, and observed defender response.
- Reference/timestamp notes that can be stored with the opponent profile. The app currently records links/notes; it does not load or analyze film.
- If available, permitted coordinate annotations at a known frame rate. Play-by-play alone cannot supply the geometric trajectories this engine needs.

No film, coach approval, tracking calibration, or dataset license was supplied during implementation. The presets remain assumptions.

## Pilot sequence

| Session             | Goal                                                                    | Evidence to collect                                                                   |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Coach review        | Validate responsibilities and language for a few concept/coverage pairs | Completed review worksheet, saved scenarios, requested rule fixes                     |
| Player lesson       | Test whether visual explanations improve recognition and reasoning      | Short before/after recognition and “why” questions, with the same scoring rubric      |
| Repeat use          | See whether coaches return to the sandbox for a real teaching need      | Which scenarios were reused, what settings they changed, and what value they reported |
| Held-out comparison | Compare movement with clips not used to choose ratings                  | Alignment/timing errors and failure cases, grouped by coverage/system                 |

This plan does not promise a measured improvement or opponent-prediction accuracy. Record actual results before making those claims.

## Developer backlog after review

1. Add the reviewed assignment corrections as domain fixtures and regression tests.
2. Define a coordinate/time annotation import contract and calibrate movement against permitted observations.
3. Improve receiver turning, defensive leverage, braking, and ball-flight geometry.
4. Add match distribution and pass-rush/protection only after their rules have been specified.
5. Add team storage/authentication when pilot workflow proves that local backups are insufficient.
6. Evaluate subscriptions and AI explanations after recurring use and dependable simulation outputs are demonstrated.
