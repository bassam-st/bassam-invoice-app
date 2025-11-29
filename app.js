function addRow() {
    const tableBody = document.getElementById("tableBody");
    const row = document.createElement("tr");

    row.innerHTML = `
        <td><input class="item-name" placeholder="الصنف"></td>
        <td><input type="number" class="count" value="0" oninput="updateTotals()"></td>
        <td><input type="number" class="weight" value="0" oninput="updateTotals()"></td>
        <td><input type="number" class="price" value="0" oninput="updateTotals()"></td>
        <td class="total-weight">0</td>
        <td class="total-price">0</td>
        <td class="no-print"><button onclick="this.parentElement.parentElement.remove(); updateTotals()">✖</button></td>
    `;

    tableBody.appendChild(row);
}

function updateTotals() {
    let totalCount = 0;
    let totalWeight = 0;
    let totalValue = 0;

    document.querySelectorAll("#tableBody tr").forEach(row => {
        const count = Number(row.querySelector(".count").value) || 0;
        const weight = Number(row.querySelector(".weight").value) || 0;
        const price = Number(row.querySelector(".price").value) || 0;

        const itemTotalWeight = count * weight;
        const itemTotalValue = count * price;

        row.querySelector(".total-weight").textContent = itemTotalWeight;
        row.querySelector(".total-price").textContent = itemTotalValue;

        totalCount += count;
        totalWeight += itemTotalWeight;
        totalValue += itemTotalValue;
    });

    document.getElementById("totalCount").textContent = `إجمالي العدد: ${totalCount}`;
    document.getElementById("totalWeight").textContent = `إجمالي الوزن (كجم): ${totalWeight}`;
    document.getElementById("totalValue").textContent = `إجمالي القيمة: ${totalValue}`;
}

// زر الطباعة
document.getElementById("printBtn").addEventListener("click", () => {
    window.print();
});

// زر PDF
document.getElementById("pdfBtn").addEventListener("click", () => {
    const opt = {
        margin: 0.5,
        filename: "فاتورة.pdf",
        html2canvas: { scale: 3 },
        jsPDF: { unit: "cm", format: "a4", orientation: "portrait" }
    };

    html2pdf().from(document.body).set(opt).save();
});

// إضافة صف تلقائي عند تشغيل الصفحة
addRow();
