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

const invoiceTitleInput = document.getElementById('invoiceTitle');

const addRowBtn = document.getElementById('addRowBtn');
const printBtn = document.getElementById('printBtn');
const pdfBtn = document.getElementById('pdfBtn');
const saveInvoiceBtn = document.getElementById('saveInvoiceBtn');
const installBtn = document.getElementById('installBtn');

const savedInvoicesList = document.getElementById('savedInvoicesList');

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
      <div class="mic-wrap">
        <input type="number" min="0" step="1" class="qty-input" value="${initial.qty ?? ''}" placeholder="0" />
        <button type="button" class="mic-under" data-mic title="إدخال بالصوت">🎤</button>
      </div>
    </td>

    <td>
      <div class="mic-wrap">
        <input type="text" class="desc-input" value="${initial.desc ?? ''}" placeholder="وصف الصنف" />
        <button type="button" class="mic-under" data-mic title="إدخال بالصوت">🎤</button>
      </div>
    </td>

    <td>
      <div class="mic-wrap">
        <input type="number" min="0" step="0.01" class="weight-per-carton-input" value="${initial.weightPerCarton ?? ''}" placeholder="0" />
        <button type="button" class="mic-under" data-mic title="إدخال بالصوت">🎤</button>
      </div>
    </td>

    <td>
      <div class="mic-wrap">
        <input type="number" min="0" step="0.01" class="price-per-carton-input" value="${initial.pricePerCarton ?? ''}" placeholder="0" />
        <button type="button" class="mic-under" data-mic title="إدخال بالصوت">🎤</button>
      </div>
    </td>

    <td>
      <input type="number" min="0" step="0.01" class="total-weight-input" value="${initial.totalWeight ?? ''}" placeholder="0" readonly />
    </td>

    <td>
      <input type="number" min="0" step="0.01" class="total-value-input" value="${initial.totalValue ?? ''}" placeholder="0" readonly />
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

// ربط الأحداث لكل صف
function attachRowEvents(row) {
  const qtyInput = row.querySelector('.qty-input');
  const weightPerCartonInput = row.querySelector('.weight-per-carton-input');
  const pricePerCartonInput = row.querySelector('.price-per-carton-input');
  const descInput = row.querySelector('.desc-input');

  [qtyInput, weightPerCartonInput, pricePerCartonInput, descInput].forEach(input => {
    input.addEventListener('input', () => {
      updateRowTotals(row);
      updateTotals();
    });
  });

  const deleteBtn = row.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => {
    const ok = confirm('هل أنت متأكد من حذف هذا السطر؟');
    if (!ok) return;
    row.remove();
    updateTotals();
  });

  const micButtons = row.querySelectorAll('[data-mic]');
  micButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.mic-wrap');
      const input = wrap ? wrap.querySelector('input') : null;
      if (input) startVoiceForInput(input);
    });
  });
}

// حساب وزن وقيمة الصف
function updateRowTotals(row) {
  const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
  const weightPerCarton = parseFloat(row.querySelector('.weight-per-carton-input').value) || 0;
  const pricePerCarton = parseFloat(row.querySelector('.price-per-carton-input').value) || 0;

  const totalWeightInput = row.querySelector('.total-weight-input');
  const totalValueInput = row.querySelector('.total-value-input');

  const totalWeight = qty * weightPerCarton;
  const totalValue = qty * pricePerCarton;

  totalWeightInput.value = totalWeight ? totalWeight.toFixed(2) : '';
  totalValueInput.value = totalValue ? totalValue.toFixed(2) : '';
}

// حساب مجاميع الفاتورة
function updateTotals() {
  let totalQty = 0;
  let totalWeight = 0;
  let totalValue = 0;

  itemsBody.querySelectorAll('tr').forEach(row => {
    const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
    const rowTotalWeight = parseFloat(row.querySelector('.total-weight-input').value) || 0;
    const rowTotalValue = parseFloat(row.querySelector('.total-value-input').value) || 0;

    totalQty += qty;
    totalWeight += rowTotalWeight;
    totalValue += rowTotalValue;
  });

  totalQtyEl.textContent = totalQty;
  totalWeightEl.textContent = totalWeight.toFixed(2);
  totalValueEl.textContent = totalValue.toFixed(2);
}

