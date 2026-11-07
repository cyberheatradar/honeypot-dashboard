"use strict";
(async () => {
 const startEl=document.getElementById("overview-start-date");
 const endEl=document.getElementById("overview-end-date");
 const button=document.getElementById("overview-range-apply");
 const status=document.getElementById("overview-range-status");
 const output=document.getElementById("overview-range-results");

 if(!startEl||!endEl||!button||!status||!output)
   throw Error("RANGE_UI_MISSING");

 const esc=s=>String(s).replace(/[&<>"']/g,c=>({
   "&":"&amp;","<":"&lt;",">":"&gt;",
   '"':"&quot;","'":"&#39;"
 })[c]);

 const fmt=n=>Number(n).toLocaleString("en-US");

 const panel=(title,inner)=>
   `<section class="panel"><h2>${esc(title)}</h2>${inner}</section>`;

 const metric=(title,n)=>
   `<article class="metric"><span>${esc(title)}</span>`+
   `<strong>${fmt(n)}</strong></article>`;

 const table=(headers,rows)=>
   `<div class="overview-days-scroll"><table><thead><tr>`+
   headers.map(x=>`<th>${esc(x)}</th>`).join("")+
   `</tr></thead><tbody>`+
   rows.map(row=>`<tr>`+
     row.map(v=>`<td>${esc(v)}</td>`).join("")+
     `</tr>`).join("")+
   `</tbody></table></div>`;

 function bars(items){
  const max=Math.max(1,...items.map(x=>x[1]));

  return `<ul class="bars">`+
   items.map(([name,n])=>
    `<li><div class="bar-label">`+
    `<span>${esc(name)}</span><b>${fmt(n)}</b>`+
    `</div><div class="track">`+
    `<div class="fill" style="width:${(100*n/max).toFixed(1)}%">`+
    `</div></div></li>`
   ).join("")+
   `</ul>`;
 }

 function summed(days,field){
  const counts=new Map();

  for(const d of days)
   for(const [label,n] of d[field]){
    const key=String(label);
    counts.set(key,(counts.get(key)||0)+n);
   }

  return [...counts].sort(
   (a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])
  );
 }

 try{
  const response=await fetch(
   "data/overview-range.json",
   {cache:"no-store"}
  );

  if(!response.ok)
   throw Error("Aggregate JSON HTTP "+response.status);

  const data=await response.json();

  if(data.schema!=="honeypot-overview-range-v1")
   throw Error("Schema mismatch");

  const days=data.days;
  const lookup=new Map(
   days.map((d,i)=>[d.date,i])
  );

  const render=()=>{
   const from=startEl.value;
   const to=endEl.value;

   if(!lookup.has(from)||!lookup.has(to)||from>to){
    status.textContent=
     "Select a valid start and end date in the available UTC range";
    return;
   }

   const begin=lookup.get(from);
   const end=lookup.get(to);
   const selected=days.slice(begin,end+1);

   const total=selected.reduce(
    (n,d)=>n+d.requests,0
   );

   const https=selected.reduce(
    (n,d)=>n+d.https,0
   );

   const ports=summed(selected,"ports");
   const countries=summed(selected,"countries");
   const signals=summed(selected,"signals");

   const asns=new Map();

   for(const d of selected)
    for(const [a,org,n] of d.asns){
     const label=`AS${a} — ${org}`;
     asns.set(label,(asns.get(label)||0)+n);
    }

   const topAsns=[...asns].sort(
    (a,b)=>b[1]-a[1]
   ).slice(0,10);

   const unique=data.unique_by_end[end][begin];
   const firstPartial=from===data.min_day;

   status.textContent=
    `HTTP observation interval: `+
    `${from.replaceAll("-","/")} — ${to.replaceAll("-","/")}`+
    ` (UTC; both dates included)`+
    (firstPartial?" · Initial observation day is partial":"")+
    ` · ${fmt(total)} requests`;

   const metrics=[
    metric("HTTP requests",total),
    metric("Unique source IPs (exact)",unique),
    metric("Destination ports (TCP)",ports.length),
    metric("HTTPS requests",https)
   ].join("");

   const dailyRows=selected.map(d=>[
    d.date,fmt(d.requests),fmt(d.unique_daily)
   ]);

   const columns=[
    panel(
     "Daily request volume",
     table(
      ["Day (UTC)","Requests","Unique sources"],
      dailyRows
     )
    ),
    panel(
     "Top destination ports",
     bars(ports.slice(0,10).map(
      ([p,n])=>[p+"/tcp",n]
     ))
    ),
    panel(
     "Source countries",
     bars(countries.slice(0,10))
    ),
    panel(
     "Heuristic attack signals",
     bars(signals.slice(0,10))
    ),
    panel(
     "Top networks (ASN)",
     table(
      ["ASN / Organization","Requests"],
      topAsns.map(([a,n])=>[a,fmt(n)])
     )
    )
   ].join("");

   output.innerHTML=
    `<div class="metrics">${metrics}</div>`+
    `<div class="columns">${columns}</div>`;
  };

  button.addEventListener("click",render);
  render();

 }catch(error){
  status.textContent=
   "Could not load the period aggregates: "+error.message;

  console.error("OVERVIEW_RANGE",error);
 }
})();
