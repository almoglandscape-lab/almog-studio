/* ============================================================
   ALMOG STUDIO — reel pager
   Native scroll-snap does the scrolling; this just lights the dots.
   Re-binds itself whenever the hydration engine rebuilds the reel
   (almog:reel-updated), so dynamic cards/dots always stay in sync.
   ============================================================ */
(function () {
  var reel = document.getElementById("reel");
  var pager = document.getElementById("pager");
  if (!reel || !pager) return;

  var cards = [], dots = [], tick;

  function update() {
    var edge = reel.scrollLeft + reel.clientWidth * 0.25;
    var active = 0, best = Infinity;
    cards.forEach(function (card, i) {
      var d = Math.abs(card.offsetLeft - edge);
      if (d < best) { best = d; active = i; }
    });
    dots.forEach(function (dot, i) { dot.classList.toggle("is-active", i === active); });
  }

  function bind() {
    cards = Array.prototype.slice.call(reel.querySelectorAll(".card"));
    dots = Array.prototype.slice.call(pager.querySelectorAll(".dot"));
    dots.forEach(function (dot, i) {
      dot.style.cursor = "pointer";
      dot.onclick = function () {
        if (cards[i]) reel.scrollTo({ left: cards[i].offsetLeft - reel.offsetLeft, behavior: "smooth" });
      };
    });
    update();
  }

  reel.addEventListener("scroll", function () {
    if (tick) cancelAnimationFrame(tick);
    tick = requestAnimationFrame(update);
  }, { passive: true });

  document.addEventListener("almog:reel-updated", bind);
  bind();
})();
