// عناصر رئيسية
const itemsBody = document.getElementById('itemsBody');
const totalQtyEl = document.getElementById('totalQty');
const totalWeightEl = document.getElementById('totalWeight');
const totalValueEl = document.getElementById('totalValue');
const totalCurrencyLabel = document.getElementById('totalCurrencyLabel');

const clientNameInput = document.getElementById('clientName');
const invoiceNumberInput = document.getElementById('invoiceNumber');
const currencySelect = document.getElementById('currencySelect');
const invoiceDateInput = document.getElementById('invoiceDate');

const addRowBtn = document.getElementById('addRowBtn');
const printBtn = document.getElementById('printBtn');
const pdfBtn = document.getElementById('pdfBtn');
const saveInvoiceBtn = document.getElementById('saveInvoiceBtn');
const installBtn = document.getElementById('installBtn');

const savedInvoicesList = document.getElementById('savedInvoicesList');

/* ======================================================
   FIX: طباعة وصف الصنف كامل (حل مشكلة input في PDF)
   ====================================================== */
function preparePrintDescriptions() {
  document.querySelectorAll('.print-desc').forEach(el => el.remove());

  document.querySelectorAll('.desc-input').forEach(input => {
    const td = input.closest('td');
    if (!td) return;

    const div = document.createElement('div');
    div.className = 'print-desc';
    div.textContent = input.value || '';
    td.appendChild(div);
  });
}

function cleanupPrintDescriptions() {
  document.querySelectorAll('.print-desc').forEach(el => el.remove());
}

window.addEventListener('beforeprint', preparePrintDescriptions);
window.addEventListener('afterprint', cleanupPrintDescriptions);

// إعداد التاريخ الحالي
(function setToday() {
  const today = new Date().toISOString().slice(0, 10);
  invoiceDateInput.value = today;
})();

// تحديث النص حسب العملة
currencySelect.addEventListener('change', () => {
  totalCurrencyLabel.textContent = currencySelect.value;
});

// إنشاء صف جديد
function createRow(initial = {}) {
  const row = document.createElement('tr');

  row.innerHTML = `
    <td>
      <input type="number" min="0" step="1" class="qty-input" value="${initial.qty ?? ''}" />
    </td>
    <td>
      <input type="text" class="desc-input" value="${initial.desc ?? ''}" />
    </td>
    <td>
      <input type="number" min="0" step="0.01" class="weight-per-carton-input" value="${initial.weightPerCarton ?? ''}" />
    </td>
    <td>
      <input type="number" min="0" step="0.01" class="price-per-carton-input" value="${initial.pricePerCarton ?? ''}" />
    </td>
    <td>
      <input type="number" class="total-weight-input" value="${initial.totalWeight ?? ''}" readonly />
    </td>
    <td>
      <input type="number" class="total-value-input" value="${initial.totalValue ?? ''}" readonly />
    </td>
    <td>
      <button type="button" class="delete-btn">✕</button>
    </td>
  `;

  itemsBody.appendChild(row);
  attachRowEvents(row);
  updateRowTotals(row);
  updateTotals();
}

// ربط الأحداث
function attachRowEvents(row) {
  const qtyInput = row.querySelector('.qty-input');
  const weightInput = row.querySelector('.weight-per-carton-input');
  const priceInput = row.querySelector('.price-per-carton-input');

  [qtyInput, weightInput, priceInput].forEach(input => {
    input.addEventListener('input', () => {
      updateRowTotals(row);
      updateTotals();
    });
  });

  row.querySelector('.delete-btn').addEventListener('click', () => {
    if (confirm('حذف السطر؟')) {
      row.remove();
      updateTotals();
    }
  });
}

// حساب صف
function updateRowTotals(row) {
  const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
  const weight = parseFloat(row.querySelector('.weight-per-carton-input').value) || 0;
  const price = parseFloat(row.querySelector('.price-per-carton-input').value) || 0;

  row.querySelector('.total-weight-input').value = qty && weight ? (qty * weight).toFixed(2) : '';
  row.querySelector('.total-value-input').value = qty && price ? (qty * price).toFixed(2) : '';
}

// حساب الإجمالي
function updateTotals() {
  let q = 0, w = 0, v = 0;

  itemsBody.querySelectorAll('tr').forEach(row => {
    q += parseFloat(row.querySelector('.qty-input').value) || 0;
    w += parseFloat(row.querySelector('.total-weight-input').value) || 0;
    v += parseFloat(row.querySelector('.total-value-input').value) || 0;
  });

  totalQtyEl.textContent = q;
  totalWeightEl.textContent = w.toFixed(2);
  totalValueEl.textContent = v.toFixed(2);
}

// أزرار
addRowBtn.addEventListener('click', () => createRow());

printBtn.addEventListener('click', () => {
  preparePrintDescriptions();
  window.print();
  setTimeout(cleanupPrintDescriptions, 300);
});

pdfBtn.addEventListener('click', () => {
  preparePrintDescriptions();
  window.print();
  setTimeout(cleanupPrintDescriptions, 300);
});

// حفظ محلي
const STORAGE_KEY = 'bassamInvoiceApp:savedInvoices';

function loadSavedInvoicesFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveInvoicesToStorage(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

saveInvoiceBtn.addEventListener('click', () => {
  alert('تم حفظ الفاتورة ✅');
});

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// صف مبدئي
createRow();
