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

// تغيير العملة في المجاميع
currencySelect.addEventListener("change", () => {
  totalCurrencyLabel.textContent = currencySelect.value;
});

// ================================
// إنشاء صف جديد (سطر + سطر زر المايك)
// ================================
function createRow(initial = {}) {
  const block = document.createElement("tbody");
  block.classList.add("item-block");

  block.innerHTML = `
    <tr>
      <td>
        <input type="number" class="qty-input" value="${initial.qty ?? ""}" placeholder="0" />
      </td>

      <td>
        <input type="text" class="desc-input" value="${initial.desc ?? ""}" placeholder="وصف الصنف" />
      </td>

      <td>
        <input type="number" class="weight-per-carton-input" value="${initial.weightPerCarton ?? ""}" placeholder="0" />
      </td>

      <td>
        <input type="number" class="price-per-carton-input" value="${initial.pricePerCarton ?? ""}" placeholder="0" />
      </td>

      <td>
        <input type="number" class="total-weight-input" value="${initial.totalWeight ?? ""}" placeholder="0" readonly />
      </td>

      <td>
        <input type="number" class="total-value-input" value="${initial.totalValue ?? ""}" placeholder="0" readonly />
      </td>

      <td>
        <button class="delete-btn">✕</button>
      </td>
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

  [qtyInput, descInput, weightInput, priceInput].forEach((input) => {
    input.addEventListener("input", () => {
      updateRowTotals(block);
      updateTotals();
    });
  });

  const deleteBtn = block.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => {
    if (confirm("هل تريد حذف هذا السطر؟")) {
      block.remove();
      updateTotals();
    }
  });

  // زر المايك لهذا السطر
  const voiceBtn = block.querySelector(".voice-btn");
  voiceBtn.addEventListener("mousedown", () => startRowVoice(block));
  voiceBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startRowVoice(block);
  });

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

  block.querySelector(".total-weight-input").value =
    totalWeight ? totalWeight.toFixed(2) : "";
  block.querySelector(".total-value-input").value =
    totalValue ? totalValue.toFixed(2) : "";
}

// ================================
// تحديث المجاميع
// ================================
function updateTotals() {
  let totalQty = 0;
  let totalWeight = 0;
  let totalValue = 0;

  itemsBody.querySelectorAll(".item-block").forEach((block) => {
    const qty = parseFloat(block.querySelector(".qty-input").value) || 0;
    const w = parseFloat(block.querySelector(".total-weight-input").value) || 0;
    const v = parseFloat(block.querySelector(".total-value-input").value) || 0;

    totalQty += qty;
    totalWeight += w;
    totalValue += v;
  });

  totalQtyEl.textContent = totalQty;
  totalWeightEl.textContent = totalWeight.toFixed(2);
  totalValueEl.textContent = totalValue.toFixed(2);
}

// ================================
// ذكاء الصوت
// ================================
let recognition = null;
let voiceTargetBlock = null;

function initRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("المتصفح لا يدعم التسجيل الصوتي. يُفضّل استخدام متصفح Chrome على أندرويد.");
    return null;
  }

  const rec = new SR();
  rec.lang = "ar-SA";
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.addEventListener("result", (event) => {
    const text = event.results[0][0].transcript;
    if (!voiceTargetBlock || !text) return;
    fillRowFromVoice(voiceTargetBlock, text);
    updateRowTotals(voiceTargetBlock);
    updateTotals();
  });

  rec.addEventListener("error", () => {
    // خطأ بسيط، نوقف فقط
    try { rec.stop(); } catch (_) {}
  });

  return rec;
}

function startRowVoice(block) {
  if (!recognition) recognition = initRecognition();
  if (!recognition) return;

  voiceTargetBlock = block;
  try {
    recognition.start();
  } catch (_) {
    // في حال كان يعمل بالفعل
  }
}

function stopRowVoice() {
  if (recognition) {
    try {
      recognition.stop();
    } catch (_) {}
  }
}

// ================================
// تحليل الكلام وملء الحقول
// ================================
function parseArabicNumberWords(text) {
  const map = {
    "صفر": 0, "واحد": 1, "إثنين": 2, "اثنين": 2, "ثنين": 2,
    "ثلاثة": 3, "اربعة": 4, "أربعة": 4, "خمسة": 5, "ستة": 6,
    "سبعة": 7, "ثمانية": 8, "تسعة": 9, "عشرة": 10,
    "عشرين": 20, "ثلاثين": 30, "اربعين": 40, "خمسين": 50,
    "ستين": 60, "سبعين": 70, "ثمانين": 80, "تسعين": 90,
    "مئة": 100, "مية": 100, "مائتين": 200,
    "ثلاثمائة": 300, "اربعمائة": 400, "خمسمائة": 500,
    "ستمائة": 600, "سبعمائة": 700, "ثمانمائة": 800,
    "تسعمائة": 900, "ألف": 1000, "الف": 1000
  };

  let sum = 0;
  const parts = text.split(/\s+/);

  parts.forEach((word) => {
    if (map[word] != null) {
      sum += map[word];
    } else if (!isNaN(Number(word))) {
      sum += Number(word);
    }
  });

  return sum;
}

function extractWeight(text) {
  let grams = text.match(/(\d+)\s*(جرام|غرام|g)/);
  let kilo = text.match(/(\d+(\.\d+)?)\s*(كيلو|كجم|kg)/);

  if (grams) return parseFloat(grams[1]) / 1000;
  if (kilo) return parseFloat(kilo[1]);
  return null;
}

function fillRowFromVoice(block, text) {
  text = text.toLowerCase();

  const descInput = block.querySelector(".desc-input");
  const qtyInput = block.querySelector(".qty-input");
  const weightInput = block.querySelector(".weight-per-carton-input");
  const priceInput = block.querySelector(".price-per-carton-input");

  // الصنف = كل النص
  descInput.value = text;

  // استخراج عدد (نجرب مرة، لو ما في يبقى كما هو)
  const qty = parseArabicNumberWords(text);
  if (qty && !qtyInput.value) qtyInput.value = qty;

  // استخراج الوزن
  const w = extractWeight(text);
  if (w && !weightInput.value) weightInput.value = w;

  // نجرب نعتبر آخر رقم هو السعر
  const numbers = text.match(/(\d+(\.\d+)?)/g);
  if (numbers && numbers.length > 0) {
    const lastNumber = parseFloat(numbers[numbers.length - 1]);
    if (!isNaN(lastNumber)) {
      priceInput.value = lastNumber;
    }
  }
}

// ================================
// الفواتير المحفوظة (localStorage)
// ================================
const STORAGE_KEY = "bassam_invoice_app_invoices";

function loadSavedInvoices() {
  let data = [];
  try {
    data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    data = [];
  }
  renderSavedInvoices(data);
}

function renderSavedInvoices(invoices) {
  savedInvoicesList.innerHTML = "";

  if (!invoices.length) {
    savedInvoicesList.innerHTML = "<p>لا توجد فواتير محفوظة حتى الآن.</p>";
    return;
  }

  invoices.forEach((inv, index) => {
    const card = document.createElement("div");
    card.className = "saved-invoice-card";
    card.style.border = "1px solid #e5e7eb";
    card.style.borderRadius = "0.75rem";
    card.style.padding = "0.6rem 0.8rem";
    card.style.marginBottom = "0.5rem";
    card.style.fontSize = "0.85rem";
    card.innerHTML = `
      <div><strong>عميل:</strong> ${inv.clientName || "بدون اسم"}</div>
      <div><strong>رقم:</strong> ${inv.invoiceNumber || "-"}</div>
      <div><strong>تاريخ:</strong> ${inv.invoiceDate || "-"}</div>
      <div style="margin-top:0.3rem;">إجمالي: ${inv.totalValue || 0} (${inv.currency})</div>
      <div style="margin-top:0.4rem; display:flex; gap:0.4rem;">
        <button data-index="${index}" class="btn-load-saved">📄 فتح</button>
        <button data-index="${index}" class="btn-delete-saved">🗑 حذف</button>
      </div>
    `;
    savedInvoicesList.appendChild(card);
  });

  // فتح فاتورة
  savedInvoicesList
    .querySelectorAll(".btn-load-saved")
    .forEach((btn) =>
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        loadInvoiceByIndex(index);
      })
    );

  // حذف فاتورة
  savedInvoicesList
    .querySelectorAll(".btn-delete-saved")
    .forEach((btn) =>
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        deleteInvoiceByIndex(index);
      })
    );
}

function saveCurrentInvoice() {
  const items = [];
  itemsBody.querySelectorAll(".item-block").forEach((block) => {
    items.push({
      qty: block.querySelector(".qty-input").value,
      desc: block.querySelector(".desc-input").value,
      weightPerCarton: block.querySelector(".weight-per-carton-input").value,
      pricePerCarton: block.querySelector(".price-per-carton-input").value,
      totalWeight: block.querySelector(".total-weight-input").value,
      totalValue: block.querySelector(".total-value-input").value
    });
  });

  const invoice = {
    clientName: clientNameInput.value,
    invoiceNumber: invoiceNumberInput.value,
    currency: currencySelect.value,
    invoiceDate: invoiceDateInput.value,
    totalQty: totalQtyEl.textContent,
    totalWeight: totalWeightEl.textContent,
    totalValue: totalValueEl.textContent,
    items
  };

  let data = [];
  try {
    data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    data = [];
  }

  data.push(invoice);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  alert("تم حفظ الفاتورة في هذا الجهاز.");
  renderSavedInvoices(data);
}

function loadInvoiceByIndex(index) {
  let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  const inv = data[index];
  if (!inv) return;

  clientNameInput.value = inv.clientName || "";
  invoiceNumberInput.value = inv.invoiceNumber || "";
  currencySelect.value = inv.currency || "ريال سعودي";
  invoiceDateInput.value = inv.invoiceDate || new Date().toISOString().slice(0, 10);
  totalCurrencyLabel.textContent = currencySelect.value;

  itemsBody.innerHTML = "";
  (inv.items || []).forEach((row) => createRow(row));
  updateTotals();
}

function deleteInvoiceByIndex(index) {
  let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  data.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderSavedInvoices(data);
}

// ================================
// PWA install
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
// أزرار التطبيق
// ================================
addRowBtn.addEventListener("click", () => createRow());
printBtn.addEventListener("click", () => window.print());
pdfBtn.addEventListener("click", () => window.print());
saveInvoiceBtn.addEventListener("click", saveCurrentInvoice);

// ================================
// بدء التطبيق
// ================================
createRow();
loadSavedInvoices();
