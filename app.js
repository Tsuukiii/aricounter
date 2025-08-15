// ===== Helpers =====
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

// ===== SharePoint per store =====
const SP_SITE = "https://aerriantai43372.sharepoint.com/sites/CashCountingReports";
const SP_LIBRARY = "Cash Counting Reports"; // exact library name
const STORE_TO_FOLDER = {
  International: "International",
  Transborder:   "Transborder",
  Jetty:         "Jetty",
  Value:         "Value"
};
function openSPForStore(){
  const store = el('store')?.value;
  const folder = STORE_TO_FOLDER[store];
  const url = folder
    ? `${SP_SITE}/${encodeURIComponent(SP_LIBRARY)}/${encodeURIComponent(folder)}`
    : `${SP_SITE}/${encodeURIComponent(SP_LIBRARY)}`;
  window.open(url, '_blank', 'noopener');
}

// ===== i18n =====
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
    cardDiff: "Card Difference (info only)",
    recDiff: "Reconciled Difference (CAD + USD + EUR)",
    btnPrint: "Print",
    btnDeposit: "+ Deposit",
    btnReset: "Reset",
    btnCSV: "Export CSV",
    btnPDF: "Export PDF",
    statusCSV: "CSV exported.",
    statusPDF: "PDF exported.",
    // Help modal
    helpTitle: "How to use this app",
    helpOk: "Got it",
    helpListHtml: `
      <li><strong>Session Info:</strong> Fill your name, date, store, cashiers, and cash number.</li>
      <li><strong>Currencies:</strong> Toggle CAD / USD / EUR you will count.</li>
      <li><strong>Count:</strong> Enter <em>quantities</em> for each denomination. Totals update automatically.</li>
      <li><strong>Reported totals:</strong> Enter Z-report values per currency.</li>
      <li><strong>Review variance:</strong> Check differences (reported − counted).</li>
      <li><strong>Deposits:</strong> Use “+ Deposit” to record drops. You can edit/delete them later.</li>
      <li><strong>Export:</strong> Use “Export CSV” or “Export PDF”.</li>
      <li><strong>SharePoint:</strong> Click “Open SharePoint Folder” to upload the file.</li>
      <li><strong>Tip:</strong> Use FR/EN toggle if needed. Print for paper records.</li>
    `,
    // Deposit modal
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
    // Validation
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
    cardDiff: "Écart carte (info seulement)",
    recDiff: "Écart réconcilié (CAD + USD + EUR)",
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
      <li><strong>Infos de session :</strong> Renseignez votre nom, date, magasin, caissiers et numéro de caisse.</li>
      <li><strong>Devises :</strong> Activez CAD / USD / EUR à compter.</li>
      <li><strong>Comptage :</strong> Entrez les <em>quantités</em> par dénomination. Totaux mis à jour automatiquement.</li>
      <li><strong>Déclaré :</strong> Saisissez les montants du rapport Z par devise.</li>
      <li><strong>Écarts :</strong> Vérifiez les différences (déclaré − compté).</li>
      <li><strong>Dépôts :</strong> Utilisez « + Dépôt » pour enregistrer des dépôts. Vous pouvez les modifier/supprimer.</li>
      <li><strong>Export :</strong> Utilisez « Exporter CSV » ou « Exporter PDF ».</li>
      <li><strong>SharePoint :</strong> Cliquez « Ouvrir le dossier SharePoint » pour téléverser le fichier.</li>
      <li><strong>Astuce :</strong> Utilisez le basculement FR/EN. Imprimez si nécessaire.</li>
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

// ===== Per-store variance thresholds =====
const STORE_TOLERANCE = {
  International: 2,
  Transborder: 2,
  Jetty: 1,
  Value: 1
};

// ===== Data State =====
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
  // NEW: manual lost change under $5 for CAD only
  lostChange: { CAD: 0 },
  deposits: [], // {currency, amount, note, time}
  reportedByCurrency: { CAD:0, USD:0, EUR:0 },
  diffsByCurrency:    { CAD:0, USD:0, EUR:0 },
  cardDifference: 0,
  countedTotal: 0,
  reconciledDifference: 0
};

