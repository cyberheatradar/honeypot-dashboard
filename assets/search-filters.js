(() => {
  'use strict';

  // HP_SEARCH_FILTERS_V1
  // Native selects remain the canonical filter state.

  const ids=['day','country','port','asn'];

  const selects=Object.fromEntries(
    ids.map(k=>[
      k,document.getElementById('f-'+k)
    ])
  );

  const sourceIp=document.getElementById(
    'f-source-ip'
  );

  const metaEl=document.getElementById(
    'unified-globe-meta'
  );

  const dataEl=document.getElementById(
    'map-data'
  );

  if(
    !sourceIp||!metaEl||!dataEl||
    ids.some(k=>
      !selects[k]||
      selects[k].tagName!=='SELECT'
    )
  ){
    throw Error('SEARCH_FILTER_DEPENDENCIES_MISSING');
  }

  if(document.querySelector('.hp-search-input')){
    throw Error('SEARCH_FILTER_DUPLICATE_INIT');
  }

  const names=JSON.parse(
    metaEl.textContent
  ).country_names||{};

  let effectiveRows=JSON.parse(
    dataEl.textContent
  ).rows;

  const ui={};

  const placeholders={
    day:'All / YYYY-MM-DD',
    country:'All / name or code',
    port:'All / exact port',
    asn:'All / AS number'
  };

  const normalize=value=>
    String(value).trim().toLowerCase();

  const options=key=>[
    ...selects[key].options
  ].filter(o=>o.value!=='');

  function display(key,value){
    if(!value)return '';

    if(key==='country'){
      return names[value]||value;
    }

    if(key==='asn'){
      return value==='?' ?
        'Unknown ASN':'AS'+value;
    }

    return value;
  }

  function availablePort(port){
    return effectiveRows.some(row=>
      String(row.port)===port &&
      [
        'day','country','transport',
        'method','signal'
      ].every(key=>{
        const chosen=document.getElementById(
          'f-'+key
        )?.value||'';

        return !chosen||
          String(row[key])===chosen;
      })
    );
  }

  function resolve(key,value){
    const text=value.trim();

    if(!text)return '';

    const entries=options(key);

    if(key==='port'){
      const match=/^(\d{1,5})(?:\/(tcp|udp))?$/i.exec(
        text
      );

      if(!match||Number(match[1])>65535){
        return null;
      }

      const kind=window.HP_KIND==='UDP' ?
        'udp':'tcp';

      if(
        match[2]&&
        match[2].toLowerCase()!==kind
      ){
        return null;
      }

      const port=String(Number(match[1]));

      return entries.some(o=>o.value===port)||
        availablePort(port) ? port:null;
    }

    const input=normalize(text);

    if(key==='asn'){
      const match=/^as\s*(\d+)$/i.exec(text);

      const value=match ?
        String(Number(match[1])) :
        /^(\d+)$/.test(text) ?
        String(Number(text)) :
        /^(?:\?|unknown(?: asn)?)$/i.test(text) ?
        '?' : null;

      if(
        value!==null&&
        entries.some(o=>o.value===value)
      ){
        return value;
      }

      const matching=entries.filter(o=>
        normalize(
          o.textContent.split(' (')[0]
        )===input
      );

      return matching.length===1 ?
        matching[0].value:null;
    }

    const matching=entries.filter(o=>
      normalize(o.value)===input||
      normalize(display(key,o.value))===input
    );

    return matching.length===1 ?
      matching[0].value:null;
  }

  function refreshList(key){
    const state=ui[key];
    const native=selects[key];

    if(!state)return;

    state.input.disabled=native.disabled;

    const fragment=document.createDocumentFragment();

    const entries=options(key);

    for(const option of entries.slice(
      0,key==='asn'?500:300
    )){
      const candidate=document.createElement(
        'option'
      );

      candidate.value=display(
        key,option.value
      );

      candidate.label=key==='country' ?
        option.value+' · '+option.textContent :
        option.textContent;

      fragment.append(candidate);
    }

    state.list.replaceChildren(fragment);

    if(!state.editing){
      state.input.value=display(
        key,native.value
      );

      state.input.removeAttribute(
        'aria-invalid'
      );
    }
  }

  function apply(key){
    const state=ui[key];
    const native=selects[key];
    const raw=state.input.value;
    const resolved=resolve(key,raw);

    state.input.setAttribute(
      'aria-invalid',
      resolved===null?'true':'false'
    );

    state.input.title=resolved===null ?
      'Select a matching suggestion or enter an exact value'
      :'';

    if(resolved===null){
      // Do not retain a stale hidden selection.
      if(native.value!==''){
        native.value='';

        native.dispatchEvent(
          new Event('change',{bubbles:true})
        );

        state.input.value=raw;
        state.editing=true;

        state.input.setAttribute(
          'aria-invalid','true'
        );
      }
      return;
    }

    if(
      resolved!==''&&
      ![...native.options].some(
        o=>o.value===resolved
      )
    ){
      if(key!=='port')return;

      native.append(
        new Option(resolved,resolved)
      );
    }

    state.editing=false;

    if(native.value!==resolved){
      native.value=resolved;

      native.dispatchEvent(
        new Event('change',{bubbles:true})
      );
    }

    state.input.value=display(
      key,native.value
    );

    state.input.removeAttribute(
      'aria-invalid'
    );
  }

  for(const key of ids){
    const native=selects[key];
    const label=native.closest('label');

    if(
      !label||
      !label.closest('.map-view-head .filters')
    ){
      throw Error(
        'SEARCH_FILTER_LAYOUT_CHANGED_'+key
      );
    }

    const input=document.createElement(
      'input'
    );

    input.type='search';
    input.className='hp-search-input';
    input.id='hp-search-'+key;
    input.placeholder=placeholders[key];
    input.autocomplete='off';
    input.spellcheck=false;

    input.maxLength=
      key==='day'?10:
      key==='port'?9:
      key==='asn'?90:80;

    const list=document.createElement(
      'datalist'
    );

    list.id='hp-search-list-'+key;

    input.setAttribute(
      'list',list.id
    );

    native.before(input);
    label.append(list);

    native.hidden=true;
    native.tabIndex=-1;

    native.setAttribute(
      'aria-hidden','true'
    );

    ui[key]={
      input,
      list,
      editing:false,
      timer:null
    };

    input.value=display(
      key,native.value
    );

    input.addEventListener('input',()=>{
      const state=ui[key];

      state.editing=true;

      clearTimeout(state.timer);

      state.timer=setTimeout(
        ()=>apply(key),300
      );
    });

    input.addEventListener('change',()=>{
      clearTimeout(ui[key].timer);
      apply(key);
    });

    input.addEventListener('keydown',event=>{
      if(event.key!=='Enter')return;

      clearTimeout(ui[key].timer);
      apply(key);
    });

    native.addEventListener('change',()=>{
      const state=ui[key];

      state.editing=false;

      clearTimeout(state.timer);

      refreshList(key);
    });

    let pending=false;

    new MutationObserver(()=>{
      if(pending)return;

      pending=true;

      queueMicrotask(()=>{
        pending=false;
        refreshList(key);
      });
    }).observe(native,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['disabled']
    });

    refreshList(key);
  }

  document.addEventListener(
    'hp-source-facets-rows',
    event=>{
      if(Array.isArray(event.detail?.rows)){
        effectiveRows=event.detail.rows;
      }
    }
  );
})();
