// app.js
// حساب الوزن والقيمة لكل صنف + المجاميع الكلية

document.addEventListener("DOMContentLoaded", () => {
  const itemsBody = document.getElementById("itemsBody");
  const addRowBtn = document.getElementById("addRowBtn");

  const totalQtyEl = document.getElementById("totalQty");
  const totalWeightEl = document.getElementById("totalWeight");
  const totalValueEl = document.getElementById("totalValue");

  // تحويل النص إلى رقم (مع تجاهل الفواصل)
  function parseNum(value) {
    if (value === undefined || value === null) return 0;
    const cleaned = String(value).replace(/,/g, "").trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  // تنسيق الرقم مع فواصل
  function formatNum(n) {
    if (!n) return "0";
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  }

  // حساب سطر واحد
  function recalcRow(row) {
    const qtyInput = row.querySelector(".item-qty");
    const unitWeightInput = row.querySelector(".item-weight");
    const unitPriceInput = row.querySelector(".item-price");
    const totalWeightInput = row.querySelector(".item-weight-total");
    const totalValueInput = row.querySelector(".item-value-total");

    if (!qtyInput || !unitWeightInput || !unitPriceInput) return;

    const qty = parseNum(qtyInput.value);
    const unitWeight = parseNum(unitWeightInput.value);
    const unitPrice = parseNum(unitPriceInput.value);

    const totalWeight = qty * unitWeight; // وزن كلي للصنف
    const totalValue = qty * unitPrice;   // قيمة كليّة للصنف

    if (totalWeightInput) {
      totalWeightInput.value = totalWeight ? formatNum(totalWeight) : "";
    }
    if (totalValueInput) {
      totalValueInput.value = totalValue ? formatNum(totalValue) : "";
    }

    recalcTotals();
  }

  // حساب المجاميع الكلية
  function recalcTotals() {
    let totalQty = 0;
    let totalWeight = 0;
    let totalValue = 0;

    itemsBody.querySelectorAll("tr").forEach((row) => {
      const qtyInput = row.querySelector(".item-qty");
      const totalWeightInput = row.querySelector(".item-weight-total");
      const totalValueInput = row.querySelector(".item-value-total");

      if (qtyInput) {
        totalQty += parseNum(qtyInput.value);
      }
      if (totalWeightInput) {
        totalWeight += parseNum(totalWeightInput.value);
      }
      if (totalValueInput) {
        totalValue += parseNum(totalValueInput.value);
      }
    });

    if (totalQtyEl) totalQtyEl.textContent = formatNum(totalQty);
    if (totalWeightEl) totalWeightEl.textContent = formatNum(totalWeight);
    if (totalValueEl) totalValueEl.textContent = formatNum(totalValue);
  }

  // ربط الأحداث على سطر واحد
  function attachRowEvents(row) {
    const qtyInput = row.querySelector(".item-qty");
    const unitWeightInput = row.querySelector(".item-weight");
    const unitPriceInput = row.querySelector(".item-price");
    const deleteBtn = row.querySelector(".delete-row");

    [qtyInput, unitWeightInput, unitPriceInput].forEach((input) => {
      if (!input) return;
      input.addEventListener("input", () => recalcRow(row));
    });

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        row.remove();
        recalcTotals();
      });
    }
  }

  // إضافة سطر جديد (لو تحب تغيّر ترتيب الأعمدة غيّر الـ innerHTML فقط)
  function addRow() {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <button type="button" class="delete-row">✕</button>
      </td>
      <td>
        <input type="text" class="item-name" placeholder="الصنف" />
      </td>
      <td>
        <input type="number" min="0" step="1" class="item-qty" placeholder="العدد" />
      </td>
      <td>
        <input type="number" min="0" step="0.001" class="item-weight" placeholder="وزن/كرتون (كجم)" />
      </td>
      <td>
        <input type="number" min="0" step="0.01" class="item-price" placeholder="قيمة/كرتون" />
      </td>
      <td>
        <input type="text" class="item-weight-total" placeholder="الوزن الكلي" readonly />
      </td>
      <td>
        <input type="text" class="item-value-total" placeholder="القيمة الكلية" readonly />
      </td>
    `;
    itemsBody.appendChild(tr);
    attachRowEvents(tr);
  }

  // ربط السطور الموجودة مسبقاً (أول سطر في الـ HTML)
  itemsBody.querySelectorAll("tr").forEach(attachRowEvents);

  // زر إضافة سطر
  if (addRowBtn) {
    addRowBtn.addEventListener("click", addRow);
  }

  // حساب أولي
  recalcTotals();
});
