/* ============================================================
   ALMOG STUDIO — lightbox
   Tap a work photo → full-screen viewer. Swipe / arrows / Esc.
   Vanilla, RTL-aware, growth easing. Gallery-grade.
   ============================================================ */
(function () {
  var isHe = (document.documentElement.lang || "").indexOf("he") === 0;

  var box, imgEl, counter, current = 0, items = [];

  function build() {
    box = document.createElement("div");
    box.className = "lb";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", isHe ? "תצוגת תמונות" : "Photo viewer");
    box.innerHTML =
      '<button class="lb-x" aria-label="' + (isHe ? "סגור" : "Close") + '">✕</button>' +
      '<button class="lb-prev" aria-label="' + (isHe ? "הקודמת" : "Previous") + '">‹</button>' +
      '<figure class="lb-stage"><img alt="" /></figure>' +
      '<button class="lb-next" aria-label="' + (isHe ? "הבאה" : "Next") + '">›</button>' +
      '<span class="lb-count"></span>';
    document.body.appendChild(box);

    imgEl = box.querySelector("img");
    counter = box.querySelector(".lb-count");

    box.querySelector(".lb-x").addEventListener("click", close);
    box.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
    box.querySelector(".lb-next").addEventListener("click", function () { step(1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });

    addEventListener("keydown", function (e) {
      if (!box.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(isHe ? 1 : -1);
      else if (e.key === "ArrowRight") step(isHe ? -1 : 1);
    });

    /* swipe */
    var x0 = null;
    box.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) < 44) return;
      /* swipe direction is physical — same for RTL */
      step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function show() {
    var it = items[current];
    if (!it) return;
    imgEl.classList.remove("in");
    imgEl.src = it.src;
    imgEl.alt = it.alt || "";
    if (imgEl.complete) requestAnimationFrame(function () { imgEl.classList.add("in"); });
    else imgEl.onload = function () { imgEl.classList.add("in"); };
    counter.textContent = (current + 1) + " / " + items.length;
    box.querySelector(".lb-prev").style.visibility = current > 0 ? "" : "hidden";
    box.querySelector(".lb-next").style.visibility = current < items.length - 1 ? "" : "hidden";
  }

  function step(d) {
    var n = current + d;
    if (n < 0 || n >= items.length) return;
    current = n;
    show();
  }

  function open(list, index) {
    if (!box) build();
    items = list;
    current = index;
    document.documentElement.classList.add("lb-open");
    box.classList.add("open");
    show();
  }

  function close() {
    document.documentElement.classList.remove("lb-open");
    box.classList.remove("open");
  }

  /* wire every work photo — including ones the hydrator adds later */
  document.addEventListener("click", function (e) {
    var img = e.target.closest(".w-gallery img, .w-media img");
    if (!img) return;
    var art = img.closest(".w-project") || document;
    var all = Array.prototype.slice.call(art.querySelectorAll(".w-media img, .w-gallery img"));
    var list = all.map(function (im) { return { src: im.currentSrc || im.src, alt: im.alt }; });
    open(list, Math.max(0, all.indexOf(img)));
  });
})();
