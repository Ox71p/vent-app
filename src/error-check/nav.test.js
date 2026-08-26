import { describe, expect, it } from 'vitest';
import { ERROR_CHECK_NAV_ITEMS, renderErrorCheckNav } from './nav.js';

describe('ERROR_CHECK_NAV_ITEMS', () => {
  it('opens the Error Dashboard via /#view-errors so a full load restores that view', () => {
    expect(ERROR_CHECK_NAV_ITEMS.map((item) => [item.id, item.href, item.label])).toEqual([
      ['dashboard', '/#view-errors', 'Error Dashboard'],
      ['runs', '/runs.html', 'Run History'],
      ['settings', '/settings.html', 'Settings'],
    ]);
  });
});

describe('renderErrorCheckNav', () => {
  it('writes the hashed dashboard href into the nav', () => {
    const html = renderErrorCheckNav('runs');
    expect(html).toContain('href="/#view-errors"');
    expect(html).toMatch(/<a href="\/#view-errors">Error Dashboard<\/a>/);
    expect(html).toContain('href="/runs.html"');
    expect(html).toContain('href="/settings.html"');
  });
});
