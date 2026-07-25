/* ============================================================
   ALMOG STUDIO — lead form → WhatsApp
   Zero backend: composes a structured message and opens the
   studio's WhatsApp (number comes from the manifest settings,
   with a safe fallback). Tracks a Lead event on the pixel.
   ============================================================ */
(function () {
  var form = document.getElementById("lead-form");
  if (!form) return;

  var isHe = (document.documentElement.lang || "").indexOf("he") === 0;
  var FALLBACK = "972509572882";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = (document.getElementById("lead-name").value || "").trim();
    var city = (document.getElementById("lead-city").value || "").trim();
    var msg = (document.getElementById("lead-msg").value || "").trim();

    var lines = isHe
      ? ["היי אלמוג 🌿", name ? "אני " + name : "", city ? "מ" + city : "", msg ? "החלום: " + msg : ""]
      : ["Hi Almog 🌿", name ? "I'm " + name : "", city ? "From " + city : "", msg ? "The dream: " + msg : ""];
    var text = lines.filter(Boolean).join("\n");

    var num = (window.ALMOG_SETTINGS && window.ALMOG_SETTINGS.whatsapp)
      ? String(window.ALMOG_SETTINGS.whatsapp).replace(/\D/g, "")
      : FALLBACK;

    try { if (window.fbq) fbq("track", "Lead"); } catch (err) {}
    window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(text), "_blank", "noopener");
  });
})();
