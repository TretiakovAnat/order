const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbybQY_JJCOfeL6tvqWtreNqGN_roKfVRXQguSjTlOs8zSMpUxn8RTpKdUfOIxfhrZ3pJQ/exec";

// =======================
// 🔥 ОБЪЕКТ ЗАКАЗА
// =======================
let order = {
  name: "",
  phone: "",
  service: 0,
  serviceName: "",
  size: 1,
  sizeName: "",
  date: null,
  extras: [],
  total: 0,
};

// =======================
// 📊 ДАННЫЕ ИЗ ТАБЛИЦЫ
// =======================
let busyMap = {}; // дата → количество
const MAX_ORDERS = 2;

// =======================
// 📅 КАЛЕНДАРЬ
// =======================
const datesEl = document.getElementById("dates");
const monthYearEl = document.getElementById("monthYear");

let date = new Date();

function renderCalendar() {
  if (!datesEl) return;

  datesEl.innerHTML = "";

  const year = date.getFullYear();
  const month = date.getMonth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];

  if (monthYearEl) {
    monthYearEl.textContent = `${monthNames[month]} ${year}`;
  }

  let start = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < start; i++) {
    datesEl.innerHTML += "<div></div>";
  }

  for (let i = 1; i <= lastDate; i++) {
    const dayEl = document.createElement("div");
    dayEl.textContent = i;

    const currentDate = new Date(year, month, i);
    currentDate.setHours(0, 0, 0, 0);

    const timestamp = currentDate.getTime();
    const count = busyMap[timestamp] || 0;
    const isBusy = count >= MAX_ORDERS;

    if (currentDate < today || isBusy) {
      dayEl.classList.add("disabled");
      if (isBusy) dayEl.classList.add("busy");
    } else {
      dayEl.addEventListener("click", () => {
        document.querySelectorAll(".calendar-dates div").forEach((d) => {
          d.classList.remove("selected");
        });

        dayEl.classList.add("selected");
        order.date = currentDate;
        updateOrder();
      });
    }

    // частично занято
    if (count > 0 && count < MAX_ORDERS) {
      dayEl.classList.add("half");
    }

    // выбранная дата
    if (order.date && timestamp === order.date.getTime()) {
      dayEl.classList.add("selected");
    }

    // сегодня
    if (
      i === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      dayEl.classList.add("today");
    }

    datesEl.appendChild(dayEl);
  }
}

// =======================
// 🔄 ПЕРЕКЛЮЧЕНИЕ МЕСЯЦЕВ
// =======================
document.getElementById("next").onclick = () => {
  date.setDate(1); // 👈 ВАЖНО
  date.setMonth(date.getMonth() + 1);
  renderCalendar();
};

document.getElementById("prev").onclick = () => {
  date.setDate(1); // 👈 ВАЖНО
  date.setMonth(date.getMonth() - 1);
  renderCalendar();
};

// =======================
// 📥 ЗАГРУЗКА GOOGLE SHEETS
// =======================
async function loadBusyDates() {
  try {
    const res = await fetch(
      "https://docs.google.com/spreadsheets/d/1vMv8T8Y_XTfj6ZqFZUlSMEh-bEHuVSbQK4KfAC_S5Mg/export?format=csv"
    );
    const text = await res.text();

    console.log("CSV:", text); // 👈 смотри что реально приходит

    const rows = text.split("\n").slice(1);

    busyMap = {};

    rows.forEach((row) => {
      if (!row.trim()) return;

      const cols = row.split(",");

      let dateStr = cols[0]?.replace(/"/g, "").trim();
      let status = cols[5]?.replace(/"/g, "").trim();

      if (!dateStr) return;

      // 👇 поддержка разных форматов
      let d, m, y;

      if (dateStr.includes(".")) {
        [d, m, y] = dateStr.split(".");
      } else if (dateStr.includes("/")) {
        [m, d, y] = dateStr.split("/");
      } else {
        return;
      }

      const dt = new Date(y, m - 1, d);
      dt.setHours(0, 0, 0, 0);

      busyMap[dt.getTime()] = parseInt(status) || 0;
    });

    console.log("busyMap:", busyMap);

    renderCalendar();
  } catch (err) {
    console.log("Ошибка загрузки:", err);
  }
}

// =======================
// 📦 ОБНОВЛЕНИЕ ЗАКАЗА
// =======================
function updateOrder() {
  if (!document.getElementById("order-name")) return;

  order.name = document.getElementById("name")?.value || "";
  order.phone = document.getElementById("phone")?.value || "";

  document.getElementById("order-name").textContent = order.name || "—";
  document.getElementById("order-phone").textContent = order.phone || "—";

  const serviceSelect = document.getElementById("service");
  order.service = parseFloat(serviceSelect?.value) || 0;
  order.serviceName =
    serviceSelect?.options[serviceSelect.selectedIndex]?.text || "—";
  document.getElementById("order-service").textContent = order.serviceName;

  const sizeSelect = document.getElementById("size");
  order.size = parseFloat(sizeSelect?.value) || 1;
  order.sizeName = sizeSelect?.options[sizeSelect.selectedIndex]?.text || "—";
  document.getElementById("order-size").textContent = order.sizeName;

  if (order.date) {
    document.getElementById("order-date").textContent =
      order.date.toLocaleDateString("ru-RU");
  }

  const extrasEls = document.querySelectorAll(".extra:checked");
  order.extras = [];
  let extrasTotal = 0;

  const list = document.getElementById("order-services");
  if (list) list.innerHTML = "";

  extrasEls.forEach((el) => {
    const price = parseFloat(el.value);
    const text = el.parentElement.textContent.trim();

    order.extras.push(text);
    extrasTotal += price;

    if (list) {
      const li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    }
  });

  order.total = order.service * order.size + extrasTotal;

  const totalEl = document.getElementById("order-total");
  if (totalEl) {
    totalEl.textContent = order.total.toFixed(2) + "₴";
  }
}

// =======================
// 🎯 СОБЫТИЯ
// =======================
document.querySelectorAll("#name, #phone, #service, #size").forEach((el) => {
  el.addEventListener("input", updateOrder);
  el.addEventListener("change", updateOrder);
});

document.querySelectorAll(".extra").forEach((el) => {
  el.addEventListener("change", updateOrder);
});

// =======================
// 📤 ОТПРАВКА В GOOGLE
// =======================
document
  .getElementById("bookingForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!order.date) {
      alert("Выберите дату");
      return;
    }

    const formData = new FormData();

    formData.append("name", order.name);
    formData.append("phone", order.phone);
    formData.append("service", order.serviceName);
    formData.append("size", order.sizeName);
    formData.append("date", order.date.toLocaleDateString("ru-RU"));
    formData.append("extras", order.extras.join(", "));
    formData.append("total", order.total);

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      console.log("Ответ:", text);

      alert("Заявка отправлена!");
      loadBusyDates();
    } catch (err) {
      console.log("Ошибка:", err);
      alert("Ошибка отправки");
    }
  });

// =======================
// 🚀 СТАРТ
// =======================
renderCalendar();
loadBusyDates();
setInterval(loadBusyDates, 30000);
