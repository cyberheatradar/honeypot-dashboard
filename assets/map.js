
"use strict";
const payload=JSON.parse(document.getElementById("map-data").textContent);
const rows=payload.rows;
const dims=["day","country","port","transport","method","signal"];
const selects=Object.fromEntries(dims.map(k=>[k,document.getElementById("f-"+k)]));
for(const k of dims){
 const values=[...new Set(rows.map(r=>String(r[k])))].sort((a,b)=>
  k==="port" ? Number(a)-Number(b) : a.localeCompare(b));
 for(const v of values){
  const opt=document.createElement("option");
  opt.value=v;opt.textContent=v;
  selects[k].appendChild(opt);
 }
}
const paths=[...document.querySelectorAll(".country")];
const tbody=document.getElementById("countries");
const summary=document.getElementById("summary");
const format=n=>n.toLocaleString("en-US");
function render(){
 const active=rows.filter(r=>dims.every(k=>
  !selects[k].value || String(r[k])===selects[k].value));
 const countryCounts=new Map();
 let total=0;
 for(const r of active){
  const country=r.country;
  countryCounts.set(country,(countryCounts.get(country)||0)+r.count);
  total+=r.count;
 }
 const maximum=Math.max(1,...countryCounts.values());
 for(const node of paths){
  const n=countryCounts.get(node.dataset.code)||0;
  const ratio=n ? Math.log1p(n)/Math.log1p(maximum) : 0;
  const green=Math.round(100+105*ratio);
  const blue=Math.round(110+70*ratio);
  node.style.fill=n ? `rgb(26,${green},${blue})` : "#25364a";
  node.classList.toggle("selected",
   node.dataset.code!=="" && node.dataset.code===selects.country.value);
  const title=node.querySelector("title");
  if(title){
   const name=title.textContent.split(" — ")[0];
   title.textContent=`${name} — ${format(n)} requests`;
  }
 }
 summary.textContent=`${format(total)} requests matching filters · `+
  `${countryCounts.size} source-country categories`;
 tbody.replaceChildren();
 const sorted=[...countryCounts.entries()].sort((a,b)=>
  b[1]-a[1]||a[0].localeCompare(b[0]));
 for(const [country,n] of sorted){
  const tr=document.createElement("tr");
  const td1=document.createElement("td");
  const td2=document.createElement("td");
  td1.textContent=country;
  td2.textContent=format(n);
  td2.className="number";
  tr.append(td1,td2);
  tbody.appendChild(tr);
 }
}
for(const select of Object.values(selects)){
 select.addEventListener("change",render);
}
for(const node of paths){
 const select=()=>{
  const code=node.dataset.code;
  if(!code || ![...selects.country.options].some(o=>o.value===code))
   return;
  selects.country.value=selects.country.value===code ? "" : code;
  render();
 };
 node.setAttribute("tabindex","0");
 node.addEventListener("click",select);
 node.addEventListener("keydown",e=>{
  if(e.key==="Enter"||e.key===" "){e.preventDefault();select();}
 });
}
render();
