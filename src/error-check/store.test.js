import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  appendRun,
  getFinding,
  getLatestRun,
  getRun,
  getRuns,
  getSettings,
  setSettings,
} from './store.js';

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

function emptyCheck(status = 'pass') {
  return { status, findings: [] };
}

function sampleFinding(overrides = {}) {
  return {
    id: 'finding-1',
    runId: 'run-1',
    check: 'lint',
    file: 'src/main.js',
    line: 10,
    message: "'x' is not defined",
    severity: 'error',
    ...overrides,
  };
}

function sampleRun(overrides = {}) {
  return {
    id: 'run-1',
    startedAt: '2026-08-26T12:00:00.000Z',
    finishedAt: '2026-08-26T12:00:01.000Z',
    checks: {
      compile: emptyCheck(),
      type: emptyCheck(),
      lint: emptyCheck(),
      test: emptyCheck(),
    },
    ...overrides,
  };
}

beforeEach(() => {
  /** @type {any} */ (globalThis).localStorage = memoryStorage();
});

afterEach(() => {
  /** @type {any} */ (globalThis).localStorage = undefined;
});

describe('store', () => {
  it('defaults all four settings to true and persists under ventErrorRuns', () => {
    expect(getSettings()).toEqual({
      compile: true,
      type: true,
      lint: true,
      test: true,
    });
    expect(getRuns()).toEqual([]);
    expect(getLatestRun()).toBeNull();
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    expect(raw).toBeNull();
  });

  it('round-trips appendRun, getRuns, getLatestRun, getRun, and getFinding', () => {
    const finding = sampleFinding();
    const stored = appendRun(sampleRun({
      checks: {
        compile: emptyCheck(),
        type: emptyCheck(),
        lint: { status: 'fail', findings: [finding] },
        test: emptyCheck(),
      },
    }));

    expect(stored.status).toBe('fail');
    expect(getRuns()).toHaveLength(1);
    expect(getLatestRun().id).toBe('run-1');
    expect(getRun('run-1').checks.lint.findings[0].message).toBe("'x' is not defined");
    expect(getFinding('finding-1')).toMatchObject({
      id: 'finding-1',
      check: 'lint',
      file: 'src/main.js',
      line: 10,
    });
    expect(getFinding('missing')).toBeNull();

    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(raw.runs[0].id).toBe('run-1');
    expect(Object.keys(stored.checks)).toEqual(['compile', 'type', 'lint', 'test']);
    expect(Object.keys(raw.runs[0].checks)).toEqual(['compile', 'type', 'lint', 'test']);
  });

  it('keeps newest run first and reports pass when no error findings', () => {
    appendRun(sampleRun({ id: 'older' }));
    appendRun(sampleRun({ id: 'newer' }));
    expect(getLatestRun().id).toBe('newer');
    expect(getRuns().map((run) => run.id)).toEqual(['newer', 'older']);
    expect(getLatestRun().status).toBe('pass');
  });

  it('marks a run fail when an enabled check has status fail', () => {
    const stored = appendRun(sampleRun({
      checks: {
        compile: { status: 'fail', findings: [] },
        type: emptyCheck(),
        lint: emptyCheck(),
        test: emptyCheck(),
      },
    }));
    expect(stored.status).toBe('fail');
  });

  it('setSettings merges booleans and ignores unknown keys', () => {
    const next = setSettings({ lint: false, extra: true, type: 'nope' });
    expect(next).toEqual({
      compile: true,
      type: true,
      lint: false,
      test: true,
    });
    expect(getSettings().lint).toBe(false);
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(raw.settings.lint).toBe(false);
  });
});
