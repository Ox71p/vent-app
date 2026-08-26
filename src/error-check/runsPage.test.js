import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  EMPTY_RUNS_TEXT,
  renderRunsPage,
  resolveRunsPage,
  runsListMarkup,
  sortRunsNewestFirst,
} from './runsPage.js';

const htmlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../runs.html');
const pageHtml = readFileSync(htmlPath, 'utf8');

function emptyCheck(status = 'pass') {
  return { status, findings: [] };
}

function sampleRun(overrides = {}) {
  return {
    id: 'run-1',
    status: 'fail',
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

function mockStore(runs = []) {
  return {
    getRuns() {
      return runs;
    },
  };
}

describe('runs.html', () => {
  it('contains the Run History heading, dashboard link, and empty copy', () => {
    expect(pageHtml).toContain('Run History');
    expect(pageHtml).toMatch(/<a\s+href="\/"\s*>Error Dashboard<\/a>/);
    expect(pageHtml).toContain('No check runs yet');
    expect(pageHtml).not.toMatch(/>\s*Fix\s*</);
    expect(pageHtml).not.toMatch(/>\s*Auto-fix\s*</);
    expect(pageHtml).toContain('/src/error-check/runsPage.js');
  });
});

describe('resolveRunsPage', () => {
  it('reports No check runs yet when the store has no runs', () => {
    const page = resolveRunsPage(mockStore([]));
    expect(page.empty).toBe(true);
    expect(page.emptyText).toBe('No check runs yet');
    expect(page.heading).toBe('Run History');
    expect(page.runs).toEqual([]);
  });

  it('returns stored runs newest first', () => {
    const older = sampleRun({ id: 'run-old', startedAt: '2026-08-25T12:00:00.000Z', status: 'pass' });
    const newer = sampleRun({ id: 'run-new', startedAt: '2026-08-26T12:00:00.000Z', status: 'fail' });
    const page = resolveRunsPage(mockStore([older, newer]));
    expect(page.empty).toBe(false);
    expect(page.runs.map((run) => run.id)).toEqual(['run-new', 'run-old']);
  });
});

describe('sortRunsNewestFirst', () => {
  it('orders by startedAt descending', () => {
    const runs = [
      sampleRun({ id: 'a', startedAt: '2026-08-24T00:00:00.000Z' }),
      sampleRun({ id: 'c', startedAt: '2026-08-26T00:00:00.000Z' }),
      sampleRun({ id: 'b', startedAt: '2026-08-25T00:00:00.000Z' }),
    ];
    expect(sortRunsNewestFirst(runs).map((run) => run.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('runsListMarkup and renderRunsPage', () => {
  it('renders No check runs yet when the list is empty', () => {
    const html = runsListMarkup([]);
    expect(html).toContain(EMPTY_RUNS_TEXT);
    expect(html).toContain('No check runs yet');
    expect(html).not.toMatch(/>\s*Fix\s*</);
    expect(html).not.toMatch(/>\s*Auto-fix\s*</);
  });

  it('renders a run id, status, and link to run-detail', () => {
    const html = runsListMarkup([sampleRun({ id: 'run-1', status: 'fail' })]);
    expect(html).toContain('run-1');
    expect(html).toContain('fail');
    expect(html).toContain('/run-detail.html?id=run-1');
    expect(html).not.toMatch(/>\s*Fix\s*</);
    expect(html).not.toMatch(/>\s*Auto-fix\s*</);
  });

  it('writes empty copy onto a mock root when no runs are stored', () => {
    const body = { innerHTML: '' };
    const root = {
      querySelector(selector) {
        return selector === '#runs-page-body' ? body : null;
      },
    };
    const page = renderRunsPage(root, { store: mockStore([]) });
    expect(page.empty).toBe(true);
    expect(body.innerHTML).toContain('No check runs yet');
  });

  it('writes id, status, and detail link onto a mock root for a stored run', () => {
    const body = { innerHTML: '' };
    const root = {
      querySelector(selector) {
        return selector === '#runs-page-body' ? body : null;
      },
    };
    const run = sampleRun({ id: 'run-42', status: 'pass' });
    const page = renderRunsPage(root, { store: mockStore([run]) });
    expect(page.empty).toBe(false);
    expect(body.innerHTML).toContain('run-42');
    expect(body.innerHTML).toContain('pass');
    expect(body.innerHTML).toContain('/run-detail.html?id=run-42');
  });
});
