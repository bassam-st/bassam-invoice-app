// ================================
// العناصر الرئيسية
// ================================
const itemsBody = document.getElementById("itemsBody");
const totalQtyEl = document.getElementById("totalQty");
const totalWeightEl = document.getElementById("totalWeight");
const totalValueEl = document.getElementById("totalValue");
const totalCurrencyLabel = document.getElementById("totalCurrencyLabel");

const clientNameInput = document.getElementById("clientName");
const invoiceNumberInput = document.getElementById("invoiceNumber");
const currencySelect = document.getElementById("currencySelect");
const invoiceDateInput = document.getElementById("invoiceDate");

const addRowBtn = document.getElementById("addRowBtn");
const printBtn = document.getElementById("printBtn");
const pdfBtn = document.getElementById("pdfBtn");
const saveInvoiceBtn = document.getElementById("saveInvoiceBtn");
const installBtn = document.getElementById("installBtn");

const savedInvoicesList = document.getElementById("savedInvoicesList");

// ================================
// إعداد التاريخ الافتراضي
// ================================
(function setToday() {
  const today = new Date().toISOString().slice(0, 10);
  invoiceDateInput.value = today;
})();

// ================================
// تغيير العملة في إجمالي القيمة
// ================================
currencySelect.addEventListener("change", () => {
  totalCurrencyLabel.textContent = currencySelect.value;
});

// ================================
// إنشاء صف جديد (سطر + سطر زر الصوت)
// ================================
function createRow(initial = {}) {
  const block = document.createElement("tbody");
  block.classList.add("item-block");

  block.innerHTML = `
    <tr>
      <td><input type="number" class="qty-input" value="${initial.qty ?? ""}" placeholder="0" /></td>
      <td><input type="text" class="desc-input" value="${initial.desc ?? ""}" placeholder="وصف الصنف" /></td>
      <td><input type="number" class="weight-per-carton-input" value="${initial.weightPerCarton ?? ""}" placeholder="0" /></td>
      <td><input type="number" class="price-per-carton-input" value="${initial.pricePerCarton ?? ""}" placeholder="0" /></td>
      <td><input type="number" class="total-weight-input" value="${initial.totalWeight ?? ""}" placeholder="0" readonly /></td>
      <td><input type="number" class="total-value-input" value="${initial.totalValue ?? ""}" placeholder="0" readonly /></td>
      <td><button class="delete-btn">✕</button></td>
    </tr>

    <tr>
      <td colspan="7">
        <div class="row-voice-section">
          <button class="voice-btn">🎤 تسجيل هذا السطر</button>
        </div>
      </td>
    </tr>
  `;

  itemsBody.appendChild(block);
  attachRowEvents(block);
  updateRowTotals(block);
  updateTotals();
}

// ================================
// ربط أحداث كل صف
// ================================
function attachRowEvents(block) {
  const qtyInput = block.querySelector(".qty-input");
  const descInput = block.querySelector(".desc-input");
  const weightInput = block.querySelector(".weight-per-carton-input");
  const priceInput = block.querySelector(".price-per-carton-input");
  const deleteBtn = block.querySelector(".delete-btn");
  const voiceBtn = block.querySelector(".voice-btn");

  [qtyInput, descInput, weightInput, priceInput].forEach((input) => {
    input.addEventListener("input", () => {
      updateRowTotals(block);
      updateTotals();
    });
  });

  deleteBtn.addEventListener("click", () => {
    if (confirm("هل تريد حذف هذا السطر؟")) {
      block.remove();
      updateTotals();
    }
  });

  voiceBtn.addEventListener("mousedown", () => startRowVoice(block));
  voiceBtn.addEventListener("touchstart", (e) => { e.preventDefault(); startRowVoice(block); });

  voiceBtn.addEventListener("mouseup", stopRowVoice);
  voiceBtn.addEventListener("mouseleave", stopRowVoice);
  voiceBtn.addEventListener("touchend", stopRowVoice);
}

