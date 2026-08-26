import { afterEach, describe, expect, it } from 'vitest';
import {
  hashTargetsErrorView,
  restoreErrorViewFromHash,
  showErrorView,
} from './dashboard.js';

function mockClassList(initial = []) {
  const classes = new Set(initial);
  return {
    add(name) {
      classes.add(name);
    },
    remove(name) {
      classes.delete(name);
    },
    toggle(name, force) {
      if (force) classes.add(name);
      else classes.delete(name);
      return classes.has(name);
    },
    contains(name) {
      return classes.has(name);
    },
    get value() {
      return [...classes].join(' ');
    },
  };
}

function mockDocument() {
  const views = {
    'view-auth': { id: 'view-auth', classList: mockClassList(['active']), style: { display: 'flex' } },
    'view-vent': { id: 'view-vent', classList: mockClassList(), style: {} },
    'view-errors': { id: 'view-errors', classList: mockClassList(), style: {} },
  };
  const dockItems = [
    {
      classList: mockClassList(['active']),
      getAttribute(name) {
        return name === 'data-target' ? 'view-vent' : null;
      },
    },
    {
      classList: mockClassList(),
      getAttribute(name) {
        return name === 'data-target' ? 'view-errors' : null;
      },
    },
  ];
  return {
    views,
    dockItems,
    getElementById(id) {
      return views[id] || null;
    },
    querySelectorAll(selector) {
      if (selector === '.app-view') return Object.values(views);
      if (selector === '.dock-item') return dockItems;
      return [];
    },
  };
}

afterEach(() => {
  /** @type {any} */ (globalThis).document = undefined;
});

describe('hashTargetsErrorView', () => {
  it('matches #view-errors with or without the hash prefix', () => {
    expect(hashTargetsErrorView('#view-errors')).toBe(true);
    expect(hashTargetsErrorView('view-errors')).toBe(true);
    expect(hashTargetsErrorView('#view-vent')).toBe(false);
    expect(hashTargetsErrorView('')).toBe(false);
    expect(hashTargetsErrorView('#')).toBe(false);
  });
});

describe('showErrorView', () => {
  it('activates #view-errors and hides auth even when Vent home was active', () => {
    const doc = mockDocument();
    /** @type {any} */ (globalThis).document = doc;
    showErrorView();
    expect(doc.views['view-errors'].classList.contains('active')).toBe(true);
    expect(doc.views['view-vent'].classList.contains('active')).toBe(false);
    expect(doc.views['view-auth'].classList.contains('active')).toBe(false);
    expect(doc.views['view-auth'].style.display).toBe('none');
    expect(doc.dockItems[0].classList.contains('active')).toBe(false);
    expect(doc.dockItems[1].classList.contains('active')).toBe(true);
  });
});

describe('restoreErrorViewFromHash', () => {
  it('opens the Error Dashboard when the hash is view-errors', () => {
    const doc = mockDocument();
    /** @type {any} */ (globalThis).document = doc;
    restoreErrorViewFromHash('#view-errors');
    expect(doc.views['view-errors'].classList.contains('active')).toBe(true);
  });

  it('leaves the current view alone when the hash is not view-errors', () => {
    const doc = mockDocument();
    /** @type {any} */ (globalThis).document = doc;
    restoreErrorViewFromHash('#view-vent');
    expect(doc.views['view-errors'].classList.contains('active')).toBe(false);
    expect(doc.views['view-auth'].classList.contains('active')).toBe(true);
  });
});
