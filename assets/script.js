/* ============================================================
   ALMOG STUDIO — interactions, performance, UX
   ============================================================ */

// Year
document.getElementById("year").textContent = new Date().getFullYear();

// ── Scroll progress bar ──────────────────────────────────────
const bar = document.createElement("div");
bar.id = "scroll-bar";
document.body.prepend(bar);

function updateBar() {
  const h = document.documentElement;
  const pct = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight);
  bar.style.transform = `scaleX(${pct})`;
}
window.addEventListener("scroll", updateBar, { passive: true });

// ── Reveal on scroll ─────────────────────────────────────────
const revealEls = document.querySelectorAll(".reveal");
const revealObs = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealObs.unobserve(e.target); } }),
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
revealEls.forEach((el) => revealObs.observe(el));

// ── Nav color swap (light on dark sections) ──────────────────
const nav = document.getElementById("nav");
const darkSections = document.querySelectorAll(".shop, .footer");
function updateNavColor() {
  const mid = 34;
  let dark = false;
  darkSections.forEach((s) => { const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) dark = true; });
  nav.classList.toggle("light", dark);
}
updateNavColor();
window.addEventListener("scroll", updateNavColor, { passive: true });

// ── Image lazy load with blur-up ─────────────────────────────
document.querySelectorAll(".project-media img").forEach((img) => {
  img.style.filter = "blur(8px)";
  img.style.transition = "filter 0.8s ease";
  if (img.complete) { img.style.filter = ""; }
  else { img.addEventListener("load", () => { img.style.filter = ""; }); }
});

// ── Smooth anchor scroll (override default) ───────────────────
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// ── View Transitions API (Chrome 111+) ───────────────────────
if (document.startViewTransition) {
  document.querySelectorAll(".project").forEach((p, i) => {
    p.style.viewTransitionName = `project-${i}`;
  });
}
