/* ============================================================
   ALMOG STUDIO — Backstage (skeleton) interactions
   Visual only: fake login, view switching, mobile drawer.
   ============================================================ */
(function () {
  var login = document.getElementById("login");
  var app = document.getElementById("app");
  var form = document.getElementById("login-form");

  // stay signed in for the session so it doesn't nag while previewing
  if (sessionStorage.getItem("bs_in") === "1") enter();

  function enter() {
    login.hidden = true;
    app.hidden = false;
    sessionStorage.setItem("bs_in", "1");
    greet();
  }
  if (form) form.addEventListener("submit", function (e) { e.preventDefault(); enter(); });

  // time-aware greeting
  function greet() {
    var el = document.getElementById("greeting");
    if (!el) return;
    var h = new Date().getHours();
    var part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
    el.textContent = "Good " + part + ", Almog.";
  }

  // view switching
  var navItems = document.querySelectorAll(".nav-item");
  var views = document.querySelectorAll(".view");
  function show(view) {
    navItems.forEach(function (n) { n.classList.toggle("is-active", n.dataset.view === view); });
    views.forEach(function (v) { v.classList.toggle("is-active", v.dataset.view === view); });
    closeDrawer();
    if (location.hash !== "#" + view) history.replaceState(null, "", "#" + view);
    document.querySelector(".main").scrollTo({ top: 0 });
  }
  navItems.forEach(function (n) {
    n.addEventListener("click", function (e) { e.preventDefault(); show(n.dataset.view); });
  });
  document.querySelectorAll("[data-jump]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); show(a.dataset.jump); });
  });
  // open the view named in the URL hash (if any)
  var initial = (location.hash || "").replace("#", "");
  if (initial && document.querySelector('.view[data-view="' + initial + '"]')) show(initial);

  // mobile drawer
  var menuBtn = document.getElementById("menu-btn");
  var scrim = document.getElementById("scrim");
  function closeDrawer() { app.classList.remove("nav-open"); }
  if (menuBtn) menuBtn.addEventListener("click", function () { app.classList.toggle("nav-open"); });
  if (scrim) scrim.addEventListener("click", closeDrawer);
})();
