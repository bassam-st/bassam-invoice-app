// مراجع عناصر الصفحة
const itemsBody      = document.getElementById('itemsBody');
const addRowBtn      = document.getElementById('addRowBtn');
const printBtn       = document.getElementById('printBtn');
const pdfBtn         = document.getElementById('pdfBtn');
const currencySelect = document.getElementById('currency');
const currencyLabel  = document.getElementById('currencyLabel');
const totalQtyEl     = document.getElementById('totalQty');
const totalWeightEl  = document.getElementById('totalWeight');
const totalPriceEl   = document.getElementById('totalPrice');
const invoiceDate    = document.getElementById('invoiceDate');
const installBtn     = document.getElementById('installBtn');

// تعيين تاريخ اليوم افتراضياً
if (invoiceDate && !invoiceDate.value) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  invoiceDate.value = `${yyyy}-${mm}-${dd}`;
}

// تحديث تسمية العملة في إجمالي القيمة
function updateCurrencyLabel() {
  const val = currencySelect.value || 'ريال سعودي';
  currencyLabel.textContent = `(${val})`;
}
currencySelect.addEventListener('change', updateCurrencyLabel);
updateCurrencyLabel();

// إنشاء سطر جديد في الجدول
function createRow() {
  const tr = document.createElement('tr');

  // الترتيب من اليمين (مع RTL):
  // العدد | الصنف | وزن/كرتون | قيمة/كرتون | الوزن الكلي | القيمة الكلية | حذف

  // 1) العدد
  const tdQty = document.createElement('td');
  tdQty.classList.add('col-qty');
  const inputQty = document.createElement('input');
  inputQty.type = 'number';
  inputQty.min = '0';
  inputQty.step = '1';
  inputQty.placeholder = '0';
  inputQty.dataset.role = 'qty';
  tdQty.appendChild(inputQty);
  tr.appendChild(tdQty);

  // 2) الصنف
  const tdItem = document.createElement('td');
  tdItem.classList.add('col-item');
  const inputItem = document.createElement('input');
  inputItem.type = 'text';
  inputItem.placeholder = 'الصنف';
  inputItem.dataset.role = 'item';
  tdItem.appendChild(inputItem);
  tr.appendChild(tdItem);

  // 3) وزن / كرتون (كجم)
  const tdWeightPer = document.createElement('td');
  tdWeightPer.classList.add('col-weight-per', 'no-print');
  const inputWeightPer = document.createElement('input');
  inputWeightPer.type = 'number';
  inputWeightPer.min = '0';
  inputWeightPer.step = 'any';
  inputWeightPer.placeholder = '0';
  inputWeightPer.dataset.role = 'weightPer';
  tdWeightPer.appendChild(inputWeightPer);
  tr.appendChild(tdWeightPer);

  // 4) قيمة / كرتون
  const tdPricePer = document.createElement('td');
  tdPricePer.classList.add('col-price-per', 'no-print');
  const inputPricePer = document.createElement('input');
  inputPricePer.type = 'number';
  inputPricePer.min = '0';
  inputPricePer.step = 'any';
  inputPricePer.placeholder = '0';
  inputPricePer.dataset.role = 'pricePer';
  tdPricePer.appendChild(inputPricePer);
  tr.appendChild(tdPricePer);

  // 5) الوزن الكلي (ناتج)
  const tdTotalWeight = document.createElement('td');
  tdTotalWeight.classList.add('col-total-weight');
  const inputTotalWeight = document.createElement('input');
  inputTotalWeight.type = 'number';
  inputTotalWeight.readOnly = true;
  inputTotalWeight.placeholder = '';
  inputTotalWeight.dataset.role = 'totalWeight';
  tdTotalWeight.appendChild(inputTotalWeight);
  tr.appendChild(tdTotalWeight);

  // 6) القيمة الكلية (ناتج)
  const tdTotalPrice = document.createElement('td');
  tdTotalPrice.classList.add('col-total-price');
  const inputTotalPrice = document.createElement('input');
  inputTotalPrice.type = 'number';
  inputTotalPrice.readOnly = true;
  inputTotalPrice.placeholder = '';
  inputTotalPrice.dataset.role = 'totalPrice';
  tdTotalPrice.appendChild(inputTotalPrice);
  tr.appendChild(tdTotalPrice);

  // 7) حذف
  const tdDelete = document.createElement('td');
  tdDelete.classList.add('col-delete', 'no-print');
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.textContent = '✕';
  delBtn.className = 'delete-btn';
  delBtn.addEventListener('click', () => {
    const ok = confirm('هل أنت متأكد من حذف هذا السطر؟');
    if (!ok) return;
    tr.remove();
    updateTotals();
  });
  tdDelete.appendChild(delBtn);
  tr.appendChild(tdDelete);

  // دالة حساب السطر
  function recalcRow() {
    const qty   = parseFloat(inputQty.value)        || 0;
    const wEach = parseFloat(inputWeightPer.value) || 0;
    const pEach = parseFloat(inputPricePer.value)  || 0;

    const totalW = qty * wEach;
    const totalP = qty * pEach;

    inputTotalWeight.value = totalW ? totalW : '';
    inputTotalPrice.value  = totalP ? totalP : '';

    updateTotals();
  }

  // مستمعي الأحداث
  [inputQty, inputWeightPer, inputPricePer].forEach(inp => {
    inp.addEventListener('input', recalcRow);
    inp.addEventListener('change', recalcRow);
  });

  itemsBody.appendChild(tr);
}

// تحديث الإجماليات أسفل الجدول
function updateTotals() {
  let totalQty   = 0;
  let totalWgt   = 0;
  let totalPrice = 0;

  Array.from(itemsBody.querySelectorAll('tr')).forEach(row => {
    const qtyInput         = row.querySelector('input[data-role="qty"]');
    const totalWeightInput = row.querySelector('input[data-role="totalWeight"]');
    const totalPriceInput  = row.querySelector('input[data-role="totalPrice"]');
    if (!qtyInput || !totalWeightInput || !totalPriceInput) return;

    const q  = parseFloat(qtyInput.value)         || 0;
    const tw = parseFloat(totalWeightInput.value) || 0;
    const tp = parseFloat(totalPriceInput.value)  || 0;

    totalQty   += q;
    totalWgt   += tw;
    totalPrice += tp;
  });

  totalQtyEl.textContent    = totalQty || 0;
  totalWeightEl.textContent = totalWgt || 0;
  totalPriceEl.textContent  = totalPrice || 0;
}

// أزرار الطباعة و PDF (نفس الشيء)
function triggerPrint() {
  window.print();
}
printBtn.addEventListener('click', triggerPrint);
pdfBtn.addEventListener('click', triggerPrint);

// زر إضافة سطر
addRowBtn.addEventListener('click', () => {
  createRow();
});

// سطر افتراضي
createRow();

/* زر التثبيت كتطبيق (PWA) */
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) {
    installBtn.style.display = 'inline-block';
  }
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    installBtn.style.display = 'none';
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
}

window.addEventListener('appinstalled', () => {
  console.log('تم تثبيت التطبيق 👍');
});
