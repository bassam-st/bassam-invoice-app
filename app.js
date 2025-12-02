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

  // الصوت: ضغط/لمس لبدء التسجيل، وعند الرفع يتوقف
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
// تحديث المجاميع في أسفل الصفحة
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
let voiceTargetRow = null;

function initRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("المتصفح لا يدعم التسجيل الصوتي. جرّب متصفح كروم على أندرويد.");
    return null;
  }

  const rec = new SR();
  rec.lang = "ar-SA";
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.addEventListener("result", (event) => {
    const text = event.results[0][0].transcript;
    if (!voiceTargetRow || !text) return;

    fillRowFromVoice(voiceTargetRow, text);
    updateRowTotals(voiceTargetRow);
    updateTotals();
  });

  rec.addEventListener("end", () => {
    voiceTargetRow = null;
  });

  rec.addEventListener("error", () => {
    voiceTargetRow = null;
  });

  return rec;
}

function startRowVoice(block) {
  if (!recognition) {
    recognition = initRecognition();
  }
  if (!recognition) return;

  voiceTargetRow = block;

  try {
    recognition.start();
  } catch (e) {
    try { recognition.stop(); } catch (_) {}
    setTimeout(() => {
      try { recognition.start(); } catch (_) {}
    }, 250);
  }
}

function stopRowVoice() {
  if (!recognition) return;
  try {
    recognition.stop();
  } catch (_) {}
}

// ================================
// تحليل النص العربي للأرقام
// ================================
function parseArabicNumberWords(text) {
  const map = {
    "صفر": 0, "واحد": 1, "واحدة": 1, "اثنين": 2, "ثنين": 2, "اثنان": 2,
    "ثلاثة": 3, "ثلاث": 3,
    "اربعة": 4, "أربعة": 4,
    "خمسة": 5,
    "ستة": 6,
    "سبعة": 7,
    "ثمانية": 8, "ثمانيه": 8,
    "تسعة": 9,
    "عشرة": 10,
    "عشرين": 20,
    "ثلاثين": 30,
    "اربعين": 40,
    "خمسين": 50,
    "ستين": 60,
    "سبعين": 70,
    "ثمانين": 80,
    "تسعين": 90,
    "مئة": 100, "مية": 100,
    "مائتين": 200,
    "ثلاثمائة": 300,
    "اربعمائة": 400,
    "خمسمائة": 500,
    "ستمائة": 600,
    "سبعمائة": 700,
    "ثمانمائة": 800,
    "تسعمائة": 900,
    "ألف": 1000, "الف": 1000
  };

  let sum = 0;
  const parts = text.split(/\s+/);

  parts.forEach((word) => {
    const clean = word.replace(/[^\u0600-\u06FF0-9\.]/g, "");
    if (map[clean] != null) {
      sum += map[clean];
    } else if (!isNaN(Number(clean))) {
      sum += Number(clean);
    }
  });

  return sum;
}

function extractWeight(text) {
  let grams = text.match(/(\d+(\.\d+)?)\s*(جرام|غرام|g)\b/);
  let kilo = text.match(/(\d+(\.\d+)?)\s*(كيلو|كجم|kg)\b/);

  if (grams) return parseFloat(grams[1]) / 1000;
  if (kilo) return parseFloat(kilo[1]);
  return null;
}

// ================================
// تعبئة السطر من النص الصوتي
// ================================
function fillRowFromVoice(block, text) {
  text = text.replace(/[،٬]/g, " ").trim();

  const descInput = block.querySelector(".desc-input");
  const qtyInput = block.querySelector(".qty-input");
  const weightInput = block.querySelector(".weight-per-carton-input");
  const priceInput = block.querySelector(".price-per-carton-input");

  // الوصف = الجملة كاملة (تقدر تعدله بعدين)
  descInput.value = text;

  // العدد: رقم بعد "عدد / كراتين / كرتون / حبة / حبات"
  let qtyMatch = text.match(/(?:عدد|كراتين|كرتون|كرتونه|حبة|حبات)\s+(\S+)/);
  if (qtyMatch) {
    const q = parseArabicNumberWords(qtyMatch[1]);
    if (q) qtyInput.value = q;
  } else {
    const anyNumber = text.match(/(\d+(\.\d+)?)/);
    if (anyNumber) qtyInput.value = parseFloat(anyNumber[1]);
  }

  const extractedWeight = extractWeight(text);
  if (extractedWeight) {
    weightInput.value = extractedWeight;
  }

  let priceMatch = text.match(/(?:قيمة|سعر)\s+(\S+)/);
  if (priceMatch) {
    const p = parseArabicNumberWords(priceMatch[1]);
    if (p) priceInput.value = p;
  }
}

