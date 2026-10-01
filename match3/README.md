# Luma Grove Match-3

Original, data-driven match-3 system added as an isolated module inside Pocket AI.

## Architecture

- `src/core.js`: model-only board, cells, seeded RNG, match detection, swapping, cascades, specials, blockers, objectives, gravity, portals, spawners, legal move detection, reshuffle, validation, replay.
- `src/ui.js`: DOM renderer and debug HUD. Game rules do not depend on it.
- `src/editor.js`: click-to-paint editor with undo/redo, validation, JSON export, play-test draft and simulation.
- `src/simulation.js`: headless repeated play attempts and difficulty estimate.
- `levels/*.json`: independently loaded level data.
- `tests.html`: browser engine tests.
- `sw.js`: offline cache scoped to /match3/.

## Scaling

Keep each level as small configuration data. Do not create per-level scripts. Worlds can later use an index/manifest that references level files by ID, while the runtime fetches only the selected level.

## Current implemented slice

Core board, 3/4/5/T/L match grouping, special creation, several special combinations, cascades, four-direction gravity, basic portals, weighted generators, seeded randomness, legal move detection, reshuffle, blockers, collect/remove-blocker/score objectives, moves, win/lose after cascade completion, validation, replay log, editor, simulation, responsive UI and offline support.

The editor intentionally starts with the most important paint tools. Portal connection UI, rectangle select/copy/paste, world-map virtualization, production analytics provider adapters, cloud sync and large-scale simulation workers are expansion work rather than fake buttons.
