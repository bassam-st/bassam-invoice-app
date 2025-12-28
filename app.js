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

// ======================
// إعداد التاريخ الحالي
// ======================
(function setToday() {
  const today = new Date().toISOString().slice(0, 10);
  invoiceDateInput.value = today;
})();

// تحديث النص حسب العملة
currencySelect.addEventListener('change', () => {
  totalCurrencyLabel.textContent = currencySelect.value;
});

// ======================
// إنشاء صف جديد
// ======================
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

// ======================
// ربط الأحداث لكل صف
// ======================
function attachRowEvents(row) {
  const qtyInput = row.querySelector('.qty-input');
  const weightPerCartonInput = row.querySelector('.weight-per-carton-input');
  const pricePerCartonInput = row.querySelector('.price-per-carton-input');
  const descInput = row.querySelector('.desc-input');

  // تحديث المجاميع عند التغيير
  [qtyInput, weightPerCartonInput, pricePerCartonInput, descInput].forEach(input => {
    input.addEventListener('input', () => {
      updateRowTotals(row);
      updateTotals();
    });
  });

  // حذف الصف
  const deleteBtn = row.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => {
    const ok = confirm('هل أنت متأكد من حذف هذا السطر؟');
    if (!ok) return;
    row.remove();
    updateTotals();
  });

  // أزرار الصوت: كل زر مربوط بالخانة فوقه داخل .mic-wrap
  const micButtons = row.querySelectorAll('[data-mic]');
  micButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.mic-wrap');
      const input = wrap ? wrap.querySelector('input') : null;
      if (input) startVoiceForInput(input);
    });
  });
}

// ======================
// حساب وزن وقيمة الصف
// ======================
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

// ======================
// حساب مجاميع الفاتورة
// ======================
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

// ======================================================
// PDF/Print داخل AppsGeyser (بدون window.print)
// ======================================================
function safeFileName(s) {
  return String(s || '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'invoice';
}

function getInvoiceDataForPdf() {
  const title = (invoiceTitleInput ? invoiceTitleInput.value.trim() : '') || 'فاتورة';
  const clientName = clientNameInput.value.trim() || '-';
  const invoiceNumber = invoiceNumberInput.value.trim() || '-';
  const date = invoiceDateInput.value || '-';
  const currency = currencySelect.value || '-';

  const rows = [];
  itemsBody.querySelectorAll('tr').forEach((row, i) => {
    const qty = row.querySelector('.qty-input')?.value || '';
    const desc = row.querySelector('.desc-input')?.value || '';
    const wpc = row.querySelector('.weight-per-carton-input')?.value || '';
    const vpc = row.querySelector('.price-per-carton-input')?.value || '';
    const tw = row.querySelector('.total-weight-input')?.value || '';
    const tv = row.querySelector('.total-value-input')?.value || '';

    // لا نرمي السطر الفاضي بالكامل
    if (!qty && !desc && !wpc && !vpc && !tw && !tv) return;

    rows.push([String(i + 1), desc, qty, wpc, vpc, tw, tv]);
  });

  return {
    title,
    clientName,
    invoiceNumber,
    date,
    currency,
    rows,
    totals: {
      qty: totalQtyEl.textContent || '0',
      weight: totalWeightEl.textContent || '0',
      value: totalValueEl.textContent || '0',
    }
  };
}

async function buildAndSavePdf() {
  try {
    if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf?.jsPDF) {
      // بعض البيئات: jsPDF موجود في window.jspdf.jsPDF
      // نحن سنتعامل مع الأكثر شيوعاً:
    }

    // jsPDF UMD
    const jsPDF = (window.jspdf && (window.jspdf.jsPDF || window.jspdf)) ? (window.jspdf.jsPDF || window.jspdf) : null;
    if (!jsPDF) {
      alert('مكتبات PDF غير موجودة. تأكد أنك أضفت jsPDF و AutoTable في index.html.');
      return;
    }

    const data = getInvoiceDataForPdf();
    if (!data.rows.length) {
      alert('لا توجد أصناف لإنشاء PDF.');
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // عنوان
    doc.setFontSize(18);
    doc.text(data.title, 555, 40, { align: 'right' });

    // معلومات
    doc.setFontSize(11);
    doc.text(`اسم العميل: ${data.clientName}`, 555, 70, { align: 'right' });
    doc.text(`رقم الفاتورة: ${data.invoiceNumber}`, 555, 86, { align: 'right' });
    doc.text(`التاريخ: ${data.date}`, 555, 102, { align: 'right' });
    doc.text(`العملة: ${data.currency}`, 555, 118, { align: 'right' });

    // جدول
    if (typeof doc.autoTable !== 'function') {
      alert('مكتبة AutoTable غير موجودة. تأكد أنك أضفت jsPDF AutoTable في index.html.');
      return;
    }

    doc.autoTable({
      startY: 140,
      head: [[ '#', 'الصنف', 'العدد', 'وزن/كرتون', 'قيمة/كرتون', 'الوزن الكلي', 'القيمة الكلية' ]],
      body: data.rows,
      margin: { left: 40, right: 40 },
      styles: { fontSize: 10, halign: 'right', cellPadding: 6 },
      headStyles: { halign: 'right' },
      didParseCell: (hook) => {
        // توسيط الرقم والعدد
        if (hook.column.index === 0 || hook.column.index === 2) {
          hook.cell.styles.halign = 'center';
        }
      }
    });

    // إجماليات
    const y = doc.lastAutoTable.finalY + 25;
    doc.setFontSize(12);
    doc.text(`إجمالي العدد: ${data.totals.qty}`, 555, y, { align: 'right' });
    doc.text(`إجمالي الوزن: ${data.totals.weight}`, 555, y + 16, { align: 'right' });
    doc.text(`إجمالي القيمة (${data.currency}): ${data.totals.value}`, 555, y + 32, { align: 'right' });

    // حفظ
    const fileName = `${safeFileName(data.title)}_${safeFileName(data.invoiceNumber || data.date)}.pdf`;
    doc.save(fileName);

  } catch (e) {
    alert('حدث خطأ أثناء إنشاء PDF. إذا ظهر PDF لكن العربي مربعات، أخبرني لأعطيك نسخة بخط عربي.');
  }
}

// زر PDF (يعمل داخل AppsGeyser)
pdfBtn.addEventListener('click', () => {
  buildAndSavePdf();
});

// زر طباعة: نفس PDF (لأن window.print لا يعمل داخل AppsGeyser)
printBtn.addEventListener('click', () => {
  buildAndSavePdf();
});

// ======================
// الصوت (Speech-to-Text)
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
      // يسمح بالأرقام والنقطة العشرية
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
// حفظ الفواتير (localStorage)
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

    // عنوان الفاتورة (يبقى)
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

// زر حفظ الفاتورة
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

// تحميل فاتورة محفوظة
function loadInvoice(id) {
  const invoices = loadSavedInvoicesFromStorage();
  const inv = invoices.find(i => i.id === id);
  if (!inv) return;

  // عنوان الفاتورة
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
// زر التثبيت PWA
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

// إخفاء زر التثبيت إذا كان التطبيق مثبت
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
