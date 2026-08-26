import './error-check.css';
import { appendRun, getLatestRun, getSettings } from './store.js';
import { renderErrorCheckNav } from './nav.js';

const CHECKS = ['compile', 'type', 'lint', 'test'];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function collectFindings(run) {
  if (!run?.checks) return [];
  return CHECKS.flatMap((key) => run.checks[key]?.findings || []);
}

function showErrorView() {
  document.querySelectorAll('.app-view').forEach((view) => {
    view.classList.remove('active');
  });
  const auth = document.getElementById('view-auth');
  if (auth) auth.style.display = 'none';
  const errors = document.getElementById('view-errors');
  if (errors) errors.classList.add('active');
  document.querySelectorAll('.dock-item').forEach((item) => {
    item.classList.toggle('active', item.getAttribute('data-target') === 'view-errors');
  });
}

export function renderDashboard(root = typeof document !== 'undefined' ? document : null) {
  if (!root) return;
  const run = getLatestRun();
  const statusEl = root.getElementById?.('error-run-status') || root.querySelector?.('#error-run-status');
  const countsEl = root.getElementById?.('error-check-counts') || root.querySelector?.('#error-check-counts');
  const listEl = root.getElementById?.('error-findings-list') || root.querySelector?.('#error-findings-list');
  const emptyEl = root.getElementById?.('error-findings-empty') || root.querySelector?.('#error-findings-empty');

  if (countsEl) {
    countsEl.innerHTML = CHECKS.map((key) => {
      const check = run?.checks?.[key];
      let value = '—';
      if (check) {
        const count = (check.findings || []).length;
        value = check.status === 'skipped' ? 'skipped' : `${check.status} · ${count}`;
      }
      return `<div class="error-check-count" data-check="${key}" data-status="${check?.status || ''}">
        <span class="error-check-label">${key}</span>
        <span class="error-check-value">${value}</span>
      </div>`;
    }).join('');
  }

  if (!run) {
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.removeAttribute('data-status');
    }
    if (listEl) listEl.innerHTML = '';
    if (emptyEl) emptyEl.textContent = 'No check runs yet';
    return;
  }

  if (statusEl) {
    statusEl.textContent = `Latest run: ${run.status}`;
    statusEl.dataset.status = run.status;
  }

  const findings = collectFindings(run);
  if (listEl) {
    listEl.innerHTML = findings.map((finding) => {
      const loc = [finding.file, finding.line].filter((part) => part != null && part !== '').join(':');
      return `<li class="error-finding" data-finding-id="${escapeHtml(finding.id)}">
        <a href="/error-detail.html?id=${encodeURIComponent(finding.id)}">
          <span class="error-finding-check">${escapeHtml(finding.check)}</span>
          ${loc ? `<span class="error-finding-loc">${escapeHtml(loc)}</span>` : ''}
          <span class="error-finding-msg">${escapeHtml(finding.message)}</span>
        </a>
      </li>`;
    }).join('');
  }
  if (emptyEl) {
    emptyEl.textContent = findings.length === 0
      ? 'No compile, type, lint, or test failures'
      : '';
  }
}

async function onRunChecks() {
  const btn = /** @type {HTMLButtonElement | null} */ (document.getElementById('btn-run-checks'));
  const statusEl = document.getElementById('error-run-status');
  if (btn) btn.disabled = true;
  if (statusEl) {
    statusEl.textContent = 'Running checks…';
    statusEl.removeAttribute('data-status');
  }
  try {
    const response = await fetch('/.netlify/functions/runChecks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: getSettings() }),
    });
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    const payload = await response.json();
    if (payload.run) appendRun(payload.run);
    renderDashboard();
  } catch (error) {
    const err = /** @type {any} */ (error);
    if (statusEl) statusEl.textContent = `Could not run checks: ${err.message}`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

function init() {
  const root = document.getElementById('view-errors');
  if (root) renderErrorCheckNav('dashboard', root);
  renderDashboard();
  document.getElementById('btn-run-checks')?.addEventListener('click', onRunChecks);
  document.getElementById('error-dashboard-auth-link')?.addEventListener('click', (event) => {
    event.preventDefault();
    showErrorView();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
