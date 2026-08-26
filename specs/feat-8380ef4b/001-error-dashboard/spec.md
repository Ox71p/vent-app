---
# [UI] Error Dashboard
## Task Type
delivery
## Goal
An operator opening `/` can switch to the Error Dashboard, click `Run checks`, and see compile, type, lint, and test findings for this Vent app. Findings are stored and listed only — the runner never auto-fixes source.
## Context
The repo is a Vite SPA journal with no error-check UI and no lint/type/test pipeline. `package.json` exposes only `dev`, `build`, and `preview`; there is no `lint`, `typecheck`, or `test` script and no ESLint/TypeScript/Vitest dependency. `index.html` is the single HTML shell (`#view-vent`, `#view-logs`, `#view-settings`, auth, dock) and does not contain an Error Dashboard view. `src/main.js` switches screens by reading `.dock-item[data-target]` and toggling `.app-view.active`, and persists user data under `vent*` `localStorage` keys. `src/nlpEngine.js` POSTs to `/.netlify/functions/processEntry`; `netlify/functions/processEntry.mjs` is the existing ESM `handler` pattern (OPTIONS 200, non-POST 405, JSON body). `src/counter.js` is unused Vite scaffold. There is no `vite.config.js`. Root `test_*.js` / `test_*.mjs` files are live manual scripts, not a runner. Locked intent: report findings only; do not change Vent source to fix errors; only compile/type/lint/test count.
## Technical Approach
Add one new seam, `src/error-check/`, and keep Vent journal modules untouched.

**Tooling (report-only):** Add devDependencies and `package.json` scripts:
- `lint` — ESLint on `src/**/*.js` and `netlify/**/*.mjs` with **no** `--fix`
- `typecheck` — `tsc --noEmit` via a root `tsconfig.json` (`allowJs`, `checkJs`, `skipLibCheck`, `noEmit`, `lib` including DOM)
- `test` — `vitest run`
Compile stays `npm run build` (`vite build`). Do not add format-on-save, `--fix`, or a lint gate that rewrites files.

**Runner:** `src/error-check/runChecks.js` (Node) plus `src/error-check/cli.js`. Spawn the four npm scripts, capture stdout/stderr/exit codes, parse via `src/error-check/parseOutput.js` into findings `{ id, runId, check, file, line, message, severity }` with `check` only in `compile` | `type` | `lint` | `test`. A tool that is disabled in settings, or missing, is recorded as `{ status: "skipped", findings: [] }` (missing tool uses message on the check object, not a fifth category). The child process for a failing lint/type/test/build is a finding source, not a runner crash. The runner must not write to `src/`, `index.html`, or `netlify/functions/processEntry.mjs`, and must not pass `--fix`.

**HTTP:** `netlify/functions/runChecks.mjs` mirrors `processEntry.mjs`: POST JSON `{ settings? }`, 200 `{ run }`, OPTIONS 200, other methods 405. `vite.config.js` (owned here) (1) glob-picks root `*.html` as MPA inputs so later tickets’ pages bundle without editing this file, and (2) intercepts `POST /.netlify/functions/runChecks` in `configureServer` by calling the same runner so `npm run dev` works without Netlify.

**Store:** `src/error-check/store.js`, `localStorage` key `ventErrorRuns` (same prefix as `ventEntries`). Shape:
```
{ settings: { compile, type, lint, test }, runs: [ { id, startedAt, finishedAt, status, checks: { compile, type, lint, test } } ] }
```
Defaults: all four settings `true`. Export `getRuns`, `appendRun`, `getLatestRun`, `getRun`, `getFinding`, `getSettings`, `setSettings`. `status` on a run is `fail` if any enabled check has findings with severity `error` or a `fail` check status; otherwise `pass`.

**Dashboard UI (index.html, designSurfaceId `dashboard`):** Add `<main class="app-view" id="view-errors">` with heading `Error Dashboard`, button `Run checks`, latest-run status, counts/labels for `compile` / `type` / `lint` / `test`, and a findings list. Each finding links to `/error-detail.html?id={findingId}` (page lands in ticket 002; broken link until then is acceptable). Include `src/error-check/nav.js` helper that injects links `Error Dashboard` → `/`, `Run History` → `/runs.html`, `Settings` → `/settings.html`. Add a dock item `data-target="view-errors"` with label `Errors` so existing `src/main.js` dock routing activates the view with **no main.js edit**. Add an `Error Dashboard` link inside `#view-auth` so the view is reachable when the dock is hidden. Second module script `/src/error-check/dashboard.js` (after `/src/main.js`) wires the button: POST `/.netlify/functions/runChecks`, `appendRun`, re-render. Empty never-run copy: `No check runs yet`. After a run with zero findings: `No compile, type, lint, or test failures`. No `Fix` / `Auto-fix` control.

**CSS:** `src/error-check/error-check.css` imported by dashboard.js. Reuse tokens already defined in `src/style.css` (`--bg-color`, `--text-primary`, `--accent-color`). Do not restyle Vent views. Do not edit `src/style.css`.

