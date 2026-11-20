(() => {
  'use strict';
  // HP_SOURCE_FACETS_V2
  const get=id=>document.getElementById(id);
  const day=get('f-day');
  const proto=get('hp-kind');
  const country=get('f-country');
  const port=get('f-port');
  const filters=port?.closest('.filters');
  const source=get('hp-packet-data');
  const base=get('map-data');

  if(!day||!proto||!country||!port||!filters||!source||!base)
    throw Error('SOURCE_FILTER_ELEMENTS_MISSING');

  if(get('f-asn')||get('f-source-ip'))
    throw Error('SOURCE_FILTER_ALREADY_EXISTS');

  const original=JSON.parse(base.textContent).rows;
  const packets=JSON.parse(source.textContent);
  if(!Array.isArray(original)||!Array.isArray(packets.rows))
    throw Error('SOURCE_FILTER_DATA_INVALID');

  const asn=document.createElement('select');
  asn.id='f-asn';
  asn.disabled=true;
  asn.append(new Option('Loading ASNs...',''));

  const asnLabel=document.createElement('label');
  asnLabel.textContent='ASN';
  asnLabel.append(asn);
  filters.append(asnLabel);

  const ip=document.createElement('input');
  ip.id='f-source-ip';
  ip.type='search';
  ip.placeholder='All / exact IP';
  ip.autocomplete='off';
  ip.maxLength=45;
  ip.disabled=true;

  const ipLabel=document.createElement('label');
  ipLabel.textContent='Source IP';
  ipLabel.append(ip);
  filters.append(ipLabel);

  const suggestions=document.createElement('datalist');
  suggestions.id='hp-source-ip-list';
  ip.setAttribute('list',suggestions.id);
  filters.append(suggestions);


  window.HP_SOURCE_ASN='';
  window.HP_SOURCE_IP='';

  let documents=[];
  let timer=null;

  const fmt=n=>Number(n).toLocaleString('en-US');

  function apply(){
    if(asn.disabled)return;

    const selectedAsn=asn.value;
    const selectedIp=ip.value.trim();

    window.HP_SOURCE_ASN=selectedAsn;
    window.HP_SOURCE_IP=selectedIp;

    if(!selectedAsn&&!selectedIp){
      document.dispatchEvent(new CustomEvent(
        'hp-source-facets-rows',
        {detail:{rows:original}}
      ));
      return;
    }

    const chosenProto=window.HP_KIND||proto.value;
    const counts=new Map();

    for(const data of documents){
      for(const [p,dport,index,count] of data.rows){
        const protocol=p===0?'TCP_SYN':'UDP';
        if(protocol!==chosenProto)continue;

        const [address,number,,cc]=data.sources[index];
        const keyAsn=number===null?'?':String(number);

        if(selectedAsn&&keyAsn!==selectedAsn)continue;
        if(selectedIp&&address!==selectedIp)continue;

        const key=JSON.stringify([
          data.day,cc||'UNKNOWN',protocol,dport
        ]);
        counts.set(key,(counts.get(key)||0)+count);
      }
    }

    const rows=[];
    for(const [key,count] of counts){
      const [date,cc,protocol,dport]=JSON.parse(key);
      rows.push({
        day:date,
        country:cc,
        transport:protocol,
        port:String(dport),
        method:'-',
        signal:'-',
        count
      });
    }

    document.dispatchEvent(new CustomEvent(
      'hp-source-facets-rows',
      {detail:{rows}}
    ));
  }

  async function initialize(){
    const response=await fetch(
      'data/source-stats/manifest.json',
      {cache:'no-store'}
    );
    if(!response.ok)throw Error('SOURCE_MANIFEST_HTTP');
    const manifest=await response.json();

    if(manifest.schema!=='hp-source-manifest-v1'||
       !Array.isArray(manifest.days)||
       !manifest.days.length)
      throw Error('SOURCE_MANIFEST_SCHEMA');

    for(let i=0;i<manifest.days.length;i+=4){
      const part=await Promise.all(
        manifest.days.slice(i,i+4).map(async d=>{
          if(!/^\d{4}-\d{2}-\d{2}$/.test(d))
            throw Error('SOURCE_DAY_NAME');
          const r=await fetch('data/source-stats/'+d+'.json');
          if(!r.ok)throw Error('SOURCE_DAY_HTTP');
          const data=await r.json();
          if(data.schema!=='hp-source-day-v1'||
             data.day!==d||
             !Array.isArray(data.sources)||
             !Array.isArray(data.rows))
            throw Error('SOURCE_DAY_SCHEMA');
          return data;
        })
      );
      documents.push(...part);
    }

    const asnCounts=new Map();
    const ipCounts=new Map();
    const orgCounts=new Map();
    let total=0;

    for(const data of documents){
      for(const [p,dport,index,count] of data.rows){
        if((p!==0&&p!==1)||
           !Number.isSafeInteger(dport)||
           !Number.isSafeInteger(index)||
           index<0||index>=data.sources.length||
           !Number.isSafeInteger(count)||count<=0)
          throw Error('SOURCE_ROW_INVALID');

        const [address,number,organization]=data.sources[index];
        const key=number===null?'?':String(number);

        total+=count;
        asnCounts.set(key,(asnCounts.get(key)||0)+count);
        ipCounts.set(address,(ipCounts.get(address)||0)+count);

        const orgKey=key+'\u001f'+(organization||'');
        orgCounts.set(orgKey,(orgCounts.get(orgKey)||0)+count);
      }
    }

    const expected=packets.rows.reduce(
      (sum,r)=>sum+Number(r.count),0
    );

    if(total!==expected||total!==manifest.total_packets)
      throw Error('SOURCE_TOTAL_MISMATCH');

    const bestOrg=new Map();
    for(const [key,count] of orgCounts){
      const sep=key.indexOf('\u001f');
      const number=key.slice(0,sep);
      const name=key.slice(sep+1);
      const old=bestOrg.get(number);
      if(!old||count>old.count)
        bestOrg.set(number,{name,count});
    }

    asn.replaceChildren(new Option('All ASNs',''));

    for(const [number,count] of [...asnCounts]
      .sort((a,b)=>b[1]-a[1])){
      const label=number==='?'?'Unknown ASN':'AS'+number;
      const organization=bestOrg.get(number)?.name||'';
      asn.append(new Option(
        label+(organization?' · '+organization:'')+
        ' ('+fmt(count)+')',
        number
      ));
    }

    for(const [address] of [...ipCounts]
      .filter(([address])=>Boolean(address))
      .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
      .slice(0,500)){
      suggestions.append(new Option(address,address));
    }

    asn.disabled=false;
    ip.disabled=false;
  }

  asn.addEventListener('change',apply);
  ip.addEventListener('input',()=>{
    if(timer!==null)clearTimeout(timer);
    timer=setTimeout(apply,300);
  });
  ip.addEventListener('change',()=>{
    if(timer!==null)clearTimeout(timer);
    apply();
  });

  initialize().catch(err=>{
    asn.replaceChildren(new Option('Data unavailable',''));
    asn.disabled=true;
    ip.disabled=true;
    ip.placeholder='Data unavailable';
    console.error('SOURCE_FACETS_LOAD',err);
  });
})();

// HP_SOURCE_IP_SELECT_V3

// HP_SOURCE_IP_SEARCH_V4
