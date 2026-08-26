import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  displayField,
  parseRunId,
  renderRunDetail,
  resolveRunDetail,
  runDetailMarkup,
} from './runDetail.js';

const htmlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../run-detail.html');
const pageHtml = readFileSync(htmlPath, 'utf8');

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
    status: 'fail',
    startedAt: '2026-08-26T12:00:00.000Z',
    finishedAt: '2026-08-26T12:00:01.000Z',
    checks: {
      compile: emptyCheck(),
      type: emptyCheck(),
      lint: { status: 'fail', findings: [sampleFinding()] },
      test: emptyCheck(),
    },
    ...overrides,
  };
}

function mockStore(runById = {}) {
  return {
    getRun(id) {
      if (id == null || id === '') return null;
      return runById[id] || null;
    },
  };
}

describe('run-detail.html', () => {
  it('contains the Run Detail heading and history / dashboard links', () => {
    expect(pageHtml).toContain('Run Detail');
    expect(pageHtml).toMatch(/<a\s+href="\/#view-errors"\s*>Error Dashboard<\/a>/);
    expect(pageHtml).toMatch(/<a\s+href="\/runs\.html"\s*>Run History<\/a>/);
    expect(pageHtml).toContain('Run not found');
    expect(pageHtml).not.toMatch(/>\s*Fix\s*</);
    expect(pageHtml).not.toMatch(/>\s*Auto-fix\s*</);
    expect(pageHtml).toContain('/src/error-check/runDetail.js');
  });
});

describe('parseRunId', () => {
  it('reads id from a query string, URL, or URLSearchParams', () => {
    expect(parseRunId('?id=run-1')).toBe('run-1');
    expect(parseRunId('id=run-1')).toBe('run-1');
    expect(parseRunId('/run-detail.html?id=run-1')).toBe('run-1');
    expect(parseRunId('https://example.test/run-detail.html?id=run-1')).toBe('run-1');
    expect(parseRunId(new URLSearchParams('id=run-1'))).toBe('run-1');
  });

  it('returns null when id is missing or empty', () => {
    expect(parseRunId('')).toBeNull();
    expect(parseRunId(null)).toBeNull();
    expect(parseRunId('?foo=bar')).toBeNull();
    expect(parseRunId('?id=')).toBeNull();
    expect(parseRunId(new URLSearchParams(''))).toBeNull();
  });
});

describe('displayField', () => {
  it('shows an em dash for null or empty values', () => {
    expect(displayField(null)).toBe('—');
    expect(displayField('')).toBe('—');
    expect(displayField('fail')).toBe('fail');
  });
});

describe('resolveRunDetail', () => {
  it('reports Run not found when the query has no id', () => {
    const detail = resolveRunDetail('', mockStore({ 'run-1': sampleRun() }));
    expect(detail.found).toBe(false);
    expect(detail.missingText).toBe('Run not found');
    expect(detail.heading).toBe('Run Detail');
    expect(detail.status).toBeNull();
  });

  it('reads status and checks from a mock store by run id', () => {
    const run = sampleRun();
    const detail = resolveRunDetail('?id=run-1', mockStore({ 'run-1': run }));
    expect(detail.found).toBe(true);
    expect(detail.status).toBe('fail');
    expect(detail.checks).toHaveProperty('compile');
    expect(detail.checks).toHaveProperty('type');
    expect(detail.checks).toHaveProperty('lint');
    expect(detail.checks).toHaveProperty('test');
    expect(detail.missingText).toBeNull();
  });

  it('reports Run not found when the id is unknown', () => {
    const detail = resolveRunDetail('?id=missing', mockStore({ 'run-1': sampleRun() }));
    expect(detail.found).toBe(false);
    expect(detail.missingText).toBe('Run not found');
  });
});

describe('runDetailMarkup and renderRunDetail', () => {
  it('renders Run not found for a missing run', () => {
    const html = runDetailMarkup(null);
    expect(html).toContain('Run not found');
    expect(html).not.toMatch(/>\s*Fix\s*</);
    expect(html).not.toMatch(/>\s*Auto-fix\s*</);
  });

  it('renders compile, type, lint, and test labels plus finding links', () => {
    const html = runDetailMarkup(sampleRun());
    expect(html).toContain('compile');
    expect(html).toContain('type');
    expect(html).toContain('lint');
    expect(html).toContain('test');
    expect(html).toContain('fail');
    expect(html).toContain("'x' is not defined");
    expect(html).toContain('/error-detail.html?id=finding-1');
    expect(html).toContain('data-check="compile"');
    expect(html).toContain('data-check="type"');
    expect(html).toContain('data-check="lint"');
    expect(html).toContain('data-check="test"');
    expect(html).not.toMatch(/>\s*Fix\s*</);
    expect(html).not.toMatch(/>\s*Auto-fix\s*</);
    expect(html).not.toContain('Apply');
  });

  it('writes markup onto a mock root using a mock store', () => {
    const body = { innerHTML: '' };
    const root = {
      querySelector(selector) {
        return selector === '#run-detail-body' ? body : null;
      },
    };
    const run = sampleRun();
    const detail = renderRunDetail(root, {
      search: '?id=run-1',
      store: mockStore({ 'run-1': run }),
    });
    expect(detail.found).toBe(true);
    expect(body.innerHTML).toContain('compile');
    expect(body.innerHTML).toContain('type');
    expect(body.innerHTML).toContain('lint');
    expect(body.innerHTML).toContain('test');
    expect(body.innerHTML).toContain("'x' is not defined");

    renderRunDetail(root, { search: '', store: mockStore({ 'run-1': run }) });
    expect(body.innerHTML).toContain('Run not found');
  });
});
