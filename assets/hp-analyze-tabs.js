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
   ['country','Source country']
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
       e.key==='End'?3:
       (i+(e.key==='ArrowRight'?1:3))%4;

     select(choices[j][0]);
     buttons[choices[j][0]].focus();
   };

   buttons[key]=b;
   cards[key].classList.add('hp-analyze-card');
   tabs.append(b);
 });

 left.append(f,m);
 body.append(r,p);
 right.append(title,tabs,body);
 w.append(left,right);

 w.classList.add('hp-analyze-layout');
 select('ip');

 const fit=()=>{
   if(innerWidth>=1280){
     const h=Math.max(
       300,
       Math.floor(innerHeight-w.getBoundingClientRect().top-14)
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
