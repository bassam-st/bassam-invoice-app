/* ==============================
   Bassam Invoice App - FINAL
   A4 Print + PDF (Stable)
   ============================== */

const STORAGE_KEY = "bassam_invoice_state_v3";

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
    tr.remove(); renumber(); update(); saveState(collectState());
  };
  tr.querySelectorAll("input").forEach(i=>{
    i.oninput=()=>{ update(); saveState(collectState()); };
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

  $("invoicePreview").innerHTML = `
    <div id="invoiceArea">
      <h3 style="margin:0;color:#0f7a36">مكتب بسام الشتيمي للتخليص الجمركي</h3>
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
        <div>إجمالي القيمة: <b>${f2(v)}</b></div>
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

/* ---------- طباعة A4 (القالب المستقل) ---------- */
function printInvoiceA4(){
  const s = collectState();
  const {q,w,v} = totals(s);

  const html = `
<!doctype html><html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>فاتورة</title>
<style>
@page{size:A4;margin:12mm}
body{font-family:Arial,Tahoma;background:#fff}
.invoice{width:100%}
table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px}
th,td{border:1px solid #e5e7eb;padding:6px;text-align:center;word-wrap:break-word}
th{background:#f0fdf4}
.name{text-align:right;width:32%}
</style>
</head>
<body onload="window.print()">
<div class="invoice">
<h2 style="color:#0f7a36;margin:0">مكتب بسام الشتيمي للتخليص الجمركي</h2>
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
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px">
<div>إجمالي العدد: <b>${q}</b></div>
<div>إجمالي الوزن: <b>${f2(w)}</b></div>
<div>إجمالي القيمة: <b>${f2(v)}</b></div>
</div>
</div>
</body></html>`;
  const wdw = window.open("", "_blank");
  wdw.document.write(html);
  wdw.document.close();
}

/* ---------- بدء ---------- */
(function boot(){
  $("invoiceDate").value = todayISO();

  const st = loadState();
  if(st){
    $("customerName").value = st.customerName||"";
    $("invoiceNo").value = st.invoiceNo||"";
    $("currency").value = st.currency||"ريال سعودي";
    $("invoiceDate").value = st.invoiceDate||todayISO();
    $("itemsBody").innerHTML="";
    (st.items?.length?st.items:[defaultRow()]).forEach(r=>addRow(r));
  }else{
    addRow(defaultRow());
  }

  update();
  ["customerName","invoiceNo","currency","invoiceDate"]
    .forEach(id=>$(id).oninput=update);

  $("addRowBtn").onclick=()=>{ addRow(defaultRow()); update(); };
  $("printBtn").onclick=printInvoiceA4;
})();
