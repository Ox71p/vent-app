import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CHECK_KEYS as RUNNER_CHECK_KEYS, runChecks } from './runChecks.js';
import { CHECK_KEYS as STORE_CHECK_KEYS, appendRun } from './store.js';
import { ERROR_CHECK_NAV_ITEMS } from './nav.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

function memoryStorage() {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key(index) {
      return [...data.keys()][index] ?? null;
    },
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(String(key), String(value)); },
    removeItem: (key) => { data.delete(key); },
    clear: () => { data.clear(); },
  };
}

function mockSpawn(handler) {
  return (command, args, options) => {
    const result = handler(command, args, options) || { code: 0, stdout: '', stderr: '' };
    return Promise.resolve(result);
  };
}

const FIX_CONTROL = />\s*(Fix|Auto-fix|Apply fixes)\s*</;

const SURFACES = {
  dashboard: read('index.html'),
  errorDetail: read('error-detail.html'),
  runs: read('runs.html'),
  runDetail: read('run-detail.html'),
  settings: read('settings.html'),
};

describe('feature integration: report-only compile/type/lint/test', () => {
  it('exposes Error Dashboard on index.html with Run checks and no fix control', () => {
    const html = SURFACES.dashboard;
    expect(html).toMatch(/id="view-errors"/);
    expect(html).toContain('Error Dashboard');
    expect(html).toMatch(/<button[^>]*>Run checks<\/button>/);
    expect(html).toMatch(/class="dock-item"[^>]*data-target="view-errors"/);
    expect(html).not.toMatch(FIX_CONTROL);
    const view = html.slice(html.indexOf('id="view-errors"'));
    expect(view).not.toMatch(FIX_CONTROL);
  });

  it('ships the four MPA surfaces at the project root', () => {
    for (const name of ['error-detail.html', 'runs.html', 'run-detail.html', 'settings.html']) {
      expect(existsSync(path.join(root, name))).toBe(true);
    }
    expect(SURFACES.errorDetail).toContain('Error Detail');
    expect(SURFACES.runs).toContain('Run History');
    expect(SURFACES.runDetail).toContain('Run Detail');
    expect(SURFACES.settings).toContain('Settings');
    expect(SURFACES.settings).toContain('Checks report findings only and do not change code.');
  });

  it('keeps MPA pages scrollable and linked through the shared nav helper', () => {
    for (const html of [SURFACES.errorDetail, SURFACES.runs, SURFACES.runDetail, SURFACES.settings]) {
      expect(html).toMatch(/<body class="error-check-page">/);
      expect(html).toMatch(/<a\s+href="\/"\s*>Error Dashboard<\/a>/);
      expect(html).not.toMatch(FIX_CONTROL);
    }
    expect(ERROR_CHECK_NAV_ITEMS.map((item) => [item.label, item.href])).toEqual([
      ['Error Dashboard', '/'],
      ['Run History', '/runs.html'],
      ['Settings', '/settings.html'],
    ]);
  });

  it('does not pass --fix from the runner or lint script', () => {
    const runner = read('src/error-check/runChecks.js');
    const pkg = JSON.parse(read('package.json'));
    expect(runner).not.toContain('--fix');
    expect(pkg.scripts.lint).not.toMatch(/--fix/);
    expect(pkg.scripts).toHaveProperty('lint');
    expect(pkg.scripts).toHaveProperty('typecheck');
    expect(pkg.scripts).toHaveProperty('test');
  });

  it('stores a run with exactly compile, type, lint, and test checks', async () => {
    expect(STORE_CHECK_KEYS).toEqual(['compile', 'type', 'lint', 'test']);
    expect(RUNNER_CHECK_KEYS).toEqual(STORE_CHECK_KEYS);

    /** @type {any} */ (globalThis).localStorage = memoryStorage();
    try {
      const run = await runChecks({
        settings: { compile: true, type: false, lint: true, test: false },
        spawn: mockSpawn((_command, args) => {
          const script = args[1];
          if (script === 'lint') {
            return { code: 1, stdout: "src/main.js\n  1:1  error  nope  no-undef\n", stderr: '' };
          }
          return { code: 0, stdout: '', stderr: '' };
        }),
      });
      expect(Object.keys(run.checks)).toEqual(['compile', 'type', 'lint', 'test']);
      expect(run.checks.type.status).toBe('skipped');
      expect(run.checks.lint.status).toBe('fail');

      const stored = appendRun(run);
      expect(Object.keys(stored.checks)).toEqual(['compile', 'type', 'lint', 'test']);
    } finally {
      /** @type {any} */ (globalThis).localStorage = undefined;
    }
  });
});

describe('feature integration: dashboard finding links', () => {
  it('points findings at /error-detail.html?id= and runs at /run-detail.html?id=', () => {
    const dashboard = read('src/error-check/dashboard.js');
    const runDetail = read('src/error-check/runDetail.js');
    const runsPage = read('src/error-check/runsPage.js');
    expect(dashboard).toContain('/error-detail.html?id=');
    expect(runDetail).toContain('/error-detail.html?id=');
    expect(runsPage).toContain('/run-detail.html?id=');
    expect(dashboard).not.toMatch(/Fix|Auto-fix|--fix/);
  });
});
