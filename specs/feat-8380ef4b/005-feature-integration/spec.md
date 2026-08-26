---
# Integrate, validate, and harden the complete feature
## Task Type
feature_integration
## Goal
Inspect the cumulative Error Dashboard feature from base to HEAD, prove the original report-only compile/type/lint/test goal holds across all five surfaces, and make plus test corrective changes only when a cross-ticket gap is found.
## Context
Delivery tickets add `src/error-check/*`, `netlify/functions/runChecks.mjs`, tool configs, `#view-errors` on `index.html`, and MPA pages `error-detail.html`, `runs.html`, `run-detail.html`, `settings.html`. Vent product code remains `src/main.js`, `src/auth.js`, `src/nlpEngine.js`, `src/style.css`, `src/counter.js`, and `netlify/functions/processEntry.mjs`. `package.json` originally had only `dev`/`build`/`preview`. Locked intent: report findings only; do not change code to fix discovered Vent errors; only compile/type/lint/test. This ticket runs last in the shared worktree. It may finish with zero source edits when evidence shows the feature is already complete.
## Technical Approach
1. Diff base→HEAD. Confirm one store (`ventErrorRuns`), one runner, one nav helper, and no second checker implementation. Confirm `vite.config.js` glob includes every new root HTML file. Confirm `package.json` scripts `lint`, `typecheck`, `test` exist.
2. Trace original goal to evidence: dashboard can run checks; detail/history/settings pages exist; settings skip is honored; no Fix control on any surface; runner has no `--fix` and does not write `src/main.js` / `src/nlpEngine.js` / `src/auth.js` / `netlify/functions/processEntry.mjs`.
3. Run `npm test` and `npm run build`. Do **not** fail this ticket because `npm run lint` or `npm run typecheck` is non-zero on pre-existing Vent files — those failures are findings, not integration defects.
4. Manual/browser path: `/` → Error Dashboard → `Run checks` → open a finding on `/error-detail.html` → `/runs.html` → `/run-detail.html` → `/settings.html` disable one check → run again → that check is `skipped`.
5. If a contract mismatch exists (nav labels, query param names, store shape, missing MPA input, dashboard links 404), fix it here with the smallest edit. If the feature already holds, commit nothing and still run the test command.
6. Do not “clean up” Vent lint/type issues, unused `src/counter.js`, or the `dockItems.forEach` nesting in `src/main.js` — those are in-scope only as reported findings.
## Acceptance Criteria
- [ ] `index.html` contains `id="view-errors"` and the text `Error Dashboard`
- [ ] Files `error-detail.html`, `runs.html`, `run-detail.html`, and `settings.html` exist at the project root
- [ ] `src/error-check/runChecks.js` does not contain the string `--fix`
- [ ] A stored run’s `checks` object has exactly the keys `compile`, `type`, `lint`, and `test`
- [ ] `settings.html` contains the text `Checks report findings only and do not change code.`
- [ ] `npm test` exits 0
- [ ] `npm run build` exits 0
- [ ] Every original requirement (report-only compile/type/lint/test check, five named surfaces, no source auto-fix) maps to cumulative code or test evidence
## Files to Touch
- src/error-check/store.js  (modify)
- src/error-check/runChecks.js  (modify)
- src/error-check/dashboard.js  (modify)
- src/error-check/nav.js  (modify)
- index.html  (modify)
- error-detail.html  (modify)
- runs.html  (modify)
- run-detail.html  (modify)
- settings.html  (modify)
- vite.config.js  (modify)
- package.json  (modify)
## Owned Areas
- (corrective feature-wide scope)
## Shared Touchpoints
- All completed delivery work, for integration fixes only
## Test Strategy
`npm test && npm run build` must exit 0. Walk `/`, `/error-detail.html`, `/runs.html`, `/run-detail.html`, and `/settings.html`. Confirm disabling a check yields `skipped` on the next run. Confirm no Fix control. Do not require a green ESLint/tsc run against existing Vent sources.
## AMC Task Metadata
```json
{
  "title": "Integrate, validate, and harden the complete feature",
  "goal": "Inspect the cumulative Error Dashboard feature from base to HEAD, prove the original report-only compile/type/lint/test goal holds across all five surfaces, and make plus test corrective changes only when a cross-ticket gap is found.",
  "taskType": "feature_integration",
  "specRef": "specs/feat-8380ef4b/005-feature-integration/spec.md",
  "acceptanceCriteria": [
    "`index.html` contains `id=\"view-errors\"` and the text `Error Dashboard`",
    "Files `error-detail.html`, `runs.html`, `run-detail.html`, and `settings.html` exist at the project root",
    "`src/error-check/runChecks.js` does not contain the string `--fix`",
    "A stored run’s `checks` object has exactly the keys `compile`, `type`, `lint`, and `test`",
    "`settings.html` contains the text `Checks report findings only and do not change code.`",
    "`npm test` exits 0",
    "`npm run build` exits 0",
    "Every original requirement (report-only compile/type/lint/test check, five named surfaces, no source auto-fix) maps to cumulative code or test evidence"
  ],
  "testCommand": "npm test && npm run build",
  "phase": "build",
  "ownedAreas": [],
  "sharedTouchpoints": [
    "All completed delivery work, for integration fixes only"
  ],
  "dependsOn": [
    "[UI] Error Dashboard",
    "[UI] Error Detail",
    "[UI] Run History and Run Detail",
    "[UI] Settings"
  ]
}
```
---
