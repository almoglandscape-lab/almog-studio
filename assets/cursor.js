/* ============================================================
   ALMOG STUDIO — Custom cursor
   נקודה קטנה + עיגול שעוקב בעיכוב — תחושה של גלריה
   ============================================================ */
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return; // לא על מובייל

  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.id  = 'cur-dot';
  ring.id = 'cur-ring';
  document.body.append(dot, ring);

  let mx = -100, my = -100, rx = -100, ry = -100;
  let isHover = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px)`;
  });

  // עיגול עוקב בעיכוב (lerp)
  function tick() {
    rx += (mx - rx) * 0.1;
    ry += (my - ry) * 0.1;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(tick);
  }
  tick();

  // הגדלה על לינקים, כפתורים ותמונות
  const targets = 'a, button, .product, .project-media, [data-edit]';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(targets)) {
      isHover = true;
      ring.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(targets)) {
      isHover = false;
      ring.classList.remove('hover');
    }
  });

  // הסתרה כשיוצאים מהחלון
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0'; ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1'; ring.style.opacity = '1';
  });
})();
