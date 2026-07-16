/* ============================================================
   ALMOG STUDIO — core interactions
   ============================================================ */
(function () {
  // language: first visit with a Hebrew browser lands on /he/
  try {
    var hePages = ["/", "/works/", "/philosophy/", "/process/", "/materials/"];
    var path = location.pathname;
    var isHe = path.indexOf("/he/") === 0 || path === "/he";
    if (!localStorage.getItem("lang") && !isHe && hePages.indexOf(path) !== -1 &&
        (navigator.language || "").toLowerCase().indexOf("he") === 0) {
      localStorage.setItem("lang", "he");
      location.replace("/he" + path);
      return;
    }
  } catch (e) {}

  // year
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // scroll progress
  var bar = document.getElementById("scroll-bar");
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // overlay menu
  var toggle = document.getElementById("nav-toggle");
  var overlay = document.getElementById("nav-overlay");
  if (toggle && overlay) {
    var label = toggle.querySelector(".nav-toggle-label");
    var heUI = document.documentElement.lang === "he";
    var txtOpen = heUI ? "תפריט" : "Menu";
    var txtClose = heUI ? "סגירה" : "Close";

    var setMenu = function (open) {
      overlay.classList.toggle("open", open);
      overlay.setAttribute("aria-hidden", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      label.textContent = open ? txtClose : txtOpen;
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", function () {
      setMenu(!overlay.classList.contains("open"));
    });
    overlay.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setMenu(false);
    });
    addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) setMenu(false);
    });
  }

  // reveal on scroll
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();
