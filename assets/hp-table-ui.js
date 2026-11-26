(()=>{
'use strict';

// HP_TABLE_CONTROLS_V1

const states=new Map();
const callbacks=new Map();
const collator=new Intl.Collator('en',{
  numeric:true,
  sensitivity:'base'
});

let listedIPs=null;
let listedActive=false;
let listedButton=null;

function normalize(value){
  if(value===null||value===undefined||
     value===''||value==='—'){
    return null;
  }

  if(typeof value==='number')return value;

  const s=String(value).trim();

  const n=s.replaceAll(',','').match(
    /^[+-]?\d+(?:\.\d+)?(?=%?$|\/(?:tcp|udp)$| (?:packets?|requests?)$)/i
  );

  return n?Number(n[0]):s;
}

function compare(a,b,dir){
  a=normalize(a);
  b=normalize(b);

  // Missing values remain last in either direction.
  if(a===null)return b===null?0:1;
  if(b===null)return -1;

  if(typeof a==='number'&&typeof b==='number'){
    return dir*(a-b);
  }

  if(
    typeof a==='string'&&
    typeof b==='string'&&
    /^ipv[46]:[0-9a-f]+$/.test(a)&&
    /^ipv[46]:[0-9a-f]+$/.test(b)
  ){
    return dir*(a<b?-1:a>b?1:0);
  }

  return dir*collator.compare(String(a),String(b));
}

function ipKey(value){
  const s=String(value).toLowerCase();

  function v4(x){
    const p=x.split('.');
    if(p.length!==4||
       !p.every(y=>/^\d{1,3}$/.test(y)&&Number(y)<=255)){
      return null;
    }
    return p.map(Number);
  }

  const four=v4(s);

  if(four){
    return 'ipv4:'+four.map(x=>
      x.toString(16).padStart(2,'0')
    ).join('');
  }

  if(!s.includes(':'))return null;

  let six=s;

  if(six.includes('.')){
    const i=six.lastIndexOf(':');
    const tail=v4(six.slice(i+1));

    if(!tail)return null;

    six=six.slice(0,i+1)+
      ((tail[0]<<8)|tail[1]).toString(16)+':'+
      ((tail[2]<<8)|tail[3]).toString(16);
  }

  const halves=six.split('::');

  if(halves.length>2)return null;

  const left=halves[0]?halves[0].split(':'):[];
  const right=halves.length===2&&halves[1]
    ?halves[1].split(':'):[];

  let parts;

  if(halves.length===2){
    const gap=8-left.length-right.length;
    if(gap<1)return null;

    parts=[
      ...left,...Array(gap).fill('0'),...right
    ];
  }else{
    parts=left;
  }

  if(parts.length!==8||
     !parts.every(x=>/^[0-9a-f]{1,4}$/.test(x))){
    return null;
  }

  return 'ipv6:'+parts.map(x=>
    x.padStart(4,'0')
  ).join('');
}

function setSort(id,column,direction){
  states.set(id,{column,direction});
}

function sort(id,records,key){
  const state=states.get(id);

  if(!state)return records;

  return records.map((record,index)=>({
    record,index,
    value:key(record)[state.column]
  })).sort((a,b)=>
    compare(a.value,b.value,state.direction)||
    a.index-b.index
  ).map(x=>x.record);
}

function refresh(id){
  if(states.has(id))callbacks.get(id)?.();
}

function bind(id,table,callback,defaultColumn,defaultDir=-1){
  const header=table?.tHead?.rows[0];

  if(!header)return;

  callbacks.set(id,callback);

  const state=states.get(id)||{
    column:defaultColumn,
    direction:defaultDir
  };

  [...header.cells].forEach((th,index)=>{
    let btn=th.querySelector('.hp-sort-header');

    const label=btn
      ?btn.dataset.label
      :th.textContent.trim();

    if(!label||label==='Status')return;

    if(!btn||btn.dataset.sortId!==id){
      btn=document.createElement('button');
      btn.type='button';
      btn.className='hp-sort-header';
      btn.dataset.label=label;
      btn.dataset.sortId=id;
      btn.textContent=label;
      btn.title='Click to toggle ascending / descending';

      btn.addEventListener('click',()=>{
        const current=states.get(id)||{
          column:defaultColumn,
          direction:defaultDir
        };

        const next=current.column===index
          ?-current.direction:1;

        setSort(id,index,next);

        callback();

        bind(id,table,callback,
          defaultColumn,defaultDir);
      });

      th.replaceChildren(btn);
    }

    const selected=state.column===index;

    btn.dataset.direction=selected
      ?(state.direction===1?'asc':'desc')
      :'none';

    th.setAttribute('aria-sort',selected
      ?(state.direction===1?'ascending':'descending')
      :'none');
  });
}

// HP_IP_LOOKUP_LINKS_V2
// HP_IP_LOOKUP_LINKS_V3

function lookupLinks(cell,ip){
  if(!ipKey(ip))return;
  if(cell.querySelector('.hp-ip-lookups'))return;

  const encoded=encodeURIComponent(ip);


  const services=[
    [
      'Abuse','AbuseIPDB',
      'https://www.abuseipdb.com/check/'+encoded
    ],
    [
      'VT','VirusTotal',
      'https://www.virustotal.com/gui/ip-address/'+encoded
    ],
    [
      'GN','GreyNoise',
      'https://viz.greynoise.io/ips/'+encoded
    ],
    [
      'OTX','AlienVault OTX',
      'https://otx.alienvault.com/indicator/ip/'+encoded
    ],
    [
      'ISC','SANS ISC / DShield',
      'https://isc.sans.edu/ipinfo/'+encoded
    ],
    [
      'Scamalytics','Scamalytics IP Fraud Risk',
      'https://scamalytics.com/ip/'+encoded
    ],
    [
      'Shodan','Shodan',
      'https://www.shodan.io/host/'+encoded
    ],
    [
      'WHOIS','ViewDNS WHOIS',
      'https://viewdns.info/whois/?domain='+encoded
    ],
    [
      'RDAP','RDAP IP registration',
      'https://client.rdap.org/?type=ip&object='+encoded
    ],
    [
      'rDNS','ViewDNS Reverse DNS / PTR',
      'https://viewdns.info/reversedns/?ip='+encoded
    ],
    [
      'pDNS','VirusTotal Passive DNS / Relations',
      'https://www.virustotal.com/gui/ip-address/'+encoded+'/relations'
    ],
    [
      'Robtex','Robtex IP Lookup / DNS history',
      ip.includes(':')
        ?'https://robtex.com/en/ip-lookup'
        :'https://robtex.com/en/ip-lookup/'+ip.split('.').join('/')
    ],
    [
      'Archive','Wayback Machine',
      'https://web.archive.org/web/'+
      new Date().getUTCFullYear()+'0000000000*/'+encoded
    ],
    [
      'URLScan','urlscan.io existing results',
      'https://urlscan.io/search/#'+encoded
    ]
  ];

  const wrap=document.createElement('span');
  wrap.className='hp-ip-lookups';

  for(const [short,name,url] of services){
    const link=document.createElement('a');

    link.className='hp-ip-lookup';
    link.dataset.label=short;
    link.href=url;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.referrerPolicy='no-referrer';
    link.title=name+' — '+ip;

    link.setAttribute(
      'aria-label',
      'Look up '+ip+' in '+name+' (new tab)'
    );

    link.addEventListener('click',event=>{
      event.stopPropagation();
    });

    wrap.append(link);
  }

  // No text nodes are added to the IP cell.
  // Existing IP parsers continue to work.

  cell.append(wrap);
}

function copyButton(cell,ip){
  if(!ipKey(ip)||
     cell.querySelector('.hp-copy-ip'))return;

  const btn=document.createElement('button');

  btn.type='button';
  btn.className='hp-copy-ip';
  btn.title='Copy IP address';
  btn.setAttribute('aria-label','Copy '+ip);

  btn.addEventListener('click',async event=>{
    event.preventDefault();
    event.stopPropagation();

    try{
      if(!navigator.clipboard){
        throw Error('CLIPBOARD_UNAVAILABLE');
      }

      await navigator.clipboard.writeText(ip);

      btn.dataset.copied='yes';
      btn.title='Copied: '+ip;

      setTimeout(()=>{
        delete btn.dataset.copied;
        btn.title='Copy IP address';
      },1000);

    }catch(error){
      btn.title='Copy failed';
      console.error('HP_IP_COPY',error);
      window.prompt('Copy IP address:',ip);
    }
  });

  // No text node: IP parsers continue to see only the IP.
  // HP_TABLE_PRESENTATION_V2
  const line=document.createElement('span');
  line.className='hp-ip-copy-line';

  const link=cell.querySelector(
    'button.hp-ranking-filter,button.hp-drill-link'
  );

  if(link){
    link.title=ip+' · '+link.title;
  }

  line.append(...Array.from(cell.childNodes),btn);
  cell.classList.add('hp-ip-copy-cell');
  cell.append(line);
  lookupLinks(cell,ip);
}

function updateListedButton(){
  if(!listedButton)return;

  listedButton.disabled=listedIPs===null;
  listedButton.setAttribute(
    'aria-pressed',String(listedActive)
  );
}

function setListed(value,notify=true){
  listedActive=Boolean(value&&listedIPs!==null);
  updateListedButton();

  if(notify){
    document.dispatchEvent(
      new CustomEvent('hp-http-group-change')
    );
  }
}

function setListedData(ips){
  listedIPs=new Set(
    Object.entries(ips)
      .filter(([,v])=>
        Array.isArray(v.r)&&v.r.length>0
      )
      .map(([ip])=>ip)
  );

  updateListedButton();
}

function installListed(after){
  const wrap=document.createElement('div');
  wrap.className='hp-clear-filters-wrap';

  listedButton=document.createElement('button');
  listedButton.type='button';
  listedButton.id='hp-listed-only';
  listedButton.textContent='Suspicious Only';
  listedButton.title=
    'Filter to IPsum / FireHOL matches; not proof of malicious activity';

  listedButton.addEventListener('click',()=>{
    setListed(!listedActive);
  });

  wrap.append(listedButton);
  after.after(wrap);

  updateListedButton();
}

window.HP_TABLE_UI={
  sort,bind,refresh,setSort,ipKey,copyButton,
  setListed,setListedData,installListed,
  get listedActive(){return listedActive;},
  allows(ip){
    return !listedActive||listedIPs.has(ip);
  }
};

})();


