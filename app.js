// عند تحميل الصفحة نضيف سطر واحد تلقائياً ونضع تاريخ اليوم
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().slice(0, 10);
  const dateInput = document.getElementById("invoiceDate");
  if (dateInput && !dateInput.value) {
    dateInput.value = today;
  }

  document.getElementById("addRowBtn").addEventListener("click", addRow);
  document.getElementById("clearAllBtn").addEventListener("click", clearAllRows);

  // تفويض للأحداث: أي تغيير داخل جسم الجدول
  document.getElementById("itemsBody").addEventListener("input", handleTableInput);
  document.getElementById("itemsBody").addEventListener("click", handleRowDelete);

  // أول سطر
  addRow();
});

// إضافة سطر جديد
function addRow() {
  const tbody = document.getElementById("itemsBody");
  const index = tbody.children.length + 1;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="row-index">${index}</td>
    <td><input type="text" class="item-name" placeholder="بيان الصنف"></td>
    <td><input type="number" class="qty" min="0" step="1" value="0"></td>
    <td>
      <input type="text" class="unit" placeholder="كرتون / حبة / طن">
    </td>
    <td>
      <input type="number" class="unit-weight" min="0" step="0.001" value="0">
    </td>
    <td>
      <input type="number" class="total-weight" readonly>
    </td>
    <td>
      <input type="number" class="line-value" min="0" step="0.01" value="0">
    </td>
    <td>
      <input type="text" class="note" placeholder="">
    </td>
    <td>
      <button type="button" class="danger delete-row">✕</button>
    </td>
  `;

  tbody.appendChild(tr);
  recalcRow(tr);
  recalcTotals();
}

// التعامل مع تغيير أي حقل في الجدول
function handleTableInput(event) {
  const target = event.target;
  if (!target.closest("tr")) return;

  // لما يتغير العدد أو وزن الوحدة أو قيمة السطر
  if (
    target.classList.contains("qty") ||
    target.classList.contains("unit-weight") ||
    target.classList.contains("line-value")
  ) {
    const tr = target.closest("tr");
    recalcRow(tr);
    recalcTotals();
  }
}

// حساب وزن الصنف داخل السطر
function recalcRow(tr) {
  const qtyInput = tr.querySelector(".qty");
  const unitWeightInput = tr.querySelector(".unit-weight");
  const totalWeightInput = tr.querySelector(".total-weight");

  const qty = parseFloat(qtyInput.value) || 0;
  const unitWeight = parseFloat(unitWeightInput.value) || 0;

  const totalWeight = qty * unitWeight; // هنا الضرب الذي تريده 💪
  totalWeightInput.value = totalWeight ? totalWeight.toFixed(3) : "";
}

// حساب الإجماليات النهائية
function recalcTotals() {
  const tbody = document.getElementById("itemsBody");
  let totalWeight = 0;
  let totalValue = 0;

  [...tbody.querySelectorAll("tr")].forEach((tr) => {
    const w = parseFloat(tr.querySelector(".total-weight").value) || 0;
    const v = parseFloat(tr.querySelector(".line-value").value) || 0;

    totalWeight += w;
    totalValue += v;
  });

  document.getElementById("totalWeight").textContent = totalWeight.toFixed(3);
  document.getElementById("totalValue").textContent = totalValue.toFixed(2);
}

// زر حذف سطر واحد
function handleRowDelete(event) {
  if (!event.target.classList.contains("delete-row")) return;

  const tr = event.target.closest("tr");
  tr.remove();
  resetRowIndices();
  recalcTotals();
}

// إعادة ترقيم الأسطر بعد الحذف
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
