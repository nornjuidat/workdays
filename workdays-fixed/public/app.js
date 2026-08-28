const $ = (id) => document.getElementById(id);

let token = localStorage.getItem("token") || "";
let register = false;
let salary = 0;
let items = [];

async function request(path, opt = {}) {
  const r = await fetch("/api" + path, opt);
  const d = await r.json().catch(() => ({}));

  if (!r.ok) {
    throw new Error(d.message || "Request failed");
  }

  return d;
}

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
});

const money = (n) =>
  "₪" +
  Number(n || 0).toLocaleString("he-IL", {
    maximumFractionDigits: 2
  });

function authMode() {
  $("authTitle").textContent = register ? "הרשמה" : "התחברות";
  $("authBtn").textContent = register ? "צור חשבון" : "התחבר";
  $("toggleAuth").textContent = register
    ? "כבר רשום? התחברות"
    : "אין לך חשבון? הרשמה";

  $("authError").textContent = "";
}

function showAuth() {
  $("auth").classList.remove("hidden");
  $("dashboard").classList.add("hidden");
}
function showDash() {
  $("auth").classList.add("hidden");
  $("dashboard").classList.remove("hidden");

  $("dayMsg").textContent = "";
}

function setupDates() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // Show today's date in the field
  $("workDate").value = `${year}-${month}-${day}`;

  $("month").innerHTML = "";

  for (let m = 1; m <= 12; m++) {
    const selected = m === now.getMonth() + 1;

    $("month").add(
      new Option(
        String(m).padStart(2, "0"),
        m,
        selected,
        selected
      )
    );
  }

  $("year").innerHTML = "";

  for (
    let y = now.getFullYear() - 5;
    y <= now.getFullYear() + 2;
    y++
  ) {
    const selected = y === now.getFullYear();

    $("year").add(
      new Option(
        y,
        y,
        selected,
        selected
      )
    );
  }
}
function render() {
  $("count").textContent = items.length;
  $("salaryView").textContent = money(salary);
  $("total").textContent = money(items.length * salary);

  $("days").innerHTML = "";

  if (!items.length) {
    $("days").innerHTML = "<p>אין ימי עבודה בחודש הזה.</p>";
    return;
  }

  items.forEach((x) => {
    const row = document.createElement("div");
    row.className = "day";

    const date = document.createElement("strong");
    date.textContent = x.date;

    const button = document.createElement("button");
    button.className = "delete";
    button.type = "button";
    button.textContent = "מחק";

    button.onclick = async () => {
      try {
        await request("/workdays/" + x._id, {
          method: "DELETE",
          headers: headers()
        });

        await loadDays();
      } catch (err) {
        $("dayMsg").textContent = err.message;
      }
    };

    row.append(date, button);
    $("days").append(row);
  });
}

async function loadMe() {
  const me = await request("/workdays/me", {
    headers: headers()
  });

  $("hello").textContent = me.username;
  salary = Number(me.dailySalary || 0);
  $("salary").value = salary || "";
}

async function loadDays() {
  items = await request(
    `/workdays?year=${$("year").value}&month=${$("month").value}`,
    { headers: headers() }
  );

  render();
}

async function boot() {
  setupDates();
  authMode();

  if (!token) {
    showAuth();
    return;
  }

  try {
    await loadMe();
    await loadDays();
    showDash();
  } catch {
    localStorage.removeItem("token");
    token = "";
    showAuth();
  }
}

$("toggleAuth").onclick = () => {
  register = !register;
  authMode();
};

$("authForm").onsubmit = async (e) => {
  e.preventDefault();
  $("authError").textContent = "";

  try {
    const d = await request(
      "/auth/" + (register ? "register" : "login"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: $("username").value.trim(),
          password: $("password").value
        })
      }
    );

    token = d.token;
    localStorage.setItem("token", token);

    setupDates();
    await loadMe();
    await loadDays();
    showDash();

    $("password").value = "";
  } catch (err) {
    $("authError").textContent = err.message;
  }
};

$("logout").onclick = () => {
  localStorage.removeItem("token");
  token = "";
  items = [];
  salary = 0;
  $("password").value = "";
  showAuth();
};

$("addDay").onclick = async () => {
  $("dayMsg").textContent = "";

  const selectedDate = $("workDate").value;

  // Do not add today or any other date automatically.
  if (!selectedDate) {
    $("dayMsg").textContent = "בחר תאריך קודם";
    return;
  }

  try {
    await request("/workdays", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ date: selectedDate })
    });

    const [year, month] = selectedDate.split("-");

    $("year").value = year;
    $("month").value = Number(month);

    // Clear the date after successful manual add.
    $("workDate").value = "";

    await loadDays();
  } catch (err) {
    $("dayMsg").textContent = err.message;
  }
};

$("saveSalary").onclick = async () => {
  $("salaryMsg").textContent = "";

  try {
    const d = await request("/workdays/salary", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        dailySalary: Number($("salary").value)
      })
    });

    salary = Number(d.dailySalary || 0);
    $("salaryMsg").textContent = "השכר נשמר";
    render();
  } catch (err) {
    $("salaryMsg").textContent = err.message;
  }
};

$("month").onchange = loadDays;
$("year").onchange = loadDays;

boot();
