(() => {
 "use strict";

 const get=id=>document.getElementById(id);

 const source=get("hp-packet-data");
 const tbody=get("hp-daily-rows");
 const kind=get("hp-kind");
 const day=get("f-day");
 const country=get("f-country");
 const port=get("f-port");
 const summary=get("summary");

 if(
   !source||!tbody||!kind||
   !day||!country||!port
 ){
   throw Error("DAILY_MAP_ELEMENTS_MISSING");
 }

 const data=JSON.parse(source.textContent);
 const rows=data.rows;

 if(!Array.isArray(rows)){
   throw Error("DAILY_MAP_DATA_INVALID");
 }

 const fmt=n=>Number(n).toLocaleString("en-US");

 function render(){
   const byDay=new Map();

   for(const r of rows){
     if(
       kind.value!=="all" &&
       r.transport!==kind.value
     )continue;

     if(
       day.value &&
       r.day!==day.value
     )continue;

     if(
       country.value &&
       r.country!==country.value
     )continue;

     if(
       port.value &&
       String(r.port)!==port.value
     )continue;

     let item=byDay.get(r.day);

     if(!item){
       item={tcp:0,udp:0};
       byDay.set(r.day,item);
     }

     if(r.transport==="TCP_SYN"){
       item.tcp+=Number(r.count);
     }else if(r.transport==="UDP"){
       item.udp+=Number(r.count);
     }
   }

   tbody.replaceChildren();

   const days=[...byDay.keys()].sort();

   for(const date of days){
     const item=byDay.get(date);
     const tr=document.createElement("tr");

     for(const value of [
       date,
       fmt(item.tcp),
       fmt(item.udp),
       fmt(item.tcp+item.udp)
     ]){
       const td=document.createElement("td");
       td.textContent=value;
       tr.appendChild(td);
     }

     tbody.appendChild(tr);
   }

   if(!days.length){
     const tr=document.createElement("tr");
     const td=document.createElement("td");

     td.colSpan=4;
     td.textContent="No matching observations";

     tr.appendChild(td);
     tbody.appendChild(tr);
   }
 }

 for(const control of [day,country,port]){
   control.addEventListener(
     "change",
     ()=>queueMicrotask(render)
   );
 }

 // The 2D country click handler can render without
 // dispatching a select change event.
 if(summary && typeof MutationObserver==="function"){
   new MutationObserver(render).observe(
     summary,{
       childList:true,
       characterData:true,
       subtree:true
     }
   );
 }

 render();
})();

