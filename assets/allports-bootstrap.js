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
 const allowed=new Set(["TCP_SYN","UDP"]);

 if(
   !Array.isArray(packets.rows) ||
   !Number.isSafeInteger(packets.total)
 ){
   throw Error("PORT_MAP_BOOTSTRAP_SCHEMA");
 }

 const params=new URLSearchParams(location.search);
 const requested=params.get("kind");
 const selected=allowed.has(requested)?requested:"TCP_SYN";

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


;(() => {
  "use strict";

  // hp-date-cards-v1

  const daySelect =
    document.getElementById("f-day");

  const dataElement =
    document.getElementById("hp-packet-data");

  if (!daySelect || !dataElement) {
    throw Error("DAY_CARD_ELEMENTS_MISSING");
  }

  const data = JSON.parse(dataElement.textContent);

  if (!Array.isArray(data.rows)) {
    throw Error("DAY_CARD_DATA_INVALID");
  }

  const cards = new Map();

  for (const card of document.querySelectorAll(
    ".hp-port-stats .hp-port-stat"
  )) {
    const label = card.querySelector("span");
    const value = card.querySelector("strong");

    if (label && value) {
      cards.set(label.textContent.trim(), value);
    }
  }

  const tcpCard = cards.get(
    "Observed TCP SYN packets"
  );

  const udpCard = cards.get(
    "Observed UDP packets"
  );

  if (!tcpCard || !udpCard) {
    throw Error("DAY_CARD_TARGETS_MISSING");
  }

  const fmt = n => n.toLocaleString("en-US");

  function updateCards() {
    const selectedDay = daySelect.value;

    let tcp = 0;
    let udp = 0;

    for (const row of data.rows) {
      if (
        selectedDay &&
        row.day !== selectedDay
      ) {
        continue;
      }

      const count = Number(row.count);

      if (!Number.isSafeInteger(count) || count < 0) {
        throw Error("DAY_CARD_COUNT_INVALID");
      }

      if (row.transport === "TCP_SYN") {
        tcp += count;
      } else if (row.transport === "UDP") {
        udp += count;
      }
    }

    if (
      !Number.isSafeInteger(tcp) ||
      !Number.isSafeInteger(udp)
    ) {
      throw Error("DAY_CARD_TOTAL_INVALID");
    }

    tcpCard.textContent = fmt(tcp);
    udpCard.textContent = fmt(udp);
  }

  daySelect.addEventListener(
    "change",
    () => queueMicrotask(updateCards)
  );

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      updateCards,
      {once:true}
    );
  } else {
    updateCards();
  }
})();
