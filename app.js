// إضافة صف جديد
function addRow() {
  const tbody = document.getElementById('items-body');
  const row = document.createElement('tr');

  row.innerHTML = `
    <td>
      <input type="number" class="cell-input qty" min="0" step="1" />
    </td>
    <td>
      <input type="text" class="cell-input desc" />
    </td>
    <td class="no-print">
      <input type="number" class="cell-input weight-per" min="0" step="0.01" />
    </td>
    <td class="no-print">
      <input type="number" class="cell-input price-per" min="0" step="0.01" />
    </td>
    <td>
      <input type="number" class="cell-input total-weight" readonly />
    </td>
    <td>
      <input type="number" class="cell-input total-price" readonly />
    </td>
    <td class="no-print">
      <button type="button" class="btn btn-danger delete-row">✕</button>
    </td>
  `;

  tbody.appendChild(row);
  attachRowListeners(row);
}

// ربط الأحداث لكل صف
function attachRowListeners(row) {
  const qtyInput        = row.querySelector('.qty');
  const weightPerInput  = row.querySelector('.weight-per');
  const pricePerInput   = row.querySelector('.price-per');
  const deleteBtn       = row.querySelector('.delete-row');

  function recalcRow() {
    const qty       = parseFloat(qtyInput.value) || 0;
    const weightPer = parseFloat(weightPerInput?.value) || 0;
    const pricePer  = parseFloat(pricePerInput?.value) || 0;

    const totalWeightInput = row.querySelector('.total-weight');
    const totalPriceInput  = row.querySelector('.total-price');

    const totalWeight = qty * weightPer;
    const totalPrice  = qty * pricePer;

    totalWeightInput.value = totalWeight ? totalWeight.toFixed(2) : '';
    totalPriceInput.value  = totalPrice ? totalPrice.toFixed(2) : '';

    recalcTotals();
  }

  qtyInput.addEventListener('input', recalcRow);
  weightPerInput.addEventListener('input', recalcRow);
  pricePerInput.addEventListener('input', recalcRow);

  deleteBtn.addEventListener('click', () => {
    const ok = confirm('هل أنت متأكد من حذف هذا السطر؟');
    if (ok) {
      row.remove();
      recalcTotals();
    }
  });
}

// إعادة حساب المجاميع النهائية
function recalcTotals() {
  const tbody = document.getElementById('items-body');
  let totalQty = 0;
  let totalWeight = 0;
  let totalPrice = 0;

  Array.from(tbody.querySelectorAll('tr')).forEach(row => {
    const qtyInput         = row.querySelector('.qty');
    const totalWeightInput = row.querySelector('.total-weight');
    const totalPriceInput  = row.querySelector('.total-price');

    const qty    = parseFloat(qtyInput.value) || 0;
    const weight = parseFloat(totalWeightInput.value) || 0;
    const price  = parseFloat(totalPriceInput.value) || 0;

    totalQty    += qty;
    totalWeight += weight;
    totalPrice  += price;
  });

  document.getElementById('total-qty').textContent    = totalQty.toString();
  document.getElementById('total-weight').textContent = totalWeight.toFixed(2);
  document.getElementById('total-price').textContent  = totalPrice.toFixed(2);
}

// طباعة / حفظ PDF (يعتمد على نظام الهاتف)
function printInvoice() {
  window.print();
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-row').addEventListener('click', addRow);
  document.getElementById('print-pdf').addEventListener('click', printInvoice);
  document.getElementById('print-btn').addEventListener('click', printInvoice);

  // إضافة صف واحد افتراضي عند فتح الصفحة
  addRow();
});
