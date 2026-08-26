import { CHECK_KEYS, getSettings as storeGetSettings, setSettings as storeSetSettings } from './store.js';
import { renderErrorCheckNav } from './nav.js';

/** @type {Record<string, string>} */
export const CHECK_LABELS = {
  compile: 'Compile',
  type: 'Type',
  lint: 'Lint',
  test: 'Test',
};

export const REPORT_ONLY_COPY = 'Checks report findings only and do not change code.';

/**
 * @param {any} [partial]
 * @returns {{ compile: boolean, type: boolean, lint: boolean, test: boolean }}
 */
export function normalizeSettings(partial) {
  const settings = { compile: true, type: true, lint: true, test: true };
  if (!partial || typeof partial !== 'object') return settings;
  for (const key of CHECK_KEYS) {
    if (typeof partial[key] === 'boolean') settings[key] = partial[key];
  }
  return settings;
}

/**
 * @param {any} root
 * @param {string} key
 * @returns {any | null}
 */
function findControl(root, key) {
  if (!root) return null;
  if (root.querySelector) {
    return root.querySelector(`[data-check="${key}"]`)
      || root.querySelector(`input[name="${key}"]`)
      || root.querySelector(`#setting-${key}`)
      || null;
  }
  if (root.getElementById) {
    return root.getElementById(`setting-${key}`) || null;
  }
  return null;
}

/**
 * @param {any} root
 * @returns {any | null}
 */
function findForm(root) {
  if (!root) return null;
  if (root.querySelector) {
    return root.querySelector('#error-settings-form')
      || root.querySelector('[data-error-settings-form]')
      || null;
  }
  if (root.getElementById) {
    return root.getElementById('error-settings-form') || null;
  }
  return null;
}

/**
 * @param {{ getSettings?: () => any }} [store]
 */
export function lookupSettings(store) {
  const getter = store?.getSettings || storeGetSettings;
  try {
    return normalizeSettings(getter());
  } catch {
    return normalizeSettings();
  }
}

/**
 * @param {any} root
 * @returns {{ compile: boolean, type: boolean, lint: boolean, test: boolean }}
 */
export function readSettingsFromControls(root) {
  const settings = normalizeSettings();
  for (const key of CHECK_KEYS) {
    const input = /** @type {HTMLInputElement | null} */ (findControl(root, key));
    if (input) settings[key] = !!input.checked;
  }
  return settings;
}

/**
 * @param {any} root
 * @param {{ compile?: boolean, type?: boolean, lint?: boolean, test?: boolean }} settings
 */
export function applySettingsToControls(root, settings) {
  const next = normalizeSettings(settings);
  for (const key of CHECK_KEYS) {
    const input = /** @type {HTMLInputElement | null} */ (findControl(root, key));
    if (input) input.checked = next[key];
  }
  return next;
}

/**
 * @param {any} root
 * @param {{ setSettings?: (partial: any) => any }} [store]
 */
export function commitSettings(root, store) {
  const setter = store?.setSettings || storeSetSettings;
  return setter(readSettingsFromControls(root));
}

/**
 * @param {any} [settings]
 * @returns {string}
 */
export function settingsFormMarkup(settings) {
  const next = normalizeSettings(settings);
  const rows = CHECK_KEYS.map((key) => {
    const checked = next[key] ? ' checked' : '';
    return `<label class="error-settings-row">
      <span class="error-settings-label">${CHECK_LABELS[key]}</span>
      <span class="toggle-switch">
        <input type="checkbox" id="setting-${key}" name="${key}" data-check="${key}"${checked}>
        <span class="slider round"></span>
      </span>
    </label>`;
  }).join('');
  return `<form class="error-settings-form" id="error-settings-form" data-error-settings-form>${rows}</form>
<p class="error-settings-note">${REPORT_ONLY_COPY}</p>`;
}

/**
 * @param {any} [root]
 * @param {{ store?: { getSettings?: () => any, setSettings?: (partial: any) => any } }} [options]
 */
export function renderSettingsPage(root, options = {}) {
  const store = options.store || {
    getSettings: storeGetSettings,
    setSettings: storeSetSettings,
  };
  const settings = lookupSettings(store);
  applySettingsToControls(root, settings);

  const form = findForm(root);
  if (form?.addEventListener) {
    if (!form.dataset?.settingsBound) {
      if (form.dataset) form.dataset.settingsBound = 'true';
      form.addEventListener('change', () => {
        commitSettings(root, store);
      });
      form.addEventListener('submit', (event) => {
        event?.preventDefault?.();
      });
    }
  } else {
    for (const key of CHECK_KEYS) {
      const input = findControl(root, key);
      if (input?.addEventListener && !input.dataset?.settingsBound) {
        if (input.dataset) input.dataset.settingsBound = 'true';
        input.addEventListener('change', () => {
          commitSettings(root, store);
        });
      }
    }
  }

  return settings;
}

function init() {
  renderErrorCheckNav('settings');
  renderSettingsPage(typeof document !== 'undefined' ? document : null);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
