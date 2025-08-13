// ===== Helpers =====
function fmt(n){ return (Number(n||0)).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
function el(id){ return document.getElementById(id); }

// i18n dictionary
const I18N = {
  en: {
    sessionInfo: "Session Info",
    headCashier: "Head Cashier/Manager Name", // UPDATED
    date: "Date",
    store: "Store",
    cashiers: "Cashiers (who used the cash)",
    cashNumber: "Cash Number",
    denominations: "Denominations",
    totals: "Totals",
    overallCounted: "Overall Counted (Denoms + Deposits)",
    reported: "Reported",
    difference: "Difference",
    counted: "Counted",
    cad: "CAD",
    usd: "USD",
    eur: "EUR",
    cardDiff: "Card Difference (info only)",
    recDiff: "Reconciled Difference (CAD + USD + EUR)",
    btnPrint: "Print",
    btnDeposit: "+ Deposit",
    btnReset: "Reset",
    btnCSV: "Export CSV",
    btnPDF: "Export PDF",
    depositPrompt: "Enter deposit amounts (leave blank if none):",
    depositCAD: "CAD amount:",
    depositUSD: "USD amount:",
    depositEUR: "EUR amount:",
    depositNote: "Optional note (e.g., Mid-day drop, bag #):",
    depositAdded: "Deposit added.",
    invalidAmount: "Invalid amount",
    placeholders: {
      cashierName: "Your full name",
      cashiersList: "Comma-separated e.g., Samira, Alex",
      reported: "0.00",
      cashNumber: "e.g., Cash #1"
    }
  },
  fr: {
    sessionInfo: "Infos de session",
    headCashier: "Nom du chef caissier/gestionnaire", // UPDATED
    date: "Date",
    store: "Magasin",
    cashiers: "Caissiers (ayant utilisé la caisse)",
    cashNumber: "Numéro de caisse",
    denominations: "Dénominations",
    totals: "Totaux",
    overallCounted: "Total compté (Billets + Dépôts)",
    reported: "Déclaré",
    difference: "Écart",
    counted: "Compté",
    cad: "CAD",
    usd: "USD",
    eur: "EUR",
    cardDiff: "Écart carte (info seulement)",
    recDiff: "Écart réconcilié (CAD + USD + EUR)",
    btnPrint: "Imprimer",
    btnDeposit: "+ Dépôt",
    btnReset: "Réinitialiser",
    btnCSV: "Exporter CSV",
    btnPDF: "Exporter PDF",
    depositPrompt: "Saisir les montants de dépôt (laisser vide si aucun) :",
    depositCAD: "Montant CAD :",
    depositUSD: "Montant USD :",
    depositEUR: "Montant EUR :",
    depositNote: "Note facultative (ex. dépôt midi, sac #) :",
    depositAdded: "Dépôt ajouté.",
    invalidAmount: "Montant invalide",
    placeholders: {
      cashierName: "Votre nom complet",
      cashiersList: "Séparés par des virgules ex.: Samira, Alex",
      reported: "0,00",
      cashNumber: "ex.: Caisse #1"
    }
  }
};

let currentLang = "en";

// ===== Data State =====
const PRESETS = { CAD:[100,50,20,10,5], USD:[100,50,20,10,5,1], EUR:[500,200,100,50,20,10,5] };

const state = {
  cashNumber: "",
  currencies: {
    CAD: {enabled:true,  rows: PRESETS.CAD.map(v=>({label:`$${v}`, value:v, qty:0, total:0}))},
    USD: {enabled:false, rows: PRESETS.USD.map(v=>({label:`$${v}`, value:v, qty:0, total:0}))},
    EUR: {enabled:false, rows: PRESETS.EUR.map(v=>({label:`€${v}`, value:v, qty:0, total:0}))},
  },
  // denomination totals by currency
  denomTotals: { CAD:0, USD:0, EUR:0 },
  // deposit totals by currency
  depositTotals: { CAD:0, USD:0, EUR:0 },
  deposits: [], // {currency:'CAD'|'USD'|'EUR', amount:number, note:string, time:string}

  // per-currency reported and diff (reported - (denom+deposits))
  reportedByCurrency: { CAD:0, USD:0, EUR:0 },
  diffsByCurrency:    { CAD:0, USD:0, EUR:0 },

  // info-only
  cardDifference: 0,

  // overall
  countedTotal: 0,
  reconciledDifference: 0
};

// ===== Init =====
function init(){
  // Year & date
  const d = new Date();
  const yearEl = el('year'); if(yearEl) yearEl.textContent = String(d.getFullYear());
  const dateEl = el('countDate'); if(dateEl) dateEl.valueAsDate = d;

  // Currency toggles (null-safe)
  const cadT = el('enableCAD'); if(cadT) cadT.addEventListener('change', e=>{ state.currencies.CAD.enabled = e.target.checked; renderDenoms(); calcTotals(); });
  const usdT = el('enableUSD'); if(usdT) usdT.addEventListener('change', e=>{ state.currencies.USD.enabled = e.target.checked; renderDenoms(); calcTotals(); });
  const eurT = el('enableEUR'); if(eurT) eurT.addEventListener('change', e=>{ state.currencies.EUR.enabled = e.target.checked; renderDenoms(); calcTotals(); });

  // Per-currency reported
  ['CAD','USD','EUR'].forEach(cur=>{
    const r = el(`reported${cur}`);
    if(r) r.addEventListener('input', (e)=>{ state.reportedByCurrency[cur] = Number(e.target.value||0); calcTotals(); });
  });

  // Card difference
  const cardEl = el('cardDifference');
  if(cardEl) cardEl.addEventListener('input', e=>{ state.cardDifference = Number(e.target.value||0); });

  // Cash number
  const cashNum = el('cashNumber');
  if(cashNum) cashNum.addEventListener('input', e=>{ state.cashNumber = e.target.value; });

  // Buttons (null-safe)
  const langBtn = el('langToggle'); if(langBtn) langBtn.addEventListener('click', toggleLanguage);
  const printBtn = el('printBtn'); if(printBtn) printBtn.addEventListener('click', ()=>window.print());
  const depBtn = el('depositBtn'); if(depBtn) depBtn.addEventListener('click', addDepositByCurrency);
  el('resetBtn').addEventListener('click', () => {
    if (confirm("Are you sure you want to reset?")) { resetAll(); }
  });

  const csvBtn = el('exportCsvBtn'); if(csvBtn) csvBtn.addEventListener('click', exportCSV);
  const pdfBtn = el('exportPdfBtn'); if(pdfBtn) pdfBtn.addEventListener('click', exportPDF);

  applyLanguage(currentLang);
  renderDenoms();
  calcTotals();
}

// ===== Language =====
function applyLanguage(lang){
  currentLang = lang;
  const t = I18N[lang];

  // Buttons
  setButtonText('printBtn', t.btnPrint);
  setButtonText('depositBtn', t.btnDeposit);
  setButtonText('resetBtn', t.btnReset);
  setButtonText('exportCsvBtn', t.btnCSV);
  setButtonText('exportPdfBtn', t.btnPDF);
  setButtonText('langToggle', lang === 'en' ? 'FR' : 'EN');

  // Placeholders
  const p = t.placeholders;
  const cn = el('cashierName'); if(cn) cn.placeholder = p.cashierName;
  const cl = el('cashiersList'); if(cl) cl.placeholder = p.cashiersList;
  ['reportedCAD','reportedUSD','reportedEUR'].forEach(id=>{ const x = el(id); if(x) x.placeholder = p.reported; });
  const cnum = el('cashNumber'); if(cnum) cnum.placeholder = p.cashNumber;

  // Labels
  setLabelForInput('cashierName', t.headCashier);
  setLabelForInput('countDate', t.date);
  setLabelForInput('store', t.store);
  setLabelForInput('cashiersList', t.cashiers);
  setLabelForInput('cashNumber', t.cashNumber);

  // Section titles (best-effort)
  document.querySelectorAll('main .card h2').forEach(h=>{
    const text = h.textContent.trim().toLowerCase();
    if(text.includes('session info') || text.includes('infos de session')) h.textContent = t.sessionInfo;
    else if(text.includes('denominations') || text.includes('dénominations')) h.textContent = t.denominations;
    else if(text.includes('totals') || text.includes('totaux')) h.textContent = t.totals;
  });
}

function toggleLanguage(){ applyLanguage(currentLang === 'en' ? 'fr' : 'en'); }

function setLabelForInput(inputId, text){
  const input = el(inputId);
  if(!input) return;
  const label = input.closest(".field");
  if(!label) return;
  const span = label.querySelector("span");
  if(span) span.textContent = text;
}
function setButtonText(id, text){ const b = el(id); if(b) b.textContent = text; }

// ===== UI: Denomination Sections =====
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

    // Qty (NUMBERS ONLY)
    const qtyCell = document.createElement('div');
    qtyCell.className = 'cell';
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number'; qtyInput.min='0'; qtyInput.step='1'; qtyInput.inputMode='numeric';
    qtyInput.value = row.qty;

    // prevent e/E/+/-/. and mouse wheel changes
    qtyInput.addEventListener('keydown', e=>{
      if (['e','E','+','-','.'].includes(e.key)) e.preventDefault();
    });
    qtyInput.addEventListener('wheel', e=>{ e.preventDefault(); e.target.blur(); }, {passive:false});
    qtyInput.addEventListener('input', e=>{
      // strip non-digits
      e.target.value = e.target.value.replace(/[^\d]/g,'');
      row.qty = Number(e.target.value||0);
      row.total = row.qty * Number(row.value||0);
      calcTotals(); lineTotal.textContent = fmt(row.total);
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
}

// ===== Calculations =====
function calcTotals(){
  // Denomination totals
  const sumDenoms = curObj => curObj.rows.reduce((s,r)=> s + (Number(r.qty||0) * Number(r.value||0)), 0);
  state.denomTotals.CAD = state.currencies.CAD.enabled ? sumDenoms(state.currencies.CAD) : 0;
  state.denomTotals.USD = state.currencies.USD.enabled ? sumDenoms(state.currencies.USD) : 0;
  state.denomTotals.EUR = state.currencies.EUR.enabled ? sumDenoms(state.currencies.EUR) : 0;

  // Deposit totals (recalculate)
  state.depositTotals = { CAD:0, USD:0, EUR:0 };
  state.deposits.forEach(d=>{
    if(d.currency && state.depositTotals[d.currency] != null){
      state.depositTotals[d.currency] += Number(d.amount||0);
    }
  });

  // Counted per currency = denom + deposits
  const countedByCur = {
    CAD: state.denomTotals.CAD + state.depositTotals.CAD,
    USD: state.denomTotals.USD + state.depositTotals.USD,
    EUR: state.denomTotals.EUR + state.depositTotals.EUR
  };

  // Per-currency diffs (reported - counted)
  ['CAD','USD','EUR'].forEach(cur=>{
    state.diffsByCurrency[cur] = Number(state.reportedByCurrency[cur]||0) - countedByCur[cur];
  });

  // Overall counted total (kept in state for exports; UI element removed)
  state.countedTotal = countedByCur.CAD + countedByCur.USD + countedByCur.EUR;

  // Reconciled difference (sum of per-currency diffs)
  state.reconciledDifference = state.diffsByCurrency.CAD + state.diffsByCurrency.USD + state.diffsByCurrency.EUR;

  // Update visible UI (all null-safe)
  const cadTotalEl = el('cadTotal'); if(cadTotalEl) cadTotalEl.textContent = fmt(countedByCur.CAD);
  const usdTotalEl = el('usdTotal'); if(usdTotalEl) usdTotalEl.textContent = fmt(countedByCur.USD);
  const eurTotalEl = el('eurTotal'); if(eurTotalEl) eurTotalEl.textContent = fmt(countedByCur.EUR);
  const cadDiffEl = el('cadDiff'); if(cadDiffEl) cadDiffEl.textContent = fmt(state.diffsByCurrency.CAD);
  const usdDiffEl = el('usdDiff'); if(usdDiffEl) usdDiffEl.textContent = fmt(state.diffsByCurrency.USD);
  const eurDiffEl = el('eurDiff'); if(eurDiffEl) eurDiffEl.textContent = fmt(state.diffsByCurrency.EUR);
  const recEl = el('recDiff'); if(recEl) recEl.textContent = fmt(state.reconciledDifference);
}

// ===== Deposits (per currency) =====
function addDepositByCurrency(){
  const t = I18N[currentLang];
  alert(t.depositPrompt);

  const cadStr = prompt(t.depositCAD, "");
  const usdStr = prompt(t.depositUSD, "");
  const eurStr = prompt(t.depositEUR, "");
  const note = prompt(t.depositNote, "") || "";

  const entries = [
    {currency:'CAD', str:cadStr},
    {currency:'USD', str:usdStr},
    {currency:'EUR', str:eurStr}
  ];

  let added = false;
  entries.forEach(ent=>{
    if(ent.str === null || ent.str.trim()==="") return;
    const val = Number(ent.str);
    if(!isFinite(val) || isNaN(val)) return alert(I18N[currentLang].invalidAmount);
    if(val !== 0){
      state.deposits.push({ currency: ent.currency, amount: val, note, time: new Date().toISOString() });
      added = true;
    }
  });

  if(added){ calcTotals(); alert(t.depositAdded); }
}

// ===== Reset =====
function resetAll(){
  ['cashierName','cashiersList','cashNumber'].forEach(id=>{ const x = el(id); if(x) x.value=''; });
  const d = new Date(); const dateEl = el('countDate'); if(dateEl) dateEl.valueAsDate = d;
  const st = el('store'); if(st) st.selectedIndex = 0;

  Object.keys(state.currencies).forEach(c=>{
    state.currencies[c].rows.forEach(r=>{ r.qty=0; r.total=0; });
  });

  state.deposits = [];
  state.depositTotals = { CAD:0, USD:0, EUR:0 };

  ['CAD','USD','EUR'].forEach(cur=>{
    state.reportedByCurrency[cur]=0;
    const input = el(`reported${cur}`); if(input) input.value='';
  });
  state.cardDifference = 0; const cardEl = el('cardDifference'); if(cardEl) cardEl.value='';

  state.cashNumber = "";

  renderDenoms();
  calcTotals();
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
  rows.push(['Head Cashier/Manager Name', el('cashierName').value]); // UPDATED
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

  // Per-currency totals/diffs
  ['CAD','USD','EUR'].forEach(cur=>{
    const counted = (state.denomTotals[cur] + state.depositTotals[cur]).toFixed(2);
    rows.push([`${cur} Counted`, counted]);
    rows.push([`${cur} Reported (Z report)`, Number(state.reportedByCurrency[cur]||0).toFixed(2)]); // UPDATED
    rows.push([`${cur} Difference (Reported - Counted)`, state.diffsByCurrency[cur].toFixed(2)]);
    rows.push([]);
  });

  // Overall (kept in export)
  const denomAll = state.denomTotals.CAD + state.denomTotals.USD + state.denomTotals.EUR;
  const depositsAll = state.depositTotals.CAD + state.depositTotals.USD + state.depositTotals.EUR;

  rows.push(['Card Difference (info only)', Number(state.cardDifference||0).toFixed(2)]);
  rows.push([]);
  rows.push(['Denominations Total (All Currencies)', denomAll.toFixed(2)]);
  rows.push(['Deposits Total (All Currencies)', depositsAll.toFixed(2)]);
  rows.push(['Counted Total (Denoms + Deposits)', state.countedTotal.toFixed(2)]);
  rows.push(['Reconciled Difference (CAD+USD+EUR)', state.reconciledDifference.toFixed(2)]);

  const csv = rows.map(r=> r.map(v=> `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filenameBase() + '.csv';
  link.click();
}

function exportPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(18);
  doc.text("MONTREAL DUTY FREE - Cash Count Report", 10, y); y += 10;

  doc.setFontSize(12);
  doc.text(`Sous-name: AER RIANTA ITL`, 10, y); y += 6;
  doc.text(`Store: ${el('store').value}`, 10, y); y += 6;
  doc.text(`Head Cashier/Manager Name: ${el('cashierName').value}`, 10, y); y += 6; // UPDATED
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

  // Per-currency
  doc.setFontSize(12);
  ['CAD','USD','EUR'].forEach(cur=>{
    const counted = state.denomTotals[cur] + state.depositTotals[cur];
    doc.text(`${cur} Counted: ${fmt(counted)}`, 10, y); y += 6;
    doc.text(`${cur} Reported (Z report): ${fmt(state.reportedByCurrency[cur]||0)}`, 10, y); y += 6; // UPDATED
    doc.text(`${cur} Difference: ${fmt(state.diffsByCurrency[cur])}`, 10, y); y += 8;
    if(y > 280){ doc.addPage(); y = 10; }
  });

  // Overall (kept in export)
  const denomAll = state.denomTotals.CAD + state.denomTotals.USD + state.denomTotals.EUR;
  const depositsAll = state.depositTotals.CAD + state.depositTotals.USD + state.depositTotals.EUR;

  doc.text(`Card Difference (info only): ${fmt(state.cardDifference||0)}`, 10, y); y += 8;
  doc.text(`Denominations Total (All): ${fmt(denomAll)}`, 10, y); y += 6;
  doc.text(`Deposits Total (All): ${fmt(depositsAll)}`, 10, y); y += 6;
  doc.text(`Counted Total: ${fmt(state.countedTotal)}`, 10, y); y += 6;
  doc.text(`Reconciled Difference: ${fmt(state.reconciledDifference)}`, 10, y); y += 6;

  doc.save(filenameBase() + ".pdf");
}

window.addEventListener('DOMContentLoaded', init);
el('resetBtn').addEventListener('click', resetAll);
