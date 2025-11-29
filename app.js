document.addEventListener("DOMContentLoaded", () => {
  const itemsBody = document.getElementById("itemsBody");
  const addRowBtn = document.getElementById("addRowBtn");

  const totalQtyEl = document.getElementById("totalQty");
  const totalWeightEl = document.getElementById("totalWeight");
  const totalValueEl = document.getElementById("totalValue");

  // زر PDF
  const exportBtn = document.getElementById("exportPdfBtn");

  function parseNum(val) {
    val = String(val || "").replace(/,/g, "").trim();
    return parseFloat(val) || 0;
  }

  function formatNum(n) {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  }

  function recalcRow(row) {
    const qty = parseNum(row.querySelector(".item-qty")?.value);
    const unitWeight = parseNum(row.querySelector(".item-weight")?.value);
    const unitPrice = parseNum(row.querySelector(".item-price")?.value);

    const totalWeightInput = row.querySelector(".item-weight-total");
    const totalValueInput = row.querySelector(".item-value-total");

    const totalWeight = qty * unitWeight;
    const totalValue = qty * unitPrice;

    if (totalWeightInput) totalWeightInput.value = totalWeight ? formatNum(totalWeight) : "";
    if (totalValueInput) totalValueInput.value = totalValue ? formatNum(totalValue) : "";

    recalcTotals();
  }

  function recalcTotals() {
    let totalQty = 0;
    let totalWeight = 0;
    let totalValue = 0;

    itemsBody.querySelectorAll("tr").forEach((row) => {
      totalQty += parseNum(row.querySelector(".item-qty")?.value);
      totalWeight += parseNum(row.querySelector(".item-weight-total")?.value);
      totalValue += parseNum(row.querySelector(".item-value-total")?.value);
    });

    totalQtyEl.textContent = formatNum(totalQty);
    totalWeightEl.textContent = formatNum(totalWeight);
    totalValueEl.textContent = formatNum(totalValue);
  }

  function attachRowEvents(row) {
    ["item-qty", "item-weight", "item-price"].forEach((cls) => {
      row.querySelector(`.${cls}`)?.addEventListener("input", () => recalcRow(row));
    });

    row.querySelector(".delete-row")?.addEventListener("click", () => {
      row.remove();
      recalcTotals();
    });
  }

  function addRow() {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="no-print"><button class="delete-row">✕</button></td>
      <td><input type="text" class="item-name" placeholder="الصنف" /></td>
      <td><input type="number" min="0" class="item-qty" /></td>
      <td class="no-print"><input type="number" min="0" step="0.001" class="item-weight" placeholder="وزن/كرتون" /></td>
      <td class="no-print"><input type="number" min="0" step="0.01" class="item-price" placeholder="قيمة/كرتون" /></td>
      <td><input type="text" class="item-weight-total" readonly /></td>
      <td><input type="text" class="item-value-total" readonly /></td>
    `;

    itemsBody.appendChild(tr);
    attachRowEvents(tr);
  }

  // زر PDF
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      document.body.classList.add("print-mode");

      const opt = {
        margin: 0.5,
        filename: `فاتورة-${Date.now()}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 3 },
        jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
      };

      html2pdf()
        .set(opt)
        .from(document.body)
        .save()
        .then(() => {
          document.body.classList.remove("print-mode");
        });
    });
  }

  addRow();
  recalcTotals();
});
