export const ERROR_CHECK_NAV_ITEMS = [
  { id: 'dashboard', href: '/#view-errors', label: 'Error Dashboard' },
  { id: 'runs', href: '/runs.html', label: 'Run History' },
  { id: 'settings', href: '/settings.html', label: 'Settings' },
];

function navMarkup(activePage) {
  return ERROR_CHECK_NAV_ITEMS.map((item) => {
    const current = item.id === activePage ? ' aria-current="page"' : '';
    return `<a href="${item.href}"${current}>${item.label}</a>`;
  }).join('');
}

export function renderErrorCheckNav(activePage, root) {
  const html = navMarkup(activePage);
  const doc = root && root.querySelector ? root : (typeof document !== 'undefined' ? document : null);
  if (!doc) return html;

  let nav = null;
  if (doc.querySelector) {
    nav = doc.querySelector('[data-error-check-nav]') || doc.querySelector('#error-check-nav');
  }
  if (!nav && doc === document) {
    nav = document.getElementById('error-check-nav');
  }
  if (!nav && doc.createElement && (doc.body || doc.appendChild)) {
    nav = (doc.ownerDocument || doc).createElement('nav');
    nav.setAttribute('data-error-check-nav', '');
    nav.className = 'error-check-nav';
    if (doc.body) {
      doc.body.insertBefore(nav, doc.body.firstChild);
    } else if (doc.appendChild && doc !== document) {
      doc.insertBefore(nav, doc.firstChild);
    }
  }
  if (nav) {
    nav.classList.add('error-check-nav');
    nav.setAttribute('data-error-check-nav', '');
    nav.innerHTML = html;
  }
  return html;
}
