"use strict";
(() => {
 const select=document.getElementById("overview-period-select");
 const panes=[...document.querySelectorAll(
  "[data-overview-period]"
 )];
 if(!select || panes.length!==5)
  throw Error("OVERVIEW_PERIOD_INIT_FAILED");
 function update(){
  for(const pane of panes)
   pane.hidden=pane.dataset.overviewPeriod!==select.value;
 }
 select.addEventListener("change",update);
 update();
})();
