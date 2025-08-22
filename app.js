/* =========================
   MONTREAL DUTY FREE — Cash Counter
   - Diff = Counted - Reported (fixed)
   - Share to SharePoint (MSAL + Graph) with feature flag
   ========================= */

/* ===== Helpers ===== */
function fmt(n){ return (Number(n||0)).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
function el(id){ return document.getElementById(id); }
function setText(id, text){ const x = el(id); if(x) x.textContent = text; }
function setHTML(id, html){ const x = el(id); if(x) x.innerHTML = html; }
function announce(msg){ const s = el('statusLive'); if(s){ s.textContent=''; setTimeout(()=>s.textContent=msg, 10); }}

// Keyboard flow helpers
function getFocusable(){
  return Array.from(document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter(el=>!el.hasAttribute('disabled') && el.offsetParent !== null);
}
function focusNext(prev=false){
  const f = getFocusable(); const i = f.indexOf(document.activeElement);
  const n = prev ? (i>0?i-1:i) : (i>=0 && i<f.length-1 ? i+1 : i);
  if (f[n]) f[n].focus();
}

/* ===== SharePoint: Open folder per store (existing behavior) ===== */
const SP_SITE_URL = "https://aerriantai43372.sharepoint.com/sites/CashCountingReports";
const SP_LIBRARY_NAME = "Cash Counting Reports"; // library display name
const STORE_TO_FOLDER = { International:"International", Transborder:"Transborder", Jetty:"Jetty", Value:"Value" };
function openSPForStore(){
  const store = el('store')?.value;
  const folder = STORE_TO_FOLDER[store] || "";
  const url = folder
    ? `${SP_SITE_URL}/${encodeURIComponent(SP_LIBRARY_NAME)}/${encodeURIComponent(folder)}`
    : `${SP_SITE_URL}/${encodeURIComponent(SP_LIBRARY_NAME)}`;
  window.open(url, '_blank', 'noopener');
}

/* ===== i18n (shortened for brevity) ===== */
/* ===== i18n (EN + FR) ===== */
const I18N = {
  en: {
    sessionInfo: "Session Info",
    headCashier: "Head Cashier/Manager Name",
    date: "Date",
    store: "Store",
    cashiers: "Cashiers (who used the cash)",
    cashNumber: "Cash Number",
    denominations: "Denominations",
    totals: "Totals",
    btnPrint: "Print",
    btnDeposit: "+ Deposit",
    btnReset: "Reset",
    btnCSV: "Export CSV",
    btnPDF: "Export PDF",
    statusCSV: "CSV exported.",
    statusPDF: "PDF exported.",
    helpTitle: "How to use this app",
    helpOk: "Got it",
    helpListHtml: `
      <li><strong>Session Info:</strong> Fill your name, date, store, cashiers, and cash number.</li>
      <li><strong>Currencies:</strong> Toggle CAD / USD / EUR you will count.</li>
      <li><strong>Count:</strong> Enter quantities for each denomination. Totals update automatically.</li>
      <li><strong>Reported totals:</strong> Enter Z-report values per currency.</li>
      <li><strong>Review variance:</strong> Check differences (<strong>counted − reported</strong>).</li>
      <li><strong>Deposits:</strong> Use “+ Deposit” to record drops. You can edit/delete them later.</li>
      <li><strong>Export:</strong> Use “Export CSV” or “Export PDF”.</li>
      <li><strong>SharePoint:</strong> Click “Share to SharePoint” to save into /Store/YYYY-MM-DD/ (when enabled).</li>
    `,
    depTitle: "Add Deposit",
    depCAD: "CAD amount",
    depUSD: "USD amount",
    depEUR: "EUR amount",
    depNote: "Optional note (e.g., Mid-day drop, bag #)",
    depSave: "Save",
    invalidAmount: "Invalid amount",
    depositAdded: "Deposit added.",
    depositUpdated: "Deposit updated.",
    confirmDelete: "Delete this deposit?",
    errName: "Please enter your name.",
    errDateFuture: "Date cannot be in the future.",
    errQtyRange: "Quantity must be between 0 and 10,000."
  },
  fr: {
    sessionInfo: "Infos de session",
    headCashier: "Nom du chef caissier/gestionnaire",
    date: "Date",
    store: "Magasin",
    cashiers: "Caissiers (ayant utilisé la caisse)",
    cashNumber: "Numéro de caisse",
    denominations: "Dénominations",
    totals: "Totaux",
    btnPrint: "Imprimer",
    btnDeposit: "+ Dépôt",
    btnReset: "Réinitialiser",
    btnCSV: "Exporter CSV",
    btnPDF: "Exporter PDF",
    statusCSV: "CSV exporté.",
    statusPDF: "PDF exporté.",
    helpTitle: "Comment utiliser l’application",
    helpOk: "Compris",
    helpListHtml: `
      <li><strong>Infos de session :</strong> Indiquez votre nom, la date, le magasin, les caissiers et le numéro de caisse.</li>
      <li><strong>Devises :</strong> Activez CAD / USD / EUR à compter.</li>
      <li><strong>Comptage :</strong> Entrez les quantités par dénomination. Les totaux se mettent à jour automatiquement.</li>
      <li><strong>Déclaré :</strong> Saisissez les montants du rapport Z par devise.</li>
      <li><strong>Écarts :</strong> Vérifiez les différences (<strong>compté − déclaré</strong>).</li>
      <li><strong>Dépôts :</strong> Utilisez « + Dépôt » pour enregistrer des dépôts. Vous pouvez les modifier/supprimer.</li>
      <li><strong>Export :</strong> Utilisez « Exporter CSV » ou « Exporter PDF ».</li>
      <li><strong>SharePoint :</strong> Cliquez « Partager vers SharePoint » pour enregistrer dans /Magasin/AAAA-MM-JJ/ (si activé).</li>
    `,
    depTitle: "Ajouter un dépôt",
    depCAD: "Montant CAD",
    depUSD: "Montant USD",
    depEUR: "Montant EUR",
    depNote: "Note facultative (ex. dépôt midi, sac #)",
    depSave: "Enregistrer",
    invalidAmount: "Montant invalide",
    depositAdded: "Dépôt ajouté.",
    depositUpdated: "Dépôt mis à jour.",
    confirmDelete: "Supprimer ce dépôt ?",
    errName: "Veuillez entrer votre nom.",
    errDateFuture: "La date ne peut pas être dans le futur.",
    errQtyRange: "La quantité doit être entre 0 et 10 000."
  }
};
let currentLang = "en";

/* ===== Language ===== */
function applyLanguage(lang){
  currentLang = lang;
  // Merge: fallback to EN for any missing keys
  const t = Object.assign({}, I18N.en, I18N[lang] || {});

  setButtonText('printBtn', t.btnPrint);
  setButtonText('depositBtn', t.btnDeposit);
  setButtonText('resetBtn', t.btnReset);
  setButtonText('exportCsvBtn', t.btnCSV);
  setButtonText('exportPdfBtn', t.btnPDF);
  setButtonText('langToggle', lang === 'en' ? 'FR' : 'EN');

  setLabelForInput('cashierName', t.headCashier);
  setLabelForInput('countDate', t.date);
  setLabelForInput('store', t.store);
  setLabelForInput('cashiersList', t.cashiers);
  setLabelForInput('cashNumber', t.cashNumber);

  document.querySelectorAll('main .card h2').forEach(h=>{
    const text = h.textContent.trim().toLowerCase();
    if(text.includes('session info') || text.includes('infos de session')) h.textContent = t.sessionInfo;
    else if(text.includes('denominations') || text.includes('dénominations')) h.textContent = t.denominations;
    else if(text.includes('totals') || text.includes('totaux')) h.textContent = t.totals;
    else if(text.includes('deposits') || text.includes('dépôts')) h.textContent = (lang==='en' ? 'Deposits' : 'Dépôts');
  });

  setText('helpTitle', t.helpTitle || I18N.en.helpTitle);
  setHTML('helpList', t.helpListHtml || I18N.en.helpListHtml);
  setButtonText('helpOk', t.helpOk || I18N.en.helpOk);

  validateForm();
}


/* ===== Per-store variance thresholds ===== */
const STORE_TOLERANCE = { International:2, Transborder:2, Jetty:1, Value:1 };

/* ===== Data State ===== */
const PRESETS = { CAD:[100,50,20,10,5], USD:[100,50,20,10,5,1], EUR:[500,200,100,50,20,10,5] };

const state = {
  cashNumber: "",
  currencies: {
    CAD: {enabled:true,  rows: PRESETS.CAD.map(v=>({label:`$${v}`, value:v, qty:0, total:0}))},
    USD: {enabled:false, rows: PRESETS.USD.map(v=>({label:`$${v}`, value:v, qty:0, total:0}))},
    EUR: {enabled:false, rows: PRESETS.EUR.map(v=>({label:`€${v}`, value:v, qty:0, total:0}))},
  },
  denomTotals: { CAD:0, USD:0, EUR:0 },
  depositTotals: { CAD:0, USD:0, EUR:0 },
  lostChange: { CAD: 0 },
  deposits: [], // {currency, amount, note, time}
  reportedByCurrency: { CAD:0, USD:0, EUR:0 },
  diffsByCurrency:    { CAD:0, USD:0, EUR:0 },
  cardDifference: 0,
  countedTotal: 0,
  reconciledDifference: 0
};

/* =========================
   MSAL + Graph: placeholders + feature flag
   ========================= */

/* 1) Flip this to true AFTER IT gives you the IDs and adds your URL as SPA Redirect URI */
const SHAREPOINT_ENABLED = true;

/* 2) Paste the two IDs from IT here */
const MSAL_CLIENT_ID  = "PASTE_APP_CLIENT_ID";
const MSAL_TENANT_ID  = "PASTE_DIRECTORY_TENANT_ID";

/* 3) Target the SharePoint site/library
   - Recommended: keep discovery ON (needs Sites.Read.All). If IT gives you driveId, set DRIVE_ID and we'll skip discovery.
*/
const SP_HOSTNAME = "aerriantai43372.sharepoint.com";
const SP_SITE_PATH = "/sites/CashCountingReports";
const TARGET_LIBRARY_NAME = "Cash Counting Reports";

// If IT gives you these, fill them to skip discovery and you can remove Sites.Read.All from scopes:
const SITE_ID  = "";  // optional
const DRIVE_ID = "";  // optional

/* 4) Scopes: If you use discovery, include "Sites.Read.All". If you hardcode DRIVE_ID, you can omit it. */
const GRAPH_SCOPES = [
  "User.Read", "openid", "profile", "email", "offline_access",
  "Files.ReadWrite.All",
  "Sites.Read.All" // remove if DRIVE_ID is provided and you skip discovery
];

/* 5) MSAL initialization (safe even if feature is disabled) */
let msalInstance = null;
if (window.msal && SHAREPOINT_ENABLED) {
  msalInstance = new msal.PublicClientApplication({
    auth: {
      clientId: MSAL_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${MSAL_TENANT_ID}`,
      redirectUri: window.location.origin + "/" // make sure this URL is in App Registration → SPA Redirect URIs
    },
    cache: { cacheLocation: "sessionStorage" }
  });
}

async function getGraphToken() {
  if (!msalInstance) throw new Error("SharePoint is not enabled yet.");
  const accounts = msalInstance.getAllAccounts();
  const account = accounts[0] || (await msalInstance.loginPopup({ scopes: GRAPH_SCOPES })).account;
  try {
    const result = await msalInstance.acquireTokenSilent({ account, scopes: GRAPH_SCOPES });
    return result.accessToken;
  } catch {
    const result = await msalInstance.acquireTokenPopup({ account, scopes: GRAPH_SCOPES });
    return result.accessToken;
  }
}

async function graphFetch(path, init={}) {
  const token = await getGraphToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...init,
    headers: { "Authorization": `Bearer ${token}`, ...(init.headers || {}) }
  });
  if (!res.ok) {
    const text = await res.text().catch(()=> "");
    throw new Error(`Graph ${init.method||"GET"} ${path} failed: ${res.status} ${text}`);
  }
  return res;
}

async function getDriveId() {
  if (DRIVE_ID) return DRIVE_ID;
  if (!SITE_ID) {
    // lookup site by path
    const siteRes = await graphFetch(`/sites/${SP_HOSTNAME}:/sites${SP_SITE_PATH}`);
    const site = await siteRes.json();
    return (await pickDriveId(site.id));
  } else {
    return (await pickDriveId(SITE_ID));
  }
}
async function pickDriveId(siteId){
  const drivesRes = await graphFetch(`/sites/${siteId}/drives`);
  const drives = (await drivesRes.json()).value || [];
  const drive = drives.find(d => d.name === TARGET_LIBRARY_NAME) || drives[0];
  if (!drive) throw new Error("Target library (drive) not found.");
  return drive.id;
}

async function ensureFolderByPath(driveId, pathParts) {
  // pathParts e.g. ["International", "2025-08-21"]
  let parent = "root";
  for (const segment of pathParts) {
    // GET the child by path
    const get = await graphFetch(`/drives/${driveId}/${parent}:/${encodeURIComponent(segment)}`, { method: "GET" }).catch(()=> null);
    if (get) {
      const item = await get.json();
      parent = `items/${item.id}`;
      continue;
    }
    // CREATE if missing
    const createRes = await graphFetch(`/drives/${driveId}/${parent}/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: segment, folder: {}, "@microsoft.graph.conflictBehavior": "replace" })
    });
    const created = await createRes.json();
    parent = `items/${created.id}`;
  }
  return parent.replace("items/","");
}

