(() => {
 "use strict";

 const by=id=>document.getElementById(id);

 const base=by("map-data");
 const source=by("hp-packet-data");
 const mode=by("hp-kind");
 const status=by("hp-status");

 if(!base||!source||!mode||!status){
   throw Error("PORT_MAP_BOOTSTRAP_MISSING");
 }

 const packets=JSON.parse(source.textContent);

 if(
   !Array.isArray(packets.rows) ||
   !Number.isSafeInteger(packets.total)
 ){
   throw Error("PORT_MAP_BOOTSTRAP_SCHEMA");
 }

 const permitted=new Set([
   "all","TCP_SYN","UDP","HTTP"
 ]);

 const url=new URLSearchParams(location.search);

 const selected=permitted.has(url.get("kind"))
   ?url.get("kind")
   :"all";

 window.HP_KIND=selected;
 mode.value=selected;

 if(selected!=="HTTP"){
   const rows=selected==="all"
     ?packets.rows
     :packets.rows.filter(
       r=>r.transport===selected
     );

   const sum=rows.reduce(
     (n,r)=>n+r.count,0
   );

   base.textContent=JSON.stringify({
     rows,
     total:sum
   });
 }

 const isHTTP=selected==="HTTP";
 document.body.classList.toggle("hp-http-mode",isHTTP);

 status.textContent=isHTTP
   ?"HTTP request observations (separate metric)"
   :(selected==="all"?"TCP SYN + UDP":selected)+
    " observed packets · "+
    new Intl.NumberFormat("en-US").format(
      JSON.parse(base.textContent).total
    )+
    (packets.coverage_verified
      ?" · coverage verified"
      :" · coverage not verified; do not infer all inbound traffic");

 for(const key of ["method","signal"]){
   const el=by("f-"+key);
   if(el){
     el.disabled=!isHTTP;
   }
 }

 mode.addEventListener("change",()=>{
   const q=new URLSearchParams(location.search);
   q.set("kind",mode.value);
   location.search=q.toString();
 });
})();
