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
   // HP_MOBILE_SCROLL_FIX_V3
   if(table.parentElement===card){
     const mq=window.matchMedia('(max-width:767px)');
     const scroll=document.createElement('div');
     scroll.className='hp-analyze-scroll';

     const sync=()=>{
       if(mq.matches&&table.parentElement===card){
         table.before(scroll);
         scroll.append(table);
       }else if(!mq.matches&&table.parentElement===scroll){
         scroll.before(table);
         scroll.remove();
       }
     };

     sync();
     mq.addEventListener('change',sync);
     continue;
   }
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
     <button type="button" data-mode="agentic">AI Agent Indicators</button>
   <button type="button" data-mode="sigma">Sigma Indicators</button>
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
 const focusNote=document.createElement('p');
 focusNote.className='hp-focus-note';
 focusNote.textContent='Ranking totals before drill-down · Highlighted rows match filters';
 const titleRow=document.createElement('div');
 titleRow.className='hp-analyze-title-row';

 const onlyButton=document.createElement('button');
 onlyButton.id='hp-highlighted-only';
 onlyButton.type='button';
 onlyButton.textContent='Highlighted Only';
 onlyButton.setAttribute('aria-pressed','false');
 onlyButton.title='Show only rows matching current filters';

 onlyButton.addEventListener('click',()=>{
   const focus=window.HP_ROW_FOCUS;
   focus.setOnly(!focus.only);
 });

 titleRow.append(title,onlyButton);
 right.append(titleRow,tabs,focusNote,groupStrip,body);
 w.append(left,right);

 w.classList.add('hp-analyze-layout');
 select('ip');

 // HTTP analysis under the shared MAP filter selections.
 // HP_AGENTIC_INDICATORS_V1
 let attackData=null;
 let agentInfo=null;
 let sigmaInfo=null;

 function agentProtocol(proto){
   const kind=window.HP_KIND||'TCP_SYN';
   return proto===kind||
     (proto==='HTTP'&&kind==='TCP_SYN');
 }
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

     for(const [d,src,cc,asnId,dport,hpId,label,,proto]
       of attackData[httpGroup.mode]){

       if(label!==httpGroup.label)continue;
       if(httpGroup.mode==='agentic'&&
          !agentProtocol(proto))continue;
       if(day&&d!==day)continue;
       if(country&&cc!==country)continue;
       if(port&&dport!==Number(port))continue;
       if(asn&&asnId!==asn)continue;
       if(ip&&src!==ip)continue;
       if(hp!=='all'&&hpId!==hp)continue;

       if(!window.HP_TABLE_UI.allows(src))continue;
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


 // HP_SIGMA_FULL_POC_V2
 const sigmaControls=document.createElement('div');
 sigmaControls.style.cssText=
   'display:none;flex-wrap:wrap;gap:6px;'+
   'align-items:center;flex-shrink:0;margin:2px 0 6px';

 const sigmaSearch=document.createElement('input');
 sigmaSearch.type='search';
 sigmaSearch.placeholder='Search CVE / rule / author / tag';
 sigmaSearch.setAttribute('aria-label','Search Sigma indicators');
 sigmaSearch.style.cssText=
   'min-width:160px;flex:1 1 100%;box-sizing:border-box';

 function sigmaSelect(name,options){
   const el=document.createElement('select');
   el.setAttribute('aria-label',name);

   for(const [value,label] of options){
     const option=document.createElement('option');
     option.value=value;
     option.textContent=label;
     el.append(option);
   }

   el.style.cssText='flex:1 1 100px;min-width:0';
   return el;
 }

 const sigmaType=sigmaSelect('Rule type',[
   ['all','All types'],
   ['cve','CVE'],
   ['noncve','Non-CVE']
 ]);

 const sigmaSource=sigmaSelect('Rule source',[
   ['all','All sources'],
   ['SigmaHQ','SigmaHQ'],
   ['CISA','CISA'],
   ['Wazuh-Sigma','Wazuh-Sigma'],
   ['Hatchepsoute','Hatchepsoute'],
   ['Iwatobi','Iwatobi'],
   ['MetaMaaz','MetaMaaz'],
   ['Custom','Custom']
 ]);

 const sigmaState=sigmaSelect('Detection status',[
   ['all','All results'],
   ['matched','Matched'],
   ['zero','No match'],
   ['unavailable','Not evaluated'],
   ['partial','Partial evaluation'],
   ['provisional','Provisional']
 ]);

 const sigmaLevel=sigmaSelect('Rule level',[
   ['all','All levels'],
   ['critical','Critical'],
   ['high','High'],
   ['medium','Medium'],
   ['low','Low'],
   ['informational','Informational']
 ]);

 const sigmaSummary=document.createElement('div');
 sigmaSummary.style.cssText=
   'flex-basis:100%;font-size:11px;opacity:.85';

 const sigmaClear=document.createElement('button');
 sigmaClear.type='button';
 sigmaClear.textContent='Reset';

 sigmaClear.addEventListener('click',()=>{
   sigmaSearch.value='';
   for(const el of [
     sigmaType,sigmaSource,sigmaState,sigmaLevel
   ])el.value='all';

   renderAttack();
 });

 // HP_SIGMA_EXTERNAL_CUSTOM_V3
 for(const el of [
   sigmaSearch,sigmaType,sigmaSource,
   sigmaState,sigmaLevel,sigmaClear
 ]){
   el.style.colorScheme='dark';
   el.style.background='#142333';
   el.style.color='#dce9f4';
   el.style.border='1px solid #40566e';
   el.style.borderRadius='5px';
   el.style.padding='5px 7px';
   el.style.fontSize='12px';
 }

 sigmaControls.append(
   sigmaSearch,sigmaType,sigmaSource,
   sigmaState,sigmaLevel,sigmaClear,sigmaSummary
 );

 attack.querySelector('.hp-attack-modes').after(sigmaControls);

 sigmaSearch.addEventListener('input',renderAttack);

 for(const el of [
   sigmaType,sigmaSource,sigmaState,sigmaLevel
 ])el.addEventListener('change',renderAttack);

 // HP_SIGMA_COLLAPSIBLE_V4
 const sigmaExpanded=new Set();

 function renderSigma(){
   attack.querySelector('h2').textContent='Sigma Indicators';

   const headers=attack.querySelectorAll('thead th');
   headers[0].textContent='Indicator / detection';
   headers[1].textContent='Requests';
   headers[2].textContent='Source IPs';
   headers[3].textContent='Top IP share';

   const saved=window.HP_ROW_FOCUS.save(attackRows);
   attackRows.replaceChildren();

   function empty(message){
     const tr=document.createElement('tr');
     const td=document.createElement('td');
     td.colSpan=4;
     td.textContent=message;
     tr.append(td);
     attackRows.append(tr);
   }

   if(!sigmaInfo){
     attackStatus.textContent='Sigma data unavailable';
     sigmaSummary.textContent='';
     empty('Rule catalog unavailable');
     return;
   }

   const day=document.getElementById('f-day')?.value||'';
   const country=document.getElementById('f-country')?.value||'';
   const port=document.getElementById('f-port')?.value||'';
   const asn=String(window.HP_SOURCE_ASN||
     document.getElementById('f-asn')?.value||'');
   const ip=window.HP_SOURCE_IP||'';
   const hp=document.getElementById('f-honeypot')?.value||'all';

   const udp=window.HP_KIND==='UDP';

   const covered=!udp&&
     (!day||sigmaInfo.coverage_days.includes(day))&&
     (hp==='all'||hp==='hp01');

   syncHttpGroup();

   const groups=new Map();
   const focused=Boolean(country||port||asn||ip||httpGroup);

   if(covered){
     for(const row of sigmaInfo.rows){
       const [d,src,cc,asnId,dport,hpId,label,n,,last]=row;

       if(day&&d!==day)continue;
       if(hp!=='all'&&hpId!==hp)continue;
       if(!window.HP_TABLE_UI.allows(src))continue;

       if(!groups.has(label)){
         groups.set(label,{
           count:0,ips:new Map(),
           latest:null,highlight:false
         });
       }

       const g=groups.get(label);

       g.count+=n;
       g.ips.set(src,(g.ips.get(src)||0)+n);

       if(last&&(
         !g.latest||Date.parse(last)>Date.parse(g.latest)
       ))g.latest=last;

       if(
         (!country||cc===country)&&
         (!port||dport===Number(port))&&
         (!asn||String(asnId)===asn)&&
         (!ip||src===ip)&&
         (!window.HP_HTTP_GROUP_IP_SET||
           window.HP_HTTP_GROUP_IP_SET.has(src))&&
         (!httpGroup||httpGroup.mode!=='sigma'||
           httpGroup.label===label)
       )g.highlight=true;
     }
   }

   const terms=sigmaSearch.value.toLowerCase()
     .trim().split(/\s+/).filter(Boolean);

   const catalog=Object.entries(sigmaInfo.rules);

   const items=[];

   for(const [label,meta] of catalog){
     const available=covered&&meta.evaluated;

     const g=groups.get(label)||{
       count:0,ips:new Map(),
       latest:null,highlight:false
     };

     const state=!available?'unavailable':
       g.count?'matched':'zero';

     const searchable=[
       label,meta.title,meta.author,meta.id,
       meta.source,...(meta.cves||[]),
       ...(meta.tags||[])
     ].join(' ').toLowerCase();

     if(!terms.every(t=>searchable.includes(t)))continue;

     if(sigmaType.value==='cve'&&!meta.cves.length)continue;
     if(sigmaType.value==='noncve'&&meta.cves.length)continue;

     if(sigmaSource.value!=='all'&&
        sigmaSource.value!==meta.source)continue;

     if(sigmaLevel.value!=='all'&&
        sigmaLevel.value!==meta.level)continue;

     if(sigmaState.value==='provisional'){
       if(!available||!meta.provisional)continue;
     }else if(sigmaState.value==='partial'){
       if(meta.scope!=='partial'||!available)continue;
     }else if(sigmaState.value!=='all'&&
              sigmaState.value!==state)continue;

     const largest=[...g.ips.values()].reduce(
       (a,b)=>Math.max(a,b),0
     );

     items.push({
       label,meta,g,state,available,
       share:g.count?100*largest/g.count:0
     });
   }

   items.sort((a,b)=>
     (b.available?b.g.count:-1)-
     (a.available?a.g.count:-1)||
     a.label.localeCompare(b.label)
   );

   const ranked=window.HP_TABLE_UI.sort(
     'attack-sigma',
     items,
     x=>[
       x.label,
       x.available?x.g.count:-1,
       x.available?x.g.ips.size:-1,
       x.available?x.share:-1
     ]
   );

   window.HP_TABLE_UI.bind(
     'attack-sigma',
     attackRows.closest('table'),
     renderAttack,1,-1
   );

   function small(parent,value){
     const div=document.createElement('div');
     div.style.cssText=
       'font-size:10px;opacity:.85;'+
       'margin-top:4px;overflow-wrap:anywhere';

     div.textContent=value;
     parent.append(div);
     return div;
   }

   let shown=0;

   for(const item of ranked){
     const {label,meta,g,state,available,share}=item;

     const tr=document.createElement('tr');
     const first=document.createElement('td');


     const titleLine=document.createElement('div');
     titleLine.style.cssText=
       'display:flex;align-items:flex-start;gap:6px;'+
       'min-width:0;overflow-wrap:anywhere';

     const toggle=document.createElement('button');
     toggle.type='button';
     toggle.textContent='▼';
     toggle.style.cssText=
       'flex:0 0 19px;padding:2px 0;'+
       'background:transparent;border:0;'+
       'color:#9fbcd2;font-size:11px;cursor:pointer';

     toggle.setAttribute('aria-label','Expand rule details');
     toggle.setAttribute('aria-expanded','false');

     titleLine.append(toggle);
     first.append(titleLine);

     if(available&&g.count){
       const btn=document.createElement('button');
       btn.type='button';
       btn.className='hp-drill-link';
       btn.textContent=label;

       btn.setAttribute('aria-pressed',String(
         httpGroup?.mode==='sigma'&&
         httpGroup.label===label
       ));

       btn.addEventListener('click',()=>{
         httpGroup=
           httpGroup?.mode==='sigma'&&
           httpGroup.label===label
           ?null:{mode:'sigma',label};

         renderAttack();
       });

       titleLine.append(btn);
     }else{
       const title=document.createElement('div');
       title.textContent=label;
       titleLine.append(title);
     }



     let detailRow=null;

     function openDetails(){
       if(detailRow)return;

       detailRow=document.createElement('tr');
       detailRow.className='hp-sigma-detail-row';

       const detail=document.createElement('td');
       detail.colSpan=4;
       detail.style.cssText=
         'padding:8px 14px 12px 30px;'+
         'text-align:left;background:#101a29;'+
         'overflow-wrap:anywhere';

     if(meta.cves?.length){
       small(detail,meta.cves.join(' · '));
     }

     const status=small(detail,
       state==='matched'?'Matched':
       state==='zero'?'No match':
       'Not evaluated'
     );

     status.style.fontWeight='600';

     status.style.color=
       state==='matched'?'#f2a09a':
       state==='zero'?'#9dc9bd':'#a6b3c2';

     if(meta.provisional){
       status.textContent+=' · Provisional';
     }

     if(meta.validation){
       small(detail,meta.validation);
     }

     if(meta.scope==='partial'){
       status.textContent+=' · Partial rule';
     }else if(meta.scope==='request-keywords'){
       status.textContent+=' · Request keywords';
     }

     const attribution=small(detail,'');
     if(meta.url){
       const link=document.createElement('a');
       link.href=meta.url;
       link.target='_blank';
       link.rel='noopener noreferrer';
       link.textContent=meta.source+' / '+meta.author;
       attribution.append(link);
     }else{
       attribution.textContent=
         meta.source+' / '+meta.author;
     }

     if(meta.license){
       small(detail,meta.license);
     }

     small(detail,
       meta.status+' · '+meta.level+
       (meta.modified?' · '+meta.modified:'')
     );

     if(g.latest){
       small(detail,'Last seen: '+
         new Date(g.latest).toISOString()
           .replace('T',' ').slice(0,19)+' UTC'
       );
     }

     if(meta.reason){
       small(detail,meta.reason);
     }

     if(meta.normalization){
       small(detail,'Normalization: '+meta.normalization);
     }



       if(meta.source==='Custom'&&meta.yaml){
         small(detail,'Sigma YAML');

         const pre=document.createElement('pre');
         pre.style.cssText=
           'margin:6px 0 0;padding:10px;'+
           'background:#0b1420;color:#bed5e8;'+
           'border:1px solid #30465c;border-radius:5px;'+
           'font-size:11px;line-height:1.5;'+
           'white-space:pre-wrap;overflow-wrap:anywhere;'+
           'max-height:280px;overflow:auto;'+
           'box-sizing:border-box;text-align:left';

         pre.textContent=meta.yaml;
         detail.append(pre);
       }

       detailRow.append(detail);

       window.HP_ROW_FOCUS.paint(
         detailRow,focused?g.highlight:null
       );

       tr.after(detailRow);

       toggle.textContent='▲';
       toggle.setAttribute('aria-expanded','true');
       toggle.setAttribute('aria-label','Collapse rule details');
     }

     function closeDetails(){
       detailRow?.remove();
       detailRow=null;

       toggle.textContent='▼';
       toggle.setAttribute('aria-expanded','false');
       toggle.setAttribute('aria-label','Expand rule details');
     }

     toggle.addEventListener('click',event=>{
       event.stopPropagation();

       if(detailRow){
         sigmaExpanded.delete(label);
         closeDetails();
       }else{
         sigmaExpanded.add(label);
         openDetails();
       }
     });

     tr.append(first);

     for(const value of [
       available?fmt(g.count):'—',
       available?fmt(g.ips.size):'—',
       available&&g.count?share.toFixed(1)+'%':'—'
     ]){
       const td=document.createElement('td');
       td.textContent=value;
       tr.append(td);
     }

     window.HP_ROW_FOCUS.paint(
       tr,focused?g.highlight:null
     );

     attackRows.append(tr);

     if(sigmaExpanded.has(label))openDetails();

     if(!tr.hidden)shown++;
   }

   if(!ranked.length){
     empty('No rules match the selected search and filters');
   }

   window.HP_ROW_FOCUS.restore(saved);

   const days=sigmaInfo.coverage_days;

   attackStatus.textContent=
     'Manual PoC · '+sigmaInfo.catalog_rules+' rules'+
     ' · '+sigmaInfo.evaluated_rules+' evaluated'+
     ' · '+sigmaInfo.matched_rules+' matched'+
     ' · '+sigmaInfo.not_evaluated_rules+' not evaluated'+
     ' · '+(sigmaInfo.provisional_rules||0)+' provisional'+
     ' · '+days[0]+' – '+days[days.length-1]+' UTC';

   if(!covered){
     attackStatus.textContent+=
       ' · Selected scope not evaluated';
   }

   const license=document.createElement('a');
   license.href=sigmaInfo.license_url;
   license.target='_blank';
   license.rel='noopener noreferrer';
   license.textContent=' · DRL 1.1';
   attackStatus.append(license);

   sigmaSummary.textContent=
     ranked.length+' / '+catalog.length+
     ' rules · Matches may overlap · '+
     'Not confirmed exploitation';

   if(focused){
     sigmaSummary.textContent+=
       ' · Ranking totals before drill-down';
   }
 }


 function renderAttack(){
   if(!attackData)return;

   sigmaControls.style.display=
     attackMode==='sigma'?'flex':'none';

   if(attackMode==='sigma'){
     attackBtns.forEach(b=>
       b.setAttribute(
         'aria-pressed',
         String(b.dataset.mode===attackMode)
       )
     );

     renderSigma();
     return;
   }

   attack.querySelector('thead th:nth-child(1)')
     .textContent='Indicator';

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
   const matched=new Set();
   const focused=Boolean(country||port||asn||ip||httpGroup);

   // HP_AGENTIC_HEADING_V1
   const agentMode=attackMode==='agentic';
   const sigmaMode=attackMode==='sigma';

   attack.querySelector('h2').textContent=
     sigmaMode?'Sigma Indicators':agentMode?'AI Agent Indicators':'HTTP indicators';

   attack.querySelector('thead th:nth-child(2)').textContent=
     agentMode?'Observations':'Requests';

   if(!udp||agentMode){
     for(const row of attackData[attackMode]){
       const [d,src,cc,asnId,dport,hp,label,n,proto]=row;

       if(agentMode&&!agentProtocol(proto))continue;

       if(day&&d!==day)continue;
       if(!window.HP_TABLE_UI.allows(src))continue;
       if(honeypot!=='all'&&hp!==honeypot)continue;

       if((!country||cc===country)&&
          (!port||dport===Number(port))&&
          (!asn||asnId===asn)&&(!ip||src===ip)&&
          (!window.HP_HTTP_GROUP_IP_SET||
             window.HP_HTTP_GROUP_IP_SET.has(src))&&
          (!httpGroup||httpGroup.mode!==attackMode||
             httpGroup.label===label)){
         matched.add(label);
       }

       if(!groups.has(label)){
         groups.set(label,{count:0,ips:new Map()});
       }

       const item=groups.get(label);
       item.count+=n;
       item.ips.set(src,(item.ips.get(src)||0)+n);
     }
   }

   const baseRank=[...groups].sort(
     (a,b)=>b[1].count-a[1].count||a[0].localeCompare(b[0])
   );

   const ranked=window.HP_TABLE_UI.sort(
     'attack-'+attackMode,
     baseRank,
     ([label,g])=>[
       label,
       g.count,
       g.ips.size,
       100*[...g.ips.values()].reduce(
         (a,b)=>Math.max(a,b),0
       )/g.count
     ]
   );

   window.HP_TABLE_UI.bind(
     'attack-'+attackMode,
     attackRows.closest('table'),
     renderAttack,1,-1
   );

   const saved=window.HP_ROW_FOCUS.save(attackRows);
   attackRows.replaceChildren();

   for(const [label,g] of ranked){
     const tr=document.createElement('tr');
     const largest=[...g.ips.values()].reduce(
       (a,b)=>Math.max(a,b),0
     );

     const values=[
       label,
       fmt(g.count)+(agentMode?
         (label.endsWith(' (Signature)')?' requests':' packets'):''),
       fmt(g.ips.size),
       (100*largest/g.count).toFixed(1)+'%'
     ];

     values.forEach((value,index)=>{
       const td=document.createElement('td');

       if(index===0){
         const btn=document.createElement('button');
         btn.type='button';
         btn.className='hp-drill-link';
         btn.textContent=value;
         btn.title=agentMode
           ?'Filter MAP to source IPs associated with this agent indicator'
           :'Filter MAP to IPs associated with this HTTP indicator';

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

         if(sigmaMode){
           const meta=sigmaInfo?.rules?.[label];

           if(meta){
             const attribution=document.createElement('div');
             attribution.style.fontSize='10px';
             attribution.style.color='#9db2c6';
             attribution.style.marginTop='4px';
             attribution.style.overflowWrap='anywhere';

             const link=document.createElement('a');
             link.href=meta.url;
             link.target='_blank';
             link.rel='noopener noreferrer';
             link.textContent='SigmaHQ / '+meta.author;
             link.style.color='#9dc9df';

             attribution.append(link);

             const status=document.createElement('div');
             status.textContent=
               meta.status+' · '+meta.level;

             attribution.append(status);
             td.append(attribution);
           }
         }
       }else td.textContent=value;

       tr.append(td);
     });
     window.HP_ROW_FOCUS.paint(tr,focused?matched.has(label):null);
     attackRows.append(tr);
   }

   window.HP_ROW_FOCUS.restore(saved);

   if(!ranked.length){
     const tr=document.createElement('tr');
     const td=document.createElement('td');
     td.colSpan=4;
     td.textContent=sigmaMode
       ?(!sigmaInfo
         ?'Sigma PoC data unavailable'
         :udp
          ?'HTTP Sigma analysis is not applicable to UDP'
          :'No matching Sigma indicators in this PoC')
       :agentMode
       ?(!agentInfo||agentInfo.status==='unavailable'
         ?'Agent intelligence unavailable'
         :'No matching agent indicators (not a benign verdict)')
       :udp
         ?'HTTP analysis is not applicable to UDP observations'
         :'No matching HTTP indicators (not a benign verdict)';
     tr.append(td);
     attackRows.append(tr);
   }

   if(sigmaMode){
     const days=sigmaInfo?.coverage_days||[];

     attackStatus.textContent=
       !sigmaInfo
       ?'Sigma PoC unavailable (not zero matches)'
       :'Manual PoC · SigmaHQ · '+
         sigmaInfo.evaluated_rules+' evaluated rules'+
         ' · '+days[0]+' – '+days[days.length-1]+
         ' · '+fmt(ranked.reduce(
           (s,x)=>s+x[1].count,0
         ))+' rule matches'+
         ' · Counts may overlap; not confirmed exploitation';

     if(day&&!days.includes(day)){
       attackStatus.textContent+=
         ' · Selected day not analyzed in this PoC';
     }

     const license=document.createElement('a');
     license.href='https://github.com/SigmaHQ/Detection-Rule-License';
     license.target='_blank';
     license.rel='noopener noreferrer';
     license.textContent=' · DRL 1.1';
     attackStatus.append(license);

     return;
   }

   if(agentMode){
     attackStatus.textContent=
       !agentInfo||agentInfo.status==='unavailable'
       ?'ThreatDefence data unavailable (not zero matches)'
       :'ThreatDefence · '+agentInfo.status+
         ' · snapshot '+agentInfo.snapshot_utc.slice(0,10)+
         ' · Exposure is not attack attribution'+
         ' · IOC is a reported address match'+
         ' · Signature = HTTP indicator'+
         ' · Counts may overlap';
     return;
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

 Promise.all([
   fetch('data/analyze/attack-tools.json',{cache:'no-store'})
     .then(res=>{
       if(!res.ok)throw Error('ATTACK_DATA_HTTP_'+res.status);
       return res.json();
     }),
   fetch('data/analyze/agentic.json',{cache:'no-store'})
     .then(res=>{
       if(!res.ok)throw Error('AGENTIC_HTTP_'+res.status);
       return res.json();
     })
     .catch(error=>{
       console.error('HP_AGENTIC_INTEL',error);
       return null;
     })

   ,fetch('data/analyze/sigma-poc.json',{
      cache:'no-store'
    })
      .then(res=>{
        if(!res.ok)throw Error('SIGMA_HTTP_'+res.status);
        return res.json();
      })
      .catch(error=>{
        console.error('HP_SIGMA_POC',error);
        return null;
      })
 ])
   .then(([data,agent,sigma])=>{
     if(
       data.schema!=='hp-analyze-attack-tools-v1'||
       !Array.isArray(data.patterns)||
       !Array.isArray(data.user_agents)||
       !Array.isArray(data.coverage_days)||
       !data.coverage_days.length
     )throw Error('ATTACK_DATA_SCHEMA');

     agentInfo=agent&&
       agent.schema==='hp-agentic-intel-v1'&&
       Array.isArray(agent.rows)
       ?agent:null;

     data.agentic=agentInfo?.rows||[];

     sigmaInfo=sigma&&
       sigma.schema==='hp-sigma-poc-public-v1'&&
       Array.isArray(sigma.rows)&&
       Array.isArray(sigma.coverage_days)&&
       sigma.rules
       ?sigma:null;

     data.sigma=sigmaInfo?.rows||[];
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

 let scanFocus={active:false,keys:new Set()};

 function scanSetTable(columns,rows,empty){
   const saved=window.HP_ROW_FOCUS.save(scanRows);
   scanHead.replaceChildren();

   const header=document.createElement('tr');
   for(const name of columns){
     const th=document.createElement('th');
     th.scope='col';
     th.textContent=name;
     header.append(th);
   }
   scanHead.append(header);

   const id='scan-'+scanMode;

   const defaultColumn=
     scanMode==='behavior'?2:
     scanMode==='daily'?0:4;

   rows=window.HP_TABLE_UI.sort(id,rows,values=>{
     const key=[...values];

     if(scanMode==='behavior'){
       key[0]=window.HP_TABLE_UI.ipKey(key[0]);

       const order={
         'Single port':1,
         'Multi-port':2,
         'Broad sweep':3,
         'Wide sweep':4
       };

       key[4]=order[key[4]]||0;
     }

     return key;
   });

   const rowKey=cells=>scanMode==='spikes'
     ?String(cells[0])+'|'+String(cells[1]).split('/')[0]
     :String(cells[0]);

   if(window.HP_ROW_FOCUS.only&&scanFocus.active){
     rows=rows.filter(cells=>
       scanFocus.keys.has(rowKey(cells))
     );
   }

   window.HP_TABLE_UI.bind(
     id,scanHead.closest('table'),
     scanRender,defaultColumn,-1
   );

   const makeRow=cells=>{
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

         if(kind==='ip'){
           window.HP_TABLE_UI.copyButton(td,String(value));
         }
       }else td.textContent=String(value);

       tr.append(td);
     });
     const key=scanMode==='spikes'
       ?String(cells[0])+'|'+String(cells[1]).split('/')[0]
       :String(cells[0]);

     window.HP_ROW_FOCUS.paint(
       tr,scanFocus.active?scanFocus.keys.has(key):null
     );

     return tr;
   };

   window.HP_ROW_FOCUS.page(
     scanRows,rows,makeRow,empty,
     columns.length,saved,id
   );
 }

 document.addEventListener('hp-row-focus-only',()=>{
   if(scanDocs)scanRender();
 });

 function scanRender(){
   if(!scanDocs)return;

   const q=scanState();
   const allDays=scanDocs.map(x=>x.day);
   const allDaySet=new Set(allDays);
   const firstSeen=scanFirstSeen[q.protocol]||new Map();
   scanFocus={active:false,keys:new Set()};

   if(q.honeypot!=='all'&&q.honeypot!=='hp01'){
     scanStatus.textContent=
       'Source stats for this honeypot are not published';
     scanSetTable(['Status'],[],
       'No source-level data for this honeypot (not zero activity)');
     return;
   }

   function collect(q,group){
   const byIp=new Map();
   const byDay=new Map();
   const byDayPort=new Map();
   let total=0;

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
       if(!window.HP_TABLE_UI.allows(ip))continue;
       if(group&&!group.has(ip))continue;
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

   return {byIp,byDay,byDayPort,total};
   }

   const baseline={
     ...q,country:'',port:'',asn:'',ip:'',
     day:scanMode==='behavior'?q.day:''
   };

   const {byIp,byDay,byDayPort,total}=collect(baseline,null);
   const match=collect(q,window.HP_HTTP_GROUP_IP_SET);

   const focused=Boolean(
     q.country||q.port||q.asn||q.ip||
     window.HP_HTTP_GROUP_IP_SET||
     (scanMode!=='behavior'&&q.day)
   );

   const keys=new Set();

   if(scanMode==='behavior'){
     for(const key of match.byIp.keys())keys.add(key);
   }else if(scanMode==='daily'){
     for(const key of match.byDay.keys())keys.add(key);
   }else{
     for(const key of match.byDayPort.keys()){
       if(!q.day||key.startsWith(q.day+'|'))keys.add(key);
     }
   }

   scanFocus={active:focused,keys};

   scanButtons.forEach(b=>b.setAttribute(
     'aria-pressed',
     String(b.dataset.scanMode===scanMode)
   ));

   const coverage=allDays[0]+' – '+allDays[allDays.length-1];
   const note=scanFocus.active
     ?' · Highlighted rows match drill-down filters'
     :'';

   if(scanMode==='behavior'){
     const rank=[...byIp].map(([ip,v])=>({ip,...v}))
       .sort((a,b)=>
         b.ports.size-a.ports.size||
         b.packets-a.packets||
         a.ip.localeCompare(b.ip)
       );

     const data=rank.map(v=>[
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

     const data=spikes.map(v=>[
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

 // HP_CLEAR_ALL_FILTERS_V1

 function installClearFilters(){
   const grid=m.querySelector('.map-view-head .filters');

   if(!grid){
     console.error('HP_CLEAR_FILTER_GRID_MISSING');
     return;
   }

   const ids=[
     'f-day','f-country','f-port',
     'f-asn','f-source-ip'
   ];

   const controls=ids.map(
     id=>document.getElementById(id)
   );

   if(controls.some(el=>!el)){
     console.error('HP_CLEAR_FILTER_CONTROL_MISSING');
     return;
   }

   const hp=document.getElementById('f-honeypot')||
     [...m.querySelectorAll('select')].find(el=>
       [...el.options].some(o=>
         o.textContent.trim().toLowerCase()==='all honeypots'
       )
     );

   const hpDefault=hp
     ?[...hp.options].find(o=>
       o.textContent.trim().toLowerCase()==='all honeypots'
     )?.value??''
     :'';

   const searchInputs=[
     'day','country','port','asn'
   ].map(k=>document.getElementById('hp-search-'+k))
    .filter(Boolean);

   const clear=document.createElement('button');
   clear.type='button';
   clear.id='hp-clear-all-filters';
   clear.textContent='Clear All Filters';
   clear.title='Clear MAP and Analyze filters; keep traffic category and map view';

   const wrap=document.createElement('div');
   wrap.className='hp-clear-filters-wrap';
   wrap.append(clear);

   let hpItem=hp?.closest('label');

   while(hpItem&&hpItem.parentElement!==grid){
     hpItem=hpItem.parentElement;
   }

   if(hpItem&&hpItem.parentElement===grid){
     hpItem.after(wrap);
   }else{
     grid.append(wrap);
   }

   function refresh(){
     const active=
       controls.some(el=>el.value.trim()!=='')||
       searchInputs.some(el=>el.value.trim()!=='')||
       Boolean(hp&&hp.value!==hpDefault)||
       Boolean(httpGroup)||
       window.HP_TABLE_UI.listedActive;

     clear.disabled=!active;
   }

   window.HP_TABLE_UI.installListed(wrap);

   clear.addEventListener('click',()=>{
     window.HP_TABLE_UI.setListed(false,false);
     httpGroup=null;

     for(const input of searchInputs){
       input.value='';
       input.removeAttribute('aria-invalid');
       input.title='';
     }

     for(const el of controls){
       el.value='';
     }

     if(hp)hp.value=hpDefault;

     syncHttpGroup();

     // Native change handlers also synchronize search inputs
     // and cancel pending search timers.
     for(const el of controls){
       el.dispatchEvent(
         new Event('change',{bubbles:true})
       );
     }

     if(hp){
       hp.dispatchEvent(
         new Event('change',{bubbles:true})
       );
     }

     renderAttack();

     if(scanDocs)scanRender();

     refresh();
   });

   document.addEventListener('input',refresh);
   document.addEventListener('change',refresh);
   document.addEventListener(
     'hp-http-group-change',refresh
   );
   document.addEventListener(
     'hp-source-facets-rows',refresh
   );

   refresh();

   console.info('HP_CLEAR_ALL_FILTERS_V1=PASS');
 }

 installClearFilters();

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

// HP_TABLE_CONTROLS_V1

// HP_ANALYZE_ROW_FOCUS_V1

// HP_HIGHLIGHTED_ONLY_V1

// HP_UNLIMITED_RANKINGS_V1

// HP_SIGMA_INDICATORS_POC_V1