async function uploadCSVToFolder(driveId, folderItemId, filename, csvString) {
  const contentPath = `/drives/${driveId}/items/${folderItemId}:/${encodeURIComponent(filename)}:/content?@microsoft.graph.conflictBehavior=rename`;
  await graphFetch(contentPath, {
    method: "PUT",
    headers: { "Content-Type": "text/csv" },
    body: new Blob([csvString], { type: "text/csv;charset=utf-8;" })
  });
}

/* ===== UI: Denomination Sections ===== */
function denomSection(currency){
  const section = document.createElement('div');
  section.className = 'denom-section';
  const title = document.createElement('div');
  title.className = 'denom-title';
  title.innerHTML = `<h3>${currency}</h3>`;
  section.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'denom-grid';
  ['Denomination','Qty','Value','Line Total'].forEach(h=>{
    const elh = document.createElement('div');
    elh.className = 'head';
    elh.textContent = h;
    grid.appendChild(elh);
  });

  state.currencies[currency].rows.forEach(row=>{
    // Denomination (READ-ONLY)
    const labelCell = document.createElement('div');
    labelCell.className = 'cell';
    const labelInput = document.createElement('input');
    labelInput.value = row.label;
    labelInput.readOnly = true;
    labelInput.tabIndex = -1;
    labelCell.appendChild(labelInput);

    // Qty
    const qtyCell = document.createElement('div');
    qtyCell.className = 'cell';
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number'; qtyInput.min='0'; qtyInput.step='1'; qtyInput.inputMode='numeric';
    qtyInput.value = row.qty;
    qtyInput.addEventListener('keydown', e=>{ if (['e','E','+','-','.'].includes(e.key)) e.preventDefault(); });
    qtyInput.addEventListener('wheel', e=>{ e.preventDefault(); e.target.blur(); }, {passive:false});
    qtyInput.addEventListener('input', e=>{
      e.target.value = e.target.value.replace(/[^\d]/g,'');
      let v = Number(e.target.value||0);
      if (v < 0) v = 0;
      if (v > 10000) v = 10000;
      e.target.value = String(v);
      row.qty = v;
      row.total = row.qty * Number(row.value||0);
      calcTotals(); colorizeDiffs(); validateForm(); lineTotal.textContent = fmt(row.total);
    });
    qtyCell.appendChild(qtyInput);

    // Value (READ-ONLY)
    const valueCell = document.createElement('div');
    valueCell.className = 'cell';
    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.value = row.value;
    valueInput.readOnly = true;
    valueInput.tabIndex = -1;
    valueCell.appendChild(valueInput);

    // Line total (read-only display)
    const totalCell = document.createElement('div');
    totalCell.className = 'cell';
    const lineTotal = document.createElement('div');
    lineTotal.className = 'readonly';
    lineTotal.textContent = fmt(row.total);
    totalCell.appendChild(lineTotal);

    grid.appendChild(labelCell);
    grid.appendChild(qtyCell);
    grid.appendChild(valueCell);
    grid.appendChild(totalCell);
  });

  section.appendChild(grid);
  return section;
}

