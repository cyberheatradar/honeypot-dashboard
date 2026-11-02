
"use strict";
const payload=JSON.parse(document.getElementById("map-data").textContent);
const countryNames={"AD": "Andorra", "AE": "United Arab Emirates", "AF": "Afghanistan", "AG": "Antigua & Barbuda", "AI": "Anguilla", "AL": "Albania", "AM": "Armenia", "AO": "Angola", "AQ": "Antarctica", "AR": "Argentina", "AS": "Samoa (American)", "AT": "Austria", "AU": "Australia", "AW": "Aruba", "AX": "\u00c5land Islands", "AZ": "Azerbaijan", "BA": "Bosnia & Herzegovina", "BB": "Barbados", "BD": "Bangladesh", "BE": "Belgium", "BF": "Burkina Faso", "BG": "Bulgaria", "BH": "Bahrain", "BI": "Burundi", "BJ": "Benin", "BL": "St Barthelemy", "BM": "Bermuda", "BN": "Brunei", "BO": "Bolivia", "BQ": "Caribbean NL", "BR": "Brazil", "BS": "Bahamas", "BT": "Bhutan", "BV": "Bouvet Island", "BW": "Botswana", "BY": "Belarus", "BZ": "Belize", "CA": "Canada", "CC": "Cocos (Keeling) Islands", "CD": "Congo (Dem. Rep.)", "CF": "Central African Rep.", "CG": "Congo (Rep.)", "CH": "Switzerland", "CI": "C\u00f4te d\u2019Ivoire", "CK": "Cook Islands", "CL": "Chile", "CM": "Cameroon", "CN": "China", "CO": "Colombia", "CR": "Costa Rica", "CU": "Cuba", "CV": "Cape Verde", "CW": "Cura\u00e7ao", "CX": "Christmas Island", "CY": "Cyprus", "CZ": "Czech Republic", "DE": "Germany", "DJ": "Djibouti", "DK": "Denmark", "DM": "Dominica", "DO": "Dominican Republic", "DZ": "Algeria", "EC": "Ecuador", "EE": "Estonia", "EG": "Egypt", "EH": "Western Sahara", "ER": "Eritrea", "ES": "Spain", "ET": "Ethiopia", "FI": "Finland", "FJ": "Fiji", "FK": "Falkland Islands", "FM": "Micronesia", "FO": "Faroe Islands", "FR": "France", "GA": "Gabon", "GB": "United Kingdom", "GD": "Grenada", "GE": "Georgia", "GF": "French Guiana", "GG": "Guernsey", "GH": "Ghana", "GI": "Gibraltar", "GL": "Greenland", "GM": "Gambia", "GN": "Guinea", "GP": "Guadeloupe", "GQ": "Equatorial Guinea", "GR": "Greece", "GS": "South Georgia & the South Sandwich Islands", "GT": "Guatemala", "GU": "Guam", "GW": "Guinea-Bissau", "GY": "Guyana", "HK": "Hong Kong", "HM": "Heard Island & McDonald Islands", "HN": "Honduras", "HR": "Croatia", "HT": "Haiti", "HU": "Hungary", "ID": "Indonesia", "IE": "Ireland", "IL": "Israel", "IM": "Isle of Man", "IN": "India", "IO": "British Indian Ocean Territory", "IQ": "Iraq", "IR": "Iran", "IS": "Iceland", "IT": "Italy", "JE": "Jersey", "JM": "Jamaica", "JO": "Jordan", "JP": "Japan", "KE": "Kenya", "KG": "Kyrgyzstan", "KH": "Cambodia", "KI": "Kiribati", "KM": "Comoros", "KN": "St Kitts & Nevis", "KP": "Korea (North)", "KR": "Korea (South)", "KW": "Kuwait", "KY": "Cayman Islands", "KZ": "Kazakhstan", "LA": "Laos", "LB": "Lebanon", "LC": "St Lucia", "LI": "Liechtenstein", "LK": "Sri Lanka", "LR": "Liberia", "LS": "Lesotho", "LT": "Lithuania", "LU": "Luxembourg", "LV": "Latvia", "LY": "Libya", "MA": "Morocco", "MC": "Monaco", "MD": "Moldova", "ME": "Montenegro", "MF": "St Martin (French)", "MG": "Madagascar", "MH": "Marshall Islands", "MK": "North Macedonia", "ML": "Mali", "MM": "Myanmar (Burma)", "MN": "Mongolia", "MO": "Macau", "MP": "Northern Mariana Islands", "MQ": "Martinique", "MR": "Mauritania", "MS": "Montserrat", "MT": "Malta", "MU": "Mauritius", "MV": "Maldives", "MW": "Malawi", "MX": "Mexico", "MY": "Malaysia", "MZ": "Mozambique", "NA": "Namibia", "NC": "New Caledonia", "NE": "Niger", "NF": "Norfolk Island", "NG": "Nigeria", "NI": "Nicaragua", "NL": "Netherlands", "NO": "Norway", "NP": "Nepal", "NR": "Nauru", "NU": "Niue", "NZ": "New Zealand", "OM": "Oman", "PA": "Panama", "PE": "Peru", "PF": "French Polynesia", "PG": "Papua New Guinea", "PH": "Philippines", "PK": "Pakistan", "PL": "Poland", "PM": "St Pierre & Miquelon", "PN": "Pitcairn", "PR": "Puerto Rico", "PS": "Palestine", "PT": "Portugal", "PW": "Palau", "PY": "Paraguay", "QA": "Qatar", "RE": "R\u00e9union", "RO": "Romania", "RS": "Serbia", "RU": "Russia", "RW": "Rwanda", "SA": "Saudi Arabia", "SB": "Solomon Islands", "SC": "Seychelles", "SD": "Sudan", "SE": "Sweden", "SG": "Singapore", "SH": "St Helena", "SI": "Slovenia", "SJ": "Svalbard & Jan Mayen", "SK": "Slovakia", "SL": "Sierra Leone", "SM": "San Marino", "SN": "Senegal", "SO": "Somalia", "SR": "Suriname", "SS": "South Sudan", "ST": "Sao Tome & Principe", "SV": "El Salvador", "SX": "St Maarten (Dutch)", "SY": "Syria", "SZ": "Eswatini (Swaziland)", "TC": "Turks & Caicos Is", "TD": "Chad", "TF": "French S. Terr.", "TG": "Togo", "TH": "Thailand", "TJ": "Tajikistan", "TK": "Tokelau", "TL": "East Timor", "TM": "Turkmenistan", "TN": "Tunisia", "TO": "Tonga", "TR": "Turkey", "TT": "Trinidad & Tobago", "TV": "Tuvalu", "TW": "Taiwan", "TZ": "Tanzania", "UA": "Ukraine", "UG": "Uganda", "UM": "US minor outlying islands", "UNKNOWN": "Unknown", "US": "United States", "UY": "Uruguay", "UZ": "Uzbekistan", "VA": "Vatican City", "VC": "St Vincent", "VE": "Venezuela", "VG": "Virgin Islands (UK)", "VI": "Virgin Islands (US)", "VN": "Vietnam", "VU": "Vanuatu", "WF": "Wallis & Futuna", "WS": "Samoa (western)", "YE": "Yemen", "YT": "Mayotte", "ZA": "South Africa", "ZM": "Zambia", "ZW": "Zimbabwe"};\nconst countryLabel=(code)=>countryNames[code]||code;\nconst rows=payload.rows;
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
