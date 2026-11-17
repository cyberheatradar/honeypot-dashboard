
(() => {
  "use strict";

  function initialize() {
    const day = document.getElementById("f-day");
    const target = document.getElementById("hp-summary-text");
    const data = document.getElementById(
      "hp-observation-summary-data"
    );

    if (!day || !target || !data) {
      throw new Error("SUMMARY_ELEMENTS_MISSING");
    }

    const summaries = JSON.parse(data.textContent);

    function update() {
      const selected = day.value;

      if (!selected) {
        target.textContent = summaries.all;
      } else {
        target.textContent =
          summaries.days[selected] ??
          "この日付の総括はありません";
      }
    }

    day.addEventListener("change", update);
    day.addEventListener("input", update);

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {once: true}
    );
  } else {
    initialize();
  }
})();