// ===== Init =====
function init(){
  // Year & date
  const d = new Date();
  setText('year', String(d.getFullYear()));
  const dateEl = el('countDate'); if(dateEl) dateEl.valueAsDate = d;

  // Respect prefers-reduced-motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('reduce-motion');
  }

  // Contrast toggle (persist)
  const savedHC = localStorage.getItem('hc') === '1';
  if (savedHC) { document.body.classList.add('hc'); el('contrastToggle')?.setAttribute('aria-pressed','true'); }
  el('contrastToggle')?.addEventListener('click', ()=>{
    const on = !document.body.classList.toggle('hc');
    const isOn = document.body.classList.contains('hc');
    el('contrastToggle').setAttribute('aria-pressed', isOn ? 'true':'false');
    localStorage.setItem('hc', isOn ? '1' : '0');
  });

  // Currency toggles
  ['CAD','USD','EUR'].forEach(cur=>{
    const toggle = el('enable'+cur);
    if(toggle) toggle.addEventListener('change', e=>{
      state.currencies[cur].enabled = e.target.checked;
      renderDenoms(); calcTotals(); validateForm();
    });
  });

  // Per-currency reported
  ['CAD','USD','EUR'].forEach(cur=>{
    const r = el(`reported${cur}`);
    if(r) r.addEventListener('input', (e)=>{ state.reportedByCurrency[cur] = Number(e.target.value||0); calcTotals(); colorizeDiffs(); validateForm(); });
  });

  // NEW: Lost Change CAD listener
  const lcCAD = el('lostChangeCAD');
  if (lcCAD) lcCAD.addEventListener('input', e => {
    state.lostChange.CAD = Number(e.target.value || 0);
    calcTotals();
    colorizeDiffs();
  });

  // Card diff & cash number
  el('cardDifference')?.addEventListener('input', e=>{ state.cardDifference = Number(e.target.value||0); });
  el('cashNumber')?.addEventListener('input', e=>{ state.cashNumber = e.target.value; });

  // Header & action buttons
  el('langToggle')?.addEventListener('click', toggleLanguage);
  el('printBtn')?.addEventListener('click', ()=>window.print());
  el('exportCsvBtn')?.addEventListener('click', ()=>{ if(!validateForm()) return; exportCSV(); announce(I18N[currentLang].statusCSV); });
  el('exportPdfBtn')?.addEventListener('click', async ()=>{ if(!validateForm()) return; await exportPDF(); announce(I18N[currentLang].statusPDF); });
  el('resetBtn')?.addEventListener('click', ()=>{ if(confirm("Are you sure you want to reset?")) resetAll(); });

  // SharePoint buttons
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

  // Close modals when clicking backdrop
  document.addEventListener('click', (e)=>{
    if (e.target && e.target.matches('.modal-backdrop,[data-close="true"]')) {
      closeHelp(); closeDeposit();
    }
    // Close any open deposit menus if clicking outside
    if (!e.target.closest?.('.deposit-actions')) {
      document.querySelectorAll('.menu.open').forEach(m=>m.classList.remove('open'));
    }
  });

  // Close modals on Esc & keyboard flow next/prev
  document.addEventListener('keydown', (e)=>{
    const helpOpen = el('helpModal')?.getAttribute('aria-hidden') === 'false';
    const depOpen  = el('depositModal')?.getAttribute('aria-hidden') === 'false';
    if (e.key === 'Escape' && (helpOpen || depOpen)) { closeHelp(); closeDeposit(); }
    if (e.key === 'Enter' && !e.shiftKey) { focusNext(false); }
    if (e.key === 'Enter' && e.shiftKey)  { focusNext(true); }
  });

  applyLanguage(currentLang);
  renderDenoms();
  calcTotals();
  colorizeDiffs();
  renderDeposits();
  validateForm();
}

