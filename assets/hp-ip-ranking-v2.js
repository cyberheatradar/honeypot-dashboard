(() => {
  'use strict';

  // HP_IP_RANKING_V2

  // HP_IP_INTEL_LIVE_PREVIEW
  let intel = {ips:{},daily:{}};
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
  // HP_AGENTIC_IP_RANKING_V1

  const agentIndex=new Map();
  let agentSnapshot='';

  function agentLabels(ip,day){
    const port=document.getElementById('f-port')?.value||'';
    const hp=document.getElementById('f-honeypot')?.value||'all';
    const kind=window.HP_KIND||'TCP_SYN';
    const labels=new Set();

    for(const row of agentIndex.get(ip)||[]){
      const [d,,cc,asn,dport,sensor,label,n,proto]=row;

      if(day&&d!==day)continue;
      if(port&&dport!==Number(port))continue;
      if(hp!=='all'&&sensor!==hp)continue;

      if(proto!==kind&&
         !(proto==='HTTP'&&kind==='TCP_SYN'))continue;

      labels.add(label);
    }

    return [...labels].sort();
  }

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


      const ip = tr.cells[0].textContent.trim();
      const day = document.getElementById('f-day')?.value || '';
      const global = intel.ips[ip] || {};
      const detail = day
        ? (intel.daily?.[day]?.[ip] || {})
        : global;

      const sources = Array.isArray(global.r) ? global.r : [];
      const reputation = tr.cells[2];
      const label = sources.length ? 'suspicious' : '—';

      if (reputation.textContent !== label) {
        reputation.textContent = label;
      }

      reputation.classList.toggle(
        'hp-cti-preview-detected',
        sources.length > 0
      );
      reputation.classList.toggle(
        'hp-cti-preview-unknown',
        sources.length === 0
      );

      reputation.title = sources.length
        ? 'Listed: ' + sources.join(', ') +
          '; ThreatFox not checked'
        : 'No match in fetched feeds; ThreatFox not checked';

      for (const [idx,key,empty] of [
        [3,'a','HTTP signal not detected or not analyzed'],
        [4,'t','No known UA match; AI usage not established']
      ]) {
        let td = tr.cells[idx];

        if (!td) {
          td = document.createElement('td');
          tr.append(td);
        }

        const matches = Array.isArray(detail[key])
          ? detail[key]
          : [];

        const additional = idx===4
          ? agentLabels(ip,day) : [];

        const labels = [
          ...new Set([
            ...matches.map(x=>x[0]),
            ...additional
          ])
        ];

        const value = labels.length
          ? labels.join(', ') : '—';

        if (td.textContent !== value) {
          td.textContent = value;
        }

        td.title = labels.length
          ? [
              ...matches.map(x=>x[0]+' ('+x[1]+')'),
              ...additional.map(label=>
                label+' · ThreatDefence · '+agentSnapshot+
                ' · Not confirmed tool attribution'
              )
            ].join('; ')
          : empty;

        td.classList.toggle(
          'hp-ip-unanalysed',
          labels.length === 0
        );
      }

    }
  }

  decorate();

  new MutationObserver(decorate).observe(tbody,{
    childList:true,
    subtree:true
  });


  const dateFilter = document.getElementById('f-day');

  if (dateFilter) {
    dateFilter.addEventListener('change', decorate);
  }

  fetch('data/source-ip-intel/preview.json', {
    cache: 'no-store'
  })
    .then(response => {
      if (!response.ok) {
        throw Error('SOURCE_INTEL_HTTP_' + response.status);
      }
      return response.json();
    })
    .then(data => {
      if (
        data.schema !== 'hp-source-intel-preview-v1' ||
        !data.ips || !data.daily
      ) {
        throw Error('SOURCE_INTEL_SCHEMA');
      }

      intel = data;

      note.textContent =
        'Preview · IPsum / FireHOL · ThreatFox pending';

      note.title = 'Snapshot: ' + data.generated_utc;
      decorate();
    })
    .catch(error => {
      console.error('SOURCE_INTEL_PREVIEW', error);
    });

  fetch('data/analyze/agentic.json',{cache:'no-store'})
    .then(res=>{
      if(!res.ok)throw Error('AGENTIC_HTTP_'+res.status);
      return res.json();
    })
    .then(data=>{
      if(data.schema!=='hp-agentic-intel-v1'||
         !Array.isArray(data.rows)){
        throw Error('AGENTIC_SCHEMA');
      }

      agentSnapshot=(data.snapshot_utc||'')+
        ' ('+data.status+')';

      for(const row of data.rows){
        const ip=row[1];

        if(!agentIndex.has(ip)){
          agentIndex.set(ip,[]);
        }

        agentIndex.get(ip).push(row);
      }

      decorate();
    })
    .catch(error=>{
      console.error('HP_AGENTIC_RANKING',error);
    });

  console.info('HP_IP_RANKING_V2=PASS');
})();