function renderDenoms(){
  const wrap = el('denomSections');
  if(!wrap) return;
  wrap.innerHTML = '';
  Object.keys(state.currencies).forEach(cur=>{
    if(state.currencies[cur].enabled){
      wrap.appendChild(denomSection(cur));
    }
  });

  // Sequential tabindex for Qty fields
  let idx = 100;
  wrap.querySelectorAll('.denom-section .cell input[type="number"]:not([readonly])').forEach(inp=>{
    inp.tabIndex = idx++;
  });
}

/* ===== Calculations & variance coloring ===== */
function calcTotals(){
  const sumDenoms = curObj => curObj.rows.reduce((s,r)=> s + (Number(r.qty||0) * Number(r.value||0)), 0);
  state.denomTotals.CAD = state.currencies.CAD.enabled ? sumDenoms(state.currencies.CAD) : 0;
  state.denomTotals.USD = state.currencies.USD.enabled ? sumDenoms(state.currencies.USD) : 0;
  state.denomTotals.EUR = state.currencies.EUR.enabled ? sumDenoms(state.currencies.EUR) : 0;

  // Deposit totals
  state.depositTotals = { CAD:0, USD:0, EUR:0 };
  state.deposits.forEach(d=>{
    if(d.currency && state.depositTotals[d.currency] != null){
      state.depositTotals[d.currency] += Number(d.amount||0);
    }
  });

  // Counted per currency = denoms + deposits + lost change (CAD)
  const countedByCur = {
    CAD: state.denomTotals.CAD + state.depositTotals.CAD + (state.lostChange.CAD || 0),
    USD: state.denomTotals.USD + state.depositTotals.USD,
    EUR: state.denomTotals.EUR + state.depositTotals.EUR
  };

  // Diff = Counted - Reported (flipped as requested)
  ['CAD','USD','EUR'].forEach(cur=>{
    state.diffsByCurrency[cur] = countedByCur[cur] - Number(state.reportedByCurrency[cur]||0);
  });

  state.countedTotal = countedByCur.CAD + countedByCur.USD + countedByCur.EUR;
  state.reconciledDifference = state.diffsByCurrency.CAD + state.diffsByCurrency.USD + state.diffsByCurrency.EUR;

  // Update UI
  setText('cadTotal', fmt(countedByCur.CAD));
  setText('usdTotal', fmt(countedByCur.USD));
  setText('eurTotal', fmt(countedByCur.EUR));
  setText('cadDiff', fmt(state.diffsByCurrency.CAD));
  setText('usdDiff', fmt(state.diffsByCurrency.USD));
  setText('eurDiff', fmt(state.diffsByCurrency.EUR));
  setText('recDiff', fmt(state.reconciledDifference));

  // Sticky summary
  setText('summaryCounted', fmt(state.countedTotal));
  setText('summaryRecDiff', fmt(state.reconciledDifference));
}

