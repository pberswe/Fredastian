# Repository Guidelines

## Master Agent Instructions (ANGENTS)
### Goal
We are building a simple browser game beside an 11-year-old collaborator. Focus on story beats and playful mechanics; you (the agent) handle all coding details.

### Agentic Loop
1. Restate the current goal in one concise sentence.
2. Make the smallest code change that advances that goal.
3. Run `python scripts/verify`.
4. Report PASS/FAIL plus the command output.
5. Provide three quick “play checks” for the kid to try in the browser.
6. If the check fails, fix it and repeat until PASS.

### Constraints
- Use plain HTML + Canvas + vanilla JS (no new deps unless the kid requests them).
- Ship one visible, fun feature at a time; avoid sweeping refactors.
- Keep code readable, functions short, and the story easy to follow.

## Project Structure & Module Organization
Core gameplay lives in `index.html` (layout plus the Canvas mount) and `game.js` (state updates, rendering, and input). Keep small helper scripts with the feature they support; larger utilities belong in a `lib/` folder under the root. Art, audio, and story assets should reside under an `assets/` subfolder referenced with relative URLs from `index.html`. Automation and tooling are in `scripts/` (notably `scripts/verify` and `scripts/verify.py`), while the local Python virtual environment is kept in `.venv/`. Documentation, including this guide, stays at the repository root so automated checks can find it without extra configuration.

## Build, Test, and Development Commands
- `python -m http.server 8080` — serves the root directory locally for quick manual playtests in the browser.
- `python scripts/verify` — runs the repository sanity checks; currently ensures required top-level files exist and is the minimum bar before committing.
- `bash scripts/verify` — convenience wrapper that uses the pinned interpreter inside `.venv/`; run after every feature to mirror CI.

## Coding Style & Naming Conventions
Stick to plain HTML + Canvas + vanilla JavaScript; do not add external dependencies unless the storyline demands it. Favor two-space indentation and short, descriptive identifiers (`updateGhostPath`, `drawHUD`). Functions should remain focused (under ~20 lines) and grouped by responsibility (input, simulation, rendering). Store configuration constants (colors, speeds, story beats) near the top of `game.js` so tweaks remain obvious to younger collaborators. Comment only when intent is non-obvious, and prefer narrative-friendly wording that ties to the game story.

## Testing Guidelines
`python scripts/verify` is the fast structural test; keep it green. For behavior, define at least three “play checks” per change (e.g., “move Freda left to confirm wall collisions”) and record them in the pull request description so others can replay manually. When adding logic-heavy helpers, create lightweight browser console snippets or temporary debug overlays instead of formal test frameworks—the project optimizes for immediacy. Remove debug hooks before submitting the PR.

## Commit & Pull Request Guidelines
Write commit subjects in the imperative mood with a short scope reference (e.g., `Add comet swirl attack to boss arena`). Explain the narrative or player impact in the body plus any data files touched. Every pull request should include: a concise summary, linked issue (if applicable), results of `python scripts/verify`, the three current play checks, and screenshots or GIFs when the change affects visuals. Keep diffs small, story-focused, and avoid multi-feature bundles so young collaborators can follow along.
