// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  // ضبط تاريخ اليوم افتراضياً
  const dateInput = document.getElementById("invoiceDate");
  if (dateInput) {
    const today = new Date().toISOString().slice(0, 10);
    dateInput.value = today;
  }

  // ربط الأزرار
  document.getElementById("addRowBtn").addEventListener("click", addRow);
  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("pdfBtn").addEventListener("click", () => window.print());

  // إضافة أول سطر
  addRow();
});

// إضافة سطر جديد
function addRow() {
  const tbody = document.getElementById("itemsBody");
  const tr = document.createElement("tr");

  // 1) العدد
  const qtyTd = document.createElement("td");
  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.min = "0";
  qtyInput.step = "1";
  qtyInput.value = "";
  qtyInput.addEventListener("input", () => updateRowTotals(tr));
  qtyTd.appendChild(qtyInput);
  tr.appendChild(qtyTd);

  // 2) الصنف
  const itemTd = document.createElement("td");
  const itemInput = document.createElement("input");
  itemInput.type = "text";
  itemInput.placeholder = "";
  itemTd.appendChild(itemInput);
  tr.appendChild(itemTd);

  // 3) وزن / كرتون (كجم) – مخفي في الطباعة
  const weightPerTd = document.createElement("td");
  weightPerTd.classList.add("no-print");
  const weightPerInput = document.createElement("input");
  weightPerInput.type = "number";
  weightPerInput.min = "0";
  weightPerInput.step = "0.01";
  weightPerInput.addEventListener("input", () => updateRowTotals(tr));
  weightPerTd.appendChild(weightPerInput);
  tr.appendChild(weightPerTd);

  // 4) قيمة / كرتون – مخفي في الطباعة
  const pricePerTd = document.createElement("td");
  pricePerTd.classList.add("no-print");
  const pricePerInput = document.createElement("input");
  pricePerInput.type = "number";
  pricePerInput.min = "0";
  pricePerInput.step = "0.01";
  pricePerInput.addEventListener("input", () => updateRowTotals(tr));
  pricePerTd.appendChild(pricePerInput);
  tr.appendChild(pricePerTd);

  // 5) الوزن الكلي (كجم) – ناتج
  const totalWeightTd = document.createElement("td");
  const totalWeightInput = document.createElement("input");
  totalWeightInput.type = "number";
  totalWeightInput.readOnly = true;
  totalWeightTd.appendChild(totalWeightInput);
  tr.appendChild(totalWeightTd);

  // 6) القيمة الكلية – ناتج
  const totalValueTd = document.createElement("td");
  const totalValueInput = document.createElement("input");
  totalValueInput.type = "number";
  totalValueInput.readOnly = true;
  totalValueTd.appendChild(totalValueInput);
  tr.appendChild(totalValueTd);

  // 7) زر الحذف – مخفي في الطباعة
  const deleteTd = document.createElement("td");
  deleteTd.classList.add("no-print");
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "×";
  deleteBtn.addEventListener("click", () => {
    const ok = confirm("هل أنت متأكد من حذف هذا السطر؟");
    if (ok) {
      tr.remove();
      updateTotals();
    }
  });
  deleteTd.appendChild(deleteBtn);
  tr.appendChild(deleteTd);

  tbody.appendChild(tr);
}

// تحديث وزن/قيمة السطر الواحد
function updateRowTotals(row) {
  const inputs = row.getElementsByTagName("input");
  const qty = parseFloat(inputs[0].value) || 0;
  const weightPer = parseFloat(inputs[2].value) || 0;
  const pricePer = parseFloat(inputs[3].value) || 0;

  const totalWeight = qty * weightPer;
  const totalValue = qty * pricePer;

  inputs[4].value = totalWeight ? totalWeight : "";
  inputs[5].value = totalValue ? totalValue : "";

  updateTotals();
}

// تحديث الإجماليات في أسفل الصفحة
function updateTotals() {
  const tbody = document.getElementById("itemsBody");
  let totalQty = 0;
  let totalWeight = 0;
  let totalValue = 0;

  Array.from(tbody.rows).forEach((row) => {
    const inputs = row.getElementsByTagName("input");
    const qty = parseFloat(inputs[0].value) || 0;
    const w = parseFloat(inputs[4].value) || 0;
    const v = parseFloat(inputs[5].value) || 0;

    totalQty += qty;
    totalWeight += w;
    totalValue += v;
  });

  document.getElementById("totalQty").textContent = totalQty;
  document.getElementById("totalWeight").textContent = totalWeight;
  document.getElementById("totalValue").textContent = totalValue;
}
