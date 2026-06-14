/* Almog Studio — minimal page wiring
   - year inject
   - scroll progress bar
   - nav darkness toggle over hero
   - overlay menu (open/close + esc)
*/
(function () {
  // Year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Scroll progress
  var bar = document.getElementById('scroll-bar');
  if (bar) {
    var update = function () {
      var max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      var p = Math.min(Math.max(window.scrollY / max, 0), 1);
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  // Nav darkness over hero
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  if (nav && hero) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > 0.3) {
          nav.classList.add('is-dark');
        } else {
          nav.classList.remove('is-dark');
        }
      });
    }, { threshold: [0, 0.3, 0.6] });
    io.observe(hero);
  }

  // Overlay menu
  var toggle = document.getElementById('nav-toggle');
  var overlay = document.getElementById('nav-overlay');
  if (toggle && overlay) {
    var setOpen = function (open) {
      overlay.classList.toggle('is-open', open);
      overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', function () {
      setOpen(!overlay.classList.contains('is-open'));
    });
    overlay.addEventListener('click', function (ev) {
      if (ev.target.tagName === 'A') setOpen(false);
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && overlay.classList.contains('is-open')) setOpen(false);
    });
  }

  // Soft hide for broken images
  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () { img.style.opacity = '0'; });
  });
})();
