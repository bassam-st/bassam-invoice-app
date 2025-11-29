// تجهيز الصفحة عند التحميل
document.addEventListener("DOMContentLoaded", () => {
  // وضع تاريخ اليوم تلقائيًا إذا لم يكن موجودًا
  const today = new Date().toISOString().slice(0, 10);
  const dateInput = document.getElementById("invoiceDate");
  if (dateInput && !dateInput.value) {
    dateInput.value = today;
  }

  document.getElementById("addRowBtn").addEventListener("click", addRow);
  document.getElementById("clearAllBtn").addEventListener("click", clearAllRows);

  const tbody = document.getElementById("itemsBody");
  tbody.addEventListener("input", handleTableInput);
  tbody.addEventListener("click", handleRowDelete);

  // أول سطر
  addRow();
});

// إضافة سطر جديد يشبه جدول الإكسل
function addRow() {
  const tbody = document.getElementById("itemsBody");
  const index = tbody.children.length + 1;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="row-index">${index}</td>
    <td><input type="number" class="qty" min="0" step="1" value="0"></td>
    <td><input type="text" class="item-name" placeholder="بيان الصنف"></td>
    <td><input type="number" class="total-weight" min="0" step="0.001" value="0"></td>
    <td><input type="number" class="value" min="0" step="0.01" value="0"></td>
    <td class="no-print">
      <input type="number" class="unit-weight" min="0" step="0.001" placeholder="وزن/كرتون">
    </td>
    <td class="no-print">
      <button type="button" class="danger delete-row">✕</button>
    </td>
  `;

  tbody.appendChild(tr);
  recalcRow(tr);
  recalcTotals();
}

// أي تغيير في الجدول
function handleTableInput(event) {
  const target = event.target;
  const tr = target.closest("tr");
  if (!tr) return;

  // لو تغير العدد أو وزن/كرتون أو القيمة
  if (
    target.classList.contains("qty") ||
    target.classList.contains("unit-weight") ||
    target.classList.contains("value") ||
    target.classList.contains("total-weight")
  ) {
    recalcRow(tr);
    recalcTotals();
  }
}

// حساب وزن الصنف داخل نفس السطر
function recalcRow(tr) {
  const qtyInput = tr.querySelector(".qty");
  const unitWeightInput = tr.querySelector(".unit-weight");
  const totalWeightInput = tr.querySelector(".total-weight");

  const qty = parseFloat(qtyInput.value) || 0;
  const unitWeight = parseFloat(unitWeightInput.value) || 0;

  // إذا المستخدم كتب وزن/كرتون، نحسب له الوزن الكلي تلقائيًا
  if (unitWeight > 0) {
    const totalWeight = qty * unitWeight;
    totalWeightInput.value = totalWeight ? totalWeight.toFixed(3) : 0;
  }
}

// حساب الإجماليات في الأسفل
function recalcTotals() {
  const rows = document.querySelectorAll("#itemsBody tr");

  let totalQty = 0;
  let totalWeight = 0;
  let totalValue = 0;

  rows.forEach((tr) => {
    const qty = parseFloat(tr.querySelector(".qty").value) || 0;
    const weight = parseFloat(tr.querySelector(".total-weight").value) || 0;
    const value = parseFloat(tr.querySelector(".value").value) || 0;

    totalQty += qty;
    totalWeight += weight;
    totalValue += value;
  });

  document.getElementById("totalQty").textContent = totalQty;
  document.getElementById("totalWeight").textContent = totalWeight.toFixed(3);
  document.getElementById("totalValue").textContent = totalValue.toFixed(2);
}

// حذف سطر واحد
function handleRowDelete(event) {
  if (!event.target.classList.contains("delete-row")) return;
  const tr = event.target.closest("tr");
  tr.remove();
  resetRowIndices();
  recalcTotals();
}

// إعادة ترقيم (م) بعد الحذف
function resetRowIndices() {
  const rows = document.querySelectorAll("#itemsBody tr");
  rows.forEach((tr, i) => {
    const cell = tr.querySelector(".row-index");
    if (cell) cell.textContent = i + 1;
  });
}

// مسح كل الأسطر
function clearAllRows() {
  if (!confirm("هل تريد مسح كل أسطر الفاتورة؟")) return;
  const tbody = document.getElementById("itemsBody");
  tbody.innerHTML = "";
  addRow();
  recalcTotals();
}
