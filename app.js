/* ==============================
   Bassam Invoice App - FINAL
   A4 Print + PDF (Stable)
   + Editable Invoice Title
   + AutoSave + Close Guard
   + Calculator (Samsung Layout) - NO PRINT
   + Print Green Header + Totals Green
   + Currency shown in totals header
   + Amount in words (Arabic) with proper minor units
   + Fixed footer line: "شامل أجور الشحن والتأمين"
   ============================== */

const STORAGE_KEY = "bassam_invoice_state_v6";

/* ---------- أدوات ---------- */
const $ = (id) => document.getElementById(id);
const num = (v) => {
  const x = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(x) ? x : 0;
};
const f2 = (n) => num(n).toFixed(2);
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const esc = (s) => String(s ?? "")
  .replaceAll("&","&amp;").replaceAll("<","&lt;")
  .replaceAll(">","&gt;").replaceAll('"',"&quot;")
  .replaceAll("'","&#039;");

/* ---------- تحويل الرقم إلى كلمات عربية (للأعداد الصحيحة حتى الملايين) ---------- */
function numberToArabicWordsInt(n){
  n = Math.floor(Math.abs(Number(n) || 0));
  if(n === 0) return "صفر";

  const ones = [
    "", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة",
    "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر",
    "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"
  ];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

  function twoDigits(x){
    if(x === 0) return "";
    if(x < 20) return ones[x];
    const t = Math.floor(x / 10);
    const o = x % 10;
    if(o === 0) return tens[t];
    return `${ones[o]} و${tens[t]}`;
  }

  function threeDigits(x){
    if(x === 0) return "";
    const h = Math.floor(x / 100);
    const r = x % 100;
    const hPart = h ? hundreds[h] : "";
    const rPart = twoDigits(r);
    if(hPart && rPart) return `${hPart} و${rPart}`;
    return hPart || rPart;
  }

  function groupName(g, unit){
    if(unit === "thousand"){
      if(g === 1) return "ألف";
      if(g === 2) return "ألفان";
      if(g >= 3 && g <= 10) return "آلاف";
      return "ألف";
    }
    if(unit === "million"){
      if(g === 1) return "مليون";
      if(g === 2) return "مليونان";
      if(g >= 3 && g <= 10) return "ملايين";
      return "مليون";
    }
    return "";
  }

  const parts = [];
  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const rest = n % 1000;

  if(millions){
    const mWords = threeDigits(millions);
    const mName = groupName(millions, "million");
    parts.push(millions <= 2 ? mName : `${mWords} ${mName}`);
  }
  if(thousands){
    const tWords = threeDigits(thousands);
    const tName = groupName(thousands, "thousand");
    parts.push(thousands <= 2 ? tName : `${tWords} ${tName}`);
  }
  if(rest){
    parts.push(threeDigits(rest));
  }

  return parts.filter(Boolean).join(" و");
}

/* ---------- أسماء العملات والجزء الصغير بصيغ مختلفة ---------- */
function currencyTerms(currency){
  switch(currency){
    case "ريال سعودي":
      return { major: "ريال سعودي", minor: { one:"هللة", two:"هللتان", few:"هللات", many:"هللة" } };
    case "درهم إماراتي":
      return { major: "درهم إماراتي", minor: { one:"فلس", two:"فلسان", few:"فلوس", many:"فلس" } };
    case "ريال يمني":
      return { major: "ريال يمني", minor: { one:"فلس", two:"فلسان", few:"فلوس", many:"فلس" } };
    case "دولار":
      return { major: "دولار", minor: { one:"سنت", two:"سنتان", few:"سنتات", many:"سنت" } };
    default:
      return { major: currency || "عملة", minor: { one:"جزء", two:"جزآن", few:"أجزاء", many:"جزء" } };
  }
}
function pickMinorWord(n, forms){
  n = Math.abs(Math.floor(Number(n) || 0));
  if(n === 1) return forms.one;
  if(n === 2) return forms.two;
  if(n >= 3 && n <= 10) return forms.few;
  return forms.many;
}
function amountToArabicWords(amount, currency){
  const { major, minor } = currencyTerms(currency);
  const a = Math.max(0, Number(amount) || 0);

  const intPart = Math.floor(a);
  const fracPart = Math.round((a - intPart) * 100);

  const intWords = numberToArabicWordsInt(intPart);

  if(fracPart > 0){
    const fracWords = numberToArabicWordsInt(fracPart);
    const minorWord = pickMinorWord(fracPart, minor);
    return `فقط: ${intWords} ${major} و${fracWords} ${minorWord} لا غير.`;
  }
  return `فقط: ${intWords} ${major} لا غير.`;
}

