/* ============================================================
   ALMOG STUDIO — Advanced scroll animations
   Parallax, stagger, hover effects on projects and CTA
   ============================================================ */
(function () {
  // Project stagger + parallax reveal
  const projects = document.querySelectorAll(".project");

  projects.forEach((proj, i) => {
    const img = proj.querySelector(".project-media");
    const text = proj.querySelector(".project-text");

    if (!img || !text) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            img.style.animation = `slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.12}s both`;
            text.style.animation = `fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.18}s both`;
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );

    obs.observe(proj);
  });

  // Hover lift on projects (desktop only)
  if (!window.matchMedia("(pointer: coarse)").matches) {
    projects.forEach((proj) => {
      proj.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
      proj.addEventListener("mouseenter", () => {
        proj.style.transform = "translateY(-6px)";
      });
      proj.addEventListener("mouseleave", () => {
        proj.style.transform = "";
      });
    });
  }

  // CTA section reveal
  const cta = document.querySelector(".cta");
  if (cta) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            cta.style.animation = "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both";
          }
        });
      },
      { threshold: 0.15 }
    );
    obs.observe(cta);
  }
})();