// ===== Language =====
function applyLanguage(lang){
  currentLang = lang;
  const t = I18N[lang];

  setButtonText('printBtn', t.btnPrint);
  setButtonText('depositBtn', t.btnDeposit);
  setButtonText('resetBtn', t.btnReset);
  setButtonText('exportCsvBtn', t.btnCSV);
  setButtonText('exportPdfBtn', t.btnPDF);
  setButtonText('langToggle', lang === 'en' ? 'FR' : 'EN');

  // Placeholders
  const p = t.placeholders || { cashierName:"", cashiersList:"", reported:"", cashNumber:"" };
  const cn = el('cashierName'); if(cn && p.cashierName) cn.placeholder = p.cashierName;
  const cl = el('cashiersList'); if(cl && p.cashiersList) cl.placeholder = p.cashiersList;
  ['reportedCAD','reportedUSD','reportedEUR'].forEach(id=>{ const x = el(id); if(x && p.reported) x.placeholder = p.reported; });
  const cnum = el('cashNumber'); if(cnum && p.cashNumber) cnum.placeholder = p.cashNumber;

  // Labels
  setLabelForInput('cashierName', t.headCashier);
  setLabelForInput('countDate', t.date);
  setLabelForInput('store', t.store);
  setLabelForInput('cashiersList', t.cashiers);
  setLabelForInput('cashNumber', t.cashNumber);

  // Section titles
  document.querySelectorAll('main .card h2').forEach(h=>{
    const text = h.textContent.trim().toLowerCase();
    if(text.includes('session info') || text.includes('infos de session')) h.textContent = t.sessionInfo;
    else if(text.includes('denominations') || text.includes('dénominations')) h.textContent = t.denominations;
    else if(text.includes('totals') || text.includes('totaux')) h.textContent = t.totals;
    else if(text.includes('deposits') || text.includes('dépôts')) h.textContent = lang==='en' ? 'Deposits' : 'Dépôts';
  });

  // Help modal text
  setText('helpTitle', t.helpTitle);
  setHTML('helpList', t.helpListHtml);
  setButtonText('helpOk', t.helpOk);

  // Deposit modal text
  setText('depositTitle', t.depTitle);
  setText('lblDepCAD', t.depCAD);
  setText('lblDepUSD', t.depUSD);
  setText('lblDepEUR', t.depEUR);
  setText('lblDepNote', t.depNote);
  setButtonText('depositSave', t.depSave);

  // Re-run validation texts if showing errors
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
function toggleLanguage(){ applyLanguage(currentLang === 'en' ? 'fr' : 'en'); }

// ===== UI: Denomination Sections (better tab order) =====
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
    qtyInput.addEventListener('keydown', e=>{
      if (['e','E','+','-','.'].includes(e.key)) e.preventDefault();
    });
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

  // Assign sequential tabindex to Qty fields (row-by-row across enabled currencies)
  let idx = 100;
  wrap.querySelectorAll('.denom-section').forEach(section=>{
    section.querySelectorAll('.cell input[type="number"]:not([readonly])').forEach(inp=>{
      inp.tabIndex = idx++;
    });
  });
}

