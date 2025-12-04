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

// إعداد التاريخ الافتراضي
(function setToday() {
  const today = new Date().toISOString().slice(0, 10);
  invoiceDateInput.value = today;
})();

// تغيير العملة في النص أسفل
currencySelect.addEventListener("change", () => {
  totalCurrencyLabel.textContent = currencySelect.value;
});

// دالة تصغير/تكبير خانة الوصف تلقائياً
function autoResizeDesc(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// ================================
// إنشاء صف جديد (صف بيانات + صف زر تسجيل)
// ================================
function createRow(initial = {}) {
  // صف البيانات
  const dataRow = document.createElement("tr");
  dataRow.classList.add("item-row");

  dataRow.innerHTML = `
    <td>
      <input type="number" min="0" step="1"
             class="qty-input"
             value="${initial.qty ?? ""}" placeholder="0" />
    </td>
    <td>
      <textarea
        class="desc-input"
        rows="1"
        placeholder="وصف الصنف">${(initial.desc ?? "")}</textarea>
    </td>
    <td>
      <input type="number" min="0" step="0.01"
             class="weight-per-carton-input"
             value="${initial.weightPerCarton ?? ""}" placeholder="0" />
    </td>
    <td>
      <input type="number" min="0" step="0.01"
             class="price-per-carton-input"
             value="${initial.pricePerCarton ?? ""}" placeholder="0" />
    </td>
    <td>
      <input type="number" min="0" step="0.01"
             class="total-weight-input"
             value="${initial.totalWeight ?? ""}" placeholder="0" readonly />
    </td>
    <td>
      <input type="number" min="0" step="0.01"
             class="total-value-input"
             value="${initial.totalValue ?? ""}" placeholder="0" readonly />
    </td>
    <td>
      <button type="button" class="delete-btn">✕</button>
    </td>
  `;

  // صف زر التسجيل الصوتي لهذا السطر
  const voiceRow = document.createElement("tr");
  voiceRow.classList.add("voice-row");
  voiceRow.innerHTML = `
    <td colspan="7">
      <div class="row-voice-section">
        <button type="button" class="voice-btn">
          🎤 تسجيل هذا السطر (اضغط واستمر)
        </button>
      </div>
    </td>
  `;

  itemsBody.appendChild(dataRow);
  itemsBody.appendChild(voiceRow);

  attachRowEvents(dataRow, voiceRow);

  // اضبط ارتفاع الوصف لو فيه نص مبدئي
  const descInput = dataRow.querySelector(".desc-input");
  autoResizeDesc(descInput);

  updateRowTotals(dataRow);
  updateTotals();
}

// ================================
// ربط أحداث كل سطر
// ================================
function attachRowEvents(dataRow, voiceRow) {
  const qtyInput = dataRow.querySelector(".qty-input");
  const descInput = dataRow.querySelector(".desc-input");
  const weightInput = dataRow.querySelector(".weight-per-carton-input");
  const priceInput = dataRow.querySelector(".price-per-carton-input");

  [qtyInput, weightInput, priceInput].forEach((input) => {
    input.addEventListener("input", () => {
      updateRowTotals(dataRow);
      updateTotals();
    });
  });

  // الوصف: تحديث المجاميع + تكبير الخانة
  descInput.addEventListener("input", () => {
    autoResizeDesc(descInput);
    updateRowTotals(dataRow);
    updateTotals();
  });

  const deleteBtn = dataRow.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => {
    if (!confirm("هل أنت متأكد من حذف هذا السطر؟")) return;
    if (voiceRow && voiceRow.parentNode === itemsBody) {
      voiceRow.remove();
    }
    dataRow.remove();
    updateTotals();
  });

  // زر المايك لهذا السطر
  const voiceBtn = voiceRow.querySelector(".voice-btn");
  voiceBtn.addEventListener("mousedown", () => startRowVoice(dataRow));
  voiceBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startRowVoice(dataRow);
  });

  voiceBtn.addEventListener("mouseup", stopRowVoice);
  voiceBtn.addEventListener("mouseleave", stopRowVoice);
  voiceBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    stopRowVoice();
  });
}

// ================================
// حساب وزن وقيمة السطر
// ================================
function updateRowTotals(dataRow) {
  const qty =
    parseFloat((dataRow.querySelector(".qty-input").value || "").replace(",", ".")) || 0;
  const weightPer =
    parseFloat(
      (dataRow
        .querySelector(".weight-per-carton-input")
        .value || "").replace(",", ".")
    ) || 0;
  const pricePer =
    parseFloat(
      (dataRow
        .querySelector(".price-per-carton-input")
        .value || "").replace(",", ".")
    ) || 0;

  const totalWeight = qty * weightPer;
  const totalValue = qty * pricePer;

  dataRow.querySelector(".total-weight-input").value = totalWeight
    ? totalWeight.toFixed(2)
    : "";
  dataRow.querySelector(".total-value-input").value = totalValue
    ? totalValue.toFixed(2)
    : "";
}

