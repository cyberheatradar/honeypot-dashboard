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
   ['attack','Attack & Tools']
 ];

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

   b.onclick=()=>select(key);

   b.onkeydown=e=>{
     if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))
       return;

     e.preventDefault();

     const j=e.key==='Home'?0:
       e.key==='End'?choices.length-1:
       (i+(e.key==='ArrowRight'?1:choices.length-1))%choices.length;

     select(choices[j][0]);
     buttons[choices[j][0]].focus();
   };

   buttons[key]=b;
   cards[key].classList.add('hp-analyze-card');
   tabs.append(b);
 });

 left.append(f,m);
 body.append(r,p,attack);
 right.append(title,tabs,body);
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

   const groups=new Map();

   if(!udp){
     for(const row of attackData[attackMode]){
       const [d,src,cc,asnId,dport,hp,label,n]=row;

       if(day&&d!==day)continue;
       if(country&&cc!==country)continue;
       if(port&&dport!==Number(port))continue;
       if(asn&&asnId!==asn)continue;
       if(ip&&src!==ip)continue;
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

     for(const value of [
       label,fmt(g.count),fmt(g.ips.size),
       (100*largest/g.count).toFixed(1)+'%'
     ]){
       const td=document.createElement('td');
       td.textContent=value;
       tr.append(td);
     }
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
