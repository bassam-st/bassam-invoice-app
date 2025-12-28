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

const invoiceArea = document.getElementById('invoiceArea'); // المنطقة التي سنحوّلها PDF

/* ======================================================
   FIX: طباعة وصف الصنف كامل في الطباعة/PDF (نضيف DIV مؤقت)
   ====================================================== */
function preparePrintDescriptions() {
  document.querySelectorAll('.print-desc').forEach(el => el.remove());

  document.querySelectorAll('.desc-input').forEach(input => {
    const td = input.closest('td');
    if (!td) return;

    if (td.querySelector('.print-desc')) return;

    const div = document.createElement('div');
    div.className = 'print-desc';
    div.style.marginTop = '6px';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordBreak = 'break-word';
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
addRowBtn.addEventListener('click', () => {
  createRow();
});

/* ======================================================
   طباعة محسّنة: نفتح نافذة جديدة ثم نطبع
   (أفضل من window.print داخل WebView)
   ====================================================== */
function openPrintWindow() {
  preparePrintDescriptions();

  const html = `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>طباعة الفاتورة</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body{ font-family:"Cairo", Arial, sans-serif; margin:16px; }
    .actions, #savedInvoicesSection, .footer-note{ display:none !important; }
    table{ width:100%; border-collapse:collapse; }
    th,td{ border:1px solid #ddd; padding:8px; vertical-align:top; }
    input,select,button{ display:none !important; } /* نخفي حقول الإدخال في نسخة الطباعة */
    .print-desc{ display:block; white-space:pre-wrap; word-break:break-word; }
    h2,h1{ margin:12px 0; }
    @media print { body{ margin:0; } }
  </style>
</head>
<body>
  ${invoiceArea.innerHTML}
  <script>
    window.onload = function(){
      setTimeout(function(){ window.print(); }, 400);
    }
  </script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) {
    cleanupPrintDescriptions();
    alert('المتصفح منع فتح نافذة جديدة. فعّل النوافذ المنبثقة (Popups) للتطبيق/المتصفح.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();

  setTimeout(cleanupPrintDescriptions, 800);
}

printBtn.addEventListener('click', () => {
  openPrintWindow();
});

/* ======================================================
   PDF حقيقي بدون تشويه العربية:
   نصوّر الفاتورة (Canvas) ثم نضعها داخل PDF
   ====================================================== */
async function generatePdfFromInvoice() {
  try {
    preparePrintDescriptions();

    // نخفي أزرار الأكشن أثناء التصوير (حتى لا تظهر داخل PDF)
    const actionsEl = document.querySelector('.actions');
    const savedEl = document.getElementById('savedInvoicesSection');
    const footerEl = document.querySelector('.footer-note');
    const oldDisplay = {
      actions: actionsEl ? actionsEl.style.display : '',
      saved: savedEl ? savedEl.style.display : '',
      footer: footerEl ? footerEl.style.display : ''
    };
    if (actionsEl) actionsEl.style.display = 'none';
    if (savedEl) savedEl.style.display = 'none';
    if (footerEl) footerEl.style.display = 'none';

    // تصوير
    const canvas = await html2canvas(invoiceArea, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight
    });

    // رجّع الإخفاء لوضعه السابق
    if (actionsEl) actionsEl.style.display = oldDisplay.actions;
    if (savedEl) savedEl.style.display = oldDisplay.saved;
    if (footerEl) footerEl.style.display = oldDisplay.footer;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // حساب أبعاد الصورة على A4
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    // إذا الصورة أطول من صفحة واحدة: نقسّمها صفحات
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      pdf.addPage();
      position = heightLeft - imgHeight; // تحريك للأعلى (قيمة سالبة)
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // اسم الملف
    const invNo = (invoiceNumberInput.value || 'invoice').replace(/[^\w\-]+/g, '_');
    const date = invoiceDateInput.value || '';
    const filename = `فاتورة_${invNo}_${date || 'بدون_تاريخ'}.pdf`;

    pdf.save(filename);

  } catch (e) {
    console.error(e);
    alert('حصل خطأ أثناء إنشاء PDF. تأكد من وجود إنترنت، ثم جرّب مرة أخرى.');
  } finally {
    cleanupPrintDescriptions();
  }
}

pdfBtn.addEventListener('click', () => {
  generatePdfFromInvoice();
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
    alert('خاصية الإملاء بالصوت غير مدعومة في هذا المتصفح. جرب Google Chrome على أندرويد.');
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

    if (!qty && !desc && !weightPerCarton && !pricePerCarton && !totalWeight && !totalValue) {
      return;
    }

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
      loadBtn.addEventListener('click', () => {
        loadInvoice(invoice.id);
      });

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

// إنشاء صف أولي واحد عند فتح الصفحة
createRow();

// تحميل الفواتير المحفوظة في البداية
renderSavedInvoices();
