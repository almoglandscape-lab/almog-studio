/* ============================================================
   ALMOG STUDIO — reel pager
   Native scroll-snap does the scrolling; this just lights the dots.
   ============================================================ */
(function () {
  var reel = document.getElementById("reel");
  var pager = document.getElementById("pager");
  if (!reel || !pager) return;

  var cards = reel.querySelectorAll(".card");
  var dots = pager.querySelectorAll(".dot");
  if (!cards.length || !dots.length) return;

  var tick;
  var update = function () {
    var edge = reel.scrollLeft + reel.clientWidth * 0.25;
    var active = 0, best = Infinity;
    cards.forEach(function (card, i) {
      var d = Math.abs(card.offsetLeft - edge);
      if (d < best) { best = d; active = i; }
    });
    dots.forEach(function (dot, i) { dot.classList.toggle("is-active", i === active); });
  };

  reel.addEventListener("scroll", function () {
    if (tick) cancelAnimationFrame(tick);
    tick = requestAnimationFrame(update);
  }, { passive: true });

  dots.forEach(function (dot, i) {
    dot.style.cursor = "pointer";
    dot.addEventListener("click", function () {
      if (cards[i]) reel.scrollTo({ left: cards[i].offsetLeft - reel.offsetLeft, behavior: "smooth" });
    });
  });

  update();
})();
