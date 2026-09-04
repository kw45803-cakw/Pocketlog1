// ใส่ URL Web App ที่ได้จากการ Deploy ของ Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbyugTnhzx1C-foUhC1malUlVxIceapJtYgTDHGdrf65TWeOT95HtHciUfZtXh7dCyE/exec";

const transactionForm = document.getElementById("transaction-form");
const categoryInput = document.getElementById("category");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");
const addBtn = document.getElementById("add-btn");
const transactionList = document.getElementById("transaction-list");

const totalIncomeEl = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");
const totalBalanceEl = document.getElementById("total-balance");

// ตั้งค่าวันที่เริ่มต้นเป็นวันปัจจุบัน
if (dateInput) {
  dateInput.value = new Date().toISOString().split("T")[0];
}

// ฟังก์ชันดึงข้อมูลรายการจาก Google Sheets
async function fetchTransactions() {
  if (!transactionList) return;
  transactionList.innerHTML = "<p>กำลังโหลดข้อมูล...</p>";

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!Array.isArray(data)) {
      transactionList.innerHTML = "<p>ยังไม่มีรายการธุรกรรม</p>";
      return;
    }

    renderTransactions(data);
  } catch (error) {
    console.error("Fetch Error:", error);
    transactionList.innerHTML = "<p>ไม่สามารถโหลดข้อมูลได้</p>";
  }
}

// ฟังก์ชันแสดงผลรายการและคำนวณยอดรวม
function renderTransactions(data) {
  transactionList.innerHTML = "";
  let totalIncome = 0;
  let totalExpense = 0;

  if (data.length === 0) {
    transactionList.innerHTML = "<p>ยังไม่มีรายการธุรกรรม</p>";
  } else {
    data.forEach((item) => {
      const amount = Number(item.Amount || item.amount || 0);
      const type = (item.Type || item.type || "expense").toLowerCase();

      if (type === "income") {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }

      const card = document.createElement("div");
      card.className = `transaction-item ${type}`;
      card.innerHTML = `
        <div>
          <strong>${item.Category || item.category || "ทั่วไป"}</strong>
          <p>${item.Description || item.description || ""}</p>
          <small>${item.Date || item.date || ""}</small>
        </div>
        <div class="amount-text ${type}">
          ${type === "income" ? "+" : "-"}฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </div>
      `;
      transactionList.appendChild(card);
    });
  }

  // อัปเดตตัวเลข Dashboard
  if (totalIncomeEl) totalIncomeEl.textContent = `฿${totalIncome.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
  if (totalExpenseEl) totalExpenseEl.textContent = `฿${totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
  if (totalBalanceEl) {
    const balance = totalIncome - totalExpense;
    totalBalanceEl.textContent = `฿${balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
  }
}

// ฟังก์ชันบันทึกรายการ
if (transactionForm) {
  transactionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedType = document.querySelector('input[name="type"]:checked')?.value || "expense";

    if (!categoryInput.value) {
      alert("กรุณาเลือกหมวดหมู่");
      return;
    }
    if (!amountInput.value || Number(amountInput.value) <= 0) {
      alert("กรุณากรอกจำนวนเงินที่ถูกต้อง");
      return;
    }

    const payload = {
      action: "add",
      type: selectedType,
      category: categoryInput.value,
      amount: Number(amountInput.value),
      description: descriptionInput.value || categoryInput.value,
      date: dateInput.value
    };

    const originalText = addBtn.textContent;
    addBtn.disabled = true;
    addBtn.textContent = "กำลังบันทึก...";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("บันทึกสำเร็จ!");
        transactionForm.reset();
        dateInput.value = new Date().toISOString().split("T")[0];
        await fetchTransactions(); // โหลดรายการใหม่ทันทีหลังบันทึก
      } else {
        alert("เกิดข้อผิดพลาด: " + result.message);
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("บันทึกไม่สำเร็จ: " + error.message);
    } finally {
      addBtn.disabled = false;
      addBtn.textContent = originalText;
    }
  });
}

// โหลดข้อมูลเมื่อเปิดหน้าเว็บ
fetchTransactions();