import { getFinding as storeGetFinding } from './store.js';
import { renderErrorCheckNav } from './nav.js';

export const MISSING_FINDING_TEXT = 'Finding not found';
export const EMPTY_FIELD = '—';

/**
 * @param {string | URLSearchParams | null | undefined} search
 * @returns {string | null}
 */
export function parseFindingId(search) {
  if (search == null || search === '') return null;
  if (search instanceof URLSearchParams) {
    const fromParams = search.get('id');
    return fromParams == null || fromParams === '' ? null : fromParams;
  }

  const raw = String(search);
  let query = raw;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) {
    try {
      query = new URL(raw).search;
    } catch {
      query = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
    }
  } else if (raw.includes('?')) {
    query = raw.slice(raw.indexOf('?'));
  }

  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  const id = params.get('id');
  return id == null || id === '' ? null : id;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function displayField(value) {
  if (value == null || value === '') return EMPTY_FIELD;
  return String(value);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string | null} id
 * @param {{ getFinding?: (id: string | null) => any }} [store]
 * @returns {any | null}
 */
export function lookupFinding(id, store) {
  if (id == null || id === '') return null;
  const getter = store?.getFinding || storeGetFinding;
  try {
    return getter(id) || null;
  } catch {
    return null;
  }
}

/**
 * @param {string | URLSearchParams | null | undefined} search
 * @param {{ getFinding?: (id: string | null) => any }} [store]
 */
export function resolveErrorDetail(search, store) {
  const id = parseFindingId(search);
  const finding = lookupFinding(id, store);
  if (!finding) {
    return {
      id,
      finding: null,
      found: false,
      heading: 'Error Detail',
      missingText: MISSING_FINDING_TEXT,
      check: null,
      file: null,
      line: null,
      message: null,
      severity: null,
    };
  }
  return {
    id,
    finding,
    found: true,
    heading: 'Error Detail',
    missingText: null,
    check: displayField(finding.check),
    file: displayField(finding.file),
    line: displayField(finding.line),
    message: displayField(finding.message),
    severity: displayField(finding.severity),
  };
}

/**
 * @param {any | null} finding
 * @returns {string}
 */
export function findingDetailMarkup(finding) {
  if (!finding) {
    return `<p class="error-detail-missing">${MISSING_FINDING_TEXT}</p>`;
  }
  const fields = [
    ['check', displayField(finding.check)],
    ['file', displayField(finding.file)],
    ['line', displayField(finding.line)],
    ['message', displayField(finding.message)],
    ['severity', displayField(finding.severity)],
  ];
  const rows = fields.map(([name, value]) => (
    `<div class="error-detail-field">
      <dt>${name}</dt>
      <dd data-field="${name}">${escapeHtml(value)}</dd>
    </div>`
  )).join('');
  return `<dl class="error-detail-fields">${rows}</dl>`;
}

/**
 * @param {any} root
 * @returns {any | null}
 */
function findDetailBody(root) {
  if (!root) return null;
  if (root.querySelector) {
    return root.querySelector('#error-detail-body')
      || root.querySelector('[data-error-detail-body]')
      || null;
  }
  if (root.getElementById) {
    return root.getElementById('error-detail-body') || null;
  }
  return null;
}

/**
 * @param {any} [root]
 * @param {{ search?: string | URLSearchParams | null, store?: { getFinding?: (id: string | null) => any } }} [options]
 */
export function renderErrorDetail(root, options = {}) {
  const search = options.search ?? (typeof location !== 'undefined' ? location.search : '');
  const detail = resolveErrorDetail(search, options.store);
  const body = findDetailBody(root);
  if (body) {
    body.innerHTML = findingDetailMarkup(detail.finding);
  }
  return detail;
}

function init() {
  renderErrorCheckNav('error-detail');
  const search = typeof location !== 'undefined' ? location.search : '';
  renderErrorDetail(typeof document !== 'undefined' ? document : null, {
    search,
    store: { getFinding: storeGetFinding },
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