// ================================
// حساب وزن وقيمة السطر
// ================================
function updateRowTotals(block) {
  const qty = parseFloat(block.querySelector(".qty-input").value) || 0;
  const weightPer = parseFloat(block.querySelector(".weight-per-carton-input").value) || 0;
  const pricePer = parseFloat(block.querySelector(".price-per-carton-input").value) || 0;

  const totalWeight = qty * weightPer;
  const totalValue = qty * pricePer;

  block.querySelector(".total-weight-input").value = totalWeight ? totalWeight.toFixed(2) : "";
  block.querySelector(".total-value-input").value = totalValue ? totalValue.toFixed(2) : "";
}

// ================================
// تحديث المجاميع
// ================================
function updateTotals() {
  let totalQty = 0, totalWeight = 0, totalValue = 0;

  itemsBody.querySelectorAll(".item-block").forEach((block) => {
    totalQty += parseFloat(block.querySelector(".qty-input").value) || 0;
    totalWeight += parseFloat(block.querySelector(".total-weight-input").value) || 0;
    totalValue += parseFloat(block.querySelector(".total-value-input").value) || 0;
  });

  totalQtyEl.textContent = totalQty;
  totalWeightEl.textContent = totalWeight.toFixed(2);
  totalValueEl.textContent = totalValue.toFixed(2);
}

// ================================
// ذكاء الصوت
// ================================
let recognition = null;
let voiceTargetRow = null;

function initRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("⚠️ المتصفح لا يدعم التسجيل الصوتي — استخدم Google Chrome.");
    return null;
  }

  const rec = new SR();
  rec.lang = "ar-SA";
  rec.interimResults = false;

  rec.addEventListener("result", (event) => {
    const text = event.results[0][0].transcript;
    if (voiceTargetRow) {
      fillRowFromVoice(voiceTargetRow, text);
      updateRowTotals(voiceTargetRow);
      updateTotals();
    }
  });

  rec.addEventListener("end", () => (voiceTargetRow = null));

  return rec;
}

function startRowVoice(block) {
  if (!recognition) recognition = initRecognition();
  if (!recognition) return;

  voiceTargetRow = block;

  try { recognition.start(); }
  catch {
    try { recognition.stop(); } catch {}
    setTimeout(() => { try { recognition.start(); } catch {} }, 200);
  }
}

function stopRowVoice() {
  if (recognition) {
    try { recognition.stop(); } catch {}
  }
}

// ================================
// تحليل الأرقام والكلمات العربية
// ================================
function parseArabicNumberWords(text) {
  const map = {
    "صفر": 0, "واحد": 1, "واحدة": 1, "اثنين": 2, "ثنين": 2,
    "ثلاثة": 3, "ثلاث": 3, "اربعة": 4, "أربعة": 4,
    "خمسة": 5, "ستة": 6, "سبعة": 7, "ثمانية": 8, "تسعة": 9,
    "عشرة": 10, "عشرين": 20, "ثلاثين": 30, "اربعين": 40,
    "خمسين": 50, "ستين": 60, "سبعين": 70, "ثمانين": 80,
    "تسعين": 90, "مئة": 100, "مية": 100, "مائتين": 200,
    "ثلاثمائة": 300, "اربعمائة": 400, "خمسمائة": 500,
    "ستمائة": 600, "سبعمائة": 700, "ثمانمائة": 800,
    "تسعمائة": 900, "ألف": 1000, "الف": 1000
  };

  let sum = 0;
  text.split(/\s+/).forEach((word) => {
    const clean = word.replace(/[^\u0600-\u06FF0-9\.]/g, "");
    if (map[clean] != null) sum += map[clean];
    else if (!isNaN(Number(clean))) sum += Number(clean);
  });
  return sum;
}

function extractWeight(text) {
  let g = text.match(/(\d+(\.\d+)?)\s*(جرام|غرام|g)/);
  let kg = text.match(/(\d+(\.\d+)?)\s*(كيلو|كجم|kg)/);
  if (g) return parseFloat(g[1]) / 1000;
  if (kg) return parseFloat(kg[1]);
  return null;
}

