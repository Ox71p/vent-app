export const STORAGE_KEY = 'ventErrorRuns';
export const CHECK_KEYS = ['compile', 'type', 'lint', 'test'];

const DEFAULT_SETTINGS = {
  compile: true,
  type: true,
  lint: true,
  test: true,
};

function emptyState() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    runs: [],
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getStorage() {
  const storage = globalThis.localStorage;
  if (!storage) {
    throw new Error('localStorage is not available');
  }
  return storage;
}

function readState() {
  const storage = getStorage();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    const settings = { ...DEFAULT_SETTINGS, ...(parsed?.settings || {}) };
    for (const key of CHECK_KEYS) {
      settings[key] = settings[key] !== false;
    }
    return {
      settings,
      runs: Array.isArray(parsed?.runs) ? parsed.runs : [],
    };
  } catch {
    return emptyState();
  }
}

function writeState(state) {
  getStorage().setItem(STORAGE_KEY, JSON.stringify(state));
}

function findingHasError(finding) {
  return finding?.severity === 'error';
}

export function computeRunStatus(run) {
  const checks = run?.checks || {};
  for (const key of CHECK_KEYS) {
    const check = checks[key];
    if (!check || check.status === 'skipped') continue;
    if (check.status === 'fail') return 'fail';
    if ((check.findings || []).some(findingHasError)) return 'fail';
  }
  return 'pass';
}

function normalizeCheck(check) {
  const source = check && typeof check === 'object' ? check : {};
  const findings = Array.isArray(source.findings) ? source.findings.map((finding) => ({ ...finding })) : [];
  const status = source.status === 'skipped' || source.status === 'fail' || source.status === 'pass'
    ? source.status
    : (findings.some(findingHasError) ? 'fail' : 'pass');
  const normalized = { status, findings };
  if (typeof source.message === 'string' && source.message) {
    normalized.message = source.message;
  }
  if (source.exitCode != null) {
    normalized.exitCode = source.exitCode;
  }
  return normalized;
}

function normalizeRun(run) {
  const source = run && typeof run === 'object' ? run : {};
  const checks = {};
  for (const key of CHECK_KEYS) {
    checks[key] = normalizeCheck(source.checks?.[key]);
  }
  const normalized = {
    id: source.id || `run-${Date.now()}`,
    startedAt: source.startedAt || new Date().toISOString(),
    finishedAt: source.finishedAt || new Date().toISOString(),
    checks,
  };
  normalized.status = computeRunStatus(normalized);
  return normalized;
}

export function getSettings() {
  return { ...readState().settings };
}

export function setSettings(partial = {}) {
  const state = readState();
  const next = { ...state.settings };
  for (const key of CHECK_KEYS) {
    if (typeof partial[key] === 'boolean') {
      next[key] = partial[key];
    }
  }
  state.settings = next;
  writeState(state);
  return { ...next };
}

export function getRuns() {
  return clone(readState().runs);
}

export function getRun(id) {
  if (id == null || id === '') return null;
  const found = readState().runs.find((run) => run.id === id);
  return found ? clone(found) : null;
}

export function getLatestRun() {
  const runs = readState().runs;
  return runs.length ? clone(runs[0]) : null;
}

export function getFinding(id) {
  if (id == null || id === '') return null;
  for (const run of readState().runs) {
    for (const key of CHECK_KEYS) {
      const findings = run.checks?.[key]?.findings || [];
      const found = findings.find((finding) => finding.id === id);
      if (found) return clone(found);
    }
  }
  return null;
}

export function appendRun(run) {
  const state = readState();
  const normalized = normalizeRun(run);
  state.runs.unshift(normalized);
  writeState(state);
  return clone(normalized);
}
