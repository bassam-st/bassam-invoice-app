// مساعد لتحويل النص لرقم
function toNumber(value) {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

// إعادة حساب صف واحد
function recalcRow(row) {
  const qtyInput = row.querySelector(".item-qty");
  const weightPerInput = row.querySelector(".item-weight-per");
  const weightTotalInput = row.querySelector(".item-weight-total");
  const pricePerInput = row.querySelector(".item-price-per");
  const priceTotalInput = row.querySelector(".item-price-total");

  const qty = toNumber(qtyInput.value);
  const wPer = toNumber(weightPerInput.value);
  const pPer = toNumber(pricePerInput.value);

  const wTotal = qty * wPer;
  const pTotal = qty * pPer;

  weightTotalInput.value = wTotal ? wTotal : "";
  priceTotalInput.value = pTotal ? pTotal : "";

  recalcTotals();
}

// إعادة حساب الإجماليات لكل الفاتورة
function recalcTotals() {
  const rows = document.querySelectorAll(".item-row");

  let totalQty = 0;
  let totalWeight = 0;
  let totalPrice = 0;

  rows.forEach((row) => {
    const qty = toNumber(row.querySelector(".item-qty").value);
    const wTotal = toNumber(row.querySelector(".item-weight-total").value);
    const pTotal = toNumber(row.querySelector(".item-price-total").value);

    totalQty += qty;
    totalWeight += wTotal;
    totalPrice += pTotal;
  });

  document.getElementById("totalQuantity").textContent = totalQty;
  document.getElementById("totalWeight").textContent = totalWeight;
  document.getElementById("totalPrice").textContent = totalPrice;
}

// إنشاء صف جديد
function createRow() {
  const tbody = document.getElementById("itemsBody");
  const tr = document.createElement("tr");
  tr.className = "item-row";
  tr.innerHTML = `
    <td>
      <input type="text" class="item-name" placeholder="مثال: ملابس" />
    </td>
    <td>
      <input type="number" class="item-qty" min="0" step="1" />
    </td>
    <td>
      <input type="number" class="item-weight-per" min="0" step="0.01" />
    </td>
    <td>
      <input type="number" class="item-weight-total" readonly />
    </td>
    <td>
      <input type="number" class="item-price-per" min="0" step="0.01" />
    </td>
    <td>
      <input type="number" class="item-price-total" readonly />
    </td>
    <td class="no-print">
      <button type="button" class="delete-row">✕</button>
    </td>
  `;
  tbody.appendChild(tr);
  attachRowEvents(tr);
}

// ربط الأحداث لصف معيّن
function attachRowEvents(row) {
  const qty = row.querySelector(".item-qty");
  const wPer = row.querySelector(".item-weight-per");
  const pPer = row.querySelector(".item-price-per");
  const del = row.querySelector(".delete-row");

  [qty, wPer, pPer].forEach((inp) => {
    inp.addEventListener("input", () => recalcRow(row));
  });

  if (del) {
    del.addEventListener("click", () => {
      row.remove();
      recalcTotals();
    });
  }
}

// تجهيز كل شيء عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  // ربط الصف الأول
  document.querySelectorAll(".item-row").forEach(attachRowEvents);

  document.getElementById("addRowBtn").addEventListener("click", () => {
    createRow();
  });

  document.getElementById("pdfBtn").addEventListener("click", () => {
    generatePdf();
  });
});

// توليد PDF متعدد الصفحات
function generatePdf() {
  const element = document.getElementById("invoiceContainer");
  const invoiceNumber = document.getElementById("invoiceNumber").value.trim();
  const filename = invoiceNumber ? `فاتورة-${invoiceNumber}.pdf` : "فاتورة-بسام.pdf";

  const opt = {
    margin: [10, 10, 10, 10], // أعلى، يمين، أسفل، يسار (بالـ mm)
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"] } // يكسر الصفحة إذا طولت
  };

  // إخفاء زرار التحكم داخل الـ PDF فقط
  const toolbar = document.querySelector(".toolbar");
  toolbar.classList.add("html2pdf__ignore");

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .finally(() => {
      toolbar.classList.remove("html2pdf__ignore");
    });
}
