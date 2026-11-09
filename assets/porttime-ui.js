
(() => {
  "use strict";

  const get = id => document.getElementById(id);
  const root = get("porttime-dashboard");
  if (!root) return;

  const status = get("porttime-status");
  const gapStatus = get("porttime-gap-status");
  const filters = get("porttime-filters");
  const results = get("porttime-results");
  const start = get("porttime-start");
  const end = get("porttime-end");
  const country = get("porttime-country");
  const proto = get("porttime-protocol");
  const port = get("porttime-port");
  const total = get("porttime-total");
  const ranking = get("porttime-ranking");
  const daily = get("porttime-daily");
  const truncation = get("porttime-truncation");
  const reset = get("porttime-reset");

  let rows = [];
  let minDay = "";
  let maxDay = "";

  const fmt = n => Number(n).toLocaleString("ja-JP");

  const countryName = code => {
    if (!code) return "不明";
    try {
      return new Intl.DisplayNames(
        ["ja"], {type:"region"}
      ).of(code) + " (" + code + ")";
    } catch (_) {
      return code;
    }
  };

  function appendRow(tbody, values) {
    const tr = document.createElement("tr");
    for (const value of values) {
      const td = document.createElement("td");
      td.textContent = String(value);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  function render() {
    ranking.replaceChildren();
    daily.replaceChildren();
    truncation.textContent = "";

    if (start.value && end.value && start.value > end.value) {
      total.textContent = "開始日が終了日より後です";
      return;
    }

    const selectedPort = port.value.trim();
    if (selectedPort !== "" && (
      !/^\d+$/.test(selectedPort) ||
      Number(selectedPort) > 65535
    )) {
      total.textContent = "宛先ポートは0～65535で指定してください";
      return;
    }

    const byGroup = new Map();
    const byDay = new Map();
    let packets = 0;

    for (const r of rows) {
      if (start.value && r.day_utc < start.value) continue;
      if (end.value && r.day_utc > end.value) continue;
      if (country.value === "__unknown__") {
        if (r.country_code !== null) continue;
      } else if (country.value &&
                 r.country_code !== country.value) continue;
      if (proto.value && r.protocol !== proto.value) continue;
      if (selectedPort !== "" &&
          r.destination_port !== Number(selectedPort)) continue;

      const n = r.packet_count;
      packets += n;

      const key = JSON.stringify([
        r.country_code, r.protocol, r.destination_port
      ]);

      const old = byGroup.get(key) || 0;
      byGroup.set(key, old + n);
      byDay.set(
        r.day_utc, (byDay.get(r.day_utc) || 0) + n
      );
    }

    total.textContent =
      "条件に一致した観測数：" + fmt(packets) + " パケット";

    const sorted = [...byGroup.entries()]
      .map(([key, count]) => ({
        fields: JSON.parse(key), count
      }))
      .sort((a,b) => b.count - a.count);

    const frag = document.createDocumentFragment();
    for (const item of sorted.slice(0, 200)) {
      const [cc, protocol, dport] = item.fields;
      appendRow(frag, [
        countryName(cc),
        protocol === "TCP_SYN" ? "TCP SYN" : "UDP",
        dport,
        fmt(item.count)
      ]);
    }
    ranking.appendChild(frag);

    if (sorted.length > 200) {
      truncation.textContent =
        "上位200組を表示（該当：" + fmt(sorted.length) + "組）";
    }

    const dayFrag = document.createDocumentFragment();
    for (const [day, count] of [...byDay.entries()]
      .sort((a,b) => a[0].localeCompare(b[0]))) {
      appendRow(dayFrag, [day, fmt(count)]);
    }
    daily.appendChild(dayFrag);
  }

  function activate(data) {
    if (!Array.isArray(data.gap_events) ||
        !("gap_unresolved_since_utc" in data)) {
      throw Error("MISSING_GAP_METADATA");
    }

    if (data.gap_unresolved_since_utc) {
      gapStatus.hidden = false;
      gapStatus.textContent =
        "欠測警告：収集停止を " +
        data.gap_unresolved_since_utc +
        " に記録しました　復旧時刻が未確認のため、" +
        "それ以降の観測完全性は未検証です";
    }

    const supported = [
      "awaiting_production_activation",
      "no_eligible_completed_day",
      "staging_ready"
    ];

    if (data.schema !== "honeypot-porttime-public-v1" ||
        !supported.includes(data.status) ||
        !Array.isArray(data.groups)) {
      throw Error("UNEXPECTED_PORTTIME_SCHEMA");
    }

    if (data.status === "awaiting_production_activation") {
      status.textContent =
        "観測準備中：常時収集の試験・有効化が未完了です";
      return;
    }
    if (data.status === "no_eligible_completed_day") {
      status.textContent =
        "公開可能な日次データはまだありません（24時間遅延）";
      return;
    }

    rows = data.groups;
    if (!rows.length) {
      status.textContent = "公開可能なデータを確認できません";
      return;
    }

    const days = rows.map(r => r.day_utc).sort();
    minDay = days[0];
    maxDay = days[days.length - 1];
    start.value = minDay;
    end.value = maxDay;
    start.min = end.min = minDay;
    start.max = end.max = maxDay;

    const countries = [...new Set(
      rows.map(r => r.country_code)
        .filter(v => v !== null)
    )].sort();

    for (const code of countries) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = countryName(code);
      country.appendChild(option);
    }

    if (rows.some(r => r.country_code === null)) {
      const option = document.createElement("option");
      option.value = "__unknown__";
      option.textContent = "不明";
      country.appendChild(option);
    }

    status.textContent =
      "観測データを表示中（UTC日単位・24時間以上の遅延）";
    filters.hidden = false;
    results.hidden = false;
    render();
  }

  for (const control of [start,end,country,proto,port]) {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  }

  reset.addEventListener("click", () => {
    start.value = minDay;
    end.value = maxDay;
    country.value = "";
    proto.value = "";
    port.value = "";
    render();
  });

  fetch("data/port-time-daily.json", {cache:"no-store"})
    .then(response => {
      if (!response.ok) throw Error("HTTP_" + response.status);
      return response.json();
    })
    .then(activate)
    .catch(() => {
      filters.hidden = true;
      results.hidden = true;
      status.textContent =
        "観測データを読み込めません（欠測や攻撃0件とは異なります）";
    });
})();