/* ---------- الحالة ---------- */
function defaultRow(){
  return { name:"", qty:0, wPer:0, vPer:0 };
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch{ return null; }
}
function saveState(s){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
function collectState(){
  const rows = Array.from(document.querySelectorAll("tr[data-row='1']"));
  return {
    invoiceTitle: $("invoiceTitle") ? ($("invoiceTitle").value || "فاتورة") : "فاتورة",
    customerName: $("customerName").value || "",
    invoiceNo: $("invoiceNo").value || "",
    currency: $("currency").value || "ريال سعودي",
    invoiceDate: $("invoiceDate").value || todayISO(),
    items: rows.map(tr => ({
      name: tr.querySelector("[data-k='name']").value || "",
      qty:  num(tr.querySelector("[data-k='qty']").value),
      wPer: num(tr.querySelector("[data-k='wPer']").value),
      vPer: num(tr.querySelector("[data-k='vPer']").value),
    }))
  };
}
function totals(state){
  let q=0,w=0,v=0;
  state.items.forEach(it=>{
    q+=num(it.qty);
    w+=num(it.qty)*num(it.wPer);
    v+=num(it.qty)*num(it.vPer);
  });
  return { q, w, v };
}

/* ---------- حفظ تلقائي مضمون ---------- */
let __saveTimer = null;
function autoSaveNow(){
  try { saveState(collectState()); } catch {}
}
function autoSaveSoon(){
  clearTimeout(__saveTimer);
  __saveTimer = setTimeout(autoSaveNow, 250);
}
function enableAutoSave(){
  document.addEventListener("input", (e)=>{
    const t = e.target;
    if(t && (t.matches("input") || t.matches("select") || t.matches("textarea"))){
      autoSaveSoon();
    }
  }, true);

  document.addEventListener("change", (e)=>{
    const t = e.target;
    if(t && (t.matches("input") || t.matches("select") || t.matches("textarea"))){
      autoSaveSoon();
    }
  }, true);

  window.addEventListener("beforeunload", ()=>{
    autoSaveNow();
  });

  document.addEventListener("visibilitychange", ()=>{
    if(document.visibilityState === "hidden"){
      autoSaveNow();
    }
  });
}

/* ---------- زر الإغلاق مع تأكيد + حفظ ---------- */
function initCloseGuard(){
  const btn = $("closeBtn");
  if(!btn) return;

  btn.addEventListener("click", (e)=>{
    e.preventDefault();
    autoSaveNow();
    const ok = confirm("تم حفظ عملك تلقائيًا.\nهل تريد الخروج؟");
    if(!ok) return;

    try{
      if(window.history.length > 1){
        window.history.back();
      }else{
        window.close();
      }
    }catch{
      location.reload();
    }
  });
}

/* ---------- الجدول ---------- */
function renumber(){
  document.querySelectorAll("tr[data-row='1'] .idx")
    .forEach((c,i)=>c.textContent=i+1);
}
function addRow(row=defaultRow()){
  const tr = document.createElement("tr");
  tr.setAttribute("data-row","1");
  tr.innerHTML = `
    <td class="idx">0</td>
    <td><input data-k="name" placeholder="اسم الصنف" value="${esc(row.name)}"></td>
    <td><input data-k="qty" type="number" step="1" value="${row.qty}"></td>
    <td><input data-k="wPer" type="number" step="0.01" value="${row.wPer}"></td>
    <td><input data-k="vPer" type="number" step="0.01" value="${row.vPer}"></td>
    <td class="wT">0.00</td>
    <td class="vT">0.00</td>
    <td class="row-actions"><button type="button">×</button></td>
  `;
  tr.querySelector(".row-actions button").onclick=()=>{
    tr.remove(); renumber(); update(); autoSaveNow();
  };
  tr.querySelectorAll("input").forEach(i=>{
    i.oninput=()=>{ update(); autoSaveSoon(); };
  });
  $("itemsBody").appendChild(tr);
  renumber();
}

/* ---------- المعاينة ---------- */
function renderPreview(state){
  const {q,w,v} = totals(state);
  const rows = state.items.filter(x=>x.name.trim());
  const body = rows.length ? rows.map((it,i)=>`
    <tr>
      <td>${i+1}</td>
      <td style="text-align:right">${esc(it.name)}</td>
      <td>${it.qty}</td>
      <td>${f2(it.wPer)}</td>
      <td>${f2(it.vPer)}</td>
      <td>${f2(it.qty*it.wPer)}</td>
      <td>${f2(it.qty*it.vPer)}</td>
    </tr>`).join("")
  : `<tr><td colspan="7" style="text-align:center">لا توجد أصناف</td></tr>`;

  const words = amountToArabicWords(v, state.currency);

  $("invoicePreview").innerHTML = `
    <div id="invoiceArea">
      <h3 style="margin:0;color:#0f7a36">مكتب بسام الشتيمي للتخليص الجمركي</h3>
      <div style="font-weight:900;font-size:16px;margin-top:6px">${esc(state.invoiceTitle || "فاتورة")}</div>

      <div style="font-size:13px;margin:6px 0">
        جوال: 00967771997809 • البريد: Bassam.7111111@gmail.com
      </div>
      <hr>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">
        <div>العميل: ${esc(state.customerName||"-")}</div>
        <div>رقم الفاتورة: ${esc(state.invoiceNo||"-")}</div>
        <div>العملة: ${esc(state.currency)}</div>
        <div>التاريخ: ${esc(state.invoiceDate)}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:12px" border="1">
        <thead style="background:#f0fdf4">
          <tr>
            <th>#</th><th>الصنف</th><th>العدد</th>
            <th>وزن/كرتون</th><th>قيمة/كرتون</th>
            <th>الوزن الكلي</th><th>القيمة الكلية</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:10px">
        <div>إجمالي العدد: <b>${q}</b></div>
        <div>إجمالي الوزن: <b>${f2(w)}</b></div>
        <div>إجمالي القيمة - ${esc(state.currency)}: <b>${f2(v)}</b></div>
      </div>

      <div style="margin-top:12px;font-size:14px;font-weight:800;line-height:1.9">
        ${esc(words)}
      </div>

      <div style="margin-top:10px;font-size:14px;font-weight:900">
        شامل أجور الشحن والتأمين
      </div>
    </div>
  `;
}

/* ---------- تحديث ---------- */
function update(){
  const s = collectState();
  document.querySelectorAll("tr[data-row='1']").forEach((tr,i)=>{
    const it = s.items[i]||defaultRow();
    tr.querySelector(".wT").textContent = f2(it.qty*it.wPer);
    tr.querySelector(".vT").textContent = f2(it.qty*it.vPer);
  });
  $("sumQty").textContent = totals(s).q;
  $("sumWeight").textContent = f2(totals(s).w);
  $("sumValue").textContent = f2(totals(s).v);
  renderPreview(s);
}

/* ---------- طباعة A4 (قالب مستقل) + أخضر للعناوين والإجماليات + العملة + كتابيًا + سطر ثابت ---------- */
function printInvoiceA4(){
  const s = collectState();
  const {q,w,v} = totals(s);
  const words = amountToArabicWords(v, s.currency);

  const html = `
<!doctype html><html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>فاتورة</title>
<style>
@page{size:A4;margin:12mm}
body{font-family:Arial,Tahoma;background:#fff}
.invoice{width:100%}

:root{
  --green:#16a34a;
  --border:#e5e7eb;
}

/* جدول */
table{
  width:100%;
  border-collapse:collapse;
  table-layout:fixed;
  font-size:12px;
}
th,td{
  border:1px solid var(--border);
  padding:6px;
  text-align:center;
  word-wrap:break-word}
th{
  background: var(--green) !important;
  color:#fff !important;
  font-weight:800;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact}
.name{text-align:right;width:32%}

/* شريط الإجماليات */
.totals{
  margin-top:10px;
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  gap:8px}
.tot-box{
  border:1px solid var(--border);
  border-radius:10px;
  overflow:hidden}
.tot-head{
  background: var(--green) !important;
  color:#fff !important;
  font-weight:800;
  padding:6px 8px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact}
.tot-val{
  padding:8px;
  font-size:14px;
  font-weight:900;
  color:#111;
  text-align:center}

.words{
  margin-top:14px;
  font-size:14px;
  font-weight:800;
  line-height:1.9}
.fixedline{
  margin-top:10px;
  font-size:14px;
  font-weight:900}
</style>
</head>
<body onload="window.print()">
<div class="invoice">
<h2 style="color:#0f7a36;margin:0">مكتب بسام الشتيمي للتخليص الجمركي</h2>
<h3 style="margin:6px 0 0 0">${esc(s.invoiceTitle || "فاتورة")}</h3>
<div style="font-size:13px;margin:6px 0">
العميل: ${esc(s.customerName||"-")} • رقم الفاتورة: ${esc(s.invoiceNo||"-")}<br>
العملة: ${esc(s.currency)} • التاريخ: ${esc(s.invoiceDate)}
</div>

<table>
<thead>
<tr>
<th>#</th><th class="name">الصنف</th><th>العدد</th>
<th>وزن/كرتون</th><th>قيمة/كرتون</th>
<th>الوزن الكلي</th><th>القيمة الكلية</th>
</tr>
</thead>
<tbody>
${s.items.map((it,i)=>`
<tr>
<td>${i+1}</td>
<td class="name">${esc(it.name)}</td>
<td>${it.qty}</td>
<td>${f2(it.wPer)}</td>
<td>${f2(it.vPer)}</td>
<td>${f2(it.qty*it.wPer)}</td>
<td>${f2(it.qty*it.vPer)}</td>
</tr>`).join("")}
</tbody>
</table>

<div class="totals">
  <div class="tot-box">
    <div class="tot-head">إجمالي العدد</div>
    <div class="tot-val">${q}</div>
  </div>
  <div class="tot-box">
    <div class="tot-head">إجمالي الوزن</div>
    <div class="tot-val">${f2(w)}</div>
  </div>
  <div class="tot-box">
    <div class="tot-head">إجمالي القيمة - ${esc(s.currency)}</div>
    <div class="tot-val">${f2(v)}</div>
  </div>
</div>

<div class="words">${esc(words)}</div>
<div class="fixedline">شامل أجور الشحن والتأمين</div>

</div>
</body></html>`;
  const wdw = window.open("", "_blank");
  wdw.document.write(html);
  wdw.document.close();
}

/* =========================================================
   ===== Calculator (Samsung Layout) - Logic =====
   ========================================================= */
function initCalculator(){
  const openBtn = $("openCalcBtn");
  const closeBtn = $("closeCalcBtn");
  const overlay = $("calcOverlay");
  const modal = $("calcModal");
  const input = $("calcInput");

  if(!openBtn || !overlay || !modal || !input) return;

  const keys = Array.from(modal.querySelectorAll(".calc-key"));

  function openCalc(){
    overlay.style.display = "block";
    modal.style.display = "block";
    overlay.setAttribute("aria-hidden", "false");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => input.focus(), 0);
  }
  function closeCalc(){
    overlay.style.display = "none";
    modal.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
    modal.setAttribute("aria-hidden", "true");
  }

  function safeEval(expr){
    const cleaned = String(expr ?? "").replace(/\s+/g, "");
    if(!/^[0-9+\-*/().%]+$/.test(cleaned)){
      throw new Error("INVALID_EXPR");
    }
    const percentFixed = cleaned.replace(/(\d+(\.\d+)?)%/g, "($1/100)");
    // eslint-disable-next-line no-eval
    const out = eval(percentFixed);
    return out;
  }

  function doEqual(){
    try{
      const result = safeEval(input.value);
      input.value = String(result);
      input.select();
    }catch(e){
      alert("خطأ في العملية. استخدم أرقام و + - × ÷ % ( ) فقط.");
    }
  }

  function addParen(){
    const v = input.value;
    const opens = (v.match(/\(/g) || []).length;
    const closes = (v.match(/\)/g) || []).length;
    input.value += (opens > closes) ? ")" : "(";
    input.focus();
  }

  function togglePM(){
    const v = input.value.trim();
    if(!v) { input.value = "-"; input.focus(); return; }
    if(v.startsWith("-")) input.value = v.slice(1);
    else input.value = "-" + v;
    input.focus();
  }

  function clearAll(){
    input.value = "";
    input.focus();
  }

  openBtn.addEventListener("click", openCalc);
  overlay.addEventListener("click", closeCalc);
  closeBtn && closeBtn.addEventListener("click", closeCalc);

  document.addEventListener("keydown", (e)=>{
    if(modal.style.display === "block" && e.key === "Escape") closeCalc();
    if(modal.style.display === "block" && e.key === "Enter") doEqual();
  });

  keys.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const action = btn.getAttribute("data-action");
      const k = btn.getAttribute("data-k");

      if(action === "clear"){ clearAll(); return; }
      if(action === "paren"){ addParen(); return; }
      if(action === "pm"){ togglePM(); return; }
      if(action === "eq"){ doEqual(); return; }

      if(k){
        input.value += k;
        input.focus();
      }
    });
  });
}

/* ---------- بدء ---------- */
(function boot(){
  enableAutoSave();
  initCloseGuard();

  $("invoiceDate").value = todayISO();

  const st = loadState();
  if(st){
    if($("invoiceTitle")) $("invoiceTitle").value = st.invoiceTitle || "فاتورة";
    $("customerName").value = st.customerName||"";
    $("invoiceNo").value = st.invoiceNo||"";
    $("currency").value = st.currency||"ريال سعودي";
    $("invoiceDate").value = st.invoiceDate||todayISO();
    $("itemsBody").innerHTML="";
    (st.items?.length?st.items:[defaultRow()]).forEach(r=>addRow(r));
  }else{
    if($("invoiceTitle")) $("invoiceTitle").value = "فاتورة";
    addRow(defaultRow());
  }

  update();

  ["invoiceTitle","customerName","invoiceNo","currency","invoiceDate"]
    .filter(id => $(id))
    .forEach(id => $(id).oninput = ()=>{ update(); autoSaveSoon(); });

  $("addRowBtn").onclick=()=>{ addRow(defaultRow()); update(); autoSaveNow(); };
  $("printBtn").onclick=printInvoiceA4;

  initCalculator();
})();