// ===== Calculations & variance coloring =====
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

  // Counted per currency = denom + deposits (+ lost change for CAD)
  const countedByCur = {
    CAD: state.denomTotals.CAD + state.depositTotals.CAD + (state.lostChange.CAD || 0),
    USD: state.denomTotals.USD + state.depositTotals.USD,
    EUR: state.denomTotals.EUR + state.depositTotals.EUR
  };

  // Per-currency diffs (reported - counted)
  ['CAD','USD','EUR'].forEach(cur=>{
    state.diffsByCurrency[cur] = Number(state.reportedByCurrency[cur]||0) - countedByCur[cur];
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

// ===== Deposits (list + edit/delete) =====
let lastFocusHelp = null, lastFocusDeposit = null;
let editingIndex = null; // null = creating new

function openDeposit(editIdx=null){
  const m = el('depositModal');
  if(!m) return;

  editingIndex = editIdx;

  // Reset fields
  ['depCAD','depUSD','depEUR','depNote'].forEach(id=>{ const x = el(id); if(x) x.value=''; });

  // Editing an existing deposit: preload its values
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
  const m = el('depositModal');
  if(!m) return;
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
  // validation
  for(const e of entries){
    if (isNaN(e.val)) { alert(t.invalidAmount); return; }
    if (e.val < 0) { alert(t.invalidAmount); return; }
  }

  let any = false;
  if (editingIndex !== null){
    // Update one deposit (choose the filled currency; if none, delete)
    const filled = entries.find(e=> e.val !== 0);
    if (!filled){ // user cleared it → delete
      state.deposits.splice(editingIndex, 1);
    } else {
      const d = state.deposits[editingIndex];
      d.currency = filled.currency;
      d.amount = filled.val;
      d.note = note;
      d.time = new Date().toISOString();
    }
    announce(t.depositUpdated);
    any = true;
  } else {
    // Add up to three deposits (one per non-zero currency)
    entries.forEach(e=>{
      if (e.val !== 0){
        state.deposits.push({ currency:e.currency, amount:e.val, note, time:new Date().toISOString() });
        any = true;
      }
    });
    if (any) announce(t.depositAdded);
  }

  calcTotals();
  colorizeDiffs();
  renderDeposits();
  closeDeposit();
}

function renderDeposits(){
  const wrap = el('depositsList'); if(!wrap) return;
  wrap.innerHTML = '';
  if (state.deposits.length === 0){
    wrap.classList.add('empty');
    return;
  }
  wrap.classList.remove('empty');

  state.deposits.forEach((d, idx)=>{
    const item = document.createElement('div');
    item.className = 'deposit-item';

    const meta = document.createElement('div');
    meta.className = 'deposit-meta';
    meta.innerHTML = `<strong>${d.currency}</strong> ${fmt(d.amount)} — ${d.note ? d.note+' — ' : ''}<span class="muted">${new Date(d.time).toLocaleString()}</span>`;

    const actions = document.createElement('div');
    actions.className = 'deposit-actions';
    const menuBtn = document.createElement('button');
    menuBtn.className = 'menu-btn';
    menuBtn.setAttribute('aria-haspopup','true');
    menuBtn.setAttribute('aria-expanded','false');
    menuBtn.textContent = '⋯';
    const menu = document.createElement('div');
    menu.className = 'menu';
    const bEdit = document.createElement('button');
    bEdit.textContent = currentLang==='en' ? 'Edit' : 'Modifier';
    bEdit.addEventListener('click', ()=>{ menu.classList.remove('open'); openDeposit(idx); });
    const bDel = document.createElement('button');
    bDel.textContent = currentLang==='en' ? 'Delete' : 'Supprimer';
    bDel.addEventListener('click', ()=>{
      menu.classList.remove('open');
      if (confirm(I18N[currentLang].confirmDelete)){
        state.deposits.splice(idx,1);
        calcTotals(); colorizeDiffs(); renderDeposits();
      }
    });
    menu.appendChild(bEdit); menu.appendChild(bDel);

    menuBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true':'false');
    });

    actions.appendChild(menuBtn);
    actions.appendChild(menu);

    item.appendChild(meta);
    item.appendChild(actions);
    wrap.appendChild(item);
  });
}

// ===== Help Modal =====
function openHelp(){
  const m = el('helpModal');
  if(!m) return;
  lastFocusHelp = document.activeElement;
  m.setAttribute('aria-hidden','false');
  m.querySelector('.modal-panel')?.focus();
  document.body.style.overflow = 'hidden';
}
function closeHelp(){
  const m = el('helpModal');
  if(!m) return;
  m.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  if (lastFocusHelp) lastFocusHelp.focus();
}

