/* ============================================================
   ALMOG STUDIO — Backstage (skeleton) interactions
   Auth is handled at the edge; this just runs the dashboard UI.
   ============================================================ */
(function () {
  // time-aware Hebrew greeting
  var el = document.getElementById("greeting");
  if (el) {
    var h = new Date().getHours();
    var part = h < 12 ? "בוקר טוב" : h < 18 ? "צהריים טובים" : h < 22 ? "ערב טוב" : "לילה טוב";
    el.textContent = part + ", אלמוג.";
  }

  // view switching
  var navItems = document.querySelectorAll(".nav-item");
  var views = document.querySelectorAll(".view");
  var main = document.querySelector(".main");
  function show(view) {
    navItems.forEach(function (n) { n.classList.toggle("is-active", n.dataset.view === view); });
    views.forEach(function (v) { v.classList.toggle("is-active", v.dataset.view === view); });
    closeDrawer();
    if (location.hash !== "#" + view) history.replaceState(null, "", "#" + view);
    if (main) main.scrollTo({ top: 0 });
  }
  navItems.forEach(function (n) {
    n.addEventListener("click", function (e) { e.preventDefault(); show(n.dataset.view); });
  });
  document.querySelectorAll("[data-jump]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); show(a.dataset.jump); });
  });
  var initial = (location.hash || "").replace("#", "");
  if (initial && document.querySelector('.view[data-view="' + initial + '"]')) show(initial);

  // mobile drawer
  var app = document.getElementById("app");
  var menuBtn = document.getElementById("menu-btn");
  var scrim = document.getElementById("scrim");
  function closeDrawer() { if (app) app.classList.remove("nav-open"); }
  if (menuBtn) menuBtn.addEventListener("click", function () { app.classList.toggle("nav-open"); });
  if (scrim) scrim.addEventListener("click", closeDrawer);

  // real numbers, straight from the gallery manifest — no fake data
  var stP = document.getElementById("st-projects");
  var stPh = document.getElementById("st-photos");
  if (stP || stPh) {
    fetch("/assets/galleries.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var live = 0, photos = 0, total = 0;
        Object.keys(data).forEach(function (k) {
          total += 1;
          var n = (data[k].images || []).length;
          photos += n;
          if (n > 0) live += 1;
        });
        if (stP) {
          stP.textContent = live;
          var s = document.getElementById("st-projects-sub");
          if (s) s.textContent = "מתוך " + total + " בתיק";
        }
        if (stPh) {
          stPh.textContent = photos;
          var s2 = document.getElementById("st-photos-sub");
          if (s2) s2.textContent = "בכל הפרויקטים";
        }
      })
      .catch(function () {});
  }
})();
