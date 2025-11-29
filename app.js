// ===== إعدادات عامة =====
const itemsBody = document.getElementById("itemsBody");
const addRowBtn = document.getElementById("addRowBtn");
const totalQtySpan = document.getElementById("totalQty");
const totalWeightSpan = document.getElementById("totalWeight");
const totalValueSpan = document.getElementById("totalValue");
const currencySelect = document.getElementById("currencySelect");
const currencyNote = document.getElementById("currencyNote");

// دعم المايك (إن وجد في المتصفح)
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "ar-YE"; // عربي يمني
}

// ===== دوال مساعدة للحساب الذكي =====

// ترجع مصفوفة الأرقام الموجودة في النص (مثلاً: "2 كرتون فيها 48 علبة والعلبة 200 جرام" => [2,48,200])
function extractNumbers(text) {
  if (!text) return [];
  const cleaned = text.replace(/[^\d.]/g, " ");
  return cleaned
    .split(/\s+/)
    .map((n) => Number(n))
    .filter((n) => !isNaN(n));
}

// في خانة العدد نأخذ أول رقم فقط
function parseQuantity(text) {
  const nums = extractNumbers(text);
  return nums.length ? nums[0] : 0;
}

// في الوزن والقيمة: إذا رقم واحد -> نفسه، إذا أكثر من رقم -> نضربهم ببعض
function parseMultiply(text) {
  const nums = extractNumbers(text);
  if (!nums.length) return 0;
  if (nums.length === 1) return nums[0];
  return nums.reduce((acc, n) => acc * n, 1);
}

// تحديث المجموع الكلي
function updateTotals() {
  let totalQty = 0;
  let totalWeight = 0;
  let totalValue = 0;

  itemsBody.querySelectorAll("tr").forEach((row) => {
    const qty = Number(row.dataset.qty || 0);
    const weight = Number(row.dataset.weight || 0);
    const value = Number(row.dataset.value || 0);

    totalQty += qty;
    totalWeight += weight;
    totalValue += value;
  });

  totalQtySpan.textContent = totalQty;
  totalWeightSpan.textContent = totalWeight;
  totalValueSpan.textContent = totalValue.toFixed(2);
}

// حساب صف واحد
function recalcRow(row) {
  const qtyInput = row.querySelector(".qty-input");
  const weightInput = row.querySelector(".weight-input");
  const valueInput = row.querySelector(".value-input");

  // العدد: نأخذ أول رقم فقط
  const qtyNum = parseQuantity(qtyInput.value);
  row.dataset.qty = qtyNum;
  if (qtyInput.value.trim() !== "" && qtyNum !== 0) {
    qtyInput.value = String(qtyNum);
  }

  // الوزن: نضرب كل الأرقام في النص
  const weightNum = parseMultiply(weightInput.value);
  row.dataset.weight = weightNum;
  if (weightInput.value.trim() !== "" && weightNum !== 0) {
    weightInput.value = String(weightNum);
  }

  // القيمة: نفس فكرة الوزن
  const valueNum = parseMultiply(valueInput.value);
  row.dataset.value = valueNum;
  if (valueInput.value.trim() !== "" && valueNum !== 0) {
    valueInput.value = String(valueNum);
  }

  updateTotals();
}

// إنشاء صف جديد في الجدول
function createRow() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <div class="cell-input">
        <input type="text" class="qty-input" placeholder="مثلاً 5 كرتون">
        <button class="mic-btn" data-field="qty" title="إدخال العدد بالصوت">🎙</button>
      </div>
    </td>
    <td>
      <input type="text" class="item-input" placeholder="مثلاً شاشات جوالات">
    </td>
    <td>
      <div class="cell-input">
        <input type="text" class="weight-input" placeholder="مثلاً 2 كرتون × 48 علبة × 200 جرام">
        <button class="mic-btn" data-field="weight" title="إدخال الوزن بالصوت">🎙</button>
      </div>
    </td>
    <td>
      <div class="cell-input">
        <input type="text" class="value-input" placeholder="مثلاً 5 حبة × 10 دولار">
        <button class="mic-btn" data-field="value" title="إدخال القيمة بالصوت">🎙</button>
      </div>
    </td>
    <td>
      <input type="text" class="origin-input" placeholder="مثلاً الصين / اليابان">
    </td>
    <td>
      <button class="delete-btn">✖</button>
    </td>
  `;

  // أحداث الإدخال الكتابي
  tr.querySelectorAll("input[type='text']").forEach((inp) => {
    if (
      inp.classList.contains("qty-input") ||
      inp.classList.contains("weight-input") ||
      inp.classList.contains("value-input")
    ) {
      inp.addEventListener("input", () => recalcRow(tr));
    }
  });

  // زر الحذف
  tr.querySelector(".delete-btn").addEventListener("click", () => {
    tr.remove();
    updateTotals();
  });

  // أزرار المايك
  tr.querySelectorAll(".mic-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!recognition) {
        alert("متصفحك لا يدعم إدخال الصوت. يمكنك الكتابة يدوياً.");
        return;
      }
      const field = btn.dataset.field;
      const targetInput = tr.querySelector(`.${field}-input`);

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript.trim();
        targetInput.value = text;
        recalcRow(tr);
      };

      recognition.onerror = () => {
        alert("حصل خطأ في المايك. جرّب مرة أخرى أو استخدم الكتابة.");
      };

      recognition.start();
    });
  });

  itemsBody.appendChild(tr);
}

// تغيير ملاحظة العملة
function updateCurrencyNote() {
  const val = currencySelect.value;
  if (val === "usd") {
    currencyNote.textContent = "القيمة يتم حسابها بالدولار الأمريكي.";
  } else if (val === "sar") {
    currencyNote.textContent = "القيمة يتم حسابها بالريال السعودي.";
  } else if (val === "yer") {
    currencyNote.textContent = "القيمة يتم حسابها بالريال اليمني.";
  } else {
    currencyNote.textContent = "";
  }
}

// ===== تشغيل عند تحميل الصفحة =====
document.addEventListener("DOMContentLoaded", () => {
  updateCurrencyNote();
  currencySelect.addEventListener("change", updateCurrencyNote);

  addRowBtn.addEventListener("click", () => createRow());

  // نضيف صف واحد افتراضي
  createRow();
});
