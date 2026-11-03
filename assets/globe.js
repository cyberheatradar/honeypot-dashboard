
"use strict";

const payload=JSON.parse(
 document.getElementById("globe-data").textContent
);
const rows=payload.rows;
const names=payload.country_names;
const positions=payload.country_positions;
const destination=payload.destination;

const dimensions=[
 "day","country","port","transport","method","signal"
];

const selects=Object.fromEntries(dimensions.map(
 key=>[key,document.getElementById("f-"+key)]
));

const summary=document.getElementById("summary");
const status=document.getElementById("globe-status");
const table=document.getElementById("country-rows");
const stage=document.getElementById("globe-stage");

const fmt=n=>Number(n).toLocaleString("en-US");
const countryName=code=>names[code]||code;
const escapeHTML=value=>String(value).replace(
 /[&<>"']/g,ch=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",
  '"':"&quot;","'":"&#39;"
 })[ch]
);

let globe=null;

for(const key of dimensions){
 const select=selects[key];
 const all=document.createElement("option");

 all.value="";
 all.textContent="All";
 select.appendChild(all);

 const values=[...new Set(rows.map(
  row=>String(row[key])
 ))];

 values.sort((a,b)=>
  key==="port" ? Number(a)-Number(b) :
  key==="country" ?
   countryName(a).localeCompare(countryName(b)) :
   a.localeCompare(b)
 );

 for(const value of values){
  const option=document.createElement("option");

  option.value=value;
  option.textContent=key==="country" ?
   countryName(value) : value;

  select.appendChild(option);
 }

 select.addEventListener("change",render);
}

function aggregate(){
 const counts=new Map();
 let total=0;

 for(const row of rows){
  if(!dimensions.every(key=>
    !selects[key].value ||
    String(row[key])===selects[key].value
  )) continue;

  counts.set(
   row.country,
   (counts.get(row.country)||0)+row.count
  );
  total+=row.count;
 }

 return {counts,total};
}

function render(){
 const {counts,total}=aggregate();

 const sorted=[...counts.entries()].sort(
  (a,b)=>b[1]-a[1]||
   countryName(a[0]).localeCompare(countryName(b[0]))
 );

 const port=selects.port.value;
 const leader=sorted.length ? sorted[0] : null;
 const portLeader=port && leader && total>0 ?
  ` · Top source for port ${port}: `+
  `${countryName(leader[0])} ${fmt(leader[1])} `+
  `(${(100*leader[1]/total).toFixed(1)}%)` : "";

 summary.textContent=
  `${fmt(total)} matching HTTP requests · `+
  `${counts.size} source-country categories`+
  portLeader;

 table.replaceChildren();

 for(const [code,count] of sorted){
  const tr=document.createElement("tr");
  const nameCell=document.createElement("td");
  const countCell=document.createElement("td");
  const button=document.createElement("button");

  button.type="button";
  button.textContent=countryName(code);

  button.addEventListener("click",()=>{
   selects.country.value=
    selects.country.value===code ? "" : code;
   render();
  });

  nameCell.appendChild(button);
  countCell.textContent=fmt(count);

  tr.append(nameCell,countCell);
  table.appendChild(tr);
 }

 if(!globe) return;

 const maximum=Math.max(1,...counts.values());
 const arcs=[];
 const points=[{
  code:"JP",
  name:"Japan (destination)",
  lat:destination.lat,
  lng:destination.lng,
  count:total,
  destination:true
 }];

 let missingCoordinates=0;

 for(const [code,count] of sorted){
  if(code==="JP"||code==="UNKNOWN") continue;

  const position=positions[code];

  if(!position){
   missingCoordinates++;
   continue;
  }

  const strength=Math.log1p(count)/Math.log1p(maximum);

  arcs.push({
   code,
   name:countryName(code),
   count,
   strength,
   startLat:position.lat,
   startLng:position.lng,
   endLat:destination.lat,
   endLng:destination.lng
  });

  points.push({
   code,
   name:countryName(code),
   count,
   lat:position.lat,
   lng:position.lng,
   destination:false
  });
 }

 globe.arcsData(arcs);
 globe.pointsData(points);

 globe.polygonCapColor(feature=>{
  const count=counts.get(feature.code)||0;

  if(!count) return "#263a51";

  const level=Math.log1p(count)/Math.log1p(maximum);
  return `rgb(20,${Math.round(113+100*level)},`+
   `${Math.round(142+65*level)})`;
 });

 status.textContent=
  `${arcs.length} international country arcs · `+
  `${fmt(counts.get("JP")||0)} domestic requests`+
  (missingCoordinates ?
   ` · ${missingCoordinates} source countries not mapped` :
   "");
}