**Tests:** Colocate `src/error-check/*.test.js`. Cover store round-trip, parser fixtures for vite/eslint/tsc/vitest output, runner skips disabled checks, and a mock-spawn test that eslint is invoked without `--fix` and that the runner does not write app source files.
## Acceptance Criteria
- [ ] File `src/error-check/store.js` exists and exports `getRuns`, `appendRun`, `getLatestRun`, `getFinding`, `getSettings`, and `setSettings`
- [ ] `package.json` `scripts` contains keys `lint`, `typecheck`, and `test`
- [ ] File `netlify/functions/runChecks.mjs` exists and exports `handler`
- [ ] `index.html` contains an element `id="view-errors"` that includes the heading text `Error Dashboard` and a button whose text is `Run checks`
- [ ] `index.html` contains a `.dock-item` with `data-target="view-errors"`
- [ ] Clicking `Run checks` writes JSON to `localStorage` key `ventErrorRuns` whose latest run has `checks.compile`, `checks.type`, `checks.lint`, and `checks.test`
- [ ] `#view-errors` contains no control whose text is `Fix` or `Auto-fix`
- [ ] `npx vitest run src/error-check/store.test.js src/error-check/parseOutput.test.js src/error-check/runChecks.test.js` exits 0
## Files to Touch
- index.html  (modify)
- package.json  (modify)
- package-lock.json  (modify)
- src/error-check/store.js  (create)
- src/error-check/runChecks.js  (create)
- src/error-check/parseOutput.js  (create)
- src/error-check/cli.js  (create)
- src/error-check/dashboard.js  (create)
- src/error-check/nav.js  (create)
- src/error-check/error-check.css  (create)
- src/error-check/store.test.js  (create)
- src/error-check/parseOutput.test.js  (create)
- src/error-check/runChecks.test.js  (create)
- netlify/functions/runChecks.mjs  (create)
- vite.config.js  (create)
- eslint.config.js  (create)
- tsconfig.json  (create)
- vitest.config.js  (create)
## Owned Areas
- src/error-check/store.js
- src/error-check/runChecks.js
- src/error-check/parseOutput.js
- src/error-check/cli.js
- src/error-check/dashboard.js
- src/error-check/nav.js
- src/error-check/error-check.css
- netlify/functions/runChecks.mjs
- vite.config.js
- eslint.config.js
- tsconfig.json
- index.html#view-errors
- package.json scripts lint/typecheck/test
## Shared Touchpoints
- src/main.js
## Test Strategy
Unit-test store, output parsers, and runner skip/`--fix` invariants with mocked `child_process`. Command: `npx vitest run src/error-check/store.test.js src/error-check/parseOutput.test.js src/error-check/runChecks.test.js`. Do not require `npm run lint` or `npm run typecheck` to exit 0 against existing Vent files. Browser: open `/`, use the `Error Dashboard` auth link or `Errors` dock item, click `Run checks`, confirm four check labels and no Fix control.
## AMC Task Metadata
```json
{
  "title": "[UI] Error Dashboard",
  "goal": "An operator opening `/` can switch to the Error Dashboard, click `Run checks`, and see compile, type, lint, and test findings for this Vent app. Findings are stored and listed only — the runner never auto-fixes source.",
  "taskType": "delivery",
  "specRef": "specs/feat-8380ef4b/001-error-dashboard/spec.md",
  "acceptanceCriteria": [
    "File `src/error-check/store.js` exists and exports `getRuns`, `appendRun`, `getLatestRun`, `getFinding`, `getSettings`, and `setSettings`",
    "`package.json` `scripts` contains keys `lint`, `typecheck`, and `test`",
    "File `netlify/functions/runChecks.mjs` exists and exports `handler`",
    "`index.html` contains an element `id=\"view-errors\"` that includes the heading text `Error Dashboard` and a button whose text is `Run checks`",
    "`index.html` contains a `.dock-item` with `data-target=\"view-errors\"`",
    "Clicking `Run checks` writes JSON to `localStorage` key `ventErrorRuns` whose latest run has `checks.compile`, `checks.type`, `checks.lint`, and `checks.test`",
    "`#view-errors` contains no control whose text is `Fix` or `Auto-fix`",
    "`npx vitest run src/error-check/store.test.js src/error-check/parseOutput.test.js src/error-check/runChecks.test.js` exits 0"
  ],
  "testCommand": "npx vitest run src/error-check/store.test.js src/error-check/parseOutput.test.js src/error-check/runChecks.test.js",
  "phase": "build",
  "ownedAreas": [
    "src/error-check/store.js",
    "src/error-check/runChecks.js",
    "src/error-check/parseOutput.js",
    "src/error-check/cli.js",
    "src/error-check/dashboard.js",
    "src/error-check/nav.js",
    "src/error-check/error-check.css",
    "netlify/functions/runChecks.mjs",
    "vite.config.js",
    "eslint.config.js",
    "tsconfig.json",
    "index.html#view-errors",
    "package.json scripts lint/typecheck/test"
  ],
  "sharedTouchpoints": [
    "src/main.js"
  ],
  "dependsOn": [],
  "designSurfaceIds": [
    "dashboard"
  ],
  "browserVerification": {
    "required": true,
    "criteria": [
      {
        "id": "AC-FE-1",
        "text": "The Error Dashboard view shows the heading Error Dashboard and a Run checks button",
        "route": "/"
      },
      {
        "id": "AC-FE-2",
        "text": "Clicking Run checks lists compile, type, lint, and test results and shows no Fix or Auto-fix control",
        "route": "/"
      }
    ]
  }
}
```
---
