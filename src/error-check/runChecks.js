import { spawn as defaultSpawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOutput, stripAnsi } from './parseOutput.js';

export const CHECK_KEYS = ['compile', 'type', 'lint', 'test'];

const SCRIPT_BY_CHECK = {
  compile: 'build',
  type: 'typecheck',
  lint: 'lint',
  test: 'test',
};

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const MISSING_PATTERNS = [
  /Missing script:/i,
  /npm ERR! missing script/i,
  /command not found/i,
  /(?:^|\n)sh:\s*\d*:\s+\S+:\s+not found/i,
  /is not recognized as an internal or external command/i,
];

function defaultSettings(partial) {
  const settings = { compile: true, type: true, lint: true, test: true };
  if (!partial || typeof partial !== 'object') return settings;
  for (const key of CHECK_KEYS) {
    if (typeof partial[key] === 'boolean') settings[key] = partial[key];
  }
  return settings;
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isMissingTool(result, findings = []) {
  if (findings.length > 0) return false;
  if (result?.error?.code === 'ENOENT') return true;
  const text = `${result?.stderr || ''}\n${result?.stdout || ''}\n${result?.error?.message || ''}`;
  return MISSING_PATTERNS.some((pattern) => pattern.test(text));
}

function missingMessage(check, result) {
  const text = `${result?.stderr || ''}\n${result?.stdout || ''}`.trim();
  const first = text.split('\n').find((line) => line.trim()) || result?.error?.message;
  return first || `${check} tool is not available`;
}

function childEnv() {
  const env = { ...process.env, NO_COLOR: '1' };
  delete env.FORCE_COLOR;
  return env;
}

function stripNodeEnvWarnings(text) {
  return stripAnsi(text || '')
    .replace(/^\(node:\d+\) Warning:.*$/gm, '')
    .replace(/^\(Use `node --trace-warnings.*\)$/gm, '');
}

function usableStreams(result) {
  return {
    stdout: stripNodeEnvWarnings(result?.stdout),
    stderr: stripNodeEnvWarnings(result?.stderr),
    error: result?.error,
    code: result?.code,
  };
}

function fallbackMessage(check, result) {
  const combined = `${result.stderr || ''}\n${result.stdout || ''}`;
  const excerpt = combined
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-3)
    .join('\n');
  return excerpt || `${check} exited with code ${result.code}`;
}

/**
 * @param {(...args: any[]) => any} spawnFn
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd: string, timeoutMs?: number }} options
 * @returns {Promise<{ code: number | null, stdout: string, stderr: string, error?: any }>}
 */
async function invoke(spawnFn, command, args, { cwd, timeoutMs }) {
  /** @type {any} */
  let child;
  try {
    child = spawnFn(command, args, {
      cwd,
      env: childEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const err = /** @type {any} */ (error);
    return { code: 127, stdout: '', stderr: err.message || String(error), error: err };
  }

  if (child && typeof child.then === 'function') {
    const result = await child;
    return {
      code: result.code ?? 0,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      error: result.error,
    };
  }

  if (child && typeof child.on !== 'function') {
    return {
      code: child.code ?? 0,
      stdout: child.stdout ?? '',
      stderr: child.stderr ?? '',
      error: child.error,
    };
  }

  return await new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (code, error) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve({ code: code ?? (error ? 127 : 0), stdout, stderr, error });
    };

    const timer = timeoutMs
      ? setTimeout(() => {
          try { child.kill?.('SIGTERM'); } catch { /* ignore */ }
          finish(124, new Error(`timed out after ${timeoutMs}ms`));
        }, timeoutMs)
      : null;

    if (child.stdout?.on) {
      child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    }
    if (child.stderr?.on) {
      child.stderr.on('data', (chunk) => { stderr += String(chunk); });
    }
    child.on?.('error', (error) => finish(127, error));
    child.on?.('close', (code) => finish(code));
  });
}

function attachFindings(runId, check, parsed) {
  return parsed.map((item, index) => ({
    id: `${runId}:${check}:${index}`,
    runId,
    check,
    file: item.file ?? null,
    line: item.line ?? null,
    message: item.message,
    severity: item.severity === 'warning' ? 'warning' : 'error',
  }));
}

function runStatusFromChecks(checks) {
  for (const key of CHECK_KEYS) {
    const check = checks[key];
    if (!check || check.status === 'skipped') continue;
    if (check.status === 'fail') return 'fail';
    if ((check.findings || []).some((finding) => finding.severity === 'error')) return 'fail';
  }
  return 'pass';
}

export async function runChecks(options = {}) {
  const settings = defaultSettings(options.settings);
  const spawnFn = options.spawn || defaultSpawn;
  const cwd = options.cwd || PROJECT_ROOT;
  const timeoutMs = options.timeoutMs ?? 180000;
  const npmCmd = options.npmCommand || (process.platform === 'win32' ? 'npm.cmd' : 'npm');

  const startedAt = new Date().toISOString();
  const id = options.runId || makeId();
  const checks = {};

  for (const check of CHECK_KEYS) {
    if (!settings[check]) {
      checks[check] = { status: 'skipped', findings: [] };
      continue;
    }

    const script = SCRIPT_BY_CHECK[check];
    const raw = await invoke(spawnFn, npmCmd, ['run', script], { cwd, timeoutMs });
    const result = usableStreams(raw);
    let findings = attachFindings(id, check, parseOutput(check, result.stdout, result.stderr));

    if (isMissingTool(result, findings)) {
      checks[check] = {
        status: 'skipped',
        findings: [],
        message: missingMessage(check, result),
      };
      continue;
    }

    const failed = result.code !== 0;
    if (failed && findings.length === 0) {
      findings = attachFindings(id, check, [{
        file: null,
        line: null,
        message: fallbackMessage(check, result),
        severity: 'error',
      }]);
    }

    checks[check] = {
      status: failed || findings.some((finding) => finding.severity === 'error') ? 'fail' : 'pass',
      findings,
      exitCode: result.code,
    };
  }

  const finishedAt = new Date().toISOString();
  return {
    id,
    startedAt,
    finishedAt,
    status: runStatusFromChecks(checks),
    checks,
  };
}
