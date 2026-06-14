/* Carousel pager — native scroll-snap; we only update the dot indicator */
(function () {
  var car = document.getElementById('proj-carousel');
  var pager = document.getElementById('pager');
  if (!car || !pager) return;
  var dots = pager.querySelectorAll('.dot');
  var cards = car.querySelectorAll('.card');
  if (!cards.length) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && e.intersectionRatio > 0.55) {
        var i = Array.prototype.indexOf.call(cards, e.target);
        dots.forEach(function (d, di) { d.classList.toggle('is-active', di === i); });
      }
    });
  }, { root: car, threshold: [0.5, 0.65, 0.8] });

  cards.forEach(function (c) { io.observe(c); });

  // Keyboard support on the carousel
  car.addEventListener('keydown', function (ev) {
    var step = car.clientWidth * 0.85;
    if (ev.key === 'ArrowRight') { car.scrollBy({ left: step, behavior: 'smooth' }); ev.preventDefault(); }
    if (ev.key === 'ArrowLeft')  { car.scrollBy({ left: -step, behavior: 'smooth' }); ev.preventDefault(); }
  });
})();
