(() => {
  "use strict";

  // Derived only from published aggregated packet rows.
  // No raw IP addresses or new data collection.

  const byId = id => document.getElementById(id);

  const source = byId("hp-packet-data");
  const portBody = byId("map-port-rows");
  const countryBody = byId("countries");

  const daySelect = byId("f-day");
  const countrySelect = byId("f-country");
  const portSelect = byId("f-port");

  if (
    !source || !portBody || !countryBody ||
    !daySelect || !countrySelect || !portSelect
  ) {
    throw Error("PORT_INSIGHTS_REQUIRED_ELEMENTS_MISSING");
  }

  const parsed = JSON.parse(source.textContent);

  if (!Array.isArray(parsed.rows)) {
    throw Error("PORT_INSIGHTS_DATA_INVALID");
  }

  const packetRows = parsed.rows;

  const fmt = value =>
    Number(value).toLocaleString("en-US");

  function findHeading(text) {
    return [...document.querySelectorAll("h2,h3")]
      .find(element =>
        element.textContent.trim() === text
      );
  }

  // Add compact metric selectors to the existing
  // ranking headings; no new columns are required.

  function addModeSelect(heading, label, options) {
    if (!heading) {
      throw Error("PORT_INSIGHTS_HEADING_MISSING");
    }

    const select = document.createElement("select");

    select.className = "hp-insight-mode";
    select.setAttribute("aria-label", label);

    for (const [value, caption] of options) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = caption;
      select.appendChild(option);
    }

    heading.appendChild(select);
    return select;
  }

  const portMode = addModeSelect(
    findHeading("Destination port ranking"),
    "Port ranking metric",
    [
      ["share", "Share"],
      ["countries", "Countries"]
    ]
  );

  const countryMode = addModeSelect(
    findHeading("Source country ranking"),
    "Country ranking metric",
    [
      ["observations", "Observations"],
      ["ports", "Ports"]
    ]
  );

  const portTable = portBody.closest("table");
  const countryTable = countryBody.closest("table");

  if (!portTable || !countryTable) {
    throw Error("PORT_INSIGHTS_TABLE_MISSING");
  }

  const portHeaders =
    portTable.querySelectorAll("thead th");

  const countryHeaders =
    countryTable.querySelectorAll("thead th");

  if (
    portHeaders.length !== 3 ||
    countryHeaders.length !== 2
  ) {
    throw Error("PORT_INSIGHTS_HEADER_MISMATCH");
  }


  let scheduled = false;

  function schedule() {
    if (scheduled) return;

    scheduled = true;

    queueMicrotask(() => {
      scheduled = false;
      update();
    });
  }

  function update() {
    const kind = window.HP_KIND;

    if (kind !== "TCP_SYN" && kind !== "UDP") {
      throw Error("PORT_INSIGHTS_UNKNOWN_PROTOCOL");
    }

    const selectedDay = daySelect.value;
    const selectedCountry = countrySelect.value;
    const selectedPort = portSelect.value;



    const countriesByPort = new Map();
    const portsByCountry = new Map();
    const observationsByCountry = new Map();
    const observationsByPort = new Map();

    let total = 0;

    // Apply the same selections used by the map.

    for (const row of packetRows) {
      if (
        row.transport !== kind ||
        (selectedDay && row.day !== selectedDay) ||
        (selectedCountry &&
         row.country !== selectedCountry) ||
        (selectedPort &&
         String(row.port) !== selectedPort)
      ) {
        continue;
      }

      const count = Number(row.count);

      if (
        !Number.isSafeInteger(count) ||
        count <= 0
      ) {
        continue;
      }

      const port = String(row.port);
      const country = String(row.country);


      total += count;

      observationsByPort.set(
        port,
        (observationsByPort.get(port) || 0) + count
      );

      observationsByCountry.set(
        country,
        (observationsByCountry.get(country) || 0)
        + count
      );

      if (!portsByCountry.has(country)) {
        portsByCountry.set(country, new Set());
      }

      portsByCountry.get(country).add(port);

      // Unknown GeoIP country is not counted as
      // an identified source country.

      if (/^[A-Z]{2}$/.test(country)) {
        if (!countriesByPort.has(port)) {
          countriesByPort.set(port, new Set());
        }

        countriesByPort.get(port).add(country);
      }
    }


    // RIGHT TOP: Share / Countries.

    portHeaders[2].textContent =
      portMode.value === "countries"
        ? "Countries"
        : "Share";

    for (const row of portBody.rows) {
      const cells = row.cells;

      if (cells.length !== 3) continue;

      const match = cells[0].textContent.match(
        /^\s*(\d{1,5})(?:\/tcp|\/udp)\b/
      );

      if (!match) continue;

      const port = String(Number(match[1]));

      if (portMode.value === "countries") {
        const countries =
          countriesByPort.get(port)?.size || 0;

        cells[2].textContent = fmt(countries);
      } else {
        const count =
          observationsByPort.get(port) || 0;

        cells[2].textContent = total
          ? (100 * count / total).toFixed(1) + "%"
          : "0.0%";
      }
    }

    // RIGHT BOTTOM: Observations / Ports.

    countryHeaders[1].textContent =
      countryMode.value === "ports"
        ? "Ports"
        : "Observations";

    // Match the original map renderer's ranking order.
    const ranking = [
      ...observationsByCountry.entries()
    ].sort(
      (a, b) =>
        b[1] - a[1] ||
        a[0].localeCompare(b[0])
    );

    if (ranking.length === countryBody.rows.length) {
      for (let i = 0; i < ranking.length; i++) {
        const cells = countryBody.rows[i].cells;

        if (cells.length !== 2) continue;

        const country = ranking[i][0];

        if (countryMode.value === "ports") {
          cells[1].textContent = fmt(
            portsByCountry.get(country)?.size || 0
          );
        } else {
          cells[1].textContent = fmt(ranking[i][1]);
        }
      }
    }
  }

  for (const control of [
    daySelect,
    countrySelect,
    portSelect,
    portMode,
    countryMode
  ]) {
    control.addEventListener("change", schedule);
  }

  // The existing map also updates tables directly
  // when a country or port is clicked.
  // Observe row replacement without modifying
  // either 2D or 3D rendering code.

  new MutationObserver(schedule).observe(
    portBody,
    {childList: true}
  );

  new MutationObserver(schedule).observe(
    countryBody,
    {childList: true}
  );

  schedule();
})();
