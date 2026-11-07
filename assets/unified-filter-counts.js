;(() => {
 "use strict";

 // STEP56-M10D: counts for all six shared filter facets.
 const keys=[
  "day","country","port",
  "transport","method","signal"
 ];

 const selects=Object.fromEntries(
  keys.map(key=>[
   key,document.getElementById("f-"+key)
  ])
 );

 const data=JSON.parse(
  document.getElementById("map-data").textContent
 );

 const meta=JSON.parse(
  document.getElementById(
   "unified-globe-meta"
  ).textContent
 );

 const rows=data.rows;
 const names=meta.country_names;
 const world=document.getElementById("world");

 const fmt=n=>Number(n).toLocaleString("en-US");
 const countryName=code=>names[code]||code;

 if(
  !Array.isArray(rows) ||
  !world ||
  keys.some(key=>!selects[key])
 ){
  throw Error("UNIFIED_FACETS_INIT_MISSING");
 }

 function refreshChoices(){
  // Snapshot all values before rebuilding any option list.
  const chosen=Object.fromEntries(
   keys.map(key=>[key,selects[key].value])
  );

  let reset=false;

  for(const key of keys){
   const counts=new Map();

   // Same faceted counting rule as the original 3D.
   // Apply all filters except the facet being counted.
   for(const row of rows){
    const matches=keys.every(other=>
     other===key ||
     !chosen[other] ||
     String(row[other])===chosen[other]
    );

    if(!matches)continue;

    const value=String(row[key]);
    counts.set(
     value,
     (counts.get(value)||0)+Number(row.count)
    );
   }

   const values=[...counts.keys()];

   values.sort((a,b)=>
    key==="port" ?
     Number(a)-Number(b) :
    key==="country" ?
     countryName(a).localeCompare(countryName(b)) :
     a.localeCompare(b)
   );

   const total=[...counts.values()].reduce(
    (sum,count)=>sum+count,0
   );

   const select=selects[key];
   select.replaceChildren();

   const all=document.createElement("option");
   all.value="";
   all.textContent=
    `All (${fmt(total)} requests)`;
   select.appendChild(all);

   for(const value of values){
    const option=document.createElement("option");
    option.value=value;

    const label=key==="country" ?
     countryName(value) : key==="port" ? value+"/tcp" : value;

    option.textContent=
     `${label} (${fmt(counts.get(value))})`;

    select.appendChild(option);
   }

   const next=chosen[key] && counts.has(chosen[key]) ?
    chosen[key] : "";

   select.value=next;

   if(next!==chosen[key]){
    reset=true;
   }
  }

  return reset;
 }

 // Capture-phase: update options before the existing
 // 2D map and 3D globe change handlers render.
 document.addEventListener("change",event=>{
  if(
   !keys.some(
    key=>selects[key]===event.target
   )
  )return;

  refreshChoices();
 },true);

 // The original 2D country click handler calls render()
 // directly instead of dispatching a change event.
 function afterMapCountry(event){
  const target=event.target;

  if(
   !target ||
   typeof target.closest!=="function" ||
   !world.contains(target) ||
   !target.closest(".country")
  )return;

  if(
   event.type==="keydown" &&
   event.key!=="Enter" &&
   event.key!==" "
  )return;

  // Run after the original 2D country selection handler.
  queueMicrotask(()=>{
   if(refreshChoices()){
    selects.country.dispatchEvent(
     new Event("change",{bubbles:true})
    );
   }
  });
 }

 document.addEventListener(
  "click",afterMapCountry,true
 );

 document.addEventListener(
  "keydown",afterMapCountry,true
 );

 // STEP56-M10E: synchronize facets with 2D render().
 const summary=document.getElementById("summary");

 if(!summary || typeof MutationObserver!=="function"){
  throw Error("UNIFIED_FACET_SYNC_UNAVAILABLE");
 }

 const summaryObserver=new MutationObserver(()=>{
  // Runs after the existing 2D render, including
  // country selection without a change event.
  const reset=refreshChoices();

  // If an incompatible selected option was cleared,
  // notify the existing renderers exactly once.
  if(reset){
   selects.country.dispatchEvent(
    new Event("change",{bubbles:true})
   );
  }
 });

 summaryObserver.observe(summary,{
  childList:true,
  characterData:true,
  subtree:true
 });

 refreshChoices();
})();