// ===== Validation (inline + ARIA) =====
function setError(id, msg){
  const err = el('err-'+id);
  const fld = el(id);
  if (!err || !fld) return;
  if (msg){
    err.textContent = msg; err.removeAttribute('aria-hidden');
    fld.setAttribute('aria-invalid','true');
  } else {
    err.textContent = ''; err.setAttribute('aria-hidden','true');
    fld.removeAttribute('aria-invalid');
  }
}
function validateForm(){
  const t = I18N[currentLang];
  let ok = true;

  // Name required
  const name = el('cashierName')?.value.trim();
  if (!name){ setError('cashierName', t.errName); ok = false; }
  else setError('cashierName', '');

  // Date not in future
  const dateVal = el('countDate')?.value;
  if (dateVal){
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(dateVal + 'T00:00:00');
    if (d > today){ setError('countDate', t.errDateFuture); ok = false; }
    else setError('countDate', '');
  } else {
    setError('countDate', t.errDateFuture); ok = false;
  }

  // Quantities range (any out-of-range?)
  let qtyBad = false;
  document.querySelectorAll('.denom-section .cell input[type="number"]:not([readonly])').forEach(inp=>{
    const v = Number(inp.value||0);
    if (v < 0 || v > 10000) qtyBad = true;
  });
  if (qtyBad){ announce(t.errQtyRange); }

  // Enable/disable export buttons
  el('exportCsvBtn')?.toggleAttribute('disabled', !ok);
  el('exportPdfBtn')?.toggleAttribute('disabled', !ok);

  return ok;
}

// ===== Reset =====
function resetAll(){
  // Clear text fields
  ['cashierName','cashiersList','cashNumber','lostChangeCAD'].forEach(id=>{ const x = el(id); if(x) x.value=''; });
  // Reset date to today
  const d = new Date(); const dateEl = el('countDate'); if(dateEl) dateEl.valueAsDate = d;
  // Reset store dropdown to first option
  const st = el('store'); if(st) st.selectedIndex = 0;

  // Reset currencies & rows
  Object.keys(state.currencies).forEach(c=>{
    state.currencies[c].rows.forEach(r=>{ r.qty=0; r.total=0; });
  });

  // Clear deposits
  state.deposits = [];
  state.depositTotals = { CAD:0, USD:0, EUR:0 };

  // Clear reported inputs & diffs
  ['CAD','USD','EUR'].forEach(cur=>{
    state.reportedByCurrency[cur]=0;
    const input = el(`reported${cur}`); if(input) input.value='';
  });

  // Clear lost change
  state.lostChange.CAD = 0;

  state.cardDifference = 0; const cardEl = el('cardDifference'); if(cardEl) cardEl.value='';
  state.cashNumber = "";

  renderDenoms();
  renderDeposits();
  calcTotals();
  colorizeDiffs();
  validateForm();
}

// ===== Filename & Exports =====
function filenameBase(){
  const name = (el('cashierName')?.value || 'Unknown').replace(/\s+/g,'_');
  const date = el('countDate')?.value || new Date().toISOString().slice(0,10);
  const store = (el('store')?.value || '').replace(/\s+/g,'_');
  const cashN = (state.cashNumber||'').replace(/\s+/g,'_');
  const cashSuffix = cashN ? `_Cash${cashN}` : '';
  return `MONTREAL_DUTY_FREE_${store}_${date}_${name}${cashSuffix}`;
}

