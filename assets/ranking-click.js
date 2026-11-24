(() => {
  'use strict';

  // HP_RANKING_CLICK_FILTER_V1

  const get=id=>document.getElementById(id);

  const asn=get('f-asn');
  const country=get('f-country');
  const ip=get('f-source-ip');

  const targets={
    asn:get('hp-source-asns'),
    ip:get('hp-source-ips'),
    country:get('countries')
  };

  const meta=get('unified-globe-meta');

  if(!asn||!country||!ip||!meta||
     Object.values(targets).some(v=>!v)){
    throw Error('HP_RANKING_LINK_DEPENDENCY_MISSING');
  }

  const names=JSON.parse(
    meta.textContent
  ).country_names;

  if(!names||typeof names!=='object'){
    throw Error('HP_RANKING_COUNTRIES_MISSING');
  }

  const codes=new Map();

  for(const [code,name] of Object.entries(names)){
    const key=String(name).trim().toLowerCase();

    if(codes.has(key)){
      throw Error('HP_COUNTRY_NAME_AMBIGUOUS');
    }

    codes.set(key,code);
  }

  function rowValue(kind,tr){
    const label=tr.cells[0];

    if(!label||
       tr.cells.length<2||
       label.colSpan>1){
      return null;
    }

    if(kind==='asn'){
      const text=label.querySelector(
        'strong'
      )?.textContent.trim()||'';

      if(text==='Unknown ASN')return '?';

      const hit=/^AS(\d+)$/i.exec(text);

      return hit?hit[1]:null;
    }

    if(kind==='ip'){
      const text=label.textContent.trim();

      return text&&text!=='Unknown IP'?
        text:null;
    }

    const text=label.textContent
      .trim()
      .toLowerCase();

    return codes.get(text)||null;
  }

  function selected(kind,value){
    const current=kind==='asn'?
      asn.value:
      kind==='country'?
      country.value:
      ip.value.trim();

    return current===value;
  }

  function updateSelected(){
    for(const [kind,tbody] of Object.entries(targets)){
      for(const button of tbody.querySelectorAll(
        'button.hp-ranking-filter'
      )){
        const value=button.dataset.filterValue;
        const active=selected(kind,value);

        button.setAttribute(
          'aria-pressed',String(active)
        );

        button.classList.toggle(
          'hp-ranking-filter-active',active
        );
      }
    }
  }

  function activate(kind,value){
    if(kind==='ip'){
      if(ip.disabled){
        console.warn('HP_IP_FILTER_NOT_READY');
        return;
      }

      ip.value=ip.value.trim()===value?
        '':value;

      ip.dispatchEvent(
        new Event('change',{bubbles:true})
      );

      updateSelected();
      return;
    }

    const select=kind==='asn'?asn:country;

    if(select.disabled){
      console.warn('HP_FILTER_NOT_READY',kind);
      return;
    }

    if(![...select.options].some(
      o=>o.value===value
    )){
      console.warn(
        'HP_RANKING_CHOICE_UNAVAILABLE',
        kind,value
      );
      return;
    }

    const next=select.value===value?'':value;

    select.value=next;

    select.dispatchEvent(
      new Event('change',{bubbles:true})
    );

    updateSelected();
  }

  function decorate(kind,tr){
    if(!tr||tr.querySelector(
      'button.hp-ranking-filter'
    ))return;

    const value=rowValue(kind,tr);

    if(value===null)return;

    const label=tr.cells[0];

    const button=document.createElement('button');

    button.type='button';
    button.className='hp-ranking-filter';
    button.dataset.filterValue=value;

    const content=label.textContent.trim();

    button.title=
      'Click to filter; click again to clear';

    button.setAttribute(
      'aria-label',
      'Filter '+
      (kind==='ip'?'source IP':
       kind==='asn'?'ASN':'country')+
      ' '+content+
      ' (click again to clear)'
    );

    // Move existing DOM nodes safely.
    // Do not interpret source data as HTML.
    button.append(
      ...Array.from(label.childNodes)
    );

    label.append(button);

    if(kind==='ip'){
      window.HP_TABLE_UI.copyButton(label,value);
    }

    const active=selected(kind,value);

    button.setAttribute(
      'aria-pressed',String(active)
    );

    button.classList.toggle(
      'hp-ranking-filter-active',active
    );
  }

  for(const [kind,tbody] of Object.entries(targets)){
    for(const tr of tbody.querySelectorAll('tr')){
      decorate(kind,tr);
    }

    // Rankings are rebuilt after every filter change.
    const observer=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes){
          if(node.nodeType!==1)continue;

          if(node.tagName==='TR'){
            decorate(kind,node);
          }else if(node.querySelectorAll){
            for(const tr of node.querySelectorAll('tr')){
              decorate(kind,tr);
            }
          }
        }
      }
    });

    observer.observe(tbody,{
      childList:true
    });

    tbody.addEventListener('click',event=>{
      const button=event.target.closest(
        'button.hp-ranking-filter'
      );

      if(!button||!tbody.contains(button)){
        return;
      }

      activate(
        kind,button.dataset.filterValue
      );
    });
  }

  asn.addEventListener(
    'change',updateSelected
  );

  country.addEventListener(
    'change',updateSelected
  );

  ip.addEventListener(
    'change',updateSelected
  );

  document.addEventListener(
    'hp-source-facets-rows',
    updateSelected
  );
})();

// HP_TABLE_CONTROLS_V1
