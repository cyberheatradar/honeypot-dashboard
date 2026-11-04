
"use strict";
const payload=JSON.parse(document.getElementById("map-data").textContent);
const countryNames={"AD": "Andorra", "AE": "United Arab Emirates", "AF": "Afghanistan", "AG": "Antigua & Barbuda", "AI": "Anguilla", "AL": "Albania", "AM": "Armenia", "AO": "Angola", "AQ": "Antarctica", "AR": "Argentina", "AS": "Samoa (American)", "AT": "Austria", "AU": "Australia", "AW": "Aruba", "AX": "\u00c5land Islands", "AZ": "Azerbaijan", "BA": "Bosnia & Herzegovina", "BB": "Barbados", "BD": "Bangladesh", "BE": "Belgium", "BF": "Burkina Faso", "BG": "Bulgaria", "BH": "Bahrain", "BI": "Burundi", "BJ": "Benin", "BL": "St Barthelemy", "BM": "Bermuda", "BN": "Brunei", "BO": "Bolivia", "BQ": "Caribbean NL", "BR": "Brazil", "BS": "Bahamas", "BT": "Bhutan", "BV": "Bouvet Island", "BW": "Botswana", "BY": "Belarus", "BZ": "Belize", "CA": "Canada", "CC": "Cocos (Keeling) Islands", "CD": "Congo (Dem. Rep.)", "CF": "Central African Rep.", "CG": "Congo (Rep.)", "CH": "Switzerland", "CI": "C\u00f4te d\u2019Ivoire", "CK": "Cook Islands", "CL": "Chile", "CM": "Cameroon", "CN": "China", "CO": "Colombia", "CR": "Costa Rica", "CU": "Cuba", "CV": "Cape Verde", "CW": "Cura\u00e7ao", "CX": "Christmas Island", "CY": "Cyprus", "CZ": "Czech Republic", "DE": "Germany", "DJ": "Djibouti", "DK": "Denmark", "DM": "Dominica", "DO": "Dominican Republic", "DZ": "Algeria", "EC": "Ecuador", "EE": "Estonia", "EG": "Egypt", "EH": "Western Sahara", "ER": "Eritrea", "ES": "Spain", "ET": "Ethiopia", "FI": "Finland", "FJ": "Fiji", "FK": "Falkland Islands", "FM": "Micronesia", "FO": "Faroe Islands", "FR": "France", "GA": "Gabon", "GB": "United Kingdom", "GD": "Grenada", "GE": "Georgia", "GF": "French Guiana", "GG": "Guernsey", "GH": "Ghana", "GI": "Gibraltar", "GL": "Greenland", "GM": "Gambia", "GN": "Guinea", "GP": "Guadeloupe", "GQ": "Equatorial Guinea", "GR": "Greece", "GS": "South Georgia & the South Sandwich Islands", "GT": "Guatemala", "GU": "Guam", "GW": "Guinea-Bissau", "GY": "Guyana", "HK": "Hong Kong", "HM": "Heard Island & McDonald Islands", "HN": "Honduras", "HR": "Croatia", "HT": "Haiti", "HU": "Hungary", "ID": "Indonesia", "IE": "Ireland", "IL": "Israel", "IM": "Isle of Man", "IN": "India", "IO": "British Indian Ocean Territory", "IQ": "Iraq", "IR": "Iran", "IS": "Iceland", "IT": "Italy", "JE": "Jersey", "JM": "Jamaica", "JO": "Jordan", "JP": "Japan", "KE": "Kenya", "KG": "Kyrgyzstan", "KH": "Cambodia", "KI": "Kiribati", "KM": "Comoros", "KN": "St Kitts & Nevis", "KP": "Korea (North)", "KR": "Korea (South)", "KW": "Kuwait", "KY": "Cayman Islands", "KZ": "Kazakhstan", "LA": "Laos", "LB": "Lebanon", "LC": "St Lucia", "LI": "Liechtenstein", "LK": "Sri Lanka", "LR": "Liberia", "LS": "Lesotho", "LT": "Lithuania", "LU": "Luxembourg", "LV": "Latvia", "LY": "Libya", "MA": "Morocco", "MC": "Monaco", "MD": "Moldova", "ME": "Montenegro", "MF": "St Martin (French)", "MG": "Madagascar", "MH": "Marshall Islands", "MK": "North Macedonia", "ML": "Mali", "MM": "Myanmar (Burma)", "MN": "Mongolia", "MO": "Macau", "MP": "Northern Mariana Islands", "MQ": "Martinique", "MR": "Mauritania", "MS": "Montserrat", "MT": "Malta", "MU": "Mauritius", "MV": "Maldives", "MW": "Malawi", "MX": "Mexico", "MY": "Malaysia", "MZ": "Mozambique", "NA": "Namibia", "NC": "New Caledonia", "NE": "Niger", "NF": "Norfolk Island", "NG": "Nigeria", "NI": "Nicaragua", "NL": "Netherlands", "NO": "Norway", "NP": "Nepal", "NR": "Nauru", "NU": "Niue", "NZ": "New Zealand", "OM": "Oman", "PA": "Panama", "PE": "Peru", "PF": "French Polynesia", "PG": "Papua New Guinea", "PH": "Philippines", "PK": "Pakistan", "PL": "Poland", "PM": "St Pierre & Miquelon", "PN": "Pitcairn", "PR": "Puerto Rico", "PS": "Palestine", "PT": "Portugal", "PW": "Palau", "PY": "Paraguay", "QA": "Qatar", "RE": "R\u00e9union", "RO": "Romania", "RS": "Serbia", "RU": "Russia", "RW": "Rwanda", "SA": "Saudi Arabia", "SB": "Solomon Islands", "SC": "Seychelles", "SD": "Sudan", "SE": "Sweden", "SG": "Singapore", "SH": "St Helena", "SI": "Slovenia", "SJ": "Svalbard & Jan Mayen", "SK": "Slovakia", "SL": "Sierra Leone", "SM": "San Marino", "SN": "Senegal", "SO": "Somalia", "SR": "Suriname", "SS": "South Sudan", "ST": "Sao Tome & Principe", "SV": "El Salvador", "SX": "St Maarten (Dutch)", "SY": "Syria", "SZ": "Eswatini (Swaziland)", "TC": "Turks & Caicos Is", "TD": "Chad", "TF": "French S. Terr.", "TG": "Togo", "TH": "Thailand", "TJ": "Tajikistan", "TK": "Tokelau", "TL": "East Timor", "TM": "Turkmenistan", "TN": "Tunisia", "TO": "Tonga", "TR": "Turkey", "TT": "Trinidad & Tobago", "TV": "Tuvalu", "TW": "Taiwan", "TZ": "Tanzania", "UA": "Ukraine", "UG": "Uganda", "UM": "US minor outlying islands", "UNKNOWN": "Unknown", "US": "United States", "UY": "Uruguay", "UZ": "Uzbekistan", "VA": "Vatican City", "VC": "St Vincent", "VE": "Venezuela", "VG": "Virgin Islands (UK)", "VI": "Virgin Islands (US)", "VN": "Vietnam", "VU": "Vanuatu", "WF": "Wallis & Futuna", "WS": "Samoa (western)", "YE": "Yemen", "YT": "Mayotte", "ZA": "South Africa", "ZM": "Zambia", "ZW": "Zimbabwe"};
const countryLabel=(code)=>countryNames[code]||code;
const rows=payload.rows;
const dims=["day","country","port","transport","method","signal"];
const selects=Object.fromEntries(dims.map(k=>[k,document.getElementById("f-"+k)]));
for(const k of dims){
 const values=[...new Set(rows.map(r=>String(r[k])))].sort((a,b)=>
  k==="port" ? Number(a)-Number(b) : (k==="country" ? countryLabel(a).localeCompare(countryLabel(b)) : a.localeCompare(b)));
 for(const v of values){
  const opt=document.createElement("option");
  opt.value=v;opt.textContent=k==="country"?countryLabel(v):v;
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
  td1.textContent=countryLabel(country);
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

;(() => {
 "use strict";

 const svg=document.getElementById("world");
 const data=JSON.parse(
  document.getElementById("map-data").textContent
 );
 const toggle=document.getElementById("map-beam-toggle");
 const status=document.getElementById("map-beam-status");

 const keys=[
  "day","country","port","transport","method","signal"
 ];

 const selectors=Object.fromEntries(
  keys.map(k=>[k,document.getElementById("f-"+k)])
 );

 const countryPaths=[
  ...svg.querySelectorAll(".country")
 ];

 const jp=countryPaths.find(
  p=>p.dataset.code==="JP"
 );

 if(!jp) throw Error("BEAM_JAPAN_NOT_FOUND");

 const ns="http://www.w3.org/2000/svg";
 const make=tag=>document.createElementNS(ns,tag);

 function midpoint(path){
  try{
   const b=path.getBBox();
   if(!Number.isFinite(b.x+b.y+b.width+b.height)){
    return null;
   }
   return {
    x:b.x+b.width/2,
    y:b.y+b.height/2
   };
  }catch(_error){
   return null;
  }
 }


 // Choose an interior point, not the bounding-box midpoint.
 function interiorPoint(path){
  try{
   const b=path.getBBox();

   if(
    !Number.isFinite(b.x+b.y+b.width+b.height) ||
    b.width<=0 || b.height<=0 ||
    typeof path.isPointInFill!=="function"
   )return null;

   const probe=svg.createSVGPoint();

   const inside=(x,y)=>{
    probe.x=x;
    probe.y=y;
    return path.isPointInFill(probe);
   };

   const candidates=[];

   const add=(x,y)=>{
    if(
     Number.isFinite(x) &&
     Number.isFinite(y) &&
     inside(x,y)
    ){
     candidates.push({x,y});
    }
   };

   add(b.x+b.width/2,b.y+b.height/2);

   // Interior grid. No assumed geographic projection.
   for(let iy=1;iy<=15;iy++){
    for(let ix=1;ix<=23;ix++){
     add(
      b.x+b.width*ix/24,
      b.y+b.height*iy/16
     );
    }
   }

   // Border sampling also finds small or separated landmasses.
   const length=path.getTotalLength();

   if(Number.isFinite(length)&&length>0){
    const samples=Math.min(
     192,Math.max(64,Math.ceil(length/4))
    );

    for(let i=0;i<samples;i++){
     const t=length*(i+0.5)/samples;

     const p=path.getPointAtLength(t);
     const p0=path.getPointAtLength(
      Math.max(0,t-0.6)
     );
     const p1=path.getPointAtLength(
      Math.min(length,t+0.6)
     );

     const dx=p1.x-p0.x;
     const dy=p1.y-p0.y;
     const norm=Math.hypot(dx,dy);

     if(!norm)continue;

     const nx=-dy/norm;
     const ny=dx/norm;

     for(const distance of [0.35,0.8,1.6,3.5,7]){
      add(
       p.x+nx*distance,
       p.y+ny*distance
      );
      add(
       p.x-nx*distance,
       p.y-ny*distance
      );
     }
    }
   }

   if(!candidates.length)return null;

   // Prefer a point with more land around it.
   const q=Math.SQRT1_2;

   const directions=[
    [1,0],[-1,0],[0,1],[0,-1],
    [q,q],[q,-q],[-q,q],[-q,-q]
   ];

   const radii=[
    0.35,0.75,1.5,2.5,4,
    6,9,13,19,28,40
   ];

   let best=null;
   let bestScore=-1;

   for(const p of candidates){
    let score=0;

    for(const radius of radii){
     const valid=directions.every(([dx,dy])=>
      inside(
       p.x+dx*radius,
       p.y+dy*radius
      )
     );

     if(!valid)break;
     score=radius;
    }

    if(score>bestScore){
     bestScore=score;
     best=p;
    }
   }

   // Every returned candidate passed the land-fill test.
   return best&&inside(best.x,best.y)?best:null;

  }catch(error){
   return null;
  }
 }

 const target=midpoint(jp);
 if(!target) throw Error("BEAM_TARGET_INVALID");

 // Japan-centered wrap, with the seam opposite Japan.
 const shift=target.x-480;
 if(!Number.isFinite(shift)) throw Error("MAP_CENTER_INVALID");
 const centeredX=x=>((x-shift)%960+960)%960;
 const left=make("g"),right=make("g");
 left.setAttribute("transform",`translate(${-shift} 0)`);
 right.setAttribute("transform",`translate(${960-shift} 0)`);
 right.setAttribute("data-wrapped-world","true");
 const copies=countryPaths.map(source=>{
  const clone=source.cloneNode(true);
  clone.removeAttribute("id");
  clone.removeAttribute("tabindex");
  clone.setAttribute("aria-hidden","true");
  return clone;
 });
 left.append(...countryPaths);
 right.append(...copies);
 svg.append(left,right);
 target.x=480;

 // Synchronize wrapped countries after the existing renderer.
 function syncCopies(){
  for(let i=0;i<countryPaths.length;i++){
   const source=countryPaths[i],copy=copies[i];
   copy.style.fill=source.style.fill;
   copy.classList.toggle(
    "selected",source.classList.contains("selected")
   );
   const from=source.querySelector("title");
   const to=copy.querySelector("title");
   if(from&&to)to.textContent=from.textContent;
  }
 }
 for(let i=0;i<copies.length;i++){
  copies[i].addEventListener("click",event=>{
   event.stopPropagation();
   countryPaths[i].dispatchEvent(
    new MouseEvent("click",{bubbles:true})
   );
   syncCopies();
  });
 }
 for(const select of Object.values(selectors)){
  select.addEventListener(
   "change",()=>queueMicrotask(syncCopies)
  );
 }
 svg.addEventListener(
  "click",()=>queueMicrotask(syncCopies)
 );
 svg.addEventListener(
  "keydown",()=>queueMicrotask(syncCopies)
 );
 syncCopies();

 const observedCountries=new Set(data.rows.map(row=>String(row.country)));
 const locations=new Map();

 for(const path of countryPaths){
  const code=path.dataset.code;
  const point=observedCountries.has(code)?interiorPoint(path):null;
  if(code && point){
   point.x=centeredX(point.x);
   locations.set(code,point);
  }
 }

 const layer=make("g");
 layer.setAttribute("id","country-beam-layer");
 layer.setAttribute("pointer-events","none");
 layer.setAttribute("aria-hidden","true");
 svg.appendChild(layer);

 function matches(row){
  return keys.every(k=>
   !selectors[k].value ||
   String(row[k])===selectors[k].value
  );
 }

 function redraw(){
  const counts=new Map();

  for(const row of data.rows){
   if(!matches(row)) continue;

   const code=String(row.country);
   const n=Number(row.count);

   counts.set(code,(counts.get(code)||0)+n);
  }

  layer.replaceChildren();

  const peak=Math.max(1,...counts.values());
  let drawn=0;
  let unmapped=0;

  for(const [code,count] of [...counts.entries()]
    .sort((a,b)=>a[1]-b[1])){

   if(code==="JP" || code==="UNKNOWN") continue;

   const from=locations.get(code);

   if(!from){
    unmapped++;
    continue;
   }

   const centerX=(from.x+target.x)/2;
   const centerY=(from.y+target.y)/2;
   const lift=Math.min(
    95,Math.max(16,Math.abs(from.x-target.x)*0.2)
   );

   const controlY=Math.max(8,centerY-lift);

   const d=
    `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} `+
    `Q ${centerX.toFixed(2)} ${controlY.toFixed(2)} `+
    `${target.x.toFixed(2)} ${target.y.toFixed(2)}`;

   const strength=Math.log1p(count)/Math.log1p(peak);

   const glow=make("path");
   glow.setAttribute("d",d);
   glow.setAttribute("class","beam-glow");
   glow.style.strokeWidth=(3+4*strength).toFixed(2);
   glow.style.opacity=(0.12+0.16*strength).toFixed(2);

   const beam=make("path");
   beam.setAttribute("d",d);
   beam.setAttribute("class","beam-flow");
   beam.style.strokeWidth=(0.7+2.1*strength).toFixed(2);
   beam.style.opacity=(0.5+0.45*strength).toFixed(2);

   layer.append(glow,beam);
   drawn++;
  }

  const marker=make("circle");
  marker.setAttribute("cx",target.x);
  marker.setAttribute("cy",target.y);
  marker.setAttribute("r","4");
  marker.setAttribute("class","beam-japan-marker");
  layer.appendChild(marker);

  layer.style.display=toggle.checked?"":"none";

  const jpCount=counts.get("JP")||0;

  status.textContent=
   `${drawn} source-country beams toward Japan`+
   ` · ${jpCount.toLocaleString("en-US")} domestic requests`+
   (unmapped?` · ${unmapped} unmapped countries`:"");
 }

 for(const select of Object.values(selectors)){
  if(!select)throw Error("BEAM_FILTER_MISSING");
  select.addEventListener("change",redraw);
 }

 // Existing map selection handlers run first.
 svg.addEventListener("click",()=>{
  queueMicrotask(redraw);
 });

 svg.addEventListener("keydown",event=>{
  if(event.key==="Enter" || event.key===" "){
   queueMicrotask(redraw);
  }
 });

 toggle.addEventListener("change",()=>{
  layer.style.display=toggle.checked?"":"none";
 });

 redraw();
})();
;(() => {
  "use strict";

  const svg = document.getElementById("world");
  const reset = document.getElementById("map-zoom-reset");
  const output = document.getElementById("map-zoom-level");

  if (!svg || !reset || !output) {
    throw Error("MAP_ZOOM_ELEMENT_MISSING");
  }

  const full = {x:0,y:0,width:960,height:480};
  const limit = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
  const wrapX=x=>((x%960)+960)%960;

  let scale = 1;
  let gesture = null;
  let ignoreClick = false;

  function view() {
    const v = svg.viewBox.baseVal;
    return {
      x:v.x,y:v.y,
      width:v.width,height:v.height
    };
  }

  function mapPoint(clientX,clientY) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;

    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    return point.matrixTransform(matrix.inverse());
  }

  function apply(next,anchor,rx,ry) {
    next = limit(next,1,8);

    const w = full.width / next;
    const h = full.height / next;

    const x = wrapX(anchor.x-rx*w);

    const y = limit(
      anchor.y-ry*h,
      full.y,
      full.y+full.height-h
    );

    svg.setAttribute(
      "viewBox",
      `${x} ${y} ${w} ${h}`
    );

    scale = next;
    output.textContent = `${scale.toFixed(1)}×`;
    reset.disabled = scale <= 1.001 && x<0.001 && y<0.001;
  }

  function focus(clientX,clientY) {
    const p = mapPoint(clientX,clientY);
    if (!p) return null;

    const v = view();

    return {
      p,
      rx:(p.x-v.x)/v.width,
      ry:(p.y-v.y)/v.height
    };
  }

  // Ctrl + wheel: zoom around the mouse pointer.
  // Ordinary wheel scrolling is not intercepted.
  svg.addEventListener("wheel",event => {
    if (!event.ctrlKey) return;

    event.preventDefault();

    const f = focus(event.clientX,event.clientY);
    if (!f) return;

    const unit =
      event.deltaMode===1 ? 16 :
      event.deltaMode===2 ? 480 : 1;

    const delta = limit(
      event.deltaY*unit,-240,240
    );

    apply(
      scale*Math.exp(-delta*0.004),
      f.p,f.rx,f.ry
    );
  },{passive:false});

  // Ctrl + left drag vertically.
  svg.addEventListener("pointerdown",event => {
    if (
      !event.ctrlKey ||
      event.button!==0 ||
      !event.isPrimary
    ) return;

    const f = focus(event.clientX,event.clientY);
    if (!f) return;

    event.preventDefault();

    gesture = {
      id:event.pointerId,
      y:event.clientY,
      start:scale,
      p:f.p,
      rx:f.rx,
      ry:f.ry,
      moved:false
    };

    svg.setPointerCapture(event.pointerId);
  },true);

  svg.addEventListener("pointermove",event => {
    if (
      !gesture ||
      event.pointerId!==gesture.id
    ) return;

    event.preventDefault();

    const dy = event.clientY-gesture.y;

    if (
      Math.abs(dy)<3 &&
      !gesture.moved
    ) return;

    gesture.moved = true;

    apply(
      gesture.start*Math.exp(-dy*0.012),
      gesture.p,
      gesture.rx,
      gesture.ry
    );
  },true);

  function finish(event) {
    if (
      !gesture ||
      (event && event.pointerId!==gesture.id)
    ) return;

    if (gesture.moved) {
      ignoreClick = true;

      setTimeout(() => {
        ignoreClick = false;
      },180);
    }

    const id = gesture.id;
    gesture = null;

    if (svg.hasPointerCapture(id)) {
      svg.releasePointerCapture(id);
    }
  }

  svg.addEventListener("pointerup",finish,true);
  svg.addEventListener("pointercancel",finish,true);

  svg.addEventListener(
    "lostpointercapture",
    () => {gesture=null;}
  );

  window.addEventListener(
    "blur",
    () => {gesture=null;}
  );

  // Do not select a country after a Ctrl-drag.
  svg.addEventListener("click",event => {
    if (!event.ctrlKey && !ignoreClick) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    ignoreClick = false;
  },true);


  // Normal left-drag pans the zoomed SVG.
  // Ctrl + drag remains reserved for zoom.
  let pan = null;
  let suppressPanClick = false;
  let suppressTicket = 0;

  svg.addEventListener("pointerdown",event => {
    if (
      event.ctrlKey ||
      event.button !== 0 ||
      !event.isPrimary ||
      event.pointerType === "touch"
    ) return;

    const matrix = svg.getScreenCTM();
    if (!matrix) return;

    pan = {
      id:event.pointerId,
      x:event.clientX,
      y:event.clientY,
      initial:view(),
      inverse:matrix.inverse(),
      moved:false
    };
  },true);

  window.addEventListener("pointermove",event => {
    if (!pan || event.pointerId !== pan.id) return;
    if (!(event.buttons & 1)) return;

    const dx = event.clientX-pan.x;
    const dy = event.clientY-pan.y;

    if (!pan.moved && Math.hypot(dx,dy)<5) return;

    pan.moved = true;
    if (event.cancelable) event.preventDefault();

    const m = pan.inverse;
    const vx = m.a*dx+m.c*dy;
    const vy = m.b*dx+m.d*dy;
    const v = pan.initial;

    const x = wrapX(v.x-vx);

    const y = limit(
      v.y-vy,
      full.y,
      full.y+full.height-v.height
    );

    svg.setAttribute(
      "viewBox",
      `${x} ${y} ${v.width} ${v.height}`
    );
    reset.disabled = scale <= 1.001 && x<0.001 && y<0.001;
  },{capture:true,passive:false});

  function finishPan(event){
    if (!pan || event.pointerId !== pan.id) return;

    const moved = pan.moved;
    pan = null;

    if (moved){
      suppressPanClick = true;
      const ticket = ++suppressTicket;

      setTimeout(() => {
        if (ticket === suppressTicket){
          suppressPanClick = false;
        }
      },300);
    }
  }

  window.addEventListener("pointerup",finishPan,true);
  window.addEventListener("pointercancel",finishPan,true);

  window.addEventListener("blur",() => {
    pan = null;
    suppressPanClick = false;
  });

  svg.addEventListener("click",event => {
    if (!suppressPanClick) return;

    suppressPanClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);

  reset.addEventListener("click",() => {
    apply(
      1,
      {x:full.width/2,y:full.height/2},
      0.5,0.5
    );
  });

  apply(
    1,
    {x:full.width/2,y:full.height/2},
    0.5,0.5
  );
})();
;(() => {
 "use strict";
 const svg=document.getElementById("world");
 const ns="http://www.w3.org/2000/svg";
 const el=t=>document.createElementNS(ns,t);

 if(!svg || svg.querySelector("#hp-world-master"))
  throw Error("WORLD_WRAP_INITIALIZATION");

 if(!svg.querySelector("#country-beam-layer"))
  throw Error("WORLD_WRAP_BEAMS_MISSING");

 // Keep one canonical world, with two adjacent copies.
 const existing=[...svg.children];

 if(existing.length<3 || !existing.some(
  node=>node.tagName.toLowerCase()==="rect"
 ))throw Error("WORLD_WRAP_SVG_STRUCTURE");

 const defs=el("defs");
 const clip=el("clipPath");
 clip.id="hp-world-clip";
 clip.setAttribute("clipPathUnits","userSpaceOnUse");

 const rect=el("rect");
 rect.setAttribute("x","0");
 rect.setAttribute("y","0");
 rect.setAttribute("width","960");
 rect.setAttribute("height","480");

 clip.appendChild(rect);
 defs.appendChild(clip);
 svg.prepend(defs);

 const master=el("g");
 master.id="hp-world-master";
 master.setAttribute("clip-path","url(#hp-world-clip)");
 master.append(...existing);

 const countries=[...master.querySelectorAll("path.country")]
  .filter(path=>!path.closest('[aria-hidden="true"]'));

 if(countries.length<170)
  throw Error("WORLD_WRAP_COUNTRIES_MISSING");

 // SVG <use> shares the source world's visual updates.
 const copies=[];

 for(const offset of [-960,960]){
  const use=el("use");
  use.setAttribute("href","#hp-world-master");
  use.setAttribute("transform",`translate(${offset} 0)`);
  use.setAttribute("aria-hidden","true");
  use.setAttribute("tabindex","-1");
  use.setAttribute("data-world-offset",String(offset));
  copies.push({use,offset});
 }

 svg.append(copies[0].use,master,copies[1].use);
 svg.style.userSelect="none";

 // Restore country selection when clicking a repeated world.
 function selectOnCopy(event,offset){
  if(event.defaultPrevented || event.ctrlKey)return;

  const screenMatrix=svg.getScreenCTM();
  if(!screenMatrix)return;

  const screenPoint=svg.createSVGPoint();
  screenPoint.x=event.clientX;
  screenPoint.y=event.clientY;

  const rootPoint=screenPoint.matrixTransform(
   screenMatrix.inverse()
  );

  rootPoint.x-=offset;
  const baseScreen=rootPoint.matrixTransform(screenMatrix);

  for(const path of countries){
   try{
    const m=path.getScreenCTM();
    if(!m)continue;

    const local=baseScreen.matrixTransform(m.inverse());

    if(path.isPointInFill(local)){
     path.dispatchEvent(new MouseEvent("click",{
      bubbles:true,cancelable:true
     }));
     return;
    }
   }catch(_error){}
  }
 }

 for(const {use,offset} of copies){
  use.addEventListener("click",event=>{
   selectOnCopy(event,offset);
  });
 }
})();
