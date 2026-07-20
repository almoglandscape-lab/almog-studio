/* ============================================================
   ALMOG STUDIO — gallery renderer
   Galleries are driven by /assets/galleries.json (the photo
   manifest the Backstage uploader writes to). Hard-coded imgs
   in the HTML stay as-is; this appends any manifest photos
   that aren't already on the page — so new uploads from the
   phone appear with zero HTML edits.
   ============================================================ */
(function () {
  var galleries = document.querySelectorAll(".w-gallery[data-project]");
  if (!galleries.length) return;

  var isHe = (document.documentElement.lang || "").indexOf("he") === 0;

  fetch("/assets/galleries.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (data) {
      galleries.forEach(function (gal) {
        var proj = data[gal.getAttribute("data-project")];
        if (!proj || !proj.images || !proj.images.length) return;

        // filenames already present in the HTML
        var have = {};
        gal.querySelectorAll("img").forEach(function (im) {
          var f = (im.getAttribute("src") || "").split("/").pop();
          if (f) have[f] = true;
        });

        proj.images.forEach(function (item) {
          if (!item.file || have[item.file]) return;
          var img = document.createElement("img");
          img.src = "/assets/" + item.file;
          img.alt = (isHe ? (item.alt_he || item.alt) : (item.alt || item.alt_he)) || proj.name || "";
          img.loading = "lazy";
          if (item.wide) img.className = "w-wide";
          img.addEventListener("load", function () { img.classList.add("is-loaded"); });
          gal.appendChild(img);
        });
      });
    })
    .catch(function () { /* manifest unavailable — hard-coded gallery stands */ });
})();