function colorize(elm, val, tol){
  elm.classList.remove('ok','warn','err');
  if (Number(val) === 0) elm.classList.add('ok');
  else if (Math.abs(Number(val)) <= tol) elm.classList.add('warn');
  else elm.classList.add('err');
}
function colorizeDiffs(){
  const store = el('store')?.value || 'International';
  const tol = STORE_TOLERANCE[store] ?? 2;
  colorize(el('cadDiff'), state.diffsByCurrency.CAD, tol);
  colorize(el('usdDiff'), state.diffsByCurrency.USD, tol);
  colorize(el('eurDiff'), state.diffsByCurrency.EUR, tol);
  colorize(el('recDiff'), state.reconciledDifference, tol);
}

/* ===== Deposits (list + edit/delete) ===== */
let lastFocusHelp = null, lastFocusDeposit = null;
let editingIndex = null; // null = creating new

function openDeposit(editIdx=null){
  const m = el('depositModal'); if(!m) return;
  editingIndex = editIdx;
  ['depCAD','depUSD','depEUR','depNote'].forEach(id=>{ const x = el(id); if(x) x.value=''; });
  if (editIdx !== null && state.deposits[editIdx]){
    const d = state.deposits[editIdx];
    el('depNote').value = d.note || '';
    if (d.currency === 'CAD') el('depCAD').value = d.amount;
    if (d.currency === 'USD') el('depUSD').value = d.amount;
    if (d.currency === 'EUR') el('depEUR').value = d.amount;
    setText('depositTitle', I18N[currentLang].depTitle.replace(/Add/i,'Edit').replace(/Ajouter/i,'Modifier'));
  } else {
    setText('depositTitle', I18N[currentLang].depTitle);
  }
  lastFocusDeposit = document.activeElement;
  m.setAttribute('aria-hidden','false');
  m.querySelector('.modal-panel')?.focus();
  document.body.style.overflow = 'hidden';
}
function closeDeposit(){
  const m = el('depositModal'); if(!m) return;
  m.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  if (lastFocusDeposit) lastFocusDeposit.focus();
  editingIndex = null;
}
function saveDeposit(){
  const t = I18N[currentLang];
  const entries = [
    {currency:'CAD', val: Number(el('depCAD').value || 0)},
    {currency:'USD', val: Number(el('depUSD').value || 0)},
    {currency:'EUR', val: Number(el('depEUR').value || 0)}
  ];
  const note = el('depNote').value || '';
  for(const e of entries){
    if (isNaN(e.val) || e.val < 0) { alert(t.invalidAmount); return; }
  }
  let any = false;
  if (editingIndex !== null){
    const filled = entries.find(e=> e.val !== 0);
    if (!filled){ state.deposits.splice(editingIndex, 1); }
    else {
      const d = state.deposits[editingIndex];
      d.currency = filled.currency; d.amount = filled.val; d.note = note; d.time = new Date().toISOString();
    }
    announce(t.depositUpdated);
    any = true;
  } else {
    entries.forEach(e=>{
      if (e.val !== 0){
        state.deposits.push({ currency:e.currency, amount:e.val, note, time:new Date().toISOString() });
        any = true;
      }
    });
    if (any) announce(t.depositAdded);
  }
  calcTotals(); colorizeDiffs(); renderDeposits(); closeDeposit();
}
function renderDeposits(){
  const wrap = el('depositsList'); if(!wrap) return;
  wrap.innerHTML = '';
  if (state.deposits.length === 0){ wrap.classList.add('empty'); return; }
  wrap.classList.remove('empty');
  state.deposits.forEach((d, idx)=>{
    const item = document.createElement('div'); item.className = 'deposit-item';
    const meta = document.createElement('div'); meta.className = 'deposit-meta';
    meta.innerHTML = `<strong>${d.currency}</strong> ${fmt(d.amount)} — ${d.note ? d.note+' — ' : ''}<span class="muted">${new Date(d.time).toLocaleString()}</span>`;
    const actions = document.createElement('div'); actions.className = 'deposit-actions';
    const menuBtn = document.createElement('button'); menuBtn.className='menu-btn'; menuBtn.setAttribute('aria-haspopup','true'); menuBtn.setAttribute('aria-expanded','false'); menuBtn.textContent='⋯';
    const menu = document.createElement('div'); menu.className = 'menu';
    const bEdit = document.createElement('button'); bEdit.textContent = currentLang==='en' ? 'Edit' : 'Modifier'; bEdit.addEventListener('click', ()=>{ menu.classList.remove('open'); openDeposit(idx); });
    const bDel = document.createElement('button'); bDel.textContent = currentLang==='en' ? 'Delete' : 'Supprimer'; bDel.addEventListener('click', ()=>{ menu.classList.remove('open'); if (confirm(I18N[currentLang].confirmDelete)){ state.deposits.splice(idx,1); calcTotals(); colorizeDiffs(); renderDeposits(); } });
    menu.appendChild(bEdit); menu.appendChild(bDel);
    menuBtn.addEventListener('click', (e)=>{ e.stopPropagation(); const open = menu.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', open ? 'true':'false'); });
    actions.appendChild(menuBtn); actions.appendChild(menu);
    item.appendChild(meta); item.appendChild(actions); wrap.appendChild(item);
  });
}

/* ===== Help Modal ===== */
function openHelp(){ const m = el('helpModal'); if(!m) return; lastFocusHelp = document.activeElement; m.setAttribute('aria-hidden','false'); m.querySelector('.modal-panel')?.focus(); document.body.style.overflow='hidden'; }
function closeHelp(){ const m = el('helpModal'); if(!m) return; m.setAttribute('aria-hidden','true'); document.body.style.overflow=''; if (lastFocusHelp) lastFocusHelp.focus(); }

/* ===== Validation ===== */
function setError(id, msg){
  const err = el('err-'+id); const fld = el(id);
  if (!err || !fld) return;
  if (msg){ err.textContent = msg; err.removeAttribute('aria-hidden'); fld.setAttribute('aria-invalid','true'); }
  else { err.textContent = ''; err.setAttribute('aria-hidden','true'); fld.removeAttribute('aria-invalid'); }
}
function validateForm(){
  const t = I18N[currentLang];
  let ok = true;
  const name = el('cashierName')?.value.trim();
  if (!name){ setError('cashierName', t.errName); ok = false; } else setError('cashierName','');
  const dateVal = el('countDate')?.value;
  if (dateVal){
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(dateVal + 'T00:00:00');
    if (d > today){ setError('countDate', t.errDateFuture); ok = false; }
    else setError('countDate','');
  } else { setError('countDate', t.errDateFuture); ok = false; }
  let qtyBad = false;
  document.querySelectorAll('.denom-section .cell input[type="number"]:not([readonly])').forEach(inp=>{
    const v = Number(inp.value||0); if (v < 0 || v > 10000) qtyBad = true;
  });
  if (qtyBad){ announce(t.errQtyRange); }
  el('exportCsvBtn')?.toggleAttribute('disabled', !ok);
  el('exportPdfBtn')?.toggleAttribute('disabled', !ok);
  return ok;
}

/* ===== Reset ===== */
function resetAll(){
  ['cashierName','cashiersList','cashNumber','lostChangeCAD'].forEach(id=>{ const x = el(id); if(x) x.value=''; });
  const d = new Date(); const dateEl = el('countDate'); if(dateEl) dateEl.valueAsDate = d;
  const st = el('store'); if(st) st.selectedIndex = 0;
  Object.keys(state.currencies).forEach(c=>{ state.currencies[c].rows.forEach(r=>{ r.qty=0; r.total=0; }); });
  state.deposits = []; state.depositTotals = { CAD:0, USD:0, EUR:0 };
  ['CAD','USD','EUR'].forEach(cur=>{ state.reportedByCurrency[cur]=0; const input = el(`reported${cur}`); if(input) input.value=''; });
  state.lostChange.CAD = 0;
  state.cardDifference = 0; const cardEl = el('cardDifference'); if(cardEl) cardEl.value='';
  state.cashNumber = "";
  renderDenoms(); renderDeposits(); calcTotals(); colorizeDiffs(); validateForm();
}

/* ===== Filename & Exports ===== */
function filenameBase(){
  const name = (el('cashierName')?.value || 'Unknown').replace(/\s+/g,'_');
  const date = el('countDate')?.value || new Date().toISOString().slice(0,10);
  const store = (el('store')?.value || '').replace(/\s+/g,'_');
  const cashN = (state.cashNumber||'').replace(/\s+/g,'_');
  const cashSuffix = cashN ? `_Cash${cashN}` : '';
  return `MONTREAL_DUTY_FREE_${store}_${date}_${name}${cashSuffix}`;
}

function buildCSVString(){
  const rows = [];
  rows.push(['Company','MONTREAL DUTY FREE']);
  rows.push(['Sous-name','AER RIANTA ITL']);
  rows.push(['Store', el('store').value]);
  rows.push(['Head Cashier/Manager Name', el('cashierName').value]);
  rows.push(['Date', el('countDate').value]);
  rows.push(['Cashiers', el('cashiersList').value]);
  rows.push(['Cash Number', state.cashNumber]);
  rows.push([]);

  Object.entries(state.currencies).forEach(([cur, data])=>{
    if(!data.enabled) return;
    rows.push([cur]);
    rows.push(['Denomination','Qty','Value','Line Total']);
    data.rows.forEach(r=>{
      if((r.qty||0)===0 && (Number(r.value||0)===0)) return;
      rows.push([r.label, r.qty, r.value, (r.qty*r.value).toFixed(2)]);
    });
    rows.push([]);
  });

  rows.push(['Deposits']);
  rows.push(['Currency','Amount','Note','Time (ISO)']);
  if(state.deposits.length===0){ rows.push(['','','','']); }
  else { state.deposits.forEach(d=> rows.push([d.currency, Number(d.amount).toFixed(2), d.note||'', d.time||''])); }
  rows.push(['Deposit Totals by Currency']);
  rows.push(['CAD', state.depositTotals.CAD.toFixed(2)]);
  rows.push(['USD', state.depositTotals.USD.toFixed(2)]);
  rows.push(['EUR', state.depositTotals.EUR.toFixed(2)]);
  rows.push([]);

  rows.push(['Lost Change (CAD < $5)', (state.lostChange.CAD || 0).toFixed(2)]);
  rows.push([]);

  ['CAD','USD','EUR'].forEach(cur=>{
    const extra = (cur==='CAD') ? (state.lostChange.CAD || 0) : 0;
    const counted = (state.denomTotals[cur] + state.depositTotals[cur] + extra).toFixed(2);
    rows.push([`${cur} Counted`, counted]);
    rows.push([`${cur} Reported (Z report)`, Number(state.reportedByCurrency[cur]||0).toFixed(2)]);
    rows.push([`${cur} Difference (Counted - Reported)`, state.diffsByCurrency[cur].toFixed(2)]);
    rows.push([]);
  });

  const denomAll = state.denomTotals.CAD + state.denomTotals.USD + state.denomTotals.EUR;
  const depositsAll = state.depositTotals.CAD + state.depositTotals.USD + state.depositTotals.EUR;

  rows.push(['Card Difference (info only)', Number(state.cardDifference||0).toFixed(2)]);
  rows.push([]);
  rows.push(['Denominations Total (All Currencies)', denomAll.toFixed(2)]);
  rows.push(['Deposits Total (All Currencies)', depositsAll.toFixed(2)]);
  rows.push(['Counted Total (Denoms + Deposits + CAD Lost Change)', state.countedTotal.toFixed(2)]);
  rows.push(['Reconciled Difference (CAD+USD+EUR)', state.reconciledDifference.toFixed(2)]);

  return rows.map(r=> r.map(v=> `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
}

function exportCSV(){
  const csv = buildCSVString();
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filenameBase() + '.csv';
  link.click();
}

/* ===== PDF Export (as before; lazy-load jsPDF) ===== */
async function exportPDF(){
  if(!window.jspdf){
    await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(18);
  doc.text("MONTREAL DUTY FREE - Cash Count Report", 10, y); y += 10;

  doc.setFontSize(12);
  doc.text(`Sous-name: AER RIANTA ITL`, 10, y); y += 6;
  doc.text(`Store: ${el('store').value}`, 10, y); y += 6;
  doc.text(`Head Cashier/Manager Name: ${el('cashierName').value}`, 10, y); y += 6;
  doc.text(`Date: ${el('countDate').value}`, 10, y); y += 6;
  doc.text(`Cashiers: ${el('cashiersList').value}`, 10, y); y += 6;
  doc.text(`Cash Number: ${state.cashNumber}`, 10, y); y += 10;

  Object.entries(state.currencies).forEach(([cur, data])=>{
    if(!data.enabled) return;
    doc.setFontSize(14);
    doc.text(`${cur} Denominations`, 10, y); y += 6;
    doc.setFontSize(10);
    data.rows.forEach(r=>{
      if((r.qty||0)===0 && (Number(r.value||0)===0)) return;
      doc.text(`${r.label} x ${r.qty} @ ${fmt(r.value)} = ${fmt(r.qty*r.value)}`, 12, y);
      y += 5; if(y > 280){ doc.addPage(); y = 10; }
    });
    y += 4; if(y > 280){ doc.addPage(); y = 10; }
  });

  doc.setFontSize(14);
  doc.text("Deposits", 10, y); y += 6;
  doc.setFontSize(10);
  if(state.deposits.length===0){ doc.text("No deposits recorded", 12, y); y += 6; }
  else {
    state.deposits.forEach(d=>{
      doc.text(`${d.currency} ${fmt(d.amount)} - ${d.note||''} (${d.time})`, 12, y);
      y += 5; if(y>280){ doc.addPage(); y=10; }
    });
  }
  y += 6;

  doc.setFontSize(12);
  doc.text(`CAD Lost Change (< $5): ${fmt(state.lostChange.CAD || 0)}`, 10, y); y += 8;

  ['CAD','USD','EUR'].forEach(cur=>{
    const extra = cur === 'CAD' ? (state.lostChange.CAD || 0) : 0;
    const counted = state.denomTotals[cur] + state.depositTotals[cur] + extra;
    doc.text(`${cur} Counted: ${fmt(counted)}`, 10, y); y += 6;
    doc.text(`${cur} Reported (Z report): ${fmt(state.reportedByCurrency[cur]||0)}`, 10, y); y += 6;
    doc.text(`${cur} Difference (Counted - Reported): ${fmt(state.diffsByCurrency[cur])}`, 10, y); y += 8;
    if(y > 280){ doc.addPage(); y = 10; }
  });

  const denomAll = state.denomTotals.CAD + state.denomTotals.USD + state.denomTotals.EUR;
  const depositsAll = state.depositTotals.CAD + state.depositTotals.USD + state.depositTotals.EUR;

  doc.text(`Card Difference (info only): ${fmt(state.cardDifference||0)}`, 10, y); y += 8;
  doc.text(`Denominations Total (All): ${fmt(denomAll)}`, 10, y); y += 6;
  doc.text(`Deposits Total (All): ${fmt(depositsAll)}`, 10, y); y += 6;
  doc.text(`Counted Total: ${fmt(state.countedTotal)}  (includes CAD Lost Change)`, 10, y); y += 6;
  doc.text(`Reconciled Difference: ${fmt(state.reconciledDifference)}`, 10, y); y += 6;

  doc.save(filenameBase() + ".pdf");
}

/* ===== Share to SharePoint (button handler) ===== */
async function shareToSharePoint(){
  try {
    if (!SHAREPOINT_ENABLED) { alert("Share to SharePoint is not enabled yet. Please contact IT."); return; }
    if (!validateForm()) { alert("Please complete the required fields before sharing."); return; }

    const csv = buildCSVString();
    const fileName = filenameBase() + ".csv";

    const driveId = await getDriveId();

    const store = el('store')?.value || 'International';
    const dateStr = el('countDate')?.value || new Date().toISOString().slice(0,10);

    const folderId = await ensureFolderByPath(driveId, [store, dateStr]);

    await uploadCSVToFolder(driveId, folderId, fileName, csv);

    announce("Uploaded to SharePoint successfully.");
    alert("Uploaded to SharePoint successfully.");
  } catch (err) {
    console.error(err);
    alert("Share to SharePoint failed:\n" + err.message);
  }
}

/* ===== Init ===== */
function init(){
  // Year & date
  const d = new Date();
  setText('year', String(d.getFullYear()));
  const dateEl = el('countDate'); if(dateEl) dateEl.valueAsDate = d;

  // Reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('reduce-motion');
  }

  // Contrast toggle (persist)
  const savedHC = localStorage.getItem('hc') === '1';
  if (savedHC) { document.body.classList.add('hc'); el('contrastToggle')?.setAttribute('aria-pressed','true'); }
  el('contrastToggle')?.addEventListener('click', ()=>{
    const isOn = !document.body.classList.toggle('hc'); // toggle returns new state reversed
    const nowOn = document.body.classList.contains('hc');
    el('contrastToggle').setAttribute('aria-pressed', nowOn ? 'true':'false');
    localStorage.setItem('hc', nowOn ? '1' : '0');
  });

  // Currency toggles
  ['CAD','USD','EUR'].forEach(cur=>{
    const toggle = el('enable'+cur);
    if(toggle) toggle.addEventListener('change', e=>{
      state.currencies[cur].enabled = e.target.checked;
      renderDenoms(); calcTotals(); validateForm();
    });
  });

  // Reported inputs
  ['CAD','USD','EUR'].forEach(cur=>{
    const r = el(`reported${cur}`);
    if(r) r.addEventListener('input', (e)=>{
      state.reportedByCurrency[cur] = Number(e.target.value||0);
      calcTotals(); colorizeDiffs(); validateForm();
    });
  });

  // Lost Change CAD
  el('lostChangeCAD')?.addEventListener('input', e=>{
    state.lostChange.CAD = Number(e.target.value || 0);
    calcTotals(); colorizeDiffs(); validateForm();
  });

  // Misc
  el('cardDifference')?.addEventListener('input', e=>{ state.cardDifference = Number(e.target.value||0); });
  el('cashNumber')?.addEventListener('input', e=>{ state.cashNumber = e.target.value; });

  // Header & actions
  el('langToggle')?.addEventListener('click', ()=>applyLanguage(currentLang === 'en' ? 'fr' : 'en'));
  el('printBtn')?.addEventListener('click', ()=>window.print());
  el('exportCsvBtn')?.addEventListener('click', ()=>{ if(!validateForm()) return; exportCSV(); announce(I18N[currentLang].statusCSV); });
  el('exportPdfBtn')?.addEventListener('click', async ()=>{ if(!validateForm()) return; await exportPDF(); announce(I18N[currentLang].statusPDF); });
  el('resetBtn')?.addEventListener('click', ()=>{ if(confirm("Are you sure you want to reset?")) resetAll(); });

  // SharePoint: open folder (existing)
  el('openSharePointBtn')?.addEventListener('click', openSPForStore);
  el('openSharePointBtn2')?.addEventListener('click', openSPForStore);

  // Help modal
  el('helpBtn')?.addEventListener('click', openHelp);
  el('helpOk')?.addEventListener('click', closeHelp);
  el('helpClose')?.addEventListener('click', closeHelp);

  // Deposit modal
  el('depositBtn')?.addEventListener('click', ()=>openDeposit());
  el('depositSave')?.addEventListener('click', saveDeposit);
  el('depositClose')?.addEventListener('click', closeDeposit);

  // Global clicks: close modals / menus
  document.addEventListener('click', (e)=>{
    if (e.target && e.target.matches('.modal-backdrop,[data-close="true"]')) { closeHelp(); closeDeposit(); }
    if (!e.target.closest?.('.deposit-actions')) { document.querySelectorAll('.menu.open').forEach(m=>m.classList.remove('open')); }
  });

  // Keyboard
  document.addEventListener('keydown', (e)=>{
    const helpOpen = el('helpModal')?.getAttribute('aria-hidden') === 'false';
    const depOpen  = el('depositModal')?.getAttribute('aria-hidden') === 'false';
    if (e.key === 'Escape' && (helpOpen || depOpen)) { closeHelp(); closeDeposit(); }
    if (e.key === 'Enter' && !e.shiftKey) { focusNext(false); }
    if (e.key === 'Enter' && e.shiftKey)  { focusNext(true); }
  });

  // Apply language
  applyLanguage(currentLang);

  // Render & compute
  renderDenoms();
  calcTotals();
  colorizeDiffs();
  renderDeposits();
  validateForm();

  // Wire Share button + hide if disabled
  const shareBtn = el('shareToSPBtn');
  if (shareBtn){
    if (!SHAREPOINT_ENABLED) shareBtn.style.display = 'none';
    shareBtn.addEventListener('click', shareToSharePoint);
  }
}

/* ===== Language ===== */
function applyLanguage(lang){
  currentLang = lang;
  const t = I18N[lang] || I18N.en;

  setButtonText('printBtn', t.btnPrint);
  setButtonText('depositBtn', t.btnDeposit);
  setButtonText('resetBtn', t.btnReset);
  setButtonText('exportCsvBtn', t.btnCSV);
  setButtonText('exportPdfBtn', t.btnPDF);
  setButtonText('langToggle', lang === 'en' ? 'FR' : 'EN');

  setLabelForInput('cashierName', t.headCashier);
  setLabelForInput('countDate', t.date);
  setLabelForInput('store', t.store);
  setLabelForInput('cashiersList', t.cashiers);
  setLabelForInput('cashNumber', t.cashNumber);

  document.querySelectorAll('main .card h2').forEach(h=>{
    const text = h.textContent.trim().toLowerCase();
    if(text.includes('session info') || text.includes('infos de session')) h.textContent = t.sessionInfo;
    else if(text.includes('denominations') || text.includes('dénominations')) h.textContent = t.denominations;
    else if(text.includes('totals') || text.includes('totaux')) h.textContent = t.totals;
    else if(text.includes('deposits') || text.includes('dépôts')) h.textContent = lang==='en' ? 'Deposits' : 'Dépôts';
  });

  setText('helpTitle', t.helpTitle);
  setHTML('helpList', t.helpListHtml);
  setButtonText('helpOk', t.helpOk);

  validateForm();
}
function setLabelForInput(inputId, text){
  const input = el(inputId);
  if(!input) return;
  const label = input.closest(".field");
  if(!label) return;
  const span = label.querySelector("span");
  if(span) span.textContent = text;
}
function setButtonText(id, text){ const b = el(id); if(b) b.textContent = text; }

/* ===== Start ===== */
window.addEventListener('DOMContentLoaded', init);
