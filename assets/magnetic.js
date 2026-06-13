/* ============================================================
   ALMOG STUDIO — Magnetic buttons
   כפתורים שמגנטים לעכבר — תחושת יוקרה
   עובד רק על desktop עם mouse
   ============================================================ */
(function () {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const STRENGTH = 0.35; // כמה חזק המגנט (0=כלום, 1=מלא)

  function initMagnetic(el) {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * STRENGTH;
      const dy = (e.clientY - cy) * STRENGTH;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  }

  // הפעל על כל לינקי ה-CTA והניווט
  document.querySelectorAll(".cta-links a, .nav-links a, .footer-links a").forEach(initMagnetic);
})();
