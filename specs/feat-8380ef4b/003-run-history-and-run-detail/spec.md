---
# [UI] Run History and Run Detail
## Task Type
delivery
## Goal
An operator can list past check runs on `/runs.html` and open one run on `/run-detail.html` to see that run’s compile, type, lint, and test statuses and findings.
## Context
Ticket 001 persists runs in `localStorage` key `ventErrorRuns` via `src/error-check/store.js` (`getRuns`, `getRun`, `getLatestRun`). The Error Dashboard only highlights the latest run. `index.html` `#view-logs` is the existing list-plus-detail pattern (searchable cards, empty copy `Your past entries will appear here.`) to follow for empty/list states — do not put run history inside `#view-logs`. `src/main.js` formats timestamps with `toLocaleDateString` / `toLocaleTimeString`; reuse that idea for `startedAt`. `package.json` still has no historical “runs” concept beyond what 001 adds. Root HTML today is only `index.html`; `runs.html` and `run-detail.html` are new Vite MPA pages picked up by 001’s glob. Do not add check categories beyond compile/type/lint/test. Do not auto-fix.
## Technical Approach
Create `runs.html` and `run-detail.html` at the project root. Do not modify `vite.config.js`, `package.json`, or `src/error-check/store.js`.

**Run History (`runs.html`):** heading `Run History`. Module `src/error-check/runsPage.js` calls `renderErrorCheckNav('runs')` and `getRuns()`. Empty array: text `No check runs yet`. Otherwise a list of runs, each showing `id`, `status` (`pass` or `fail`), and `startedAt`. Each row is a link to `/run-detail.html?id={runId}`. Newest first.

**Run Detail (`run-detail.html`):** heading `Run Detail`. Module `src/error-check/runDetail.js` reads `id`, `getRun(id)`. Missing: text `Run not found`. Present: show `status`, `startedAt`, `finishedAt`, and four labeled sections `compile`, `type`, `lint`, `test` each with that check’s `status` and finding `message` lines. Finding messages link to `/error-detail.html?id={findingId}`. Anchor `Error Dashboard` → `/`. Anchor `Run History` → `/runs.html`. No Fix control. Do not re-run checks from these pages.

Tests: `src/error-check/runsPage.test.js` and `src/error-check/runDetail.test.js` with fixture run objects.
## Acceptance Criteria
- [ ] File `runs.html` exists at the project root and contains the heading text `Run History`
- [ ] Visiting `/runs.html` when `ventErrorRuns.runs` is missing or `[]` shows the text `No check runs yet`
- [ ] Given a stored run, `/runs.html` shows that run’s `id` and `status` and a link to `/run-detail.html?id={runId}`
- [ ] File `run-detail.html` exists at the project root and contains the heading text `Run Detail`
- [ ] Visiting `/run-detail.html` with no `id` query param shows the text `Run not found`
- [ ] Given a stored run, `/run-detail.html?id={runId}` shows the labels `compile`, `type`, `lint`, and `test`
- [ ] `run-detail.html` and `runs.html` contain no control whose text is `Fix` or `Auto-fix`
- [ ] `npx vitest run src/error-check/runsPage.test.js src/error-check/runDetail.test.js` exits 0
## Files to Touch
- runs.html  (create)
- run-detail.html  (create)
- src/error-check/runsPage.js  (create)
- src/error-check/runDetail.js  (create)
- src/error-check/runsPage.test.js  (create)
- src/error-check/runDetail.test.js  (create)
## Owned Areas
- runs.html
- run-detail.html
- src/error-check/runsPage.js
- src/error-check/runDetail.js
## Shared Touchpoints
- src/error-check/store.js
- src/error-check/nav.js
- src/error-check/error-check.css
- vite.config.js
## Test Strategy
`npx vitest run src/error-check/runsPage.test.js src/error-check/runDetail.test.js`. Browser: open `/runs.html` for empty copy; seed `ventErrorRuns` with one run; confirm the id/status list and drill into `/run-detail.html?id=` to see the four check labels.
## AMC Task Metadata
```json
{
  "title": "[UI] Run History and Run Detail",
  "goal": "An operator can list past check runs on `/runs.html` and open one run on `/run-detail.html` to see that run’s compile, type, lint, and test statuses and findings.",
  "taskType": "delivery",
  "specRef": "specs/feat-8380ef4b/003-run-history-and-run-detail/spec.md",
  "acceptanceCriteria": [
    "File `runs.html` exists at the project root and contains the heading text `Run History`",
    "Visiting `/runs.html` when `ventErrorRuns.runs` is missing or `[]` shows the text `No check runs yet`",
    "Given a stored run, `/runs.html` shows that run’s `id` and `status` and a link to `/run-detail.html?id={runId}`",
    "File `run-detail.html` exists at the project root and contains the heading text `Run Detail`",
    "Visiting `/run-detail.html` with no `id` query param shows the text `Run not found`",
    "Given a stored run, `/run-detail.html?id={runId}` shows the labels `compile`, `type`, `lint`, and `test`",
    "`run-detail.html` and `runs.html` contain no control whose text is `Fix` or `Auto-fix`",
    "`npx vitest run src/error-check/runsPage.test.js src/error-check/runDetail.test.js` exits 0"
  ],
  "testCommand": "npx vitest run src/error-check/runsPage.test.js src/error-check/runDetail.test.js",
  "phase": "build",
  "ownedAreas": [
    "runs.html",
    "run-detail.html",
    "src/error-check/runsPage.js",
    "src/error-check/runDetail.js"
  ],
  "sharedTouchpoints": [
    "src/error-check/store.js",
    "src/error-check/nav.js",
    "src/error-check/error-check.css",
    "vite.config.js"
  ],
  "dependsOn": [
    "[UI] Error Dashboard"
  ],
  "designSurfaceIds": [
    "runs",
    "run-detail"
  ],
  "browserVerification": {
    "required": true,
    "criteria": [
      {
        "id": "AC-FE-4",
        "text": "runs.html shows heading Run History and the text No check runs yet when no runs are stored",
        "route": "/runs.html"
      },
      {
        "id": "AC-FE-5",
        "text": "run-detail.html shows heading Run Detail and the text Run not found when no id is provided",
        "route": "/run-detail.html"
      }
    ]
  }
}
```
---