// ================================
// حفظ الفاتورة في localStorage
// ================================
const STORAGE_KEY = "bassam_invoice_app_invoices";

function getCurrentInvoiceData() {
  const items = [];

  itemsBody.querySelectorAll(".item-block").forEach((block) => {
    const qty = block.querySelector(".qty-input").value || "";
    const desc = block.querySelector(".desc-input").value || "";
    const weightPerCarton =
      block.querySelector(".weight-per-carton-input").value || "";
    const pricePerCarton =
      block.querySelector(".price-per-carton-input").value || "";
    const totalWeight =
      block.querySelector(".total-weight-input").value || "";
    const totalValue = block.querySelector(".total-value-input").value || "";

    if (
      qty !== "" ||
      desc !== "" ||
      weightPerCarton !== "" ||
      pricePerCarton !== ""
    ) {
      items.push({
        qty,
        desc,
        weightPerCarton,
        pricePerCarton,
        totalWeight,
        totalValue,
      });
    }
  });

  return {
    clientName: clientNameInput.value || "",
    invoiceNumber: invoiceNumberInput.value || "",
    currency: currencySelect.value,
    date: invoiceDateInput.value || "",
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
  if (!data.items.length) {
    alert("لا توجد أصناف في الفاتورة لحفظها.");
    return;
  }

  const titleBase =
    data.invoiceNumber ||
    (data.clientName ? data.clientName.slice(0, 20) : "فاتورة بدون رقم");
  const customTitle =
    prompt("اسم الفاتورة للحفظ:", titleBase) || titleBase;

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  const invoice = {
    id: Date.now(),
    title: customTitle,
    ...data,
  };

  stored.push(invoice);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  renderSavedInvoices();
  alert("تم حفظ الفاتورة في هذا الجهاز.");
}

function renderSavedInvoices() {
  savedInvoicesList.innerHTML = "";

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!stored.length) {
    savedInvoicesList.textContent = "لا توجد فواتير محفوظة حتى الآن.";
    return;
  }

  stored.forEach((inv) => {
    const div = document.createElement("div");
    div.className = "saved-item";
    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.style.alignItems = "center";
    div.style.padding = "0.4rem 0";
    div.style.borderBottom = "1px solid #e5e7eb";

    const info = document.createElement("div");
    info.innerHTML = `<strong>${inv.title}</strong><br><small>${inv.date || ""}</small>`;

    const actions = document.createElement("div");
    const loadBtn = document.createElement("button");
    loadBtn.textContent = "عرض";
    loadBtn.style.marginLeft = "0.25rem";
    loadBtn.className = "btn secondary";
    loadBtn.style.padding = "0.2rem 0.6rem";
    loadBtn.style.fontSize = "0.8rem";

    const delBtn = document.createElement("button");
    delBtn.textContent = "حذف";
    delBtn.className = "btn";
    delBtn.style.background = "#ef4444";
    delBtn.style.color = "#fff";
    delBtn.style.padding = "0.2rem 0.6rem";
    delBtn.style.fontSize = "0.8rem";

    loadBtn.addEventListener("click", () => loadInvoice(inv.id));
    delBtn.addEventListener("click", () => deleteInvoice(inv.id));

    actions.appendChild(loadBtn);
    actions.appendChild(delBtn);

    div.appendChild(info);
    div.appendChild(actions);

    savedInvoicesList.appendChild(div);
  });
}

function loadInvoice(id) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const inv = stored.find((x) => x.id === id);
  if (!inv) return;

  clientNameInput.value = inv.clientName || "";
  invoiceNumberInput.value = inv.invoiceNumber || "";
  currencySelect.value = inv.currency || "ريال سعودي";
  totalCurrencyLabel.textContent = currencySelect.value;
  invoiceDateInput.value = inv.date || "";

  itemsBody.innerHTML = "";
  inv.items.forEach((item) => {
    createRow(item);
  });
  updateTotals();
}

function deleteInvoice(id) {
  if (!confirm("هل تريد حذف هذه الفاتورة المحفوظة؟")) return;

  let stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]" );
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
// PWA: زر التثبيت
// ================================
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) {
    installBtn.hidden = false;
  }
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });
}

// ================================
// تهيئة أولية
// ================================
createRow();
renderSavedInvoices();
