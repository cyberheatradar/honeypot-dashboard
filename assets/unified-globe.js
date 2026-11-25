;(() => {
 "use strict";

 const el=id=>document.getElementById(id);

 const two=el("view-2d");
 const three=el("view-3d");
 const btn2=el("map-view-2d");
 const btn3=el("map-view-3d");
 const stage=el("unified-globe-stage");
 const status=el("unified-globe-status");

 const keys=[
  "day","country","port",
  "transport","method","signal"
 ];

 const selects=Object.fromEntries(
  keys.map(k=>[k,el("f-"+k)])
 );

 const source=JSON.parse(
  el("map-data").textContent
 );

 const meta=JSON.parse(
  el("unified-globe-meta").textContent
 );

 let rows=source.rows;
 const positions=meta.country_positions;
 const destination=meta.destination;
 const names=meta.country_names;

 const fmt=n=>Number(n).toLocaleString("en-US");
 const countryName=code=>names[code]||code;

 const safe=value=>String(value).replace(
  /[&<>"']/g,
  ch=>({
   "&":"&amp;",
   "<":"&lt;",
   ">":"&gt;",
   '"':"&quot;",
   "'":"&#39;"
  })[ch]
 );

 let mode="2d";
 let globe=null;
 let loading=null;
 let loadLibrary=null;
 let globeBeamToggle=null;
 let globeZoomReset=null;
 let globeZoomLevel=null;
 let twoStatus=null;
 let sharedHint=null;
 let twoHint="";
 let twoZoomText="1.0×";
 let twoZoomDisabled=true;
 const initialPOV={lat:32,lng:128,altitude:2.6};

 if(
  !two||!three||!btn2||!btn3||
  !stage||!status||!rows||
  !positions||!destination||
  keys.some(k=>!selects[k])
 ){
  throw Error("UNIFIED_INIT_MISSING");
 }



 function mountGlobeFooter(){
  const toggle=el('map-beam-toggle');
  const reset=el('map-zoom-reset');
  const level=el('map-zoom-level');
  const status2d=el('map-beam-status');
  const original=toggle&&toggle.closest('.beam-controls');
  const old3d=status.closest('.hp-globe-footer');
  const hint=original&&original.querySelector('.muted');

  if(!toggle||!reset||!level||!status2d||
     !original||!hint||!old3d||
     !two.contains(original)||
     !original.contains(reset)||
     !three.contains(old3d)||
     two.parentElement!==three.parentElement){
   throw Error('SHARED_MAP_CONTROLS_STRUCTURE_INVALID');
  }

  // Move original controls outside both renderers.
  // Existing 2D event listeners stay attached.
  twoStatus=status2d;
  globeBeamToggle=toggle;
  globeZoomReset=reset;
  globeZoomLevel=level;
  sharedHint=hint;
  twoHint=hint.textContent.trim();
  twoZoomText=level.textContent;
  twoZoomDisabled=reset.disabled;

  original.id='hp-shared-map-controls';
  original.title=old3d.title;

  status.style.margin='0';
  status.style.fontWeight='inherit';
  status.style.color='inherit';
  status.hidden=true;

  status2d.insertAdjacentElement('afterend',status);
  old3d.remove();
  three.insertAdjacentElement('afterend',original);

  if(document.querySelectorAll('#map-beam-toggle').length!==1||
     document.querySelectorAll('#map-zoom-reset').length!==1||
     document.querySelectorAll('#hp-shared-map-controls').length!==1||
     two.querySelector('.beam-controls')||
     three.querySelector('.beam-controls')){
   throw Error('SHARED_MAP_CONTROLS_DUPLICATION');
  }

  toggle.addEventListener('change',()=>{
   if(mode==='3d')updateGlobe();
  });

  // Intercept reset only in 3D.
  reset.addEventListener('click',event=>{
   if(mode!=='3d')return;

   event.preventDefault();
   event.stopImmediatePropagation();

   if(!globe)return;

   globe.pointOfView({...initialPOV},0);
   update3dZoom();
  },true);
 }

 function update3dZoom(){
  if(mode!=="3d"||!globe||!globeZoomLevel||
     !globeZoomReset)return;

  const pov=globe.pointOfView();

  globeZoomLevel.textContent=(
   initialPOV.altitude/pov.altitude
  ).toFixed(1)+'×';

  globeZoomReset.disabled=
   Math.abs(pov.altitude-initialPOV.altitude)<.001 &&
   Math.abs(pov.lat-initialPOV.lat)<.001 &&
   Math.abs(pov.lng-initialPOV.lng)<.001;
 }

 function setCountry(code){
  const select=selects.country;

  if(
   !code ||
   ![...select.options].some(
    option=>option.value===code
   )
  )return;

  select.value=
   select.value===code?"":code;

  select.dispatchEvent(
   new Event("change",{bubbles:true})
  );
 }

 function matched(row){
  return keys.every(k=>
   !selects[k].value ||
   String(row[k])===selects[k].value
  );
 }

 function updateGlobe(){
  if(!globe)return;
  const listed=Boolean(window.HP_TABLE_UI?.listedActive);

  const counts=new Map();
  let total=0;

  for(const row of rows){
   if(!matched(row))continue;

   const n=Number(row.count);
   total+=n;

   counts.set(
    row.country,
    (counts.get(row.country)||0)+n
   );
  }

  const sorted=[...counts].sort(
   (a,b)=>b[1]-a[1]
  );

  const peak=Math.max(
   1,...counts.values()
  );

  const arcs=[];

  const points=[{
   code:"JP",
   name:"Japan (destination)",
   lat:destination.lat,
   lng:destination.lng,
   count:total,
   destination:true
  }];

  let unmapped=0;

  for(const [code,count] of sorted){
   if(
    code==="JP" ||
    code==="UNKNOWN"
   )continue;

   const p=positions[code];

   if(!p){
    unmapped++;
    continue;
   }

   const strength=
    Math.log1p(count)/Math.log1p(peak);

   arcs.push({
    code,
    name:countryName(code),
    count,
    strength,
    listed,
    startLat:p.lat,
    startLng:p.lng,
    endLat:destination.lat,
    endLng:destination.lng
   });

   points.push({
    code,
    name:countryName(code),
    count,
    lat:p.lat,
    lng:p.lng,
    listed,
    destination:false
   });
  }

  globe.arcsData(globeBeamToggle.checked ? arcs : []);
  globe.pointsData(points);

  globe.polygonCapColor(feature=>{
   const count=counts.get(feature.code)||0;

   if(!count)return "#263a51";

   const level=
    Math.log1p(count)/Math.log1p(peak);

   if(listed){
    return `rgb(${Math.round(100+120*level)},${Math.round(38+35*level)},${Math.round(48+35*level)})`;
   }

   return `rgb(20,${Math.round(113+100*level)},`+
    `${Math.round(142+65*level)})`;
  });

  status.textContent=
   `${arcs.length} source-country beams toward Japan`+
   ` · ${fmt(counts.get("JP")||0)} domestic observations`+
   (unmapped?` · ${unmapped} unmapped countries`:"");
 }

 function fitStage(){
  if(!globe||mode!=="3d")return;

  const w=Math.max(
   320,stage.clientWidth
  );

  globe.width(w).height(
   Math.max(320,Math.round(w/2))
  );
 }

 function configureControl(){
  const controls=globe.controls();

  controls.enableDamping=true;
  controls.autoRotate=false;
  controls.enableZoom=false;
  controls.enablePan=false;
  controls.addEventListener("change",update3dZoom);

  const zoomTo=value=>{
   if(!Number.isFinite(value))return;

   const view=globe.pointOfView();

   globe.pointOfView({
    lat:view.lat,
    lng:view.lng,
    altitude:Math.max(
     .25,Math.min(6,value)
    )
   },0);
   update3dZoom();
  };

  stage.addEventListener(
   "wheel",
   event=>{
    event.stopPropagation();

    if(!event.ctrlKey)return;

    event.preventDefault();

    const unit=
     event.deltaMode===1?16:
     (event.deltaMode===2?400:1);

    zoomTo(
     globe.pointOfView().altitude*
     Math.exp(event.deltaY*unit/650)
    );
   },
   {capture:true,passive:false}
  );

  let drag=null;

  stage.addEventListener(
   "pointerdown",
   event=>{
    if(
     event.pointerType!=="mouse" ||
     event.button!==0 ||
     !event.ctrlKey
    )return;

    drag={
     id:event.pointerId,
     y:event.clientY,
     altitude:
      globe.pointOfView().altitude
    };

    stage.setPointerCapture(
     event.pointerId
    );

    event.preventDefault();
    event.stopPropagation();
   },
   true
  );

  stage.addEventListener(
   "pointermove",
   event=>{
    if(
     !drag ||
     event.pointerId!==drag.id
    )return;

    event.preventDefault();
    event.stopPropagation();

    zoomTo(
     drag.altitude*
     Math.exp(
      (event.clientY-drag.y)/300
     )
    );
   },
   true
  );

  const finish=event=>{
   if(
    !drag ||
    event.pointerId!==drag.id
   )return;

   const id=drag.id;
   drag=null;

   if(stage.hasPointerCapture(id)){
    stage.releasePointerCapture(id);
   }
  };

  stage.addEventListener(
   "pointerup",finish,true
  );

  stage.addEventListener(
   "pointercancel",finish,true
  );

  stage.addEventListener(
   "lostpointercapture",
   ()=>{drag=null;},
   true
  );
 }

 function loadGlobeLibrary(){
  if(typeof window.Globe==="function"){
   return Promise.resolve();
  }

  if(loadLibrary)return loadLibrary;

  loadLibrary=new Promise(
   (resolve,reject)=>{
    const script=
     document.createElement("script");

    script.src=
     "assets/vendor/globe.gl.min.js";

    script.onload=()=>{
     if(typeof window.Globe==="function"){
      resolve();
     }else{
      reject(
       Error("GLOBE_LIBRARY_INVALID")
      );
     }
    };

    script.onerror=()=>reject(
     Error("GLOBE_LIBRARY_LOAD_FAILED")
    );

    document.head.appendChild(script);
   }
  );

  return loadLibrary;
 }

 async function ensure3d(){
  if(globe){
   fitStage();
   updateGlobe();
   return;
  }

  if(loading)return loading;

  loading=(async()=>{
   if(!window.WebGLRenderingContext){
    throw Error("WEBGL_UNAVAILABLE");
   }

   status.textContent=
    "Loading 3D globe...";

   await loadGlobeLibrary();

   const response=await fetch(
    "data/globe-world.json",
    {cache:"no-store"}
   );

   if(!response.ok){
    throw Error("WORLD_DATA_HTTP");
   }

   const polygons=await response.json();

   if(
    !Array.isArray(polygons) ||
    polygons.length<150
   ){
    throw Error("WORLD_DATA_INVALID");
   }

   const w=Math.max(
    320,stage.clientWidth
   );

   const h=Math.max(320,Math.round(w/2));

   globe=new window.Globe(stage,{
    animateIn:false,
    waitForGlobeReady:false
   })
    .width(w)
    .height(h)
    .backgroundColor("#081321")
    .globeImageUrl(null)
    .showGraticules(true)
    .showAtmosphere(true)
    .atmosphereColor("#48cce3")
    .atmosphereAltitude(.12)
    .polygonsData(polygons)
    .polygonGeoJsonGeometry(d=>d.geometry)
    .polygonCapColor(()=>"#263a51")
    .polygonSideColor(()=>"#102237")
    .polygonStrokeColor(()=>"#4c647b")
    .polygonAltitude(.002)
    .arcsData([])
    .arcStartLat(d=>d.startLat)
    .arcStartLng(d=>d.startLng)
    .arcEndLat(d=>d.endLat)
    .arcEndLng(d=>d.endLng)
    .arcColor(d=>d.listed ? [
     `rgba(243,75,82,${.35+.35*d.strength})`,
     `rgba(255,146,125,${.65+.35*d.strength})`
    ] : [
     `rgba(54,220,233,${.35+.35*d.strength})`,
     `rgba(119,244,228,${.65+.35*d.strength})`
    ])
    .arcStroke(d=>.22+.70*d.strength)
    .arcAltitudeAutoScale(.42)
    .arcDashLength(.07)
    .arcDashGap(.10)
    .arcDashAnimateTime(2800)
    .arcLabel(
     d=>safe(d.name)+": "+
      fmt(d.count)+" observations"
    )
    .pointsData([])
    .pointLat(d=>d.lat)
    .pointLng(d=>d.lng)
    .pointRadius(
     d=>d.destination?.6:.24
    )
    .pointAltitude(.014)
    .pointColor(
     d=>d.destination?
      "#ffdc73":(d.listed?"#ff927d":"#63e8ef")
    )
    .pointLabel(
     d=>safe(d.name)+": "+
      fmt(d.count)+" observations"
    )
    .onArcClick(
     d=>setCountry(d.code)
    )
    .onPointClick(
     d=>{
      if(!d.destination){
       setCountry(d.code);
      }
     }
    )
    .onPolygonClick(
     d=>setCountry(d.code)
    )
    .pointOfView({
     lat:32,
     lng:128,
     altitude:2.6
    },0);

   configureControl();
   update3dZoom();

   if("ResizeObserver" in window){
    const observer=
     new ResizeObserver(fitStage);

    observer.observe(stage);
   }

   updateGlobe();
  })();

  try{
   await loading;
  }catch(error){
   status.textContent=
    "3D rendering unavailable. "+
    "2D map remains usable.";

   console.error(
    "UNIFIED_GLOBE_ERROR",
    error
   );

   loading=null;
  }
 }

 function switchView(next){
  if(
   next!=="2d" &&
   next!=="3d"
  )return;

  if(mode==="2d"&&next==="3d"){
   twoZoomText=globeZoomLevel.textContent;
   twoZoomDisabled=globeZoomReset.disabled;
  }

  mode=next;

  two.hidden=next!=="2d";
  three.hidden=next!=="3d";
  twoStatus.hidden=next==="3d";
  status.hidden=next!=="3d";

  sharedHint.textContent=next==="3d" ?
   'Drag to rotate · Ctrl + drag ↑↓ / Ctrl + wheel to zoom':
   twoHint;

  if(next==="2d"){
   globeZoomLevel.textContent=twoZoomText;
   globeZoomReset.disabled=twoZoomDisabled;
  }else if(globe){
   update3dZoom();
  }else{
   globeZoomLevel.textContent="1.0×";
   globeZoomReset.disabled=true;
  }

  btn2.setAttribute(
   "aria-pressed",
   String(next==="2d")
  );

  btn3.setAttribute(
   "aria-pressed",
   String(next==="3d")
  );

  if(next==="3d"){
   void ensure3d();
  }
 }

 btn2.addEventListener(
  "click",()=>switchView("2d")
 );

 btn3.addEventListener(
  "click",()=>switchView("3d")
 );

 for(const key of keys){
  selects[key].addEventListener(
   "change",
   ()=>{
    if(mode==="3d"){
     updateGlobe();
    }
   }
  );
 }

 document.addEventListener("hp-source-facets-rows",event=>{
  rows=event.detail.rows;
  if(mode==="3d")updateGlobe();
 });
 mountGlobeFooter();
 switchView("2d");
})();

// HP_FACET_GLOBE_V2

// HP_GLOBE_FOOTER_MATCH_2D_V1

// HP_SHARED_MAP_CONTROLS_V4

// HP_SUSPICIOUS_PALETTE_V1
