/* ============================================================
   ALMOG STUDIO — core interactions
   ============================================================ */
(function () {
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
    // make the menu discoverable: a visible word + grouped bars
    var bars = document.createElement("span");
    bars.className = "bars";
    toggle.querySelectorAll("span").forEach(function (s) { bars.appendChild(s); });
    var label = document.createElement("span");
    label.className = "nav-toggle-label";
    label.textContent = "Menu";
    toggle.appendChild(label);
    toggle.appendChild(bars);

    var setMenu = function (open) {
      overlay.classList.toggle("open", open);
      overlay.setAttribute("aria-hidden", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      label.textContent = open ? "Close" : "Menu";
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
