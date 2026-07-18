/* מרכז שליטה — שלד בלבד: ניווט, ברכה, שבוע, משוב עדין. אפס חיבורים. */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  /* ---------- ניווט בין מסכים ---------- */
  var navItems = document.querySelectorAll(".nav-item[data-view]");
  var views = document.querySelectorAll(".view[data-view]");

  function setView(name) {
    var found = false;
    views.forEach(function (v) {
      var on = v.dataset.view === name;
      v.classList.toggle("is-active", on);
      if (on) found = true;
    });
    if (!found) return setView("today");
    navItems.forEach(function (n) {
      n.classList.toggle("is-active", n.dataset.view === name);
    });
    app.classList.remove("nav-open");
    window.scrollTo({ top: 0 });
  }

  navItems.forEach(function (n) {
    n.addEventListener("click", function () { setView(n.dataset.view); });
  });
  document.querySelectorAll("[data-jump]").forEach(function (el) {
    el.addEventListener("click", function () {
      setView(el.dataset.jump);
      location.hash = el.dataset.jump;
    });
  });
  window.addEventListener("hashchange", function () {
    setView(location.hash.replace("#", "") || "today");
  });
  if (location.hash) setView(location.hash.replace("#", ""));

  /* ---------- תפריט מובייל ---------- */
  document.getElementById("menu-btn").addEventListener("click", function () {
    app.classList.toggle("nav-open");
  });
  document.getElementById("scrim").addEventListener("click", function () {
    app.classList.remove("nav-open");
  });

  /* ---------- ברכה לפי שעה ---------- */
  var h = new Date().getHours();
  var word = h >= 5 && h < 12 ? "בוקר טוב" : h < 17 ? "צהריים טובים" : h < 21 ? "ערב טוב" : "לילה טוב";
  document.getElementById("greeting").textContent = word + ", אלמוג. מה מסדרים עכשיו?";

  /* ---------- רצועת שבוע (יומן) ---------- */
  var week = document.getElementById("week");
  if (week) {
    var names = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
    var now = new Date();
    var start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    for (var i = 0; i < 7; i++) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      var el = document.createElement("div");
      el.className = "day" + (d.toDateString() === now.toDateString() ? " today" : "");
      el.innerHTML = "<b>" + names[i] + "</b><span>" + d.getDate() + "</span><div class='slot'></div><div class='slot' style='opacity:.6'></div>";
      week.appendChild(el);
    }
  }

  /* ---------- שלד: משוב כן לכל פעולה שעוד לא מחוברת ---------- */
  var SOON = "השלד באוויר — החיבור הזה מגיע בשלב הבא, צעד־צעד.";
  document.querySelectorAll("[data-soon]").forEach(function (el) {
    el.addEventListener("click", function () { showToast(SOON); });
  });

  function agentReply() {
    var input = document.getElementById("agent-input");
    if (!input.value.trim()) { input.focus(); return; }
    showToast("נקלט. בשלב החיבורים אתחיל באמת לבצע — כרגע אנחנו בשלב השלד.");
    input.value = "";
  }
  document.getElementById("agent-send").addEventListener("click", agentReply);
  document.getElementById("agent-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") agentReply();
  });
  document.getElementById("cmd-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") showToast("החיפוש יופעל כשיהיה תוכן במערכת.");
  });
})();