async function initialize(){
 render();

 if(typeof Globe!=="function"||
    !window.WebGLRenderingContext){
  status.textContent=
   "WebGL unavailable. Country ranking is still accessible.";
  return;
 }

 try{
  const response=await fetch("data/globe-world.json",{
   cache:"no-store"
  });

  if(!response.ok) throw Error("WORLD_DATA_HTTP");

  const polygons=await response.json();

  if(!Array.isArray(polygons)||polygons.length<150){
   throw Error("WORLD_DATA_INVALID");
  }

  const width=Math.max(320,stage.clientWidth);
  const height=Math.max(420,Math.min(640,width*0.62));

  globe=new Globe(stage,{
   animateIn:false,
   waitForGlobeReady:false
  })
   .width(width)
   .height(height)
   .backgroundColor("#081321")
   .globeImageUrl(null)
   .showGraticules(true)
   .showAtmosphere(true)
   .atmosphereColor("#48cce3")
   .atmosphereAltitude(0.12)
   .polygonsData(polygons)
   .polygonGeoJsonGeometry(d=>d.geometry)
   .polygonCapColor(()=>"#263a51")
   .polygonSideColor(()=>"#102237")
   .polygonStrokeColor(()=>"#4c647b")
   .polygonAltitude(0.002)
   .arcsData([])
   .arcStartLat(d=>d.startLat)
   .arcStartLng(d=>d.startLng)
   .arcEndLat(d=>d.endLat)
   .arcEndLng(d=>d.endLng)
   .arcColor(d=>[
    `rgba(42,177,252,${0.4+0.5*d.strength})`,
    `rgba(106,255,197,${0.7+0.3*d.strength})`
   ])
   .arcStroke(d=>0.25+1.5*d.strength)
   .arcAltitudeAutoScale(0.42)
   .arcDashLength(0.22)
   .arcDashGap(0.78)
   .arcDashAnimateTime(d=>3500-1200*d.strength)
   .arcLabel(d=>escapeHTML(d.name)+
    ": "+fmt(d.count)+" requests")
   .pointsData([])
   .pointLat(d=>d.lat)
   .pointLng(d=>d.lng)
   .pointRadius(d=>d.destination?0.6:0.24)
   .pointAltitude(0.014)
   .pointColor(d=>d.destination?"#ffdc73":"#63e8ef")
   .pointLabel(d=>escapeHTML(d.name)+
    ": "+fmt(d.count)+" requests")
   .onArcClick(d=>{
    selects.country.value=d.code;
    render();
   })
   .onPointClick(d=>{
    if(d.destination) return;
    selects.country.value=d.code;
    render();
   })
   .pointOfView({
    lat:32,lng:128,altitude:2.6
   },0);

  const controls=globe.controls();
  controls.enableDamping=true;
  controls.autoRotate=false;
  controls.enableZoom=false;
  controls.enablePan=false;

  // Ordinary drag rotates. Ctrl + left drag changes zoom.
  // Wheel and middle-button zoom are disabled.
  const canvas=globe.renderer().domElement;
  if(!canvas) throw Error("GLOBE_CANVAS_MISSING");

  let zoomDrag=null;

  canvas.addEventListener("pointerdown",event=>{
   if(event.pointerType!=="mouse"||
      event.button!==0||!event.ctrlKey||zoomDrag){
    return;
   }

   zoomDrag={
    id:event.pointerId,
    startY:event.clientY,
    altitude:globe.pointOfView().altitude
   };

   canvas.setPointerCapture(event.pointerId);
   event.preventDefault();
   event.stopImmediatePropagation();
  },true);

  canvas.addEventListener("pointermove",event=>{
   if(!zoomDrag||event.pointerId!==zoomDrag.id){
    return;
   }

   const deltaY=event.clientY-zoomDrag.startY;
   const next=Math.max(
    0.25,
    Math.min(
     6,
     zoomDrag.altitude*Math.exp(deltaY/360)
    )
   );

   globe.pointOfView({altitude:next},0);
   event.preventDefault();
   event.stopImmediatePropagation();
  },true);

  const finishZoom=event=>{
   if(!zoomDrag||event.pointerId!==zoomDrag.id){
    return;
   }

   zoomDrag=null;

   if(canvas.hasPointerCapture(event.pointerId)){
    canvas.releasePointerCapture(event.pointerId);
   }

   event.preventDefault();
   event.stopImmediatePropagation();
  };

  canvas.addEventListener("pointerup",finishZoom,true);
  canvas.addEventListener("pointercancel",finishZoom,true);

  canvas.addEventListener("lostpointercapture",event=>{
   if(zoomDrag&&event.pointerId===zoomDrag.id){
    zoomDrag=null;
   }
  },true);

  if("ResizeObserver" in window){
   const observer=new ResizeObserver(()=>{
    if(!globe) return;

    const w=Math.max(320,stage.clientWidth);
    globe.width(w).height(
     Math.max(420,Math.min(640,w*0.62))
    );
   });

   observer.observe(stage);
  }

  render();

 }catch(error){
  status.textContent=
   "3D rendering failed. Aggregated ranking remains available.";
  console.error("GLOBE_RENDER_ERROR",error);
 }
}

initialize();
