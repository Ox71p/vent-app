---
# [UI] Settings
## Task Type
delivery
## Goal
An operator can open `/settings.html` and enable or disable the compile, type, lint, and test checkers; the next `Run checks` skip-disables those categories. There is no auto-fix setting.
## Context
Ticket 001’s store already has `getSettings` / `setSettings` with defaults `{ compile: true, type: true, lint: true, test: true }` inside `ventErrorRuns`. The runner in `src/error-check/runChecks.js` must skip a category when its setting is false (`status: "skipped"`). This page is **not** Vent’s existing `#view-settings` in `index.html` (About me / Interface / Intelligence / Account / Data / Accessibility). Do not add toggles to `#set-intelligence` or other Vent panes. `src/main.js` persists Vent settings as individual `vent*` keys; error-check settings stay in the 001 store, not new `ventLint` keys. `index.html` `#settingInsights` is an unrelated checkbox — do not reuse it. Locked intent remains report-only: no control that writes source or passes `--fix`.
## Technical Approach
Create root `settings.html`. Heading `Settings`. Module `src/error-check/settingsPage.js`: `renderErrorCheckNav('settings')`; `getSettings()`; four checkbox (or equivalent) controls labeled exactly `Compile`, `Type`, `Lint`, and `Test`. On change, `setSettings` with the four booleans. Do not add a save round-trip that requires a second button unless needed for accessibility; immediate persist on toggle is enough and matches Vent’s `localStorage.setItem` on `change`/`input` in `src/main.js`.

Include copy that checks report findings and do not modify source, visible text: `Checks report findings only and do not change code.` No `Fix`, `Auto-fix`, or `Apply fixes` control.

Anchor `Error Dashboard` → `/`. Do not modify `src/error-check/store.js` or `runChecks.js` unless a getter is missing (then stop — that is 001’s ownership; file a gap for integration rather than restacking the runner).

Tests in `src/error-check/settingsPage.test.js`: toggling `Lint` off writes `settings.lint === false`; renderer includes the four labels and the report-only sentence; no Fix label.
## Acceptance Criteria
- [ ] File `settings.html` exists at the project root and contains the heading text `Settings`
- [ ] `settings.html` contains labeled controls `Compile`, `Type`, `Lint`, and `Test`
- [ ] Toggling `Lint` off writes `settings.lint` as `false` in the `ventErrorRuns` store
- [ ] `settings.html` contains the text `Checks report findings only and do not change code.`
- [ ] `settings.html` contains no control whose text is `Fix` or `Auto-fix`
- [ ] After `settings.lint` is `false`, the next check run stores `checks.lint.status` as `skipped`
- [ ] `settings.html` contains an anchor with text `Error Dashboard` and `href="/"`
- [ ] `npx vitest run src/error-check/settingsPage.test.js` exits 0
## Files to Touch
- settings.html  (create)
- src/error-check/settingsPage.js  (create)
- src/error-check/settingsPage.test.js  (create)
## Owned Areas
- settings.html
- src/error-check/settingsPage.js
## Shared Touchpoints
- src/error-check/store.js
- src/error-check/runChecks.js
- src/error-check/nav.js
- src/error-check/error-check.css
- index.html#view-settings
## Test Strategy
`npx vitest run src/error-check/settingsPage.test.js`. Browser: open `/settings.html`, confirm four labels and the report-only sentence, turn `Lint` off, go to `/`, click `Run checks`, confirm the lint row reads `skipped`. Do not use Vent `#view-settings` for this.
## AMC Task Metadata
```json
{
  "title": "[UI] Settings",
  "goal": "An operator can open `/settings.html` and enable or disable the compile, type, lint, and test checkers; the next `Run checks` skip-disables those categories. There is no auto-fix setting.",
  "taskType": "delivery",
  "specRef": "specs/feat-8380ef4b/004-settings/spec.md",
  "acceptanceCriteria": [
    "File `settings.html` exists at the project root and contains the heading text `Settings`",
    "`settings.html` contains labeled controls `Compile`, `Type`, `Lint`, and `Test`",
    "Toggling `Lint` off writes `settings.lint` as `false` in the `ventErrorRuns` store",
    "`settings.html` contains the text `Checks report findings only and do not change code.`",
    "`settings.html` contains no control whose text is `Fix` or `Auto-fix`",
    "After `settings.lint` is `false`, the next check run stores `checks.lint.status` as `skipped`",
    "`settings.html` contains an anchor with text `Error Dashboard` and `href=\"/\"`",
    "`npx vitest run src/error-check/settingsPage.test.js` exits 0"
  ],
  "testCommand": "npx vitest run src/error-check/settingsPage.test.js",
  "phase": "build",
  "ownedAreas": [
    "settings.html",
    "src/error-check/settingsPage.js"
  ],
  "sharedTouchpoints": [
    "src/error-check/store.js",
    "src/error-check/runChecks.js",
    "src/error-check/nav.js",
    "src/error-check/error-check.css",
    "index.html#view-settings"
  ],
  "dependsOn": [
    "[UI] Error Dashboard"
  ],
  "designSurfaceIds": [
    "settings"
  ],
  "browserVerification": {
    "required": true,
    "criteria": [
      {
        "id": "AC-FE-6",
        "text": "settings.html shows heading Settings, Compile/Type/Lint/Test controls, the report-only sentence, and no Fix control",
        "route": "/settings.html"
      }
    ]
  }
}
```
---
