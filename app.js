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

// إنشاء سطر جديد
function createRow() {
  const tr = document.createElement('tr');

  // نجهز كل المدخلات أولاً
  const inputQty = document.createElement('input');
  inputQty.type = 'number';
  inputQty.min = '0';
  inputQty.step = '1';
  inputQty.placeholder = '0';
  inputQty.dataset.role = 'qty';

  const inputItem = document.createElement('input');
  inputItem.type = 'text';
  inputItem.placeholder = 'الصنف';
  inputItem.dataset.role = 'item';

  const inputWeightPer = document.createElement('input');
  inputWeightPer.type = 'number';
  inputWeightPer.min = '0';
  inputWeightPer.step = 'any';
  inputWeightPer.placeholder = '0';
  inputWeightPer.dataset.role = 'weightPer';

  const inputPricePer = document.createElement('input');
  inputPricePer.type = 'number';
  inputPricePer.min = '0';
  inputPricePer.step = 'any';
  inputPricePer.placeholder = '0';
  inputPricePer.dataset.role = 'pricePer';

  const inputTotalWeight = document.createElement('input');
  inputTotalWeight.type = 'number';
  inputTotalWeight.readOnly = true;
  inputTotalWeight.placeholder = '';
  inputTotalWeight.dataset.role = 'totalWeight';

  const inputTotalPrice = document.createElement('input');
  inputTotalPrice.type = 'number';
  inputTotalPrice.readOnly = true;
  inputTotalPrice.placeholder = '';
  inputTotalPrice.dataset.role = 'totalPrice';

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

  [inputQty, inputWeightPer, inputPricePer].forEach(inp => {
    inp.addEventListener('input', recalcRow);
    inp.addEventListener('change', recalcRow);
  });

  // الآن نركّب الأعمدة داخل الصف بالترتيب من اليسار إلى اليمين:
  // حذف – القيمة الكلية – الوزن الكلي – قيمة/كرتون – وزن/كرتون – الصنف – العدد

  // حذف
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

  // القيمة الكلية
  const tdTotalPrice = document.createElement('td');
  tdTotalPrice.classList.add('col-total-price');
  tdTotalPrice.appendChild(inputTotalPrice);
  tr.appendChild(tdTotalPrice);

  // الوزن الكلي
  const tdTotalWeight = document.createElement('td');
  tdTotalWeight.classList.add('col-total-weight');
  tdTotalWeight.appendChild(inputTotalWeight);
  tr.appendChild(tdTotalWeight);

  // قيمة / كرتون (مخفية عند الطباعة)
  const tdPricePer = document.createElement('td');
  tdPricePer.classList.add('col-price-per', 'no-print');
  tdPricePer.appendChild(inputPricePer);
  tr.appendChild(tdPricePer);

  // وزن / كرتون (مخفية عند الطباعة)
  const tdWeightPer = document.createElement('td');
  tdWeightPer.classList.add('col-weight-per', 'no-print');
  tdWeightPer.appendChild(inputWeightPer);
  tr.appendChild(tdWeightPer);

  // الصنف
  const tdItem = document.createElement('td');
  tdItem.classList.add('col-item');
  tdItem.appendChild(inputItem);
  tr.appendChild(tdItem);

  // العدد (أقصى اليمين)
  const tdQty = document.createElement('td');
  tdQty.classList.add('col-qty');
  tdQty.appendChild(inputQty);
  tr.appendChild(tdQty);

  itemsBody.appendChild(tr);
}

// تحديث الإجماليات
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

// طباعة / حفظ PDF (من متصفح الجوال)
function triggerPrint() {
  window.print();
}

printBtn.addEventListener('click', triggerPrint);
pdfBtn.addEventListener('click', triggerPrint);

// زر إضافة سطر
addRowBtn.addEventListener('click', () => {
  createRow();
});

// إنشاء سطر افتراضي
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
