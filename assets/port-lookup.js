"use strict";
(async () => {
  const input = document.getElementById("port-lookup-input");
  const options = document.getElementById("port-lookup-options");
  const result = document.getElementById("port-lookup-result");
  if (!input || !options || !result) return;

  try {
    const response = await fetch("data/port-counters.json", {cache: "no-store"});
    if (!response.ok) throw Error("HTTP " + response.status);
    const data = await response.json();
    if (data.schema !== "honeypot-public-port-counters-v1") throw Error("Schema mismatch");

    const lookup = new Map();
    for (const r of data.ports) {
      const suffix = r.protocol === "TCP_SYN" ? "tcp" : r.protocol === "UDP_NEW" ? "udp" : null;
      if (suffix === null || !Number.isInteger(r.port)) continue;
      lookup.set(`${r.port}/${suffix}`, r);
    }

    const keys = [...lookup.keys()].sort(
      (a, b) => lookup.get(b).packets - lookup.get(a).packets
    );
    const nf = new Intl.NumberFormat("en-US");

    const update = () => {
      const typed = input.value.trim().toLowerCase();
      options.replaceChildren();

      if (!typed) {
        result.textContent = "Enter a port number or number/protocol (e.g. 53/udp)";
        return;
      }

      const selected = keys.filter(k => k.startsWith(typed)).slice(0, 20);

      for (const key of selected) {
        const el = document.createElement("option");
        el.value = key;
        options.appendChild(el);
      }

      const r = lookup.get(typed);
      result.textContent = r
        ? `${typed}: ${nf.format(r.packets)} retained packets, ${nf.format(r.bytes)} bytes (sampled ${data.sampled_at_utc}; not daily totals)`
        : `${selected.length} matching port/protocol combinations. Select a suggestion or type an exact value.`;
    };

    input.addEventListener("input", update);
    input.addEventListener("change", update);
    update();
  } catch (e) {
    result.textContent = "Port data could not be loaded: " + e.message;
  }
})();
