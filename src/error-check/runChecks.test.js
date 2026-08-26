import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runChecks } from './runChecks.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const SOURCE_FILES = [
  'src/main.js',
  'index.html',
  'netlify/functions/processEntry.mjs',
];

function mockSpawn(handler) {
  return (command, args, options) => {
    const result = handler(command, args, options) || { code: 0, stdout: '', stderr: '' };
    return Promise.resolve(result);
  };
}

describe('runChecks', () => {
  it('skips disabled checks with empty findings', async () => {
    const calls = [];
    const run = await runChecks({
      settings: { compile: false, type: true, lint: false, test: false },
      spawn: mockSpawn((command, args) => {
        calls.push([command, ...args]);
        return { code: 0, stdout: '', stderr: '' };
      }),
    });

    expect(run.checks.compile).toEqual({ status: 'skipped', findings: [] });
    expect(run.checks.lint).toEqual({ status: 'skipped', findings: [] });
    expect(run.checks.test).toEqual({ status: 'skipped', findings: [] });
    expect(run.checks.type.status).toBe('pass');
    expect(calls).toEqual([['npm', 'run', 'typecheck']]);
    expect(run.checks).toHaveProperty('compile');
    expect(run.checks).toHaveProperty('type');
    expect(run.checks).toHaveProperty('lint');
    expect(run.checks).toHaveProperty('test');
  });

  it('records missing tools as skipped with a message, not a fifth category', async () => {
    const run = await runChecks({
      settings: { compile: false, type: true, lint: false, test: false },
      spawn: mockSpawn(() => ({
        code: 1,
        stdout: '',
        stderr: 'npm error Missing script: "typecheck"',
      })),
    });
    expect(Object.keys(run.checks).sort()).toEqual(['compile', 'lint', 'test', 'type']);
    expect(run.checks.type.status).toBe('skipped');
    expect(run.checks.type.findings).toEqual([]);
    expect(run.checks.type.message).toMatch(/Missing script/);
  });

  it('invokes eslint via npm run lint without extra args and does not write app source', async () => {
    const calls = [];
    const before = Object.fromEntries(
      SOURCE_FILES.map((rel) => {
        const abs = path.join(root, rel);
        return [rel, fs.statSync(abs).mtimeMs];
      })
    );

    const run = await runChecks({
      settings: { compile: false, type: false, lint: true, test: false },
      spawn: mockSpawn((command, args) => {
        calls.push({ command, args });
        return {
          code: 1,
          stdout: `/app/src/main.js\n  12:7  error  'x' is defined but never used  no-unused-vars\n`,
          stderr: '',
        };
      }),
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].command).toBe('npm');
    expect(calls[0].args).toEqual(['run', 'lint']);
    expect(calls[0].args.join(' ')).not.toMatch(/(^|\s)--fix(\s|$)/);
    expect(run.checks.lint.status).toBe('fail');
    expect(run.checks.lint.findings[0].check).toBe('lint');
    expect(run.checks.lint.findings[0].message).toContain('never used');
    expect(run.status).toBe('fail');

    for (const rel of SOURCE_FILES) {
      expect(fs.statSync(path.join(root, rel)).mtimeMs).toBe(before[rel]);
      expect(fs.readFileSync(path.join(root, rel), 'utf8').length).toBeGreaterThan(0);
    }
  });

  it('keeps tsc "Cannot find module" diagnostics as type findings, not a skipped tool', async () => {
    const run = await runChecks({
      settings: { compile: false, type: true, lint: false, test: false },
      spawn: mockSpawn(() => ({
        code: 2,
        stdout: 'src/error-check/runChecks.js(1,39): error TS2307: Cannot find module \'node:child_process\' or its corresponding type declarations.\n',
        stderr: '',
      })),
    });
    expect(run.checks.type.status).toBe('fail');
    expect(run.checks.type.findings.length).toBeGreaterThan(0);
    expect(run.checks.type.findings[0].message).toMatch(/TS2307/);
  });

  it('treats a failing child process as findings, not a runner crash', async () => {
    const run = await runChecks({
      spawn: mockSpawn((_command, args) => {
        const script = args[1];
        if (script === 'build') {
          return { code: 1, stdout: '', stderr: 'error during build:\nsrc/main.js:1:0: ERROR: Unexpected token' };
        }
        if (script === 'typecheck') {
          return { code: 2, stdout: 'src/main.js(1,1): error TS2304: Cannot find name "foo".\n', stderr: '' };
        }
        if (script === 'lint') {
          return { code: 1, stdout: '', stderr: 'Oops, something went wrong' };
        }
        return { code: 1, stdout: 'FAIL  src/foo.test.js > boom\nError: nope\n ❯ src/foo.test.js:2:1\n', stderr: '' };
      }),
    });

    expect(run.status).toBe('fail');
    expect(run.checks.compile.status).toBe('fail');
    expect(run.checks.type.status).toBe('fail');
    expect(run.checks.lint.status).toBe('fail');
    expect(run.checks.test.status).toBe('fail');
    expect(run.checks.compile.findings.length).toBeGreaterThan(0);
    expect(run.checks.lint.findings[0].message).toMatch(/Oops|exited/);
  });
});
