// الحصول على جسم الجدول
const itemsBody =
  document.getElementById("itemsBody") ||
  document.querySelector(".items-table tbody");

// الأزرار
const addRowBtn = document.getElementById("addRowBtn");
const printBtn = document.getElementById("printBtn");
const pdfBtn = document.getElementById("pdfBtn");

// عناصر الإجمالي
const totalQtyEl = document.getElementById("totalQty");
const totalWeightEl = document.getElementById("totalWeight");
const totalValueEl = document.getElementById("totalValue");

if (!itemsBody) {
  console.warn("لم يتم العثور على tbody للجدول، تأكد من وجوده.");
}

// إنشاء صف جديد بالترتيب المطلوب من اليمين:
// الصنف - العدد - وزن/كرتون - قيمة/كرتون - الوزن الكلي - القيمة الكلية - حذف
function createRow() {
  if (!itemsBody) return;

  const tr = document.createElement("tr");

  // 1) الصنف
  const descTd = document.createElement("td");
  const descInput = document.createElement("input");
  descInput.type = "text";
  descInput.className = "desc";
  descTd.appendChild(descInput);
  tr.appendChild(descTd);

  // 2) العدد
  const qtyTd = document.createElement("td");
  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.className = "qty";
  qtyTd.appendChild(qtyInput);
  tr.appendChild(qtyTd);

  // 3) وزن / كرتون
  const unitWeightTd = document.createElement("td");
  unitWeightTd.classList.add("per-unit-col");
  const unitWeightInput = document.createElement("input");
  unitWeightInput.type = "number";
  unitWeightInput.className = "unit-weight";
  unitWeightTd.appendChild(unitWeightInput);
  tr.appendChild(unitWeightTd);

  // 4) قيمة / كرتون
  const unitPriceTd = document.createElement("td");
  unitPriceTd.classList.add("per-unit-col");
  const unitPriceInput = document.createElement("input");
  unitPriceInput.type = "number";
  unitPriceInput.className = "unit-price";
  unitPriceTd.appendChild(unitPriceInput);
  tr.appendChild(unitPriceTd);

  // 5) الوزن الكلي (قراءة فقط)
  const totalWeightTd = document.createElement("td");
  const totalWeightInput = document.createElement("input");
  totalWeightInput.type = "number";
  totalWeightInput.className = "total-weight";
  totalWeightInput.readOnly = true;
  totalWeightTd.appendChild(totalWeightInput);
  tr.appendChild(totalWeightTd);

  // 6) القيمة الكلية (قراءة فقط)
  const totalValueTd = document.createElement("td");
  const totalValueInput = document.createElement("input");
  totalValueInput.type = "number";
  totalValueInput.className = "total-value";
  totalValueInput.readOnly = true;
  totalValueTd.appendChild(totalValueInput);
  tr.appendChild(totalValueTd);

  // 7) حذف
  const deleteTd = document.createElement("td");
  deleteTd.classList.add("no-print");
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.textContent = "✕";
  deleteBtn.className = "delete-btn";
  deleteBtn.addEventListener("click", () => {
    const ok = confirm("هل أنت متأكد من حذف هذا السطر؟");
    if (ok) {
      tr.remove();
      recalcTotals();
    }
  });
  deleteTd.appendChild(deleteBtn);
  tr.appendChild(deleteTd);

  // عند أي تغيير يعاد حساب السطر والإجمالي
  [qtyInput, unitWeightInput, unitPriceInput].forEach((input) => {
    input.addEventListener("input", () => {
      recalcRow(tr);
      recalcTotals();
    });
  });

  itemsBody.appendChild(tr);
}

// حساب سطر واحد
function recalcRow(tr) {
  const qty = Number(tr.querySelector(".qty")?.value) || 0;
  const unitWeight = Number(tr.querySelector(".unit-weight")?.value) || 0;
  const unitPrice = Number(tr.querySelector(".unit-price")?.value) || 0;

  const totalWeightInput = tr.querySelector(".total-weight");
  const totalValueInput = tr.querySelector(".total-value");

  const rowTotalWeight = qty * unitWeight;
  const rowTotalValue = qty * unitPrice;

  totalWeightInput.value = rowTotalWeight ? rowTotalWeight : "";
  totalValueInput.value = rowTotalValue ? rowTotalValue : "";
}

// حساب الإجماليات
function recalcTotals() {
  if (!itemsBody) return;

  let totalQty = 0;
  let totalWeight = 0;
  let totalValue = 0;

  itemsBody.querySelectorAll("tr").forEach((tr) => {
    const qty = Number(tr.querySelector(".qty")?.value) || 0;
    const rowWeight = Number(tr.querySelector(".total-weight")?.value) || 0;
    const rowValue = Number(tr.querySelector(".total-value")?.value) || 0;

    totalQty += qty;
    totalWeight += rowWeight;
    totalValue += rowValue;
  });

  totalQtyEl.textContent = totalQty;
  totalWeightEl.textContent = totalWeight;
  totalValueEl.textContent = totalValue;
}

// زر إضافة سطر
if (addRowBtn) {
  addRowBtn.addEventListener("click", () => {
    createRow();
  });
}

// زر الطباعة
if (printBtn) {
  printBtn.addEventListener("click", () => {
    window.print();
  });
}

// زر PDF (نفس الطباعة، والمستخدم يختار حفظ كـ PDF)
if (pdfBtn) {
  pdfBtn.addEventListener("click", () => {
    window.print();
  });
}

// إنشاء أول سطر عند فتح الصفحة
createRow();
