(() => {
  'use strict';

  // HP_IP_RANKING_V2
  const tbody = document.getElementById('hp-source-ips');
  const root = document.getElementById('hp-source-rankings');

  if (!tbody || !root) {
    throw Error('STOP=SOURCE_RANKING_MISSING');
  }

  const panel = tbody.closest('.hp-source-ranking-panel');
  const wrapper = tbody.closest('.hp-source-tablewrap');
  const table = tbody.closest('table');
  const header = table?.querySelector('thead tr');

  if (!panel || !wrapper || !header ||
      header.cells.length !== 3) {
    throw Error('STOP=RANKING_STRUCTURE_CHANGED');
  }

  panel.classList.add('hp-ip-ranking-v2');

  // Existing preview's Status column is repurposed.
  header.cells[2].textContent = 'IP Reputation';
  header.cells[2].title =
    'IPsum / FireHOL / ThreatFox; not yet connected';

  for (const [title,description] of [
    ['Attack Detection','Suricata / HTTP rule matches'],
    ['AI/Tool Fingerprint','Observed tool fingerprint; AI use is not proven']
  ]) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = title;
    th.title = description;
    header.append(th);
  }

  const heading = panel.querySelector('h2');
  if (!heading) throw Error('STOP=RANKING_HEADING_MISSING');

  const controls = document.createElement('div');
  controls.className = 'hp-ip-ranking-controls';

  const note = document.createElement('span');
  note.className = 'hp-ip-ranking-note';
  note.textContent = 'Preview · — = not evaluated';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hp-ip-ranking-expand';
  button.textContent = 'Expand';
  button.setAttribute('aria-expanded','false');

  controls.append(note,button);
  panel.insertBefore(controls,wrapper);

  function setExpanded(expanded) {
    panel.classList.toggle('hp-ip-ranking-expanded',expanded);
    document.body.classList.toggle('hp-ip-ranking-open',expanded);
    button.textContent = expanded ? 'Close' : 'Expand';
    button.setAttribute('aria-expanded',String(expanded));
  }

  button.addEventListener('click',() => {
    setExpanded(
      !panel.classList.contains('hp-ip-ranking-expanded')
    );
  });

  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' &&
        panel.classList.contains('hp-ip-ranking-expanded')) {
      setExpanded(false);
    }
  });

  // Re-rendered ranking rows must also receive five columns.
  function decorate() {
    for (const tr of tbody.rows) {
      if (tr.cells.length === 1 &&
          tr.cells[0].colSpan > 1) {
        if (tr.cells[0].colSpan !== 5) {
          tr.cells[0].colSpan = 5;
        }
        continue;
      }

      if (tr.cells.length !== 3 &&
          tr.cells.length !== 5) {
        continue;
      }

      // Remove the retired AbuseIPDB hardcoded preview.
      // Do not classify these IPs until 3 CTI feeds exist.
      const reputation = tr.cells[2];

      if (reputation.textContent !== '—') {
        reputation.textContent = '—';
      }

      reputation.classList.remove(
        'hp-cti-preview-detected'
      );
      reputation.classList.add(
        'hp-cti-preview-unknown'
      );

      reputation.title =
        'Not evaluated: IPsum, FireHOL, ThreatFox';

      if (tr.cells.length === 3) {
        for (const description of [
          'Not yet analyzed by attack detection',
          'Not yet analyzed for tool fingerprints'
        ]) {
          const td = document.createElement('td');
          td.textContent = '—';
          td.title = description;
          td.className = 'hp-ip-unanalysed';
          tr.append(td);
        }
      }
    }
  }

  decorate();

  new MutationObserver(decorate).observe(tbody,{
    childList:true,
    subtree:true
  });

  console.info('HP_IP_RANKING_V2=PASS');
})();
