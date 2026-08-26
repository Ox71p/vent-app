import { describe, expect, it } from 'vitest';
import {
  parseEslintOutput,
  parseOutput,
  parseTscOutput,
  parseViteOutput,
  parseVitestOutput,
  stripAnsi,
} from './parseOutput.js';

const VITE_OUTPUT = `
vite v8.1.1 building client environment for production...
✓ 4 modules transformed.
✗ Build failed in 12ms
error during build:
[vite:esbuild] Transform failed with 1 error:
src/main.js:10:5: ERROR: Unexpected token
`;

const VITE_ROLLUP = `
error during build:
src/nlpEngine.js (3:10): Identifier expected
`;

const ESLINT_STYLISH = `
/app/src/main.js
  12:7  error  'x' is defined but never used  no-unused-vars
  20:1  warning  Unexpected console statement  no-console

/app/netlify/functions/processEntry.mjs
  4:10  error  'foo' is not defined  no-undef

✖ 3 problems (2 errors, 1 warning)
`;

const ESLINT_STYLISH_ANSI = `\u001b[0m\u001b[4m/app/src/main.js\u001b[24m\u001b[0m
\u001b[0m  \u001b[2m12:7\u001b[22m  \u001b[31merror\u001b[39m  'x' is defined but never used  \u001b[2mno-unused-vars\u001b[22m\u001b[0m
\u001b[0m  \u001b[2m20:1\u001b[22m  \u001b[33mwarning\u001b[39m  Unexpected console statement  \u001b[2mno-console\u001b[22m\u001b[0m
`;

const ESLINT_JSON = `
> vent@0.0.0 lint
> eslint src netlify

[{"filePath":"/app/src/auth.js","messages":[{"line":8,"severity":2,"message":"'user' is never reassigned. Use 'const' instead.","ruleId":"prefer-const"}],"errorCount":1,"warningCount":0}]
`;

const TSC_OUTPUT = `
src/main.js(42,18): error TS2339: Property 'foo' does not exist on type 'Window'.
src/auth.js(10,5): error TS2304: Cannot find name 'GoTrue'.
src/counter.js(3,16): warning TS80005: 'element' is possibly 'null'.
`;

const VITEST_OUTPUT = `
 FAIL  src/error-check/store.test.js > store > getRuns returns empty
AssertionError: expected [] to deeply equal [1]

 ❯ src/error-check/store.test.js:12:20

Test Files  1 failed | 2 passed (3)
`;

describe('parseOutput fixtures', () => {
  it('parses vite esbuild compile errors', () => {
    const findings = parseViteOutput(VITE_OUTPUT);
    expect(findings).toEqual([
      {
        file: 'src/main.js',
        line: 10,
        message: 'Unexpected token',
        severity: 'error',
      },
    ]);
    expect(parseOutput('compile', VITE_OUTPUT, '')).toEqual(findings);
  });

  it('parses vite rollup compile errors', () => {
    const findings = parseOutput('compile', '', VITE_ROLLUP);
    expect(findings[0]).toMatchObject({
      file: 'src/nlpEngine.js',
      line: 3,
      message: 'Identifier expected',
      severity: 'error',
    });
  });

  it('parses eslint stylish output', () => {
    const findings = parseEslintOutput(ESLINT_STYLISH);
    expect(findings).toHaveLength(3);
    expect(findings[0]).toMatchObject({
      file: '/app/src/main.js',
      line: 12,
      severity: 'error',
    });
    expect(findings[0].message).toContain('never used');
    expect(findings[1].severity).toBe('warning');
    expect(findings[2].file).toContain('processEntry.mjs');
    expect(parseOutput('lint', ESLINT_STYLISH, '')).toHaveLength(3);
  });

  it('parses FORCE_COLOR / ANSI stylish eslint output', () => {
    expect(stripAnsi(ESLINT_STYLISH_ANSI)).toContain('12:7');
    expect(stripAnsi(ESLINT_STYLISH_ANSI)).not.toMatch(/\u001B/);
    const findings = parseOutput('lint', ESLINT_STYLISH_ANSI, '');
    expect(findings).toHaveLength(2);
    expect(findings[0]).toMatchObject({
      file: '/app/src/main.js',
      line: 12,
      severity: 'error',
    });
    expect(findings[0].message).toContain('never used');
    expect(findings[1].severity).toBe('warning');
  });

  it('parses eslint JSON output mixed with npm lifecycle logs', () => {
    const findings = parseOutput('lint', ESLINT_JSON, '');
    expect(findings).toEqual([
      {
        file: '/app/src/auth.js',
        line: 8,
        message: "'user' is never reassigned. Use 'const' instead. (prefer-const)",
        severity: 'error',
      },
    ]);
  });

  it('parses tsc type errors', () => {
    const findings = parseTscOutput(TSC_OUTPUT);
    expect(findings).toHaveLength(3);
    expect(findings[0]).toMatchObject({
      file: 'src/main.js',
      line: 42,
      message: "TS2339: Property 'foo' does not exist on type 'Window'.",
      severity: 'error',
    });
    expect(findings[2].severity).toBe('warning');
    expect(parseOutput('type', TSC_OUTPUT, '')[1].file).toBe('src/auth.js');
  });

  it('parses vitest FAIL blocks', () => {
    const findings = parseVitestOutput(VITEST_OUTPUT);
    expect(findings).toEqual([
      {
        file: 'src/error-check/store.test.js',
        line: 12,
        message: 'expected [] to deeply equal [1]',
        severity: 'error',
      },
    ]);
    expect(parseOutput('test', VITEST_OUTPUT, '')).toEqual(findings);
  });
});
