// ================================
// العناصر الرئيسية
// ================================
const itemsBody = document.getElementById("itemsBody");
const totalQtyEl = document.getElementById("totalQty");
const totalWeightEl = document.getElementById("totalWeight");
const totalValueEl = document.getElementById("totalValue");
const totalCurrencyLabel = document.getElementById("totalCurrencyLabel");

const clientNameInput = document.getElementById("clientName");
const invoiceNumberInput = document.getElementById("invoiceNumber");
const currencySelect = document.getElementById("currencySelect");
const invoiceDateInput = document.getElementById("invoiceDate");

const addRowBtn = document.getElementById("addRowBtn");
const printBtn = document.getElementById("printBtn");
const pdfBtn = document.getElementById("pdfBtn");
const saveInvoiceBtn = document.getElementById("saveInvoiceBtn");
const installBtn = document.getElementById("installBtn");

const savedInvoicesList = document.getElementById("savedInvoicesList");

// إعداد التاريخ الافتراضي
(function setToday() {
const today = new Date().toISOString().slice(0, 10);
invoiceDateInput.value = today;
})();

// تغيير رمز العملة
currencySelect.addEventListener("change", () => {
totalCurrencyLabel.textContent = currencySelect.value;
});

// ================================
// إنشاء صف جديد
// ================================
function createRow(initial = {}) {
const row = document.createElement("tbody");
row.classList.add("item-block");

row.innerHTML = `
<tr>
<td>
<input type="number" class="qty-input" value="${initial.qty ?? ""}" placeholder="0" />
</td>

<td>  
    <input type="text" class="desc-input" value="${initial.desc ?? ""}" placeholder="وصف الصنف" />  
  </td>  

  <td>  
    <input type="number" class="weight-per-carton-input" value="${initial.weightPerCarton ?? ""}" placeholder="0" />  
  </td>  

  <td>  
    <input type="number" class="price-per-carton-input" value="${initial.pricePerCarton ?? ""}" placeholder="0" />  
  </td>  

  <td>  
    <input type="number" class="total-weight-input" value="${initial.totalWeight ?? ""}" placeholder="0" readonly />  
  </td>  

  <td>  
    <input type="number" class="total-value-input" value="${initial.totalValue ?? ""}" placeholder="0" readonly />  
  </td>  

  <td>  
    <button class="delete-btn">✕</button>  
  </td>  
</tr>  

<!-- زر التسجيل -->  
<tr>  
  <td colspan="7">  
    <div class="row-voice-section">  
      <button class="voice-btn">🎤 تسجيل هذا السطر</button>  
    </div>  
  </td>  
</tr>

`;

itemsBody.appendChild(row);

attachRowEvents(row);
updateRowTotals(row);
updateTotals();
}

// ================================
// ربط أحداث كل صف
// ================================
function attachRowEvents(row) {
const qtyInput = row.querySelector(".qty-input");
const descInput = row.querySelector(".desc-input");
const weightInput = row.querySelector(".weight-per-carton-input");
const priceInput = row.querySelector(".price-per-carton-input");

const totalWeightInput = row.querySelector(".total-weight-input");
const totalValueInput = row.querySelector(".total-value-input");

[qtyInput, descInput, weightInput, priceInput].forEach((input) => {
input.addEventListener("input", () => {
updateRowTotals(row);
updateTotals();
});
});

const deleteBtn = row.querySelector(".delete-btn");
deleteBtn.addEventListener("click", () => {
if (confirm("هل تريد حذف هذا السطر؟")) {
row.remove();
updateTotals();
}
});

// زر المايك
const voiceBtn = row.querySelector(".voice-btn");

voiceBtn.addEventListener("mousedown", () => startRowVoice(row));
voiceBtn.addEventListener("touchstart", () => startRowVoice(row));

voiceBtn.addEventListener("mouseup", () => stopRowVoice());
voiceBtn.addEventListener("mouseleave", () => stopRowVoice());
voiceBtn.addEventListener("touchend", () => stopRowVoice());
}

// ================================
// حساب وزن وقيمة السطر
// ================================
function updateRowTotals(row) {
const qty = parseFloat(row.querySelector(".qty-input").value) || 0;
const weightPer = parseFloat(row.querySelector(".weight-per-carton-input").value) || 0;
const pricePer = parseFloat(row.querySelector(".price-per-carton-input").value) || 0;

const totalWeight = qty * weightPer;
const totalValue = qty * pricePer;

row.querySelector(".total-weight-input").value = totalWeight ? totalWeight.toFixed(2) : "";
row.querySelector(".total-value-input").value = totalValue ? totalValue.toFixed(2) : "";
}

