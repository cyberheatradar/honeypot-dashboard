(() => {
  'use strict';

  // HP_STATUS_HONEYPOT_PREVIEW_V1
  // 20 manually verified AbuseIPDB IPs.
  // Other IPs remain UNKNOWN, not benign.

  const verified = new Set(`
77.239.124.174 77.239.124.177 204.76.203.4
79.124.62.230 79.124.62.134 139.162.119.49
79.124.62.126 77.239.124.176 172.104.74.45
157.245.211.243 79.124.49.130 45.131.195.224
45.33.16.187 79.124.56.102 213.209.159.175
139.177.206.6 139.162.112.126 45.33.12.231
104.237.132.58 45.56.79.53
`.trim().split(/\s+/));

  const body = document.getElementById('hp-source-ips');
  const filters = document.querySelector(
    '.map-center-panel .filters'
  );

  if (!body || !filters) {
    throw Error('HP_GUI_PREVIEW_DOM_MISSING');
  }

  if (document.getElementById('f-honeypot')) return;

  const header = body.closest('table')
    ?.querySelector('thead tr');

  if (!header || header.cells.length !== 2) {
    throw Error('HP_GUI_PREVIEW_HEADER_CHANGED');
  }

  const th = document.createElement('th');
  th.textContent = 'Status';
  th.scope = 'col';
  th.title = 'Preview: 20 verified IPs; — means not evaluated';
  header.append(th);

  const label = document.createElement('label');
  label.textContent = 'Honeypot';

  const select = document.createElement('select');
  select.id = 'f-honeypot';

  select.append(
    new Option('All Honeypots', 'all'),
    new Option('hp01 · Existing', 'hp01')
  );

  for (let i = 2; i <= 5; i++) {
    const id = 'hp' + String(i).padStart(2, '0');
    const option = new Option(id + ' · Not connected', id);
    option.disabled = true;
    select.append(option);
  }

  select.title = 'Preview: only hp01 has public data';
  label.append(select);
  filters.append(label);

  function decorate() {
    for (const row of body.rows) {
      if (
        row.cells.length === 1 &&
        row.cells[0].colSpan > 1
      ) {
        row.cells[0].colSpan = 3;
        continue;
      }

      if (row.cells.length !== 2) continue;

      const ip = row.cells[0].textContent.trim();
      const matched = verified.has(ip);

      const cell = document.createElement('td');
      cell.className = 'hp-cti-preview-status ' +
        (matched
          ? 'hp-cti-preview-detected'
          : 'hp-cti-preview-unknown');

      cell.textContent = matched ? 'suspicious' : '—';
      row.append(cell);
    }
  }

  decorate();

  new MutationObserver(decorate).observe(body, {
    childList: true
  });
})();