// زر إضافة سطر
addRowBtn.addEventListener('click', () => createRow());

// ==========================
//  طباعة/PDF داخل APK (IFRAME)
// ==========================
function escapeHtml(str) {
  return (str ?? '').toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildPrintableHTML() {
  const title = escapeHtml(invoiceTitleInput?.value || 'فاتورة بسام');
  const client = escapeHtml(clientNameInput.value || '');
  const invNo = escapeHtml(invoiceNumberInput.value || '');
  const cur = escapeHtml(currencySelect.value || '');
  const date = escapeHtml(invoiceDateInput.value || '');

  // بيانات مكتبك (الهيدر في الطباعة)
  const officeName = 'مكتب بسام الشتيمي للتخليص الجمركي';
  const phone = '00967771997809';
  const email = 'Bassam.7111111@gmail.com';

  let rowsHtml = '';
  let idx = 1;

  itemsBody.querySelectorAll('tr').forEach(row => {
    const qty = escapeHtml(row.querySelector('.qty-input')?.value || '');
    const desc = escapeHtml(row.querySelector('.desc-input')?.value || '');
    const wpc = escapeHtml(row.querySelector('.weight-per-carton-input')?.value || '');
    const ppc = escapeHtml(row.querySelector('.price-per-carton-input')?.value || '');
    const tw = escapeHtml(row.querySelector('.total-weight-input')?.value || '');
    const tv = escapeHtml(row.querySelector('.total-value-input')?.value || '');

    // تجاهل الصف الفاضي تمامًا
    if (!qty && !desc && !wpc && !ppc && !tw && !tv) return;

    rowsHtml += `
      <tr>
        <td class="c">${idx++}</td>
        <td class="c">${qty || '0'}</td>
        <td class="r">${desc}</td>
        <td class="c">${wpc || '0'}</td>
        <td class="c">${ppc || '0'}</td>
        <td class="c">${tw || '0'}</td>
        <td class="c">${tv || '0'}</td>
      </tr>
    `;
  });

  const totalQty = escapeHtml(totalQtyEl.textContent);
  const totalWeight = escapeHtml(totalWeightEl.textContent);
  const totalValue = escapeHtml(totalValueEl.textContent);

  const css = `
    @page { size: A4; margin: 14mm; }
    body { font-family: "Cairo", Arial, sans-serif; direction: rtl; color: #111; }
    .top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px; }
    .brand { display:flex; gap:10px; align-items:center; }
    .mark { width:44px; height:44px; border-radius:12px; background:#16a34a; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:22px; }
    .brand .t1 { font-weight:800; font-size:14px; }
    .brand .t2 { font-size:11px; color:#444; }
    h1 { margin: 10px 0 6px; font-size:18px; text-align:center; }
    .meta { margin: 8px 0 10px; font-size:12px; display:grid; grid-template-columns: 1fr 1fr; gap:6px 10px; }
    .meta div { padding:6px 8px; border:1px solid #e6e6e6; border-radius:10px; }
    table { width:100%; border-collapse: collapse; margin-top:8px; font-size:12px; }
    th, td { border:1px solid #dcdcdc; padding:7px 8px; vertical-align:top; }
    th { background:#f3f6ff; }
    .c { text-align:center; }
    .r { text-align:right; }
    .totals { margin-top:10px; display:flex; gap:12px; justify-content:flex-start; flex-wrap:wrap; font-size:12px; }
    .totals .box { border:1px solid #e6e6e6; border-radius:10px; padding:8px 10px; }
    .foot { margin-top:14px; font-size:11px; color:#555; text-align:center; }
  `;

  return `
    <!doctype html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <title>${title}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="top">
        <div class="brand">
          <div class="mark">ب</div>
          <div>
            <div class="t1">${officeName}</div>
            <div class="t2">جوال: ${phone} • ${email}</div>
          </div>
        </div>
        <div style="text-align:left;font-size:11px;color:#666;direction:ltr">A4</div>
      </div>

      <h1>${title}</h1>

      <div class="meta">
        <div><strong>اسم العميل:</strong> ${client || '—'}</div>
        <div><strong>رقم الفاتورة:</strong> ${invNo || '—'}</div>
        <div><strong>العملة:</strong> ${cur || '—'}</div>
        <div><strong>التاريخ:</strong> ${date || '—'}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="c">#</th>
            <th class="c">العدد</th>
            <th class="r">الصنف</th>
            <th class="c">وزن/كرتون</th>
            <th class="c">قيمة/كرتون</th>
            <th class="c">الوزن الكلي</th>
            <th class="c">القيمة الكلية</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td class="c" colspan="7">لا توجد أصناف</td></tr>`}
        </tbody>
      </table>

      <div class="totals">
        <div class="box"><strong>إجمالي العدد:</strong> ${totalQty}</div>
        <div class="box"><strong>إجمالي الوزن (كجم):</strong> ${totalWeight}</div>
        <div class="box"><strong>إجمالي القيمة (${cur}):</strong> ${totalValue}</div>
      </div>

      <div class="foot">تم الإنشاء بواسطة تطبيق فاتورة بسام</div>

      <script>
        // بعض WebView تحتاج تأخير بسيط قبل الطباعة
        setTimeout(() => { window.print(); }, 400);
      </script>
    </body>
    </html>
  `;
}

function printViaIframe() {
  const html = buildPrintableHTML();

  // إزالة أي iframe قديم
  const old = document.getElementById('printFrame');
  if (old) old.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'printFrame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // تنظيف بعد الطباعة
  const cleanup = () => {
    setTimeout(() => {
      try { iframe.remove(); } catch {}
    }, 800);
  };

  iframe.contentWindow.onafterprint = cleanup;

  // احتياط: لو onafterprint ما اشتغل
  setTimeout(cleanup, 3000);
}

// زر الطباعة
printBtn.addEventListener('click', () => {
  printViaIframe();
});

// زر PDF (على أندرويد: اختَر "حفظ كـ PDF" من شاشة الطباعة)
pdfBtn.addEventListener('click', () => {
  printViaIframe();
});

// ======================
//  الصوت (Speech-to-Text)
// ======================
let recognition = null;
let recognitionActive = false;

function getRecognition() {
  if (recognition) return recognition;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('خاصية الإملاء بالصوت غير مدعومة هنا. الأفضل فتحه عبر Chrome.');
    return null;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'ar-SA';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  return recognition;
}

function startVoiceForInput(targetInput) {
  const rec = getRecognition();
  if (!rec || recognitionActive) return;

  recognitionActive = true;

  rec.onresult = (event) => {
    const transcript = event.results[0][0].transcript || '';

    if (targetInput.type === 'number') {
      const digits = transcript.replace(/[^\d.]/g, '');
      if (digits) targetInput.value = digits;
    } else {
      targetInput.value = transcript;
    }

    const row = targetInput.closest('tr');
    if (row) {
      updateRowTotals(row);
      updateTotals();
    }
  };

  rec.onerror = () => { recognitionActive = false; };
  rec.onend = () => { recognitionActive = false; };

  try { rec.start(); } catch (e) { recognitionActive = false; }
}

// ======================
//  حفظ الفواتير (localStorage)
// ======================
const STORAGE_KEY = 'bassamInvoiceApp:savedInvoices';

function loadSavedInvoicesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function saveInvoicesToStorage(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function captureCurrentInvoice() {
  const items = [];

  itemsBody.querySelectorAll('tr').forEach(row => {
    const qty = row.querySelector('.qty-input').value.trim();
    const desc = row.querySelector('.desc-input').value.trim();
    const weightPerCarton = row.querySelector('.weight-per-carton-input').value.trim();
    const pricePerCarton = row.querySelector('.price-per-carton-input').value.trim();
    const totalWeight = row.querySelector('.total-weight-input').value.trim();
    const totalValue = row.querySelector('.total-value-input').value.trim();

    if (!qty && !desc && !weightPerCarton && !pricePerCarton && !totalWeight && !totalValue) return;

    items.push({ qty, desc, weightPerCarton, pricePerCarton, totalWeight, totalValue });
  });

  return {
    id: Date.now(),
    title: invoiceTitleInput ? invoiceTitleInput.value.trim() : '',
    clientName: clientNameInput.value.trim(),
    invoiceNumber: invoiceNumberInput.value.trim(),
    currency: currencySelect.value,
    date: invoiceDateInput.value,
    items,
    totals: {
      qty: totalQtyEl.textContent,
      weight: totalWeightEl.textContent,
      value: totalValueEl.textContent
    }
  };
}

function renderSavedInvoices() {
  const invoices = loadSavedInvoicesFromStorage();
  savedInvoicesList.innerHTML = '';

  if (!invoices.length) {
    savedInvoicesList.textContent = 'لا توجد فواتير محفوظة حتى الآن.';
    return;
  }

  invoices
    .sort((a, b) => b.id - a.id)
    .forEach(invoice => {
      const card = document.createElement('div');
      card.className = 'saved-card';

      const main = document.createElement('div');
      main.className = 'saved-card-main';
      main.innerHTML = `
        <strong>${invoice.invoiceNumber || 'بدون رقم'}</strong>
        <span>العميل: ${invoice.clientName || 'غير محدد'}</span>
        <span>التاريخ: ${invoice.date || 'غير محدد'} – العملة: ${invoice.currency}</span>
      `;

      const buttons = document.createElement('div');
      buttons.className = 'saved-card-buttons';

      const loadBtn = document.createElement('button');
      loadBtn.className = 'saved-load-btn';
      loadBtn.textContent = 'تحميل';
      loadBtn.addEventListener('click', () => loadInvoice(invoice.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'saved-delete-btn';
      deleteBtn.textContent = 'حذف';
      deleteBtn.addEventListener('click', () => {
        const ok = confirm('هل تريد حذف هذه الفاتورة من الجهاز؟');
        if (!ok) return;
        const list = loadSavedInvoicesFromStorage().filter(i => i.id !== invoice.id);
        saveInvoicesToStorage(list);
        renderSavedInvoices();
      });

      buttons.appendChild(loadBtn);
      buttons.appendChild(deleteBtn);

      card.appendChild(main);
      card.appendChild(buttons);

      savedInvoicesList.appendChild(card);
    });
}

saveInvoiceBtn.addEventListener('click', () => {
  const invoice = captureCurrentInvoice();

  if (!invoice.items.length) {
    alert('لا يوجد أصناف في الفاتورة للحفظ.');
    return;
  }

  const list = loadSavedInvoicesFromStorage();
  list.push(invoice);
  saveInvoicesToStorage(list);
  renderSavedInvoices();

  alert('تم حفظ الفاتورة في هذا الجهاز ✅');
});

function loadInvoice(id) {
  const invoices = loadSavedInvoicesFromStorage();
  const inv = invoices.find(i => i.id === id);
  if (!inv) return;

  if (invoiceTitleInput) invoiceTitleInput.value = inv.title || 'فاتورة بسام';

  clientNameInput.value = inv.clientName || '';
  invoiceNumberInput.value = inv.invoiceNumber || '';
  currencySelect.value = inv.currency || 'ريال سعودي';
  invoiceDateInput.value = inv.date || '';

  totalCurrencyLabel.textContent = currencySelect.value;

  itemsBody.innerHTML = '';
  (inv.items || []).forEach(item => createRow(item));
  updateTotals();
}

// ======================
//  زر التثبيت PWA
// ======================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
    return;
  }

  alert('إذا لم تظهر نافذة التثبيت: افتح قائمة Chrome (⋮) ثم اختر "إضافة إلى الشاشة الرئيسية".');
});

window.addEventListener('DOMContentLoaded', () => {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) installBtn.hidden = true;
});

// تسجيل Service Worker إن وجد
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// بدء التطبيق
createRow();
renderSavedInvoices();
updateTotals();
