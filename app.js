// عناصر أساسية
const itemsBody = document.getElementById("itemsBody");
const totalQtyEl = document.getElementById("totalQty");
const totalWeightEl = document.getElementById("totalWeight");
const totalValueEl = document.getElementById("totalValue");
const currencySelect = document.getElementById("currencySelect");
const currencyLabel = document.getElementById("currencyLabel");

const addRowBtn = document.getElementById("addRowBtn");
const printBtn = document.getElementById("printBtn");
const pdfBtn = document.getElementById("pdfBtn");
const installBtn = document.getElementById("installBtn");
const invoiceElement = document.getElementById("invoice");

// تهيئة التاريخ اليوم
(function initDate() {
  const dateInput = document.getElementById("invoiceDate");
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  dateInput.value = `${y}-${m}-${d}`;
})();

// ماب للعملة لعرضها في النص
const currencyNames = {
  SAR: "ريال سعودي",
  AED: "درهم إماراتي",
  USD: "دولار أمريكي",
  OMR: "ريال عُماني",
};

// تغيير نص العملة في الإجمالي
currencySelect.addEventListener("change", () => {
  const code = currencySelect.value;
  currencyLabel.textContent = currencyNames[code] || "ريال";
});

// إنشاء صف جديد
function createRow() {
  const tr = document.createElement("tr");

  // العدد
  const qtyTd = document.createElement("td");
  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.min = "0";
  qtyInput.step = "1";
  qtyInput.placeholder = "0";
  qtyTd.appendChild(qtyInput);
  tr.appendChild(qtyTd);

  // الصنف
  const descTd = document.createElement("td");
  const descInput = document.createElement("input");
  descInput.type = "text";
  descInput.placeholder = "وصف الصنف";
  descTd.appendChild(descInput);
  tr.appendChild(descTd);

  // وزن / كرتون
  const perWeightTd = document.createElement("td");
  perWeightTd.classList.add("per-carton");
  const perWeightInput = document.createElement("input");
  perWeightInput.type = "number";
  perWeightInput.min = "0";
  perWeightInput.step = "any";
  perWeightInput.placeholder = "0";
  perWeightTd.appendChild(perWeightInput);
  tr.appendChild(perWeightTd);

  // قيمة / كرتون
  const perValueTd = document.createElement("td");
  perValueTd.classList.add("per-carton");
  const perValueInput = document.createElement("input");
  perValueInput.type = "number";
  perValueInput.min = "0";
  perValueInput.step = "any";
  perValueInput.placeholder = "0";
  perValueTd.appendChild(perValueInput);
  tr.appendChild(perValueTd);

  // الوزن الكلي
  const totalWeightTd = document.createElement("td");
  const totalWeightInput = document.createElement("input");
  totalWeightInput.type = "number";
  totalWeightInput.readOnly = true;
  totalWeightTd.appendChild(totalWeightInput);
  tr.appendChild(totalWeightTd);

  // القيمة الكلية
  const totalValueTd = document.createElement("td");
  const totalValueInput = document.createElement("input");
  totalValueInput.type = "number";
  totalValueInput.readOnly = true;
  totalValueTd.appendChild(totalValueInput);
  tr.appendChild(totalValueTd);

  // حذف
  const delTd = document.createElement("td");
  delTd.classList.add("col-del");
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "row-delete-btn";
  delBtn.textContent = "✕";
  delTd.appendChild(delBtn);
  tr.appendChild(delTd);

  // إضافة الصف للجدول
  itemsBody.appendChild(tr);

  // تحديث سطر عند إدخال قيم
  function updateRow() {
    const qty = parseFloat(qtyInput.value) || 0;
    const perW = parseFloat(perWeightInput.value) || 0;
    const perV = parseFloat(perValueInput.value) || 0;

    const totalW = qty * perW;
    const totalV = qty * perV;

    totalWeightInput.value = totalW ? totalW.toFixed(2).replace(/\.00$/, "") : "";
    totalValueInput.value = totalV ? totalV.toFixed(2).replace(/\.00$/, "") : "";

    updateTotals();
  }

  qtyInput.addEventListener("input", updateRow);
  perWeightInput.addEventListener("input", updateRow);
  perValueInput.addEventListener("input", updateRow);

  // حذف الصف مع تأكيد
  delBtn.addEventListener("click", () => {
    const ok = confirm("هل تريد حذف هذا السطر؟");
    if (!ok) return;
    tr.remove();
    updateTotals();
  });

  return tr;
}

// حساب المجاميع
function updateTotals() {
  let totalQty = 0;
  let totalWeight = 0;
  let totalValue = 0;

  itemsBody.querySelectorAll("tr").forEach((row) => {
    const inputs = row.querySelectorAll("input");
    if (inputs.length < 6) return;

    const qty = parseFloat(inputs[0].value) || 0;
    const rowTotalWeight = parseFloat(inputs[4].value) || 0;
    const rowTotalValue = parseFloat(inputs[5].value) || 0;

    totalQty += qty;
    totalWeight += rowTotalWeight;
    totalValue += rowTotalValue;
  });

  totalQtyEl.textContent = totalQty;
  totalWeightEl.textContent = totalWeight.toFixed(2).replace(/\.00$/, "");
  totalValueEl.textContent = totalValue.toFixed(2).replace(/\.00$/, "");
}

// زر إضافة سطر
addRowBtn.addEventListener("click", () => {
  createRow();
});

// زر الطباعة
printBtn.addEventListener("click", () => {
  window.print();
});

// زر إنشاء PDF
pdfBtn.addEventListener("click", () => {
  const opt = {
    margin: [5, 5, 5, 5],
    filename: "bassam-invoice.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  html2pdf().set(opt).from(invoiceElement).save();
});

// إنشاء أول صف تلقائياً
createRow();

/* ====== زر التثبيت (PWA) ====== */
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.disabled = false;

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      console.log("تم قبول تثبيت التطبيق");
    }
    deferredPrompt = null;
    installBtn.disabled = true;
  });
});

// تسجيل Service Worker (ضروري لـ PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .catch((err) => console.error("SW registration failed:", err));
  });
}
