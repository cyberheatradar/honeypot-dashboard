(() => {
  'use strict';
  const root=document.getElementById('hp-source-stats');
  if(!root)return;

  // HP_SOURCE_SPLIT_V2
  const oldAsn=root.querySelector('#hp-source-asns');
  const oldIp=root.querySelector('#hp-source-ips');
  const oldStatus=root.querySelector('#hp-source-state');

  if(!oldAsn||!oldIp||!oldStatus)
    throw Error('SOURCE_PANEL_STRUCTURE_CHANGED');

  const asnWrap=oldAsn.closest('.hp-source-tablewrap');
  const ipWrap=oldIp.closest('.hp-source-tablewrap');

  if(!asnWrap||!ipWrap)
    throw Error('SOURCE_TABLE_WRAPPER_MISSING');

  function makePanel(title,wrap,state){
    const panel=document.createElement('section');
    panel.className='panel hp-source-ranking-panel';

    const heading=document.createElement('h2');
    heading.textContent=title;
    panel.append(heading);

    if(state)panel.append(state);
    panel.append(wrap);
    return panel;
  }

  const asnPanel=makePanel(
    'Source ASN ranking',asnWrap,oldStatus
  );
  const ipPanel=makePanel(
    'Source IP ranking',ipWrap,null
  );

  root.replaceChildren(asnPanel,ipPanel);
  root.id='hp-source-rankings';
  root.className='hp-source-rankings';
  const day=document.getElementById('f-day');
  const country=document.getElementById('f-country');
  const port=document.getElementById('f-port');
  const status=document.getElementById('hp-source-state');
  const asns=document.getElementById('hp-source-asns');
  const ips=document.getElementById('hp-source-ips');
  if(!day||!country||!port||!status||!asns||!ips)return;
  const fmt=n=>n.toLocaleString('en-US');
  const cache=new Map();
  let seq=0;
  const manifestPromise=fetch('data/source-stats/manifest.json',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw Error('manifest HTTP '+r.status);return r.json()})
    .then(d=>{if(d.schema!=='hp-source-manifest-v1'||!Array.isArray(d.days))throw Error('manifest schema');return d});
  function load(d){
    if(!cache.has(d))cache.set(d,fetch('data/source-stats/'+d+'.json')
      .then(r=>{if(!r.ok)throw Error('day HTTP '+r.status);return r.json()})
      .then(v=>{if(v.schema!=='hp-source-day-v1'||v.day!==d||!Array.isArray(v.sources)||!Array.isArray(v.rows))throw Error('day schema');return v}));
    return cache.get(d);
  }

  const lastRecords=new Map();

  function table(target,records,asnMode){
    const id=asnMode?'asn':'ip';

    lastRecords.set(id,records);

    records=window.HP_TABLE_UI.sort(id,records,item=>{
      if(asnMode)return [item.asn,item.count];

      return [
        window.HP_TABLE_UI.ipKey(item.ip),
        item.count,
        ...(window.HP_RANK_SORT_VALUES?.(item.ip)||
          [null,null,null])
      ];
    });
    if(window.HP_ROW_FOCUS.only &&
       records.some(item=>typeof item.matched==='boolean')){
      records=records.filter(item=>item.matched===true);
    }

    const saved=window.HP_ROW_FOCUS.save(target);
    const previousLength=target.rows.length;
    target.replaceChildren();

    const scroller=target.closest('.hp-source-tablewrap');
    if(!scroller)
      throw Error('SOURCE_SCROLLER_MISSING');

    scroller.onscroll=null;
    // Preserve the existing scroll position.

    if(records.length===0){
      const tr=document.createElement('tr');
      const td=document.createElement('td');
      td.colSpan=2;
      td.textContent='No matching observations';
      tr.append(td);
      target.append(tr);
      return;
    }

    let offset=0;
    const batchSize=150;

    function appendBatch(){
      if(offset>=records.length)return;

      const fragment=document.createDocumentFragment();
      const end=Math.min(offset+batchSize,records.length);

      for(;offset<end;offset++){
        const item=records[offset];

        const tr=document.createElement('tr');
        const label=document.createElement('td');
        const count=document.createElement('td');

        count.textContent=fmt(item.count);
        count.className='hp-source-number';

        if(asnMode){
          const id=document.createElement('strong');
          id.textContent=item.asn===null
            ?'Unknown ASN':'AS'+item.asn;

          const org=document.createElement('span');
          org.className='hp-source-org';
          org.textContent=item.org||'Unknown organization';

          label.append(id,org);
        }else{
          label.textContent=item.ip||'Unknown IP';
          label.className='hp-source-ip';
        }

        tr.append(label,count);
        window.HP_ROW_FOCUS.paint(tr,item.matched);
        fragment.append(tr);
      }

      target.append(fragment);
    }

    appendBatch();
    while(offset<Math.min(previousLength,records.length)){
      appendBatch();
    }

    window.HP_ROW_FOCUS.restore(saved);

    scroller.onscroll=()=>{
      const nearBottom=
        scroller.scrollTop+scroller.clientHeight >=
        scroller.scrollHeight-200;

      if(nearBottom)appendBatch();
    };
  }

  document.addEventListener('hp-row-focus-only',()=>{
    for(const [id,target,asnMode] of [
      ['ip',ips,false],
      ['asn',asns,true]
    ]){
      if(lastRecords.has(id)){
        table(target,lastRecords.get(id),asnMode);
      }
    }
  });

  async function render(){
    const ticket=++seq;
    status.textContent='Loading source statistics...';
    const fDay=day.value,fCountry=country.value,fPort=port.value;
    const fAsn=window.HP_SOURCE_ASN||'';
    const fIp=window.HP_SOURCE_IP||'';
    const group=window.HP_HTTP_GROUP_IP_SET;
    const focused=Boolean(fCountry||fPort||fAsn||fIp||group);
    const matchIps=new Set(),matchAsns=new Set();
    const kind=window.HP_KIND||'TCP_SYN';
    try{
      const manifest=await manifestPromise;
      const days=fDay?manifest.days.filter(d=>d===fDay):manifest.days;
      const ipCounts=new Map(),asnCounts=new Map(),orgCounts=new Map();
      let total=0;
      for(let i=0;i<days.length;i+=6){
        const pages=await Promise.all(days.slice(i,i+6).map(load));
        if(ticket!==seq)return;
        for(const data of pages){
          for(const row of data.rows){
            const [p,pNum,src,n]=row;
            if(kind!=='all' && p!==(kind==='UDP'?1:0))continue;
            const [ip,asn,org,cc]=data.sources[src];
            if(!window.HP_TABLE_UI.allows(ip))continue;

            const keyAsn=asn===null?'?':String(asn);

            if((!fPort||pNum===Number(fPort))&&
               (!fCountry||(cc||'UNKNOWN')===fCountry)&&
               (!fAsn||keyAsn===fAsn)&&
               (!fIp||ip===fIp)&&
               (!group||group.has(ip))){
              matchIps.add(ip||'');
              matchAsns.add(keyAsn);
            }
            total+=n;
            const ipKey=ip||'';
            ipCounts.set(ipKey,(ipCounts.get(ipKey)||0)+n);
            const asnKey=asn===null?'?':String(asn);
            asnCounts.set(asnKey,(asnCounts.get(asnKey)||0)+n);
            const orgKey=asnKey+'\u001f'+(org||'');
            orgCounts.set(orgKey,(orgCounts.get(orgKey)||0)+n);
          }
        }
      }
      if(ticket!==seq)return;
      const ipsRank=[...ipCounts].map(([ip,count])=>({ip,count,matched:focused?matchIps.has(ip):null}))
        .sort((a,b)=>b.count-a.count||a.ip.localeCompare(b.ip));
      const bestOrg=new Map();
      for(const [key,n] of orgCounts){
        const idx=key.indexOf('\u001f'),asn=key.slice(0,idx),org=key.slice(idx+1);
        const old=bestOrg.get(asn);
        if(!old||n>old.count)bestOrg.set(asn,{org,count:n});
      }
      const asnsRank=[...asnCounts].map(([k,count])=>({
        asn:k==='?'?null:Number(k),org:bestOrg.get(k)?.org||'',count,matched:focused?matchAsns.has(k):null
      })).sort((a,b)=>b.count-a.count||String(a.asn).localeCompare(String(b.asn)));
      table(ips,ipsRank,false);table(asns,asnsRank,true);
      status.textContent='Ranking-scope TCP SYN / UDP packet counts · '+fmt(ipCounts.size)+' source IPs · '+fmt(asnCounts.size)+' ASNs';
    }catch(e){
      if(ticket!==seq)return;
      status.textContent='Source statistics unavailable (not zero observations)';
      asns.replaceChildren();ips.replaceChildren();console.error('SOURCE_STATS',e);
    }
  }
  for(const el of [day,country,port])el.addEventListener('change',render);
  const summary=document.getElementById('summary');
  if(summary&&typeof MutationObserver==='function'){
    new MutationObserver(render).observe(summary,{childList:true,characterData:true,subtree:true});
  }
  window.addEventListener('load',()=>{
    for(const [id,target,asnMode] of [
      ['ip',ips,false],
      ['asn',asns,true]
    ]){
      const repaint=()=>{
        if(lastRecords.has(id)){
          table(target,lastRecords.get(id),asnMode);
        }
      };

      window.HP_TABLE_UI.bind(
        id,target.closest('table'),repaint,1,-1
      );
    }
  },{once:true});

  document.addEventListener('hp-source-facets-rows',render);
  render();
})();

// HP_FACET_SOURCE_RANK_V2

// HP_HTTP_GROUP_SOURCE_STATS_V1

// HP_TABLE_CONTROLS_V1

// HP_ANALYZE_ROW_FOCUS_V1

// HP_HIGHLIGHTED_ONLY_V1
