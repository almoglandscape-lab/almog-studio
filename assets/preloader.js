/* ============================================================
   ALMOG STUDIO — Preloader
   האות א' מופיעה, נשארת רגע, ואז נעלמת — האתר מתגלה
   ============================================================ */
(function () {
  // צור preloader
  const el = document.createElement("div");
  el.id = "preloader";
  el.innerHTML = `<img src="assets/symbol.png" alt="" id="pre-symbol" />`;
  document.body.prepend(el);

  // נעל גלילה בזמן טעינה
  document.body.style.overflow = "hidden";

  function dismiss() {
    el.classList.add("out");
    document.body.style.overflow = "";
    setTimeout(() => el.remove(), 800);
  }

  // המתן לטעינה מלאה, מינימום 900ms כדי שתמיד תראו את הלוגו
  let loaded = false, minDone = false;
  function tryDismiss() { if (loaded && minDone) dismiss(); }

  window.addEventListener("load", () => { loaded = true; tryDismiss(); });
  setTimeout(() => { minDone = true; tryDismiss(); }, 900);
})();
