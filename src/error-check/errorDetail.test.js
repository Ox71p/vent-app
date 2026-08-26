import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  displayField,
  findingDetailMarkup,
  parseFindingId,
  renderErrorDetail,
  resolveErrorDetail,
} from './errorDetail.js';

const htmlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../error-detail.html');
const pageHtml = readFileSync(htmlPath, 'utf8');

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

function mockStore(findingById = {}) {
  return {
    getFinding(id) {
      if (id == null || id === '') return null;
      return findingById[id] || null;
    },
  };
}

describe('error-detail.html', () => {
  it('contains the Error Detail heading and dashboard link', () => {
    expect(pageHtml).toContain('Error Detail');
    expect(pageHtml).toMatch(/<body class="error-check-page">/);
    expect(pageHtml).toMatch(/<a\s+href="\/"\s*>Error Dashboard<\/a>/);
    expect(pageHtml).toMatch(/<a\s+href="\/runs\.html"\s*>Run History<\/a>/);
    expect(pageHtml).not.toMatch(/>\s*Fix\s*</);
    expect(pageHtml).not.toMatch(/>\s*Auto-fix\s*</);
    expect(pageHtml).toContain('/src/error-check/errorDetail.js');
  });
});

describe('parseFindingId', () => {
  it('reads id from a query string, URL, or URLSearchParams', () => {
    expect(parseFindingId('?id=finding-1')).toBe('finding-1');
    expect(parseFindingId('id=finding-1')).toBe('finding-1');
    expect(parseFindingId('/error-detail.html?id=finding-1')).toBe('finding-1');
    expect(parseFindingId('https://example.test/error-detail.html?id=finding-1')).toBe('finding-1');
    expect(parseFindingId(new URLSearchParams('id=finding-1'))).toBe('finding-1');
  });

  it('returns null when id is missing or empty', () => {
    expect(parseFindingId('')).toBeNull();
    expect(parseFindingId(null)).toBeNull();
    expect(parseFindingId('?foo=bar')).toBeNull();
    expect(parseFindingId('?id=')).toBeNull();
    expect(parseFindingId(new URLSearchParams(''))).toBeNull();
  });
});

describe('displayField', () => {
  it('shows an em dash for null or empty file and line', () => {
    expect(displayField(null)).toBe('—');
    expect(displayField('')).toBe('—');
    expect(displayField(12)).toBe('12');
    expect(displayField('src/main.js')).toBe('src/main.js');
  });
});

describe('resolveErrorDetail', () => {
  it('reports Finding not found when the query has no id', () => {
    const detail = resolveErrorDetail('', mockStore({ 'finding-1': sampleFinding() }));
    expect(detail.found).toBe(false);
    expect(detail.missingText).toBe('Finding not found');
    expect(detail.heading).toBe('Error Detail');
    expect(detail.message).toBeNull();
    expect(detail.check).toBeNull();
  });

  it('reads check and message from a mock store by finding id', () => {
    const finding = sampleFinding();
    const detail = resolveErrorDetail('?id=finding-1', mockStore({ 'finding-1': finding }));
    expect(detail.found).toBe(true);
    expect(detail.check).toBe('lint');
    expect(detail.message).toBe("'x' is not defined");
    expect(detail.file).toBe('src/main.js');
    expect(detail.line).toBe('10');
    expect(detail.severity).toBe('error');
    expect(detail.missingText).toBeNull();
  });

  it('reports Finding not found when the id is unknown', () => {
    const detail = resolveErrorDetail('?id=missing', mockStore({ 'finding-1': sampleFinding() }));
    expect(detail.found).toBe(false);
    expect(detail.missingText).toBe('Finding not found');
  });
});

describe('findingDetailMarkup and renderErrorDetail', () => {
  it('renders Finding not found for a missing finding', () => {
    const html = findingDetailMarkup(null);
    expect(html).toContain('Finding not found');
    expect(html).not.toMatch(/>\s*Fix\s*</);
    expect(html).not.toMatch(/>\s*Auto-fix\s*</);
  });

  it('renders check, file, line, message, and severity', () => {
    const html = findingDetailMarkup(sampleFinding({ file: null, line: null }));
    expect(html).toContain('lint');
    expect(html).toContain("'x' is not defined");
    expect(html).toContain('error');
    expect(html).toContain('—');
    expect(html).toContain('data-field="check"');
    expect(html).toContain('data-field="message"');
    expect(html).not.toMatch(/>\s*Fix\s*</);
    expect(html).not.toMatch(/>\s*Auto-fix\s*</);
    expect(html).not.toContain('Apply');
  });

  it('writes markup onto a mock root using a mock store', () => {
    const body = { innerHTML: '' };
    const root = {
      querySelector(selector) {
        return selector === '#error-detail-body' ? body : null;
      },
    };
    const finding = sampleFinding();
    const detail = renderErrorDetail(root, {
      search: '?id=finding-1',
      store: mockStore({ 'finding-1': finding }),
    });
    expect(detail.found).toBe(true);
    expect(body.innerHTML).toContain('lint');
    expect(body.innerHTML).toContain("'x' is not defined");

    renderErrorDetail(root, { search: '', store: mockStore({ 'finding-1': finding }) });
    expect(body.innerHTML).toContain('Finding not found');
  });
});
