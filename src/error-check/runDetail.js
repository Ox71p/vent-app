import { CHECK_KEYS, getRun as storeGetRun } from './store.js';
import { renderErrorCheckNav } from './nav.js';

export const MISSING_RUN_TEXT = 'Run not found';
export const EMPTY_FIELD = '—';

/**
 * @param {string | URLSearchParams | null | undefined} search
 * @returns {string | null}
 */
export function parseRunId(search) {
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

/**
 * @param {unknown} iso
 * @returns {string}
 */
export function formatTimestamp(iso) {
  if (iso == null || iso === '') return EMPTY_FIELD;
  const d = new Date(/** @type {string | number} */ (iso));
  if (Number.isNaN(d.getTime())) return String(iso);
  /** @type {Intl.DateTimeFormatOptions} */
  const dateOpt = { weekday: 'short', month: 'short', day: 'numeric' };
  /** @type {Intl.DateTimeFormatOptions} */
  const timeOpt = { hour: 'numeric', minute: '2-digit' };
  return `${d.toLocaleDateString(undefined, dateOpt)} at ${d.toLocaleTimeString(undefined, timeOpt)}`;
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
 * @param {{ getRun?: (id: string | null) => any }} [store]
 * @returns {any | null}
 */
export function lookupRun(id, store) {
  if (id == null || id === '') return null;
  const getter = store?.getRun || storeGetRun;
  try {
    return getter(id) || null;
  } catch {
    return null;
  }
}

/**
 * @param {any | null} run
 * @returns {string}
 */
export function runDetailMarkup(run) {
  if (!run) {
    return `<p class="error-detail-missing">${MISSING_RUN_TEXT}</p>`;
  }

  const status = displayField(run.status);
  const started = formatTimestamp(run.startedAt);
  const finished = formatTimestamp(run.finishedAt);
  const meta = `<dl class="run-detail-meta">
    <div class="error-detail-field">
      <dt>status</dt>
      <dd data-field="status" data-status="${escapeHtml(run.status || '')}">${escapeHtml(status)}</dd>
    </div>
    <div class="error-detail-field">
      <dt>startedAt</dt>
      <dd data-field="startedAt"><time datetime="${escapeHtml(run.startedAt || '')}">${escapeHtml(started)}</time></dd>
    </div>
    <div class="error-detail-field">
      <dt>finishedAt</dt>
      <dd data-field="finishedAt"><time datetime="${escapeHtml(run.finishedAt || '')}">${escapeHtml(finished)}</time></dd>
    </div>
  </dl>`;

  const sections = CHECK_KEYS.map((key) => {
    const check = run.checks?.[key];
    const checkStatus = displayField(check?.status);
    const findings = Array.isArray(check?.findings) ? check.findings : [];
    const findingItems = findings.map((finding) => {
      const findingId = finding?.id == null ? '' : String(finding.id);
      const message = displayField(finding?.message);
      const href = `/error-detail.html?id=${encodeURIComponent(findingId)}`;
      return `<li class="run-finding" data-finding-id="${escapeHtml(findingId)}">
        <a href="${href}">${escapeHtml(message)}</a>
      </li>`;
    }).join('');
    return `<section class="run-check" data-check="${key}">
      <h2 class="run-check-label">${key}</h2>
      <p class="run-check-status" data-status="${escapeHtml(check?.status || '')}">${escapeHtml(checkStatus)}</p>
      ${findingItems ? `<ul class="run-check-findings">${findingItems}</ul>` : ''}
    </section>`;
  }).join('');

  return `${meta}<div class="run-detail-checks">${sections}</div>`;
}

/**
 * @param {string | URLSearchParams | null | undefined} search
 * @param {{ getRun?: (id: string | null) => any }} [store]
 */
export function resolveRunDetail(search, store) {
  const id = parseRunId(search);
  const run = lookupRun(id, store);
  if (!run) {
    return {
      id,
      run: null,
      found: false,
      heading: 'Run Detail',
      missingText: MISSING_RUN_TEXT,
      status: null,
      startedAt: null,
      finishedAt: null,
      checks: null,
    };
  }
  return {
    id,
    run,
    found: true,
    heading: 'Run Detail',
    missingText: null,
    status: displayField(run.status),
    startedAt: formatTimestamp(run.startedAt),
    finishedAt: formatTimestamp(run.finishedAt),
    checks: run.checks || null,
  };
}

/**
 * @param {any} root
 * @returns {any | null}
 */
function findDetailBody(root) {
  if (!root) return null;
  if (root.querySelector) {
    return root.querySelector('#run-detail-body')
      || root.querySelector('[data-run-detail-body]')
      || null;
  }
  if (root.getElementById) {
    return root.getElementById('run-detail-body') || null;
  }
  return null;
}

/**
 * @param {any} [root]
 * @param {{ search?: string | URLSearchParams | null, store?: { getRun?: (id: string | null) => any } }} [options]
 */
export function renderRunDetail(root, options = {}) {
  const search = options.search ?? (typeof location !== 'undefined' ? location.search : '');
  const detail = resolveRunDetail(search, options.store);
  const body = findDetailBody(root);
  if (body) {
    body.innerHTML = runDetailMarkup(detail.run);
  }
  return detail;
}

function init() {
  renderErrorCheckNav('run-detail');
  const search = typeof location !== 'undefined' ? location.search : '';
  renderRunDetail(typeof document !== 'undefined' ? document : null, {
    search,
    store: { getRun: storeGetRun },
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
