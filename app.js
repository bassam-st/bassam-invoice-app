const STORAGE_KEY = "bassam_invoice_draft_v2";

function qs(id){ return document.getElementById(id); }

function format2(n){
  const x = Number(n || 0);
  return x.toFixed(2);
}
function todayISO(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function isStandalone(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
}
function safeNumber(v){
  const x = Number(String(v ?? "").replace(/,/g,"").trim());
  return Number.isFinite(x) ? x : 0;
}
function defaultRow(){ return { name:"", qty:0, wPer:0, vPer:0 }; }

function loadDraft(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch{ return null; }
}
function saveDraft(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function collectState(){
  const state = {
    customerName: qs("customerName")?.value?.trim() || "",
    invoiceNo: qs("invoiceNo")?.value?.trim() || "",
    currency: qs("currency")?.value || "ريال سعودي",
    invoiceDate: qs("invoiceDate")?.value || todayISO(),
    items: []
  };
  const rows = Array.from(document.querySelectorAll("tr[data-row='1']"));
  for(const tr of rows){
    const name = tr.querySelector("input[data-k='name']")?.value?.trim() || "";
    const qty  = safeNumber(tr.querySelector("input[data-k='qty']")?.value);
    const wPer = safeNumber(tr.querySelector("input[data-k='wPer']")?.value);
    const vPer = safeNumber(tr.querySelector("input[data-k='vPer']")?.value);
    state.items.push({name, qty, wPer, vPer});
  }
  return state;
}

function computeTotals(state){
  let sumQty=0, sumW=0, sumV=0;
  state.items.forEach(it=>{
    const qty = safeNumber(it.qty);
    const wPer = safeNumber(it.wPer);
    const vPer = safeNumber(it.vPer);
    sumQty += qty;
    sumW += qty * wPer;
    sumV += qty * vPer;
  });
  return {sumQty,sumW,sumV};
}

function renumber(){
  const rows = Array.from(document.querySelectorAll("tr[data-row='1']"));
  rows.forEach((tr,i)=> tr.querySelector(".idx").textContent = String(i+1));
}

function addRow(row = defaultRow()){
  const body = qs("itemsBody");
  const tr = document.createElement("tr");
  tr.setAttribute("data-row","1");
  tr.innerHTML = `
    <td class="idx">0</td>
    <td><input data-k="name" type="text" placeholder="اسم الصنف" value="${escapeHtml(row.name)}"></td>
    <td><input data-k="qty" type="number" inputmode="decimal" min="0" step="1" value="${row.qty ?? 0}"></td>
    <td><input data-k="wPer" type="number" inputmode="decimal" min="0" step="0.01" value="${row.wPer ?? 0}"></td>
    <td><input data-k="vPer" type="number" inputmode="decimal" min="0" step="0.01" value="${row.vPer ?? 0}"></td>
    <td class="wTotal">0.00</td>
    <td class="vTotal">0.00</td>
    <td class="row-actions"><button type="button" title="حذف">×</button></td>
  `;
  tr.querySelector(".row-actions button").addEventListener("click", () => {
    tr.remove();
    renumber();
    updatePreviewAndTotals();
    saveDraft(collectState());
  });
  tr.querySelectorAll("input").forEach(inp=>{
    inp.addEventListener("input", () => {
      updatePreviewAndTotals();
      saveDraft(collectState());
    });
  });
  body.appendChild(tr);
  renumber();
}

function renderInvoiceHTML(state, {forPrint=false}={}){
  const {sumQty,sumW,sumV} = computeTotals(state);
  const rows = (state.items||[]).filter(x => (x.name||"").trim() !== "");

  const itemsRows = rows.length ? rows.map((it,i)=>{
    const qty = safeNumber(it.qty);
    const wPer = safeNumber(it.wPer);
    const vPer = safeNumber(it.vPer);
    return `
      <tr>
        <td>${i+1}</td>
        <td style="text-align:right">${escapeHtml(it.name)}</td>
        <td>${qty}</td>
        <td>${format2(wPer)}</td>
        <td>${format2(vPer)}</td>
        <td>${format2(qty*wPer)}</td>
        <td>${format2(qty*vPer)}</td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="7" style="text-align:center;color:#64748b;padding:14px">لا توجد أصناف</td></tr>`;

  const wrapClass = forPrint ? "print-card" : "";

  return `
    <section class="card ${wrapClass}" id="invoiceArea">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <div style="font-weight:900;color:#0f7a36;font-size:18px">مكتب بسام الشتيمي للتخليص الجمركي</div>
          <div style="color:#64748b;font-size:13px;margin-top:6px">
            جوال: <b>00967771997809</b> • البريد: <b>Bassam.7111111@gmail.com</b>
          </div>
        </div>
        <div style="background:#ecfdf5;border:1px solid #bbf7d0;color:#0f7a36;padding:8px 10px;border-radius:14px;font-weight:900">
          فاتورة
        </div>
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0"/>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><b>اسم العميل:</b> ${escapeHtml(state.customerName || "-")}</div>
        <div><b>رقم الفاتورة:</b> ${escapeHtml(state.invoiceNo || "-")}</div>
        <div><b>العملة:</b> ${escapeHtml(state.currency || "-")}</div>
        <div><b>التاريخ:</b> ${escapeHtml(state.invoiceDate || "-")}</div>
      </div>

      <div style="margin-top:12px;border:1px solid #e5e7eb;border-radius:14px;overflow:auto">
        <table style="width:100%;border-collapse:collapse;min-width:720px">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:10px;border-bottom:1px solid #e5e7eb">#</th>
              <th style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right">الصنف</th>
              <th style="padding:10px;border-bottom:1px solid #e5e7eb">العدد</th>
              <th style="padding:10px;border-bottom:1px solid #e5e7eb">وزن/كرتون</th>
              <th style="padding:10px;border-bottom:1px solid #e5e7eb">قيمة/كرتون</th>
              <th style="padding:10px;border-bottom:1px solid #e5e7eb">الوزن الكلي</th>
              <th style="padding:10px;border-bottom:1px solid #e5e7eb">القيمة الكلية</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
      </div>

      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px">
          <div style="color:#64748b">إجمالي العدد:</div>
          <div style="font-weight:900;font-size:18px">${sumQty}</div>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px">
          <div style="color:#64748b">إجمالي الوزن (كجم):</div>
          <div style="font-weight:900;font-size:18px">${format2(sumW)}</div>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px">
          <div style="color:#64748b">إجمالي القيمة (${escapeHtml(state.currency)}):</div>
          <div style="font-weight:900;font-size:18px">${format2(sumV)}</div>
        </div>
      </div>
    </section>
  `;
}

function updatePreviewAndTotals(){
  const state = collectState();

  const rows = Array.from(document.querySelectorAll("tr[data-row='1']"));
  rows.forEach((tr,i)=>{
    const it = state.items[i] || defaultRow();
    const qty = safeNumber(it.qty);
    const wPer = safeNumber(it.wPer);
    const vPer = safeNumber(it.vPer);
    tr.querySelector(".wTotal").textContent = format2(qty*wPer);
    tr.querySelector(".vTotal").textContent = format2(qty*vPer);
  });

  const {sumQty,sumW,sumV} = computeTotals(state);
  qs("sumQty").textContent = String(sumQty);
  qs("sumWeight").textContent = format2(sumW);
  qs("sumValue").textContent = format2(sumV);

  qs("invoicePreview").innerHTML = renderInvoiceHTML(state, {forPrint:false});
  saveDraft(state);
}

function openPrintTab(){
  const state = collectState();
  saveDraft(state);

  const url = new URL(location.href);
  url.searchParams.set("print","1");
  window.open(url.toString(), "_blank");
}

function doPrintInThisTab(){
  const draft = loadDraft() || {items:[defaultRow()], invoiceDate: todayISO(), currency:"ريال سعودي"};
  document.body.innerHTML = `<div class="container">${renderInvoiceHTML(draft,{forPrint:true})}</div>`;
  setTimeout(()=>window.print(), 350);
}

function downloadPdfDirect(){
  const state = collectState();
  saveDraft(state);

  const invoiceEl = document.getElementById("invoiceArea");
  if(!invoiceEl){ alert("لم يتم العثور على منطقة الفاتورة."); return; }

  const filename = `فاتورة-${(state.invoiceNo || "بدون-رقم")}.pdf`;

  if(typeof html2pdf === "undefined"){
    alert("مكتبة PDF لم تُحمّل. تأكد من الاتصال بالإنترنت ثم حاول.");
    return;
  }

  html2pdf().set({
    margin: 10,
    filename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(invoiceEl).save();
}

// --------- تسجيل الصوت (ملف صوتي) ----------
let mediaRecorder = null;
let recChunks = [];
let recStream = null;

async function startRecording(){
  if(!navigator.mediaDevices?.getUserMedia){
    alert("جهازك لا يدعم تسجيل الصوت في المتصفح.");
    return;
  }
  try{
    recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recChunks = [];

    const options = {};
    mediaRecorder = new MediaRecorder(recStream, options);

    mediaRecorder.ondataavailable = (e) => {
      if(e.data && e.data.size > 0) recChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const url = URL.createObjectURL(blob);

      const audio = qs("recAudio");
      audio.src = url;
      audio.style.display = "block";

      const link = qs("recDownloadLink");
      link.href = url;
      link.download = `voice-note-${Date.now()}.webm`;
      link.style.display = "inline-flex";

      // إيقاف المايك
      if(recStream){
        recStream.getTracks().forEach(t => t.stop());
        recStream = null;
      }
    };

    mediaRecorder.start();

    qs("recStartBtn").disabled = true;
    qs("recStopBtn").disabled = false;
  }catch(e){
    alert("لم يتم السماح بالميكروفون أو حدث خطأ في التسجيل.");
  }
}

function stopRecording(){
  try{
    if(mediaRecorder && mediaRecorder.state !== "inactive"){
      mediaRecorder.stop();
    }
  }catch{}
  qs("recStartBtn").disabled = false;
  qs("recStopBtn").disabled = true;
}

// ---- تشغيل ----
(function boot(){
  const params = new URLSearchParams(location.search);
  if(params.get("print") === "1"){
    doPrintInThisTab();
    return;
  }

  qs("invoiceDate").value = todayISO();

  const draft = loadDraft();
  if(draft){
    qs("customerName").value = draft.customerName || "";
    qs("invoiceNo").value = draft.invoiceNo || "";
    qs("currency").value = draft.currency || "ريال سعودي";
    qs("invoiceDate").value = draft.invoiceDate || todayISO();

    qs("itemsBody").innerHTML = "";
    (draft.items?.length ? draft.items : [defaultRow()]).forEach(r => addRow(r));
  }else{
    addRow(defaultRow());
  }

  updatePreviewAndTotals();

  qs("addRowBtn").addEventListener("click", () => {
    addRow(defaultRow());
    updatePreviewAndTotals();
  });

  ["customerName","invoiceNo","currency","invoiceDate"].forEach(id=>{
    qs(id).addEventListener("input", updatePreviewAndTotals);
    qs(id).addEventListener("change", updatePreviewAndTotals);
  });

  qs("downloadPdfBtn").addEventListener("click", downloadPdfDirect);

  qs("printBtn").addEventListener("click", () => {
    if(isStandalone()){
      openPrintTab();
      return;
    }
    window.print();
  });

  qs("closeBtn").addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));

  // تسجيل الصوت
  qs("recStartBtn").addEventListener("click", startRecording);
  qs("recStopBtn").addEventListener("click", stopRecording);

  // Service Worker واحد فقط
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
})();
