(()=>{
'use strict';
// HP_ANALYZE_TABS_V1

window.addEventListener('load',()=>{
try {
 const w=document.querySelector('.map-workspace');
 const f=w?.querySelector('.map-filters-panel');
 const m=w?.querySelector('.map-center-panel');
 const r=document.getElementById('hp-source-rankings');
 const p=w?.querySelector('.map-ranking-pair');
 const ips=document.getElementById('hp-source-ips');

 if(!w||!f||!m||!r||!p||!ips||!f.contains(r))
   throw Error('STOP=ANALYZE_LAYOUT');

 const find=(parent,names)=>{
   const h=[...parent.querySelectorAll('h2,h3,h4')]
     .find(e=>names.includes(e.textContent.trim()));
   if(!h)throw Error('STOP=HEADING_'+names[0]);

   const a=[...parent.children].filter(e=>e.contains(h));
   if(a.length!==1)throw Error('STOP=CARD_'+names[0]);
   return a[0];
 };

 const cards={
   ip:find(r,['Top source IPs','Source IP ranking']),
   asn:find(r,['Top source ASNs','Source ASN ranking']),
   port:find(p,['Destination port ranking']),
   country:find(p,['Source country ranking'])
 };

 if(new Set(Object.values(cards)).size!==4 ||
    !cards.ip.contains(ips) ||
    !cards.ip.classList.contains('hp-ip-ranking-v2'))
   throw Error('STOP=CARD_COLLISION');

 // HP_ANALYZE_TABS_V2_FIX
 // Remove the obsolete Expand control.
 const expand=cards.ip.querySelector('.hp-ip-ranking-expand');
 if(expand) expand.remove();
 cards.ip.classList.remove('hp-ip-ranking-expanded');
 document.body.classList.remove('hp-ip-ranking-open');

 // Identify the existing table scroll containers.
 for(const [name,card] of Object.entries(cards)){
   const table=card.querySelector('table');
   if(!table) throw Error('STOP=ANALYZE_TABLE_'+name);
   let el=table.parentElement;
   while(el && el!==card){
     el.classList.add(
       el===table.parentElement ? 'hp-analyze-scroll' : 'hp-analyze-path'
     );
     el=el.parentElement;
   }
   if(el!==card) throw Error('STOP=ANALYZE_TABLE_PARENT_'+name);
 }

 // HP_ATTACK_TOOLS_TAB_V1
 const attack=document.createElement('section');
 attack.className='hp-analyze-card hp-attack-panel';
 attack.id='hp-analyze-panel-attack';
 attack.innerHTML=`
   <h2>HTTP indicators</h2>
   <p class="hp-attack-note" id="hp-attack-status">Loading data...</p>
   <div class="hp-attack-modes">
     <button type="button" data-mode="patterns">Attack patterns</button>
     <button type="button" data-mode="user_agents">User-Agent fingerprints</button>
   </div>
   <div class="hp-attack-scroll">
     <table>
       <thead><tr>
         <th>Indicator</th><th>Requests</th>
         <th>Source IPs</th><th>Top IP share</th>
       </tr></thead>
       <tbody id="hp-attack-rows"></tbody>
     </table>
   </div>`;
 cards.attack=attack;

 // HP_SCAN_TRENDS_PANEL_V1
 const scan=document.createElement('section');
 scan.className='hp-analyze-card hp-scan-panel';
 scan.id='hp-analyze-panel-scan';

 scan.innerHTML=`
   <h2>Scan & Trends</h2>
   <p class="hp-scan-note" id="hp-scan-status">
     Load when tab opens
   </p>
   <div class="hp-scan-modes">
     <button type="button" data-scan-mode="behavior">
       Scan Behavior
     </button>
     <button type="button" data-scan-mode="daily">
       Daily Trends
     </button>
     <button type="button" data-scan-mode="spikes">
       Port Spikes
     </button>
   </div>
   <div class="hp-scan-scroll">
     <table>
       <thead id="hp-scan-head"></thead>
       <tbody id="hp-scan-rows"></tbody>
     </table>
   </div>`;

 cards.scan=scan;

 const left=document.createElement('div');
 left.className='hp-analyze-left';

 const right=document.createElement('section');
 right.className='hp-analyze-right';

 const title=document.createElement('h2');
 title.className='hp-analyze-title';
 title.textContent='Analyze';

 const tabs=document.createElement('div');
 tabs.className='hp-analyze-tabs';
 tabs.setAttribute('role','tablist');
 tabs.setAttribute('aria-label','Ranking type');

 const body=document.createElement('div');
 body.className='hp-analyze-body';

 const choices=[
   ['ip','Source IP'],
   ['asn','Source ASN'],
   ['port','Destination port'],
   ['country','Source country'],
   ['attack','Attack & Tools'],
   ['scan','Scan & Trends']
 ];

 // HP_HTTP_GROUP_CLICK_V1
 let httpGroup=null;
 window.HP_HTTP_GROUP_IP_SET=null;

 const groupStrip=document.createElement('div');
 groupStrip.className='hp-group-strip';
 groupStrip.hidden=true;

 const groupNote=document.createElement('span');
 const groupClear=document.createElement('button');
 groupClear.type='button';
 groupClear.textContent='Clear IP group';
 groupStrip.append(groupNote,groupClear);

 const buttons={};

 const select=key=>{
   for(const [k,node] of Object.entries(cards)){
     const on=k===key;
     node.hidden=!on;
     node.classList.toggle('hp-analyze-hidden',!on);
     buttons[k].setAttribute('aria-selected',String(on));
     buttons[k].tabIndex=on?0:-1;
   }

   r.classList.toggle(
     'hp-analyze-hidden',
     !['ip','asn'].includes(key)
   );

   p.classList.toggle(
     'hp-analyze-hidden',
     !['port','country'].includes(key)
   );
 };

 choices.forEach(([key,label],i)=>{
   const b=document.createElement('button');
   b.type='button';
   b.textContent=label;
   b.className='hp-analyze-tab';
   b.id='hp-analyze-tab-'+key;

   b.setAttribute('role','tab');
   cards[key].id ||= 'hp-analyze-panel-'+key;
   b.setAttribute('aria-controls',cards[key].id);
   cards[key].setAttribute('role','tabpanel');
   cards[key].setAttribute('aria-labelledby',b.id);

   b.onclick=()=>{select(key);if(key==='scan')initScan();};

   b.onkeydown=e=>{
     if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))
       return;

     e.preventDefault();

     const j=e.key==='Home'?0:
       e.key==='End'?choices.length-1:
       (i+(e.key==='ArrowRight'?1:choices.length-1))%choices.length;

     select(choices[j][0]);
     if(choices[j][0]==='scan')initScan();
     buttons[choices[j][0]].focus();
   };

   buttons[key]=b;
   cards[key].classList.add('hp-analyze-card');
   tabs.append(b);
 });

 left.append(f,m);
 body.append(r,p,attack,scan);
 right.append(title,tabs,groupStrip,body);
 w.append(left,right);

 w.classList.add('hp-analyze-layout');
 select('ip');

 // HTTP analysis under the shared MAP filter selections.
 let attackData=null;
 let attackMode='patterns';
 const attackStatus=attack.querySelector('#hp-attack-status');
 const attackRows=attack.querySelector('#hp-attack-rows');
 const attackBtns=[...attack.querySelectorAll('[data-mode]')];
 const fmt=n=>Number(n).toLocaleString('en-US');
 let renderTimer=0;

 function syncHttpGroup(){
   if(!attackData)return;

   let next=null;

   if(httpGroup){
     next=new Set();

     const day=document.getElementById('f-day')?.value||'';
     const country=document.getElementById('f-country')?.value||'';
     const port=document.getElementById('f-port')?.value||'';

     const asn=window.HP_SOURCE_ASN||
       document.getElementById('f-asn')?.value||'';

     const ip=window.HP_SOURCE_IP||'';

     const hp=document.getElementById('f-honeypot')?.value||'all';

     for(const [d,src,cc,asnId,dport,hpId,label]
       of attackData[httpGroup.mode]){

       if(label!==httpGroup.label)continue;
       if(day&&d!==day)continue;
       if(country&&cc!==country)continue;
       if(port&&dport!==Number(port))continue;
       if(asn&&asnId!==asn)continue;
       if(ip&&src!==ip)continue;
       if(hp!=='all'&&hpId!==hp)continue;

       next.add(src);
     }
   }

   const prev=window.HP_HTTP_GROUP_IP_SET;

   const changed=prev===null
     ?next!==null
     :next===null||prev.size!==next.size||
       [...next].some(ip=>!prev.has(ip));

   window.HP_HTTP_GROUP_IP_SET=next;
   groupStrip.hidden=!httpGroup;

   if(httpGroup){
     groupNote.textContent='MAP + Analyze: '+
       httpGroup.label+' · '+next.size+
       ' source IPs · all TCP/UDP port observations from these IPs';
   }

   if(changed){
     document.dispatchEvent(
       new CustomEvent('hp-http-group-change')
     );
   }
 }

 groupClear.addEventListener('click',()=>{
   httpGroup=null;
   renderAttack();
 });

 function renderAttack(){
   if(!attackData)return;

   attackBtns.forEach(b=>
     b.setAttribute(
       'aria-pressed',String(b.dataset.mode===attackMode)
     )
   );

   const day=document.getElementById('f-day')?.value||'';
   const country=document.getElementById('f-country')?.value||'';
   const port=document.getElementById('f-port')?.value||'';
   const asn=window.HP_SOURCE_ASN||
     document.getElementById('f-asn')?.value||'';
   const ip=window.HP_SOURCE_IP||'';
   const honeypot=
     document.getElementById('f-honeypot')?.value||'all';
   const udp=window.HP_KIND==='UDP';

   syncHttpGroup();
   const groups=new Map();

   if(!udp){
     for(const row of attackData[attackMode]){
       const [d,src,cc,asnId,dport,hp,label,n]=row;

       if(day&&d!==day)continue;
       if(country&&cc!==country)continue;
       if(port&&dport!==Number(port))continue;
       if(asn&&asnId!==asn)continue;
       if(ip&&src!==ip)continue;
       if(window.HP_HTTP_GROUP_IP_SET&&
          !window.HP_HTTP_GROUP_IP_SET.has(src))continue;
       if(honeypot!=='all'&&hp!==honeypot)continue;

       if(!groups.has(label)){
         groups.set(label,{count:0,ips:new Map()});
       }

       const item=groups.get(label);
       item.count+=n;
       item.ips.set(src,(item.ips.get(src)||0)+n);
     }
   }

   const ranked=[...groups].sort(
     (a,b)=>b[1].count-a[1].count||a[0].localeCompare(b[0])
   );

   attackRows.replaceChildren();

   for(const [label,g] of ranked){
     const tr=document.createElement('tr');
     const largest=[...g.ips.values()].reduce(
       (a,b)=>Math.max(a,b),0
     );

     const values=[
       label,fmt(g.count),fmt(g.ips.size),
       (100*largest/g.count).toFixed(1)+'%'
     ];

     values.forEach((value,index)=>{
       const td=document.createElement('td');

       if(index===0){
         const btn=document.createElement('button');
         btn.type='button';
         btn.className='hp-drill-link';
         btn.textContent=value;
         btn.title='Filter MAP to IPs associated with this HTTP indicator';

         btn.setAttribute('aria-pressed',String(
           !!httpGroup&&
           httpGroup.mode===attackMode&&
           httpGroup.label===label
         ));

         btn.addEventListener('click',()=>{
           httpGroup=httpGroup&&
             httpGroup.mode===attackMode&&
             httpGroup.label===label
             ?null:{mode:attackMode,label};

           renderAttack();
         });

         td.append(btn);
       }else td.textContent=value;

       tr.append(td);
     });
     attackRows.append(tr);
   }

   if(!ranked.length){
     const tr=document.createElement('tr');
     const td=document.createElement('td');
     td.colSpan=4;
     td.textContent=udp
       ?'HTTP analysis is not applicable to UDP observations'
       :'No matching HTTP indicators (not a benign verdict)';
     tr.append(td);
     attackRows.append(tr);
   }

   const days=attackData.coverage_days;
   attackStatus.textContent=
     (attackMode==='patterns'
       ?'HTTP URI indicators · multi-label'
       :'HTTP User-Agent signatures · unverified tool identity')+
     ' · '+days[0]+' – '+days[days.length-1]+
     ' · '+fmt(ranked.reduce((s,x)=>s+x[1].count,0))+
     ' matches';
 }

 function scheduleAttack(){
   clearTimeout(renderTimer);
   renderTimer=setTimeout(renderAttack,360);
 }

 for(const b of attackBtns){
   b.addEventListener('click',()=>{
     attackMode=b.dataset.mode;
     renderAttack();
   });
 }

 for(const id of [
   'f-day','f-country','f-port','f-asn','f-honeypot'
 ]){
   document.getElementById(id)?.addEventListener(
     'change',scheduleAttack
   );
 }

 for(const type of ['input','change']){
   document.getElementById('f-source-ip')?.addEventListener(
     type,scheduleAttack
   );
 }

 document.addEventListener(
   'hp-source-facets-rows',scheduleAttack
 );

 const sum=document.getElementById('summary');
 if(sum){
   new MutationObserver(scheduleAttack).observe(
     sum,{childList:true,subtree:true,characterData:true}
   );
 }

 fetch('data/analyze/attack-tools.json',{cache:'no-store'})
   .then(res=>{
     if(!res.ok)throw Error('ATTACK_DATA_HTTP_'+res.status);
     return res.json();
   })
   .then(data=>{
     if(
       data.schema!=='hp-analyze-attack-tools-v1'||
       !Array.isArray(data.patterns)||
       !Array.isArray(data.user_agents)||
       !Array.isArray(data.coverage_days)||
       !data.coverage_days.length
     )throw Error('ATTACK_DATA_SCHEMA');

     attackData=data;
     renderAttack();
   })
   .catch(err=>{
     attackStatus.textContent=
       'HTTP indicator data unavailable (not zero matches)';
     console.error('HP_ATTACK_TOOLS',err);
   });

 // HP_SCAN_TRENDS_V1
 let scanDocs=null;
 const scanFirstSeen={TCP_SYN:new Map(),UDP:new Map()};
 let scanPromise=null;
 let scanMode='behavior';
 let scanTimer=null;
 const scanStatus=scan.querySelector('#hp-scan-status');
 const scanHead=scan.querySelector('#hp-scan-head');
 const scanRows=scan.querySelector('#hp-scan-rows');
 const scanButtons=[...scan.querySelectorAll('[data-scan-mode]')];
 const scanFmt=n=>Number(n).toLocaleString('en-US');

 const scanDayMinusOne=day=>{
   const d=new Date(day+'T00:00:00Z');
   d.setUTCDate(d.getUTCDate()-1);
   return d.toISOString().slice(0,10);
 };

 function scanState(){
   return {
     day:document.getElementById('f-day')?.value||'',
     country:document.getElementById('f-country')?.value||'',
     port:document.getElementById('f-port')?.value||'',
     asn:window.HP_SOURCE_ASN||
       document.getElementById('f-asn')?.value||'',
     ip:window.HP_SOURCE_IP||'',
     honeypot:document.getElementById('f-honeypot')?.value||'all',
     protocol:window.HP_KIND||'TCP_SYN'
   };
 }

 function scanSetTable(columns,rows,empty){
   scanHead.replaceChildren();
   scanRows.replaceChildren();

   const header=document.createElement('tr');
   for(const name of columns){
     const th=document.createElement('th');
     th.scope='col';
     th.textContent=name;
     header.append(th);
   }
   scanHead.append(header);

   if(!rows.length){
     const tr=document.createElement('tr');
     const td=document.createElement('td');
     td.colSpan=columns.length;
     td.textContent=empty;
     tr.append(td);
     scanRows.append(tr);
     return;
   }

   const frag=document.createDocumentFragment();
   for(const cells of rows){
     const tr=document.createElement('tr');
     cells.forEach((value,index)=>{
       const td=document.createElement('td');

       const kind=scanMode==='behavior'&&index===0?'ip':
         scanMode==='daily'&&index===0?'day':
         scanMode==='spikes'&&index===0?'day':
         scanMode==='spikes'&&index===1?'port':null;

       if(kind){
         const button=document.createElement('button');
         button.type='button';
         button.className='hp-drill-link';
         button.textContent=String(value);
         button.title='Filter MAP and Analyze; click again to clear';

         button.addEventListener('click',()=>{
           const id=kind==='ip'?'f-source-ip':
             kind==='day'?'f-day':'f-port';
           const control=document.getElementById(id);
           if(!control||control.disabled)return;

           const v=kind==='port'
             ?String(value).split('/')[0]:String(value);

           if(control.tagName==='SELECT'&&
             ![...control.options].some(o=>o.value===v)){
             control.add(new Option(v,v));
           }

           control.value=control.value===v?'':v;
           control.dispatchEvent(
             new Event('change',{bubbles:true})
           );
         });

         td.append(button);
       }else td.textContent=String(value);

       tr.append(td);
     });
     frag.append(tr);
   }
   scanRows.append(frag);
 }

 function scanRender(){
   if(!scanDocs)return;

   const q=scanState();
   const allDays=scanDocs.map(x=>x.day);
   const allDaySet=new Set(allDays);
   const firstSeen=scanFirstSeen[q.protocol]||new Map();
   const byIp=new Map();
   const byDay=new Map();
   const byDayPort=new Map();
   let total=0;

   if(q.honeypot!=='all'&&q.honeypot!=='hp01'){
     scanStatus.textContent=
       'Source stats for this honeypot are not published';
     scanSetTable(['Status'],[],
       'No source-level data for this honeypot (not zero activity)');
     return;
   }

   for(const doc of scanDocs){
     if(q.day&&q.day!==doc.day&&scanMode!=='spikes')continue;

     for(const [p,dport,index,n] of doc.rows){
       if(p!==(q.protocol==='UDP'?1:0))continue;
       if(q.port&&dport!==Number(q.port))continue;

       const record=doc.sources[index];
       if(!record)continue;

       const [ip,asn,,country]=record;
       const cc=country||'UNKNOWN';
       const asnId=asn===null?'?':String(asn);

       if(q.country&&cc!==q.country)continue;
       if(q.asn&&q.asn!==asnId)continue;
       if(q.ip&&ip!==q.ip)continue;
       if(window.HP_HTTP_GROUP_IP_SET&&
          !window.HP_HTTP_GROUP_IP_SET.has(ip))continue;
       if(!Number.isSafeInteger(n)||n<=0)continue;

       total+=n;

       if(!byIp.has(ip)){
         byIp.set(ip,{
           packets:0,
           ports:new Set(),
           days:new Set()
         });
       }

       const item=byIp.get(ip);
       item.packets+=n;
       item.ports.add(dport);
       item.days.add(doc.day);

       if(!byDay.has(doc.day)){
         byDay.set(doc.day,{
           packets:0,
           ips:new Set(),
           newIps:new Set(),
           ports:new Set()
         });
       }

       const daily=byDay.get(doc.day);
       daily.packets+=n;
       daily.ips.add(ip);
       daily.ports.add(dport);

       if(firstSeen.get(ip)===doc.day){
         daily.newIps.add(ip);
       }

       const key=doc.day+'|'+dport;
       byDayPort.set(key,(byDayPort.get(key)||0)+n);
     }
   }

   scanButtons.forEach(b=>b.setAttribute(
     'aria-pressed',
     String(b.dataset.scanMode===scanMode)
   ));

   const coverage=allDays[0]+' – '+allDays[allDays.length-1];
   const note=q.port
     ?' · Port filter limits observed port breadth'
     :'';

   if(scanMode==='behavior'){
     const rank=[...byIp].map(([ip,v])=>({ip,...v}))
       .sort((a,b)=>
         b.ports.size-a.ports.size||
         b.packets-a.packets||
         a.ip.localeCompare(b.ip)
       );

     const data=rank.slice(0,100).map(v=>[
       v.ip,
       scanFmt(v.packets),
       scanFmt(v.ports.size),
       scanFmt(v.days.size),
       v.ports.size>=200?'Wide sweep':
       v.ports.size>=20?'Broad sweep':
       v.ports.size>=2?'Multi-port':'Single port'
     ]);

     scanStatus.textContent=
       'Source IP scanning breadth · '+coverage+
       ' · '+scanFmt(byIp.size)+' IPs'+
       ' · '+scanFmt(total)+' packets'+note+
       ' · Sweep labels describe port breadth, not malicious intent';

     scanSetTable(
       ['Source IP','Packets','Unique ports','Days','Pattern'],
       data,
       'No matching observations'
     );

   }else if(scanMode==='daily'){
     const data=[...byDay]
       .sort((a,b)=>b[0].localeCompare(a[0]))
       .map(([day,v])=>[
         day,
         scanFmt(v.packets),
         scanFmt(v.ips.size),
         scanFmt(v.newIps.size),
         scanFmt(v.ports.size)
       ]);

     scanStatus.textContent=
       'Daily TCP SYN / UDP observations · '+coverage+
       ' · New IPs = first observed within this published period'+note;

     scanSetTable(
       ['Day (UTC)','Packets','Source IPs',
        'First-seen IPs','Unique ports'],
       data,
       'No matching observations'
     );

   }else{
     const spikes=[];

     for(const [key,now] of byDayPort){
       const divider=key.indexOf('|');
       const day=key.slice(0,divider);

       if(q.day&&day!==q.day)continue;

       const port=key.slice(divider+1);
       const prev=scanDayMinusOne(day);

       if(!allDaySet.has(prev))continue;

       const before=byDayPort.get(prev+'|'+port)||0;
       const change=now-before;

       if(change<=0)continue;
       spikes.push([day,Number(port),now,before,change]);
     }

     spikes.sort((a,b)=>
       b[4]-a[4]||
       b[0].localeCompare(a[0])||
       a[1]-b[1]
     );

     const data=spikes.slice(0,100).map(v=>[
       v[0],
       v[1]+(q.protocol==='UDP'?'/udp':'/tcp'),
       scanFmt(v[2]),
       scanFmt(v[3]),
       '+'+scanFmt(v[4])
     ]);

     scanStatus.textContent=
       'Destination port increases vs preceding UTC day · '+
       coverage+
       ' · Only consecutive published days compared'+note;

     scanSetTable(
       ['Day','Destination port','Packets',
        'Previous day','Increase'],
       data,
       'No positive day-over-day changes (or no previous day)'
     );
   }
 }

 function scanSchedule(){
   if(!scanDocs)return;
   clearTimeout(scanTimer);
   scanTimer=setTimeout(scanRender,400);
 }

 function initScan(){
   if(scanPromise)return;

   scanStatus.textContent=
     'Loading published source observations...';

   scanPromise=fetch(
     'data/source-stats/manifest.json',
     {cache:'no-store'}
   )
     .then(res=>{
       if(!res.ok){
         throw Error('SCAN_MANIFEST_HTTP_'+res.status);
       }
       return res.json();
     })
     .then(async m=>{
       if(
         m.schema!=='hp-source-manifest-v1'||
         !Array.isArray(m.days)||
         !m.days.length
       ){
         throw Error('SCAN_MANIFEST_SCHEMA');
       }

       const docs=[];

       for(let i=0;i<m.days.length;i+=4){
         const part=await Promise.all(
           m.days.slice(i,i+4).map(async day=>{
             const res=await fetch(
               'data/source-stats/'+day+'.json'
             );

             if(!res.ok){
               throw Error('SCAN_DAY_HTTP_'+day);
             }

             const d=await res.json();

             if(
               d.schema!=='hp-source-day-v1'||
               d.day!==day||
               !Array.isArray(d.rows)||
               !Array.isArray(d.sources)
             ){
               throw Error('SCAN_DAY_SCHEMA_'+day);
             }

             return d;
           })
         );
         docs.push(...part);
       }

       docs.sort((a,b)=>a.day.localeCompare(b.day));

       const all=docs.reduce((sum,d)=>
         sum+d.rows.reduce((v,r)=>v+Number(r[3]),0),0
       );

       if(all!==m.total_packets){
         throw Error('SCAN_SOURCE_TOTAL_MISMATCH');
       }

       for(const doc of docs){
         for(const [p,,src] of doc.rows){
           const protocol=p===1?'UDP':'TCP_SYN';
           const ip=doc.sources[src]?.[0];

           if(
             ip&&
             !scanFirstSeen[protocol].has(ip)
           ){
             scanFirstSeen[protocol].set(ip,doc.day);
           }
         }
       }

       scanDocs=docs;
       scanRender();
     })
     .catch(error=>{
       scanStatus.textContent=
         'Scan statistics unavailable (not zero observations)';
       scanSetTable(['Status'],[],String(error.message));
       console.error('HP_SCAN_TRENDS',error);
     });
 }

 for(const b of scanButtons){
   b.addEventListener('click',()=>{
     scanMode=b.dataset.scanMode;
     if(scanDocs)scanRender();
   });
 }

 for(const id of [
   'f-day','f-country','f-port','f-asn','f-honeypot'
 ]){
   document.getElementById(id)?.addEventListener(
     'change',scanSchedule
   );
 }

 document.getElementById('f-source-ip')
   ?.addEventListener('input',scanSchedule);

 document.getElementById('f-source-ip')
   ?.addEventListener('change',scanSchedule);

 document.addEventListener(
   'hp-source-facets-rows',scanSchedule
 );

 if(sum){
   new MutationObserver(scanSchedule).observe(sum,{
     childList:true,
     characterData:true,
     subtree:true
   });
 }

 const fit=()=>{
   if(innerWidth>=1280){
     const h=Math.max(
       300,
       Math.floor(innerHeight-w.getBoundingClientRect().top-26)
     );
     w.style.setProperty('--hp-analyze-height',h+'px');
   }else{
     w.style.removeProperty('--hp-analyze-height');
   }
 };

 fit();
 window.addEventListener('resize',fit,{passive:true});

 requestAnimationFrame(()=>{
   dispatchEvent(new Event('resize'));
 });

 console.info('HP_ANALYZE_TABS_V1=PASS');

}catch(e){
 console.error('HP_ANALYZE_TABS_V1',e);
}
},{once:true});
})();