window.HP_ROW_FOCUS=(()=>{
  const style=document.createElement('style');
  style.textContent=`
    .hp-analyze-layout tr.hp-focus-muted>td{
      opacity:.38;
    }
    .hp-analyze-layout tr.hp-focus-hit>td{
      background:#224657!important;
    }
    .hp-analyze-layout tr.hp-focus-hit>td:first-child{
      box-shadow:inset 3px 0 #6bd3e6;
    }
    .hp-analyze-layout tr.hp-focus-muted:hover>td{
      opacity:.8;
    }
    .hp-analyze-layout .hp-focus-note{
      font-size:11px;
      color:#a8bdcf;
      margin:0 0 6px;
    }
  `;
  document.head.append(style);

  function paint(tr,match){
    tr.classList.toggle('hp-focus-hit',match===true);
    tr.classList.toggle('hp-focus-muted',match===false);
  }

  function save(body){
    const result=[];
    let el=body.closest('table')?.parentElement;
    while(el && el!==document.body){
      const css=getComputedStyle(el);
      if(/auto|scroll/.test(css.overflowY+' '+css.overflowX)){
        result.push([el,el.scrollTop,el.scrollLeft]);
      }
      if(el.classList.contains('hp-analyze-right'))break;
      el=el.parentElement;
    }
    return result;
  }

  function restore(result){
    for(const [el,y,x] of result){
      el.scrollTop=y;
      el.scrollLeft=x;
    }
  }

  // The entire row is clickable when its action is unambiguous.
  // Copy buttons and external investigation links are unaffected.
  document.addEventListener('click',event=>{
    if(event.target.closest?.('a,button,input,select,label'))return;
    const tr=event.target.closest?.('.hp-analyze-layout tbody tr');
    if(!tr)return;

    let buttons=[...tr.querySelectorAll(
      'button.hp-ranking-filter,button.hp-drill-link'
    )];

    if(tr.parentElement.id==='map-port-rows'){
      buttons=[...tr.cells[0].querySelectorAll('button')];
    }

    if(buttons.length===1)buttons[0].click();
  });

  return {paint,save,restore};
})();

// HP_ANALYZE_ROW_FOCUS_V1