// ================================
// تعبئة السطر من الكلام
// ================================
function fillRowFromVoice(block, text) {
  text = text.replace(/[،٬]/g, " ");

  block.querySelector(".desc-input").value = text;

  const qtyInput = block.querySelector(".qty-input");
  const weightInput = block.querySelector(".weight-per-carton-input");
  const priceInput = block.querySelector(".price-per-carton-input");

  const q = parseArabicNumberWords(text);
  if (q) qtyInput.value = q;

  const w = extractWeight(text);
  if (w) weightInput.value = w;

  let priceMatch = text.match(/(?:سعر|قيمة)\s+(\S+)/);
  if (priceMatch) {
    const p = parseArabicNumberWords(priceMatch[1]);
    if (p) priceInput.value = p;
  }
}

// ================================
// حفظ الفواتير
// ================================
const STORAGE_KEY = "bassam_invoice_app_invoices";

function getCurrentInvoiceData() {
  const items = [];

  itemsBody.querySelectorAll(".item-block").forEach((block) => {
    const entry = {
      qty: block.querySelector(".qty-input").value,
      desc: block.querySelector(".desc-input").value,
      weightPerCarton: block.querySelector(".weight-per-carton-input").value,
      pricePerCarton: block.querySelector(".price-per-carton-input").value,
      totalWeight: block.querySelector(".total-weight-input").value,
      totalValue: block.querySelector(".total-value-input").value,
    };

    if (entry.qty || entry.desc || entry.weightPerCarton || entry.pricePerCarton)
      items.push(entry);
  });

  return {
    clientName: clientNameInput.value,
    invoiceNumber: invoiceNumberInput.value,
    currency: currencySelect.value,
    date: invoiceDateInput.value,
    totals: {
      qty: totalQtyEl.textContent,
      weight: totalWeightEl.textContent,
      value: totalValueEl.textContent,
    },
    items,
  };
}

function saveCurrentInvoice() {
  const data = getCurrentInvoiceData();
  if (!data.items.length) return alert("لا توجد أصناف للحفظ.");

  const titleBase =
    data.invoiceNumber || (data.clientName ? data.clientName.slice(0, 20) : "فاتورة");

  const title = prompt("اسم الفاتورة:", titleBase) || titleBase;

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  stored.push({ id: Date.now(), title, ...data });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  renderSavedInvoices();
  alert("تم حفظ الفاتورة.");
}

function renderSavedInvoices() {
  savedInvoicesList.innerHTML = "";
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  if (!stored.length) {
    savedInvoicesList.textContent = "لا توجد فواتير محفوظة.";
    return;
  }

  stored.forEach((inv) => {
    const div = document.createElement("div");
    div.style.padding = "4px 0";
    div.style.borderBottom = "1px solid #ddd";
    div.style.display = "flex";
    div.style.justifyContent = "space-between";

    div.innerHTML = `
      <div>
        <strong>${inv.title}</strong><br>
        <small>${inv.date}</small>
      </div>
      <div>
        <button class="btn secondary" style="padding:2px 8px;font-size:12px" onclick="loadInvoice(${inv.id})">عرض</button>
        <button class="btn" style="background:#ef4444;color:white;padding:2px 8px;font-size:12px" onclick="deleteInvoice(${inv.id})">حذف</button>
      </div>
    `;

    savedInvoicesList.appendChild(div);
  });
}

function loadInvoice(id) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const inv = stored.find((x) => x.id === id);
  if (!inv) return;

  clientNameInput.value = inv.clientName;
  invoiceNumberInput.value = inv.invoiceNumber;
  currencySelect.value = inv.currency;
  totalCurrencyLabel.textContent = inv.currency;
  invoiceDateInput.value = inv.date;

  itemsBody.innerHTML = "";
  inv.items.forEach((item) => createRow(item));

  updateTotals();
}

function deleteInvoice(id) {
  if (!confirm("تأكيد الحذف؟")) return;

  let stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  stored = stored.filter((x) => x.id !== id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  renderSavedInvoices();
}

// ================================
// أزرار التطبيق
// ================================
addRowBtn.addEventListener("click", () => createRow());
printBtn.addEventListener("click", () => window.print());
pdfBtn.addEventListener("click", () => window.print());
saveInvoiceBtn.addEventListener("click", saveCurrentInvoice);

// ================================
// PWA
// ================================
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;

  deferredPrompt = null;
  installBtn.hidden = true;
});

// ================================
// تهيئة
// ================================
createRow();
renderSavedInvoices();