// ================================
// تحديث المجاميع
// ================================
function updateTotals() {
let totalQty = 0;
let totalWeight = 0;
let totalValue = 0;

itemsBody.querySelectorAll(".item-block").forEach((block) => {
const qty = parseFloat(block.querySelector(".qty-input").value) || 0;
const w = parseFloat(block.querySelector(".total-weight-input").value) || 0;
const v = parseFloat(block.querySelector(".total-value-input").value) || 0;

totalQty += qty;  
totalWeight += w;  
totalValue += v;

});

totalQtyEl.textContent = totalQty;
totalWeightEl.textContent = totalWeight.toFixed(2);
totalValueEl.textContent = totalValue.toFixed(2);
}

// ================================
// ذكاء الصوت
// ================================
let recognition = null;
let voiceTargetRow = null;

function initRecognition() {
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) {
alert("المتصفح لا يدعم التسجيل الصوتي. استخدم Chrome على أندرويد.");
return null;
}

const rec = new SR();
rec.lang = "ar-SA";
rec.interimResults = false;
rec.maxAlternatives = 1;
return rec;
}

function startRowVoice(row) {
if (!recognition) recognition = initRecognition();
if (!recognition) return;

voiceTargetRow = row;
recognition.start();
}

function stopRowVoice() {
if (recognition) recognition.stop();
}

// تحليل الكلام
recognition?.addEventListener("result", (event) => {
const text = event.results[0][0].transcript;
if (!voiceTargetRow || !text) return;

fillRowFromVoice(voiceTargetRow, text);
updateRowTotals(voiceTargetRow);
updateTotals();
});

// ================================
// ذكاء استخراج الأرقام والوحدات
// ================================
function parseArabicNumberWords(text) {
const map = {
"صفر": 0, "واحد": 1, "اثنين": 2, "ثنين": 2, "ثلاثة": 3,
"اربعة": 4, "أربعة": 4, "خمسة": 5, "ستة": 6, "سبعة": 7,
"ثمانية": 8, "تسعة": 9, "عشرة": 10, "عشرين": 20,
"ثلاثين": 30, "اربعين": 40, "خمسين": 50, "ستين": 60,
"سبعين": 70, "ثمانين": 80, "تسعين": 90, "مئة": 100,
"مية": 100, "مائتين": 200, "ثلاثمائة": 300, "اربعمائة": 400,
"خمسمائة": 500, "ستمائة": 600, "سبعمائة": 700,
"ثمانمائة": 800, "تسعمائة": 900, "ألف": 1000, "الف": 1000
};

let sum = 0;
const parts = text.split(" ");

parts.forEach(word => {
if (map[word]) sum += map[word];
if (!isNaN(Number(word))) sum += Number(word);
});

return sum;
}

function extractWeight(text) {
let grams = text.match(/(\d+)\sجرام/) || text.match(/(\d+)\sg/);
let kilo = text.match(/(\d+(.\d+)?)\sكيلو/) || text.match(/(\d+)\skg/);

if (grams) return parseFloat(grams[1]) / 1000;
if (kilo) return parseFloat(kilo[1]);
return null;
}

// ================================
// تعبئة السطر من الكلام الذكي
// ================================
function fillRowFromVoice(row, text) {
text = text.toLowerCase();

// الصنف
const descInput = row.querySelector(".desc-input");
descInput.value = text;

// العدد
const qtyInput = row.querySelector(".qty-input");
const qty = parseArabicNumberWords(text);
if (qty) qtyInput.value = qty;

// وزن بالكيلو
const weightInput = row.querySelector(".weight-per-carton-input");
const extractedWeight = extractWeight(text);
if (extractedWeight) weightInput.value = extractedWeight;

// قيمة للكرتون
const priceInput = row.querySelector(".price-per-carton-input");
const price = parseArabicNumberWords(text);
if (price) priceInput.value = price;
}

// ================================
// أزرار التطبيق
// ================================
addRowBtn.addEventListener("click", () => createRow());
printBtn.addEventListener("click", () => window.print());
pdfBtn.addEventListener("click", () => window.print());

// ================================
// الفواتير المحفوظة + PWA
// ================================

// … نفس نظام الحفظ عندك بدون تغيير

// إنشاء أول صف
createRow();
