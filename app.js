document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById("invoiceDate").value = today;

  document.getElementById("addRowBtn").addEventListener("click", addRow);

  const tbody = document.getElementById("itemsBody");
  tbody.addEventListener("input", handleInput);
  tbody.addEventListener("click", deleteRow);

  addRow();
});

function addRow() {
  const tbody = document.getElementById("itemsBody");
  const index = tbody.children.length + 1;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="row-index">${index}</td>
    <td><input type="number" class="qty" min="0" value="0"></td>
    <td><input type="text" class="item-name" placeholder="بيان الصنف"></td>
    <td><input type="number" class="total-weight" min="0" value="0"></td>
    <td><input type="number" class="value" min="0" value="0"></td>
    <td class="no-print"><input type="number" class="unit-weight" min="0" placeholder="وزن/كرتون"></td>
    <td class="no-print"><button class="delete-row">✕</button></td>
  `;

  tbody.appendChild(tr);
  calculateRow(tr);
  calculateTotals();
}

function handleInput(e) {
  const tr = e.target.closest("tr");
  if (!tr) return;

  if (
    e.target.classList.contains("qty") ||
    e.target.classList.contains("unit-weight") ||
    e.target.classList.contains("total-weight") ||
    e.target.classList.contains("value")
  ) {
    calculateRow(tr);
    calculateTotals();
  }
}

function calculateRow(tr) {
  const qty = parseFloat(tr.querySelector(".qty").value) || 0;
  const unitWeight = parseFloat(tr.querySelector(".unit-weight").value) || 0;
  const totalWeightInput = tr.querySelector(".total-weight");

  if (unitWeight > 0) {
    totalWeightInput.value = (qty * unitWeight).toFixed(3);
  }
}

function calculateTotals() {
  const rows = document.querySelectorAll("#itemsBody tr");

  let totalQty = 0;
  let totalWeight = 0;
  let totalValue = 0;

  rows.forEach((tr) => {
    totalQty += parseFloat(tr.querySelector(".qty").value) || 0;
    totalWeight += parseFloat(tr.querySelector(".total-weight").value) || 0;
    totalValue += parseFloat(tr.querySelector(".value").value) || 0;
  });

  document.getElementById("totalQty").textContent = totalQty;
  document.getElementById("totalWeight").textContent = totalWeight.toFixed(3);
  document.getElementById("totalValue").textContent = totalValue.toFixed(2);
}

function deleteRow(e) {
  if (!e.target.classList.contains("delete-row")) return;

  e.target.closest("tr").remove();
  reorderRows();
  calculateTotals();
}

function reorderRows() {
  document.querySelectorAll("#itemsBody tr").forEach((tr, i) => {
    tr.querySelector(".row-index").textContent = i + 1;
  });
}
