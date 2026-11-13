(() => {
 "use strict";

 const by=id=>document.getElementById(id);
 const base=by("map-data");
 const source=by("hp-packet-data");
 const mode=by("hp-kind");

 if(!base||!source||!mode){
   throw Error("PORT_MAP_BOOTSTRAP_MISSING");
 }

 const packets=JSON.parse(source.textContent);
 const allowed=new Set(["all","TCP_SYN","UDP"]);

 if(
   !Array.isArray(packets.rows) ||
   !Number.isSafeInteger(packets.total)
 ){
   throw Error("PORT_MAP_BOOTSTRAP_SCHEMA");
 }

 const params=new URLSearchParams(location.search);
 const requested=params.get("kind");
 const selected=allowed.has(requested)?requested:"all";

 window.HP_KIND=selected;
 mode.value=selected;

 const rows=selected==="all"
   ?packets.rows
   :packets.rows.filter(
      r=>r.transport===selected
    );

 const sum=rows.reduce((n,r)=>n+r.count,0);

 if(!Number.isSafeInteger(sum)){
   throw Error("PORT_MAP_COUNT_INVALID");
 }

 base.textContent=JSON.stringify({
   rows:rows,
   total:sum
 });

 for(const key of ["method","signal"]){
   const el=by("f-"+key);
   if(el)el.disabled=true;
 }

 mode.addEventListener("change",()=>{
   const q=new URLSearchParams(location.search);
   q.set("kind",mode.value);
   location.search=q.toString();
 });
})();
