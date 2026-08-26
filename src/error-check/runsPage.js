import { getRuns as storeGetRuns } from './store.js';
import { renderErrorCheckNav } from './nav.js';

export const EMPTY_RUNS_TEXT = 'No check runs yet';
export const EMPTY_FIELD = '—';

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
export function formatStartedAt(iso) {
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
 * @param {any[]} runs
 * @returns {any[]}
 */
export function sortRunsNewestFirst(runs) {
  const list = Array.isArray(runs) ? [...runs] : [];
  return list.sort((a, b) => {
    const aTime = Date.parse(a?.startedAt || '') || 0;
    const bTime = Date.parse(b?.startedAt || '') || 0;
    return bTime - aTime;
  });
}

/**
 * @param {{ getRuns?: () => any[] }} [store]
 * @returns {any[]}
 */
export function lookupRuns(store) {
  const getter = store?.getRuns || storeGetRuns;
  try {
    const runs = getter();
    return Array.isArray(runs) ? runs : [];
  } catch {
    return [];
  }
}

/**
 * @param {any[]} runs
 * @returns {string}
 */
export function runsListMarkup(runs) {
  const list = Array.isArray(runs) ? runs : [];
  if (list.length === 0) {
    return `<p class="error-runs-empty">${EMPTY_RUNS_TEXT}</p>`;
  }
  const items = list.map((run) => {
    const id = run?.id == null ? '' : String(run.id);
    const status = run?.status == null ? '' : String(run.status);
    const startedRaw = run?.startedAt == null ? '' : String(run.startedAt);
    const href = `/run-detail.html?id=${encodeURIComponent(id)}`;
    return `<li class="error-run" data-run-id="${escapeHtml(id)}" data-status="${escapeHtml(status)}">
      <a href="${href}">
        <span class="error-run-id">${escapeHtml(id)}</span>
        <span class="error-run-row-status" data-status="${escapeHtml(status)}">${escapeHtml(displayField(status))}</span>
        <time class="error-run-started" datetime="${escapeHtml(startedRaw)}">${escapeHtml(formatStartedAt(startedRaw))}</time>
      </a>
    </li>`;
  }).join('');
  return `<ul class="error-runs-list">${items}</ul>`;
}

/**
 * @param {{ getRuns?: () => any[] }} [store]
 */
export function resolveRunsPage(store) {
  const runs = sortRunsNewestFirst(lookupRuns(store));
  return {
    runs,
    empty: runs.length === 0,
    emptyText: runs.length === 0 ? EMPTY_RUNS_TEXT : null,
    heading: 'Run History',
  };
}

/**
 * @param {any} root
 * @returns {any | null}
 */
function findRunsBody(root) {
  if (!root) return null;
  if (root.querySelector) {
    return root.querySelector('#runs-page-body')
      || root.querySelector('[data-runs-page-body]')
      || null;
  }
  if (root.getElementById) {
    return root.getElementById('runs-page-body') || null;
  }
  return null;
}

/**
 * @param {any} [root]
 * @param {{ store?: { getRuns?: () => any[] } }} [options]
 */
export function renderRunsPage(root, options = {}) {
  const resolved = resolveRunsPage(options.store);
  const body = findRunsBody(root);
  if (body) {
    body.innerHTML = runsListMarkup(resolved.runs);
  }
  return resolved;
}

function init() {
  renderErrorCheckNav('runs');
  renderRunsPage(typeof document !== 'undefined' ? document : null, {
    store: { getRuns: storeGetRuns },
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
