---
# [UI] Error Detail
## Task Type
delivery
## Goal
An operator can open a single finding from the Error Dashboard and see its check kind, file, line, and message on `/error-detail.html` — still report-only, with no fix action.
## Context
Ticket 001 adds `ventErrorRuns` and dashboard links of the form `/error-detail.html?id={findingId}`, but that HTML file does not exist yet. `index.html` is currently the only HTML page (Vite default single entry). `src/main.js` already has a drill-in pattern for log cards (`#log-entry-{id}`, `window.jumpToEntry`) that this page should mirror for findings: identity in the URL, missing identity shows an explicit empty string. `src/nlpEngine.js` and `netlify/functions/processEntry.mjs` show the existing JSON request/response style this app uses; findings are client-side records, not a new Gemini call. Do not invent a second store. Do not edit `src/main.js` or Vent journal views.
## Technical Approach
Create root `error-detail.html` (Vite MPA input is already globbed by ticket 001’s `vite.config.js` — do not modify `vite.config.js`). Page head links `/src/style.css` and `/src/error-check/error-check.css`. Module `/src/error-check/errorDetail.js` on load: call `renderErrorCheckNav('error-detail')` from `src/error-check/nav.js`; read `id` from `URLSearchParams`; `getFinding(id)` from `src/error-check/store.js`.

If no finding: visible text `Finding not found`. If found: heading `Error Detail` and visible fields for `check`, `file` (or `—` when null), `line` (or `—` when null), `message`, and `severity`. Link with text `Error Dashboard` and `href="/"`. Link with text `Run History` and `href="/runs.html"`. No `Fix` / `Apply` / `Auto-fix` control. Do not call the runner. Do not write findings except via existing store getters.

Unit-test URL parsing and render helpers in `src/error-check/errorDetail.test.js` with a mock store object (no browser required).
## Acceptance Criteria
- [ ] File `error-detail.html` exists at the project root
- [ ] `error-detail.html` contains the heading text `Error Detail`
- [ ] Visiting `/error-detail.html` with no `id` query param shows the text `Finding not found`
- [ ] Given a finding stored under `ventErrorRuns`, visiting `/error-detail.html?id={findingId}` shows that finding’s `message` text and its `check` value
- [ ] `error-detail.html` contains an anchor with text `Error Dashboard` and `href="/"`
- [ ] `error-detail.html` contains no control whose text is `Fix` or `Auto-fix`
- [ ] `npx vitest run src/error-check/errorDetail.test.js` exits 0
## Files to Touch
- error-detail.html  (create)
- src/error-check/errorDetail.js  (create)
- src/error-check/errorDetail.test.js  (create)
## Owned Areas
- error-detail.html
- src/error-check/errorDetail.js
## Shared Touchpoints
- src/error-check/store.js
- src/error-check/nav.js
- src/error-check/error-check.css
- vite.config.js
## Test Strategy
`npx vitest run src/error-check/errorDetail.test.js` covers missing-id and populated-finding render strings. Browser: open `/error-detail.html` and confirm `Error Detail` plus `Finding not found`; seed one finding in `localStorage` and reload with `?id=` to see `message` and `check`.
## AMC Task Metadata
```json
{
  "title": "[UI] Error Detail",
  "goal": "An operator can open a single finding from the Error Dashboard and see its check kind, file, line, and message on `/error-detail.html` — still report-only, with no fix action.",
  "taskType": "delivery",
  "specRef": "specs/feat-8380ef4b/002-error-detail/spec.md",
  "acceptanceCriteria": [
    "File `error-detail.html` exists at the project root",
    "`error-detail.html` contains the heading text `Error Detail`",
    "Visiting `/error-detail.html` with no `id` query param shows the text `Finding not found`",
    "Given a finding stored under `ventErrorRuns`, visiting `/error-detail.html?id={findingId}` shows that finding’s `message` text and its `check` value",
    "`error-detail.html` contains an anchor with text `Error Dashboard` and `href=\"/\"`",
    "`error-detail.html` contains no control whose text is `Fix` or `Auto-fix`",
    "`npx vitest run src/error-check/errorDetail.test.js` exits 0"
  ],
  "testCommand": "npx vitest run src/error-check/errorDetail.test.js",
  "phase": "build",
  "ownedAreas": [
    "error-detail.html",
    "src/error-check/errorDetail.js"
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
    "error-detail"
  ],
  "browserVerification": {
    "required": true,
    "criteria": [
      {
        "id": "AC-FE-3",
        "text": "error-detail.html shows heading Error Detail and the text Finding not found when no id is provided",
        "route": "/error-detail.html"
      }
    ]
  }
}
```
---