// ================================
// تحديث مجاميع الفاتورة
// ================================
function updateTotals() {
  let totalQty = 0;
  let totalWeight = 0;
  let totalValue = 0;

  itemsBody.querySelectorAll("tr.item-row").forEach((row) => {
    const qty =
      parseFloat((row.querySelector(".qty-input").value || "").replace(",", ".")) || 0;
    const w =
      parseFloat(
        (row.querySelector(".total-weight-input").value || "").replace(",", ".")
      ) || 0;
    const v =
      parseFloat(
        (row.querySelector(".total-value-input").value || "").replace(",", ".")
      ) || 0;

    totalQty += qty;
    totalWeight += w;
    totalValue += v;
  });

  totalQtyEl.textContent = totalQty;
  totalWeightEl.textContent = totalWeight.toFixed(2);
  totalValueEl.textContent = totalValue.toFixed(2);
}

// ================================
// الصوت – Web Speech API (ضغط مستمر)
// ================================
let recognition = null;
let currentVoiceRow = null;

function ensureRecognition() {
  if (recognition) return recognition;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("هذا المتصفح لا يدعم الإملاء الصوتي. جرب Google Chrome على أندرويد.");
    return null;
  }

  recognition = new SR();
  recognition.lang = "ar-SA";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.addEventListener("result", (event) => {
    if (!currentVoiceRow) return;
    const text = event.results[0][0].transcript || "";
    fillRowFromVoice(currentVoiceRow, text);
    updateRowTotals(currentVoiceRow);
    updateTotals();
  });

  recognition.addEventListener("end", () => {
    currentVoiceRow = null;
  });

  recognition.addEventListener("error", () => {
    currentVoiceRow = null;
  });

  return recognition;
}

function startRowVoice(row) {
  const rec = ensureRecognition();
  if (!rec) return;
  currentVoiceRow = row;
  try {
    rec.start();
  } catch (e) {
    // أحياناً يكون شغال مسبقاً
  }
}

function stopRowVoice() {
  if (!recognition) return;
  try {
    recognition.stop();
  } catch (e) {}
}

// تحليل أرقام بالعربي/أرقام عادية
function parseArabicNumberWords(text) {
  const map = {
    "صفر": 0,
    "واحد": 1,
    "واحدة": 1,
    "اثنين": 2,
    "ثنين": 2,
    "ثلاثة": 3,
    "ثلاث": 3,
    "اربعة": 4,
    "أربعة": 4,
    "خمسة": 5,
    "ستة": 6,
    "سبعة": 7,
    "ثمانية": 8,
    "ثمانيه": 8,
    "تسعة": 9,
    "تسعه": 9,
    "عشرة": 10,
    "عشره": 10,
    "عشرين": 20,
    "ثلاثين": 30,
    "اربعين": 40,
    "خمسين": 50,
    "ستين": 60,
    "سبعين": 70,
    "ثمانين": 80,
    "تسعين": 90,
    "مئة": 100,
    "مية": 100,
    "مائتين": 200,
    "ثلاثمائة": 300,
    "اربعمائة": 400,
    "خمسمائة": 500,
    "ستمائة": 600,
    "سبعمائة": 700,
    "ثمانمائة": 800,
    "تسعمائة": 900,
    "الف": 1000,
    "ألف": 1000
  };

  let sum = 0;
  const parts = text.split(/\s+/);

  parts.forEach((word) => {
    const w = word.replace(/[^\u0600-\u06FF]/g, "");
    if (map[w] !== undefined) {
      sum += map[w];
    }
  });

  return sum;
}

function extractDigits(text) {
  const nums = [];
  const regex = /(\d+(\.\d+)?)/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    nums.push(parseFloat(m[1]));
  }
  return nums;
}

function extractNumbersSmart(text) {
  const nums = extractDigits(text);
  if (nums.length) return nums;

  const fromWords = parseArabicNumberWords(text);
  return fromWords ? [fromWords] : [];
}

// تعبئة السطر من الكلام
function fillRowFromVoice(row, text) {
  const descInput = row.querySelector(".desc-input");
  const qtyInput = row.querySelector(".qty-input");
  const weightInput = row.querySelector(".weight-per-carton-input");
  const priceInput = row.querySelector(".price-per-carton-input");

  descInput.value = text;
  autoResizeDesc(descInput);

  const lower = text.toLowerCase();
  const nums = extractNumbersSmart(lower);

  if (nums[0] !== undefined) qtyInput.value = nums[0];
  if (nums[1] !== undefined) weightInput.value = nums[1];
  if (nums[2] !== undefined) priceInput.value = nums[2];
}

// ================================
// حفظ الفواتير في localStorage
// ================================
const STORAGE_KEY = "bassamInvoiceApp:savedInvoices";

function loadSavedInvoicesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function saveInvoicesToStorage(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function captureCurrentInvoice() {
  const items = [];

  itemsBody.querySelectorAll("tr.item-row").forEach((row) => {
    const qty = (row.querySelector(".qty-input")?.value || "").trim();
    const desc = (row.querySelector(".desc-input")?.value || "").trim();
    const weightPerCarton = (
      row.querySelector(".weight-per-carton-input")?.value || ""
    ).trim();
    const pricePerCarton = (
      row.querySelector(".price-per-carton-input")?.value || ""
    ).trim();
    const totalWeight = (
      row.querySelector(".total-weight-input")?.value || ""
    ).trim();
    const totalValue = (
      row.querySelector(".total-value-input")?.value || ""
    ).trim();

    if (!qty && !desc && !weightPerCarton && !pricePerCarton && !totalWeight && !totalValue) {
      return;
    }

    items.push({
      qty,
      desc,
      weightPerCarton,
      pricePerCarton,
      totalWeight,
      totalValue,
    });
  });

  return {
    id: Date.now(),
    clientName: clientNameInput.value.trim(),
    invoiceNumber: invoiceNumberInput.value.trim(),
    currency: currencySelect.value,
    date: invoiceDateInput.value,
    items,
    totals: {
      qty: totalQtyEl.textContent,
      weight: totalWeightEl.textContent,
      value: totalValueEl.textContent,
    },
  };
}

function renderSavedInvoices() {
  const invoices = loadSavedInvoicesFromStorage();
  savedInvoicesList.innerHTML = "";

  if (!invoices.length) {
    savedInvoicesList.textContent = "لا توجد فواتير محفوظة حتى الآن.";
    return;
  }

  invoices
    .sort((a, b) => b.id - a.id)
    .forEach((invoice) => {
      const card = document.createElement("div");
      card.className = "saved-card";

      const main = document.createElement("div");
      main.className = "saved-card-main";
      main.innerHTML = `
        <strong>${invoice.invoiceNumber || "بدون رقم"}</strong>
        <span>العميل: ${invoice.clientName || "غير محدد"}</span>
        <span>التاريخ: ${invoice.date || "غير محدد"} – العملة: ${invoice.currency}</span>
      `;

      const buttons = document.createElement("div");
      buttons.className = "saved-card-buttons";

      const loadBtn = document.createElement("button");
      loadBtn.className = "saved-load-btn";
      loadBtn.textContent = "تحميل";
      loadBtn.addEventListener("click", () => {
        loadInvoice(invoice.id);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "saved-delete-btn";
      deleteBtn.textContent = "حذف";
      deleteBtn.addEventListener("click", () => {
        if (!confirm("هل تريد حذف هذه الفاتورة من الجهاز؟")) return;
        const list = loadSavedInvoicesFromStorage().filter(
          (i) => i.id !== invoice.id
        );
        saveInvoicesToStorage(list);
        renderSavedInvoices();
      });

      buttons.appendChild(loadBtn);
      buttons.appendChild(deleteBtn);

      card.appendChild(main);
      card.appendChild(buttons);

      savedInvoicesList.appendChild(card);
    });
}

saveInvoiceBtn.addEventListener("click", () => {
  const invoice = captureCurrentInvoice();

  if (!invoice.items.length) {
    alert("لا يوجد أصناف في الفاتورة للحفظ.");
    return;
  }

  const list = loadSavedInvoicesFromStorage();
  list.push(invoice);
  saveInvoicesToStorage(list);
  renderSavedInvoices();

  alert("تم حفظ الفاتورة في هذا الجهاز ✅");
});

function loadInvoice(id) {
  const invoices = loadSavedInvoicesFromStorage();
  const inv = invoices.find((i) => i.id === id);
  if (!inv) return;

  clientNameInput.value = inv.clientName || "";
  invoiceNumberInput.value = inv.invoiceNumber || "";
  currencySelect.value = inv.currency || "ريال سعودي";
  invoiceDateInput.value = inv.date || "";

  totalCurrencyLabel.textContent = currencySelect.value;

  itemsBody.innerHTML = "";

  (inv.items || []).forEach((item) => {
    createRow(item);
  });

  updateTotals();
}

// ================================
// طباعة – فتح نافذة جديدة ثم print()
// ================================
function openPrintWindow() {
  const container = document.querySelector(".container");
  if (!container) {
    window.print();
    return;
  }

  const printContent = container.innerHTML;
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <title>طباعة فاتورة بسام</title>
      <link rel="stylesheet" href="styles.css" />
    </head>
    <body>
      <div class="container">
        ${printContent}
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();

  printWindow.focus();
  setTimeout(() => {
    try {
      printWindow.print();
    } catch (e) {
      window.print();
    }
  }, 600);
}

// ================================
// أزرار إضافة سطر + طباعة + PDF
// ================================
addRowBtn.addEventListener("click", () => {
  createRow();
});

printBtn.addEventListener("click", () => {
  openPrintWindow();
});

pdfBtn.addEventListener("click", () => {
  openPrintWindow(); // المستخدم يختار حفظ كـ PDF
});

// ================================
// زر التثبيت PWA
// ================================
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

// تسجيل Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

// إنشاء أول صف وتحميل الفواتير المحفوظة
createRow();
renderSavedInvoices();