function exportCSV(){
  const rows = [];
  rows.push(['Company','MONTREAL DUTY FREE']);
  rows.push(['Sous-name','AER RIANTA ITL']);
  rows.push(['Store', el('store').value]);
  rows.push(['Head Cashier/Manager Name', el('cashierName').value]);
  rows.push(['Date', el('countDate').value]);
  rows.push(['Cashiers', el('cashiersList').value]);
  rows.push(['Cash Number', state.cashNumber]);
  rows.push([]);

  // Denoms detail
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

  // Deposits
  rows.push(['Deposits']);
  rows.push(['Currency','Amount','Note','Time (ISO)']);
  if(state.deposits.length===0){
    rows.push(['','','','']);
  }else{
    state.deposits.forEach(d=> rows.push([d.currency, Number(d.amount).toFixed(2), d.note||'', d.time||'']));
  }
  rows.push(['Deposit Totals by Currency']);
  rows.push(['CAD', state.depositTotals.CAD.toFixed(2)]);
  rows.push(['USD', state.depositTotals.USD.toFixed(2)]);
  rows.push(['EUR', state.depositTotals.EUR.toFixed(2)]);
  rows.push([]);

  // NEW: Lost change info
  rows.push(['Lost Change (CAD < $5)', (state.lostChange.CAD || 0).toFixed(2)]);
  rows.push([]);

  // Per-currency totals/diffs
  ['CAD','USD','EUR'].forEach(cur=>{
    const extra = (cur==='CAD') ? (state.lostChange.CAD || 0) : 0;
    const counted = (state.denomTotals[cur] + state.depositTotals[cur] + extra).toFixed(2);
    rows.push([`${cur} Counted`, counted]);
    rows.push([`${cur} Reported (Z report)`, Number(state.reportedByCurrency[cur]||0).toFixed(2)]);
    rows.push([`${cur} Difference (Reported - Counted)`, state.diffsByCurrency[cur].toFixed(2)]);
    rows.push([]);
  });

  // Overall
  const denomAll = state.denomTotals.CAD + state.denomTotals.USD + state.denomTotals.EUR;
  const depositsAll = state.depositTotals.CAD + state.depositTotals.USD + state.depositTotals.EUR;

  rows.push(['Card Difference (info only)', Number(state.cardDifference||0).toFixed(2)]);
  rows.push([]);
  rows.push(['Denominations Total (All Currencies)', denomAll.toFixed(2)]);
  rows.push(['Deposits Total (All Currencies)', depositsAll.toFixed(2)]);
  rows.push(['Counted Total (Denoms + Deposits + CAD Lost Change)', state.countedTotal.toFixed(2)]);
  rows.push(['Reconciled Difference (CAD+USD+EUR)', state.reconciledDifference.toFixed(2)]);

  const csv = rows.map(r=> r.map(v=> `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filenameBase() + '.csv';
  link.click();
}

// Lazy-load jsPDF for performance
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

  // Denominations
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

  // Deposits
  doc.setFontSize(14);
  doc.text("Deposits", 10, y); y += 6;
  doc.setFontSize(10);
  if(state.deposits.length===0){
    doc.text("No deposits recorded", 12, y); y += 6;
  }else{
    state.deposits.forEach(d=>{
      doc.text(`${d.currency} ${fmt(d.amount)} - ${d.note||''} (${d.time})`, 12, y);
      y += 5; if(y>280){ doc.addPage(); y=10; }
    });
  }
  y += 6;

  // Lost Change (CAD)
  doc.setFontSize(12);
  doc.text(`CAD Lost Change (< $5): ${fmt(state.lostChange.CAD || 0)}`, 10, y); y += 8;

  // Per-currency
  ['CAD','USD','EUR'].forEach(cur=>{
    const extra = cur === 'CAD' ? (state.lostChange.CAD || 0) : 0;
    const counted = state.denomTotals[cur] + state.depositTotals[cur] + extra;
    doc.text(`${cur} Counted: ${fmt(counted)}`, 10, y); y += 6;
    doc.text(`${cur} Reported (Z report): ${fmt(state.reportedByCurrency[cur]||0)}`, 10, y); y += 6;
    doc.text(`${cur} Difference: ${fmt(state.diffsByCurrency[cur])}`, 10, y); y += 8;
    if(y > 280){ doc.addPage(); y = 10; }
  });

  // Overall
  const denomAll = state.denomTotals.CAD + state.denomTotals.USD + state.denomTotals.EUR;
  const depositsAll = state.depositTotals.CAD + state.depositTotals.USD + state.depositTotals.EUR;

  doc.text(`Card Difference (info only): ${fmt(state.cardDifference||0)}`, 10, y); y += 8;
  doc.text(`Denominations Total (All): ${fmt(denomAll)}`, 10, y); y += 6;
  doc.text(`Deposits Total (All): ${fmt(depositsAll)}`, 10, y); y += 6;
  doc.text(`Counted Total: ${fmt(state.countedTotal)}  (includes CAD Lost Change)`, 10, y); y += 6;
  doc.text(`Reconciled Difference: ${fmt(state.reconciledDifference)}`, 10, y); y += 6;

  doc.save(filenameBase() + ".pdf");
}

window.addEventListener('DOMContentLoaded', init);
