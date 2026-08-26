import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runChecks } from './runChecks.js';
import { STORAGE_KEY, getSettings, setSettings } from './store.js';
import {
  CHECK_LABELS,
  REPORT_ONLY_COPY,
  commitSettings,
  readSettingsFromControls,
  renderSettingsPage,
  settingsFormMarkup,
} from './settingsPage.js';

const htmlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../settings.html');
const pageHtml = readFileSync(htmlPath, 'utf8');

function memoryStorage() {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key(index) {
      return [...data.keys()][index] ?? null;
    },
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(String(key), String(value)); },
    removeItem: (key) => { data.delete(key); },
    clear: () => { data.clear(); },
  };
}

function mockSpawn(handler) {
  return (command, args, options) => {
    const result = handler(command, args, options) || { code: 0, stdout: '', stderr: '' };
    return Promise.resolve(result);
  };
}

function mockControl(key, checked = true) {
  /** @type {Record<string, Function[]>} */
  const listeners = {};
  const dataset = { check: key };
  return {
    checked,
    name: key,
    id: `setting-${key}`,
    dataset,
    getAttribute(name) {
      if (name === 'data-check' || name === 'name') return key;
      if (name === 'id') return `setting-${key}`;
      if (name === 'type') return 'checkbox';
      return null;
    },
    addEventListener(event, handler) {
      (listeners[event] ||= []).push(handler);
    },
    dispatchEvent(event) {
      const type = typeof event === 'string' ? event : event?.type;
      for (const handler of listeners[type] || []) handler(event);
      return true;
    },
  };
}

function mockRoot(initial = { compile: true, type: true, lint: true, test: true }) {
  const controls = {
    compile: mockControl('compile', initial.compile !== false),
    type: mockControl('type', initial.type !== false),
    lint: mockControl('lint', initial.lint !== false),
    test: mockControl('test', initial.test !== false),
  };
  /** @type {Record<string, Function[]>} */
  const formListeners = {};
  const formDataset = {};
  const form = {
    dataset: formDataset,
    addEventListener(event, handler) {
      (formListeners[event] ||= []).push(handler);
    },
    dispatchEvent(event) {
      const type = typeof event === 'string' ? event : event?.type;
      for (const handler of formListeners[type] || []) handler(event);
      return true;
    },
  };
  return {
    controls,
    form,
    querySelector(selector) {
      if (selector === '#error-settings-form' || selector === '[data-error-settings-form]') return form;
      if (selector === '[data-error-check-nav]' || selector === '#error-check-nav') {
        return { classList: { add() {} }, setAttribute() {}, innerHTML: '' };
      }
      for (const key of Object.keys(controls)) {
        if (
          selector === `[data-check="${key}"]`
          || selector === `input[name="${key}"]`
          || selector === `#setting-${key}`
        ) {
          return controls[key];
        }
      }
      return null;
    },
    getElementById(id) {
      if (id === 'error-settings-form') return form;
      for (const key of Object.keys(controls)) {
        if (id === `setting-${key}`) return controls[key];
      }
      return null;
    },
  };
}

beforeEach(() => {
  /** @type {any} */ (globalThis).localStorage = memoryStorage();
});

afterEach(() => {
  /** @type {any} */ (globalThis).localStorage = undefined;
});

describe('settings.html', () => {
  it('contains the Settings heading, four labeled controls, report-only copy, and dashboard link', () => {
    expect(pageHtml).toContain('Settings');
    expect(pageHtml).toMatch(/<h1[^>]*>Settings<\/h1>/);
    expect(pageHtml).toContain('Compile');
    expect(pageHtml).toContain('Type');
    expect(pageHtml).toContain('Lint');
    expect(pageHtml).toContain('Test');
    expect(pageHtml).toMatch(/<label[^>]*>[\s\S]*Compile[\s\S]*<\/label>/);
    expect(pageHtml).toMatch(/<label[^>]*>[\s\S]*Type[\s\S]*<\/label>/);
    expect(pageHtml).toMatch(/<label[^>]*>[\s\S]*Lint[\s\S]*<\/label>/);
    expect(pageHtml).toMatch(/<label[^>]*>[\s\S]*Test[\s\S]*<\/label>/);
    expect(pageHtml).toContain(REPORT_ONLY_COPY);
    expect(pageHtml).toContain('Checks report findings only and do not change code.');
    expect(pageHtml).toMatch(/<a\s+href="\/#view-errors"\s*>Error Dashboard<\/a>/);
    expect(pageHtml).toContain('/src/error-check/settingsPage.js');
    expect(pageHtml).not.toMatch(/>\s*Fix\s*</);
    expect(pageHtml).not.toMatch(/>\s*Auto-fix\s*</);
    expect(pageHtml).not.toMatch(/>\s*Apply fixes\s*</);
  });
});

describe('settingsFormMarkup', () => {
  it('renders the four labels and the report-only sentence with no Fix control', () => {
    const html = settingsFormMarkup({ compile: true, type: true, lint: false, test: true });
    expect(html).toContain(CHECK_LABELS.compile);
    expect(html).toContain(CHECK_LABELS.type);
    expect(html).toContain(CHECK_LABELS.lint);
    expect(html).toContain(CHECK_LABELS.test);
    expect(html).toContain(REPORT_ONLY_COPY);
    expect(html).not.toMatch(/>\s*Fix\s*</);
    expect(html).not.toMatch(/>\s*Auto-fix\s*</);
    expect(html).toContain('id="setting-lint"');
    expect(html).not.toMatch(/id="setting-lint"[^>]*\schecked/);
  });
});

describe('renderSettingsPage', () => {
  it('hydrates controls from the store and toggling Lint off writes settings.lint as false', () => {
    setSettings({ compile: true, type: true, lint: true, test: true });
    const root = mockRoot();
    const rendered = renderSettingsPage(root, { store: { getSettings, setSettings } });
    expect(rendered.lint).toBe(true);
    expect(root.controls.lint.checked).toBe(true);

    root.controls.lint.checked = false;
    root.form.dispatchEvent({ type: 'change' });

    expect(getSettings().lint).toBe(false);
    expect(getSettings()).toEqual({
      compile: true,
      type: true,
      lint: false,
      test: true,
    });
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    expect(raw.settings.lint).toBe(false);
  });

  it('commitSettings writes all four booleans from the controls', () => {
    const root = mockRoot({ compile: false, type: true, lint: false, test: true });
    expect(readSettingsFromControls(root)).toEqual({
      compile: false,
      type: true,
      lint: false,
      test: true,
    });
    const next = commitSettings(root, { setSettings });
    expect(next.lint).toBe(false);
    expect(getSettings().compile).toBe(false);
  });
});

describe('disabled checkers skip on the next run', () => {
  it('stores checks.lint.status as skipped after settings.lint is false', async () => {
    const root = mockRoot();
    renderSettingsPage(root, { store: { getSettings, setSettings } });
    root.controls.lint.checked = false;
    root.form.dispatchEvent({ type: 'change' });
    expect(getSettings().lint).toBe(false);

    const calls = [];
    const run = await runChecks({
      settings: getSettings(),
      spawn: mockSpawn((command, args) => {
        calls.push([command, ...args]);
        return { code: 0, stdout: '', stderr: '' };
      }),
    });

    expect(run.checks.lint.status).toBe('skipped');
    expect(run.checks.lint.findings).toEqual([]);
    expect(calls.some((call) => call.includes('lint'))).toBe(false);
  });
});
