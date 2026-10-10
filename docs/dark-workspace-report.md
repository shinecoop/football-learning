# Dark workspace redesign — October 10, 2026

The interface now uses a black and deep-green palette, emerald gradients, restrained card borders, and centered Learn, Sandbox, and Glossary navigation. Secondary links keep the existing tools accessible within those three sections. Lessons, quizzes, mastery tracking, route drawing, replay, training, and glossary search remain available.

## Delivered

- Responsive desktop and phone layouts with a shared dark theme across existing pages.
- Sandbox game plans: name an opponent, save the complete setup, load it later, update it, or start a new game from the current setup. Snapshots include route geometry, coverage, timing, opponent ratings, and player assignments.
- Player library: offense and defense profiles, individual assignments, edit/delete, JSON player export/import, and inclusion in full workspace backups. Assigned profiles are copied into the scenario; subsequent edits to the library do not change a saved game.
- Standard button: all moving players return to illustrative baseline 50 ratings and offense release delays return to zero. Routes and alignments remain intact. This is a model baseline, not a claim about measured average athletes.
- Lesson Game clips tab: native embedded video, local uploads or direct HTTPS video files, named camera views, and camera offsets to maintain the same play moment when switching views.
- Manual timed focus highlights: pause, name the focus, choose a duration, and click the player or area to shade. Positions and time ranges persist with each camera. Marks remain at the chosen screen position; they do not track motion.
- Durable local video storage in IndexedDB, separate from lightweight workspace metadata. Missing files can be relinked after restoring a backup on another device.
- Backward compatible backup parsing: existing version 2 backups can omit the new games, players, and film fields; legacy progress migration remains supported. New imports validate player ratings, lineup sides, video sources, and focus ranges before storage.

## What remains bounded

The simulation remains seven-on-seven route movement and coverage assignment. It does not include a live pass rush, collisions, ball flight, running plays, catch outcomes, or calibrated win probabilities. Offense profiles affect the moving eligible player's speed and release delay. Defense profiles affect all six existing movement/coverage ratings. Quarterback and center remain alignment references.

Video files are not packed into JSON backups or committed to the repository. Keep originals separately. Browser storage may be cleared or evicted, and browser-supported codecs determine whether a clip plays. A direct link must serve a video file, not a YouTube page. Cross-device sharing and durable cloud media hosting need a future backend.

No actual game clips were supplied for this change. Browser tests use a clearly synthetic generated video to verify playback and persistence without substituting it for teaching footage.

## Verification

- Type checker and linter.
- 53 unit tests covering existing behavior plus new backup compatibility, lineup snapshots, invalid player data, video source validation, and focus ranges.
- 22 browser checks across desktop and phone-emulated Chromium: existing workflows plus Standard reset, game persistence/update, player export, uploaded video persistence, camera synchronization, highlights, and missing-file relinking.
- Optimized production build and browser checks against the production server.
- Visual inspection of overview, curriculum, Sandbox, lesson film room, glossary, and the phone curriculum layout.

## Problems resolved

Old light panels and low-contrast labels were found during visual inspection and corrected. Game saving initially created new entries instead of updating a loaded game; it now updates the same snapshot. A local type check found duplicate generated files in the build cache; deleting only those duplicate cache files restored a clean check. None of these remain open application failures.

Desktop and phone previews are saved in [screenshots](screenshots/).

## Next steps and materials

1. Supply a small set of original MP4/WebM clips, matched camera angles, concept labels, and the time of the same snap/play moment in each view. Add these from each lesson's Game clips tab today.
2. Review player rating assumptions and educational content with a coach; these remain explicitly uncalibrated.
3. Extend highlights to editable keyframes or tracked paths. Automatic receiver segmentation/tracking is a separate computer-vision project requiring labeled footage, a model or service, and accuracy evaluation.
4. Add authenticated cloud workspace storage and media hosting if plans should be shared between coaches or devices without manual backups.
5. Expand the simulation only after deciding the next concrete football model: pass rush, run fits, ball flight, or full-team assignments.

All work is on `codex/dark-game-workspace`, based on the previous foundation branch. Main is unchanged.
