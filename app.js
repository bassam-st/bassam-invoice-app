<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>فاتورة بسام الذكية</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="wrap">
    <header class="header">
      <h1>فاتورة بسام الذكية</h1>
      <p class="subtitle">حساب آلي للوزن والقيمة لكل صنف</p>
    </header>

    <!-- معلومات الفاتورة -->
    <section class="invoice-info">
      <div class="field">
        <label for="clientName">اسم العميل:</label>
        <input id="clientName" type="text" placeholder="مثال: شركة الرواد للتجارة" />
      </div>
      <div class="field">
        <label for="invoiceNumber">رقم الفاتورة:</label>
        <input id="invoiceNumber" type="text" placeholder="مثال: 2025-001" />
      </div>
      <div class="field">
        <label for="invoiceDate">التاريخ:</label>
        <input id="invoiceDate" type="date" />
      </div>
    </section>

    <!-- جدول الأصناف -->
    <section class="items-section">
      <div class="items-header">
        <h2>أصناف الفاتورة</h2>
        <button id="addRowBtn" type="button">+ إضافة سطر</button>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>م</th>
              <th>بيان الصنف</th>
              <th>العدد</th>
              <th>الوحدة</th>
              <th>وزن الوحدة (كجم)</th>
              <th>إجمالي وزن الصنف (كجم)</th>
              <th>قيمة السطر</th>
              <th>ملاحظات</th>
              <th>حذف</th>
            </tr>
          </thead>
          <tbody id="itemsBody">
            <!-- يتم توليد الأسطر من جافاسكربت -->
          </tbody>
        </table>
      </div>
    </section>

    <!-- الإجماليات -->
    <section class="totals">
      <div>
        <span>إجمالي وزن الفاتورة (كجم):</span>
        <strong id="totalWeight">0</strong>
      </div>
      <div>
        <span>إجمالي قيمة الفاتورة:</span>
        <strong id="totalValue">0</strong>
      </div>
    </section>

    <!-- أزرار التحكم -->
    <section class="actions">
      <button type="button" id="clearAllBtn" class="danger">مسح كل الأسطر</button>
      <button type="button" onclick="window.print()">طباعة / حفظ PDF</button>
    </section>

    <footer class="footer">
      <small>تطبيق فاتورة بسام — نسخة الوزن الآلي</small>
    </footer>
  </div>

  <script src="app.js"></script>
</body>
</html>
