/* ============================================================
   ALMOG STUDIO — site hydration engine
   /assets/galleries.json is the site's brain. The Backstage
   writes it; this file makes the public site obey it:
   - galleries: manifest-controlled (add, remove, reorder)
   - project name / place / description overrides (when set)
   - hidden projects disappear; `order` re-sorts the portfolio
   - projects that exist only in the manifest are built here
   - contact links (email / whatsapp / instagram) from _settings
   Static HTML stays the SEO baseline; edits apply on load.
   ============================================================ */
(function () {
  var isHe = (document.documentElement.lang || "").indexOf("he") === 0;
  var t = function (obj, key) {
    var he = obj[key + "_he"], en = obj[key];
    var v = isHe ? (he || en) : (en || he);
    return (typeof v === "string" && v.trim()) ? v.trim() : "";
  };
  var pad3 = function (n) { return ("00" + n).slice(-3); };

  fetch("/assets/galleries.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (data) {
      var settings = data._settings || {};
      var slugs = Object.keys(data).filter(function (k) { return k !== "_settings"; });
      slugs.sort(function (a, b) { return (data[a].order || 999) - (data[b].order || 999); });

      hydrateContacts(settings);
      hydrateWorks(data, slugs);
      hydrateReel(data, slugs);
    })
    .catch(function () { /* manifest unavailable — the static site stands on its own */ });

  /* ---------- contact links, site-wide ---------- */
  function hydrateContacts(s) {
    if (s.email) document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
      a.href = "mailto:" + s.email;
      if (/@/.test(a.textContent)) a.textContent = s.email;
    });
    if (s.whatsapp) document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
      var q = (a.href.split("?")[1] || "");
      a.href = "https://wa.me/" + String(s.whatsapp).replace(/\D/g, "") + (q ? "?" + q : "");
    });
    if (s.instagram) document.querySelectorAll('a[href*="instagram.com"]').forEach(function (a) {
      a.href = "https://instagram.com/" + s.instagram;
    });
  }

  /* ---------- works page ---------- */
  function hydrateWorks(data, slugs) {
    var main = document.querySelector(".w-main");
    if (!main) return;

    var anchor = null; // where project articles live
    var existing = {};
    document.querySelectorAll(".w-project").forEach(function (art) {
      existing[art.id] = art;
      anchor = art.parentNode;
    });
    if (!anchor) return;

    // build sections for manifest-only projects
    slugs.forEach(function (slug) {
      if (existing[slug] || (data[slug].hidden)) return;
      var proj = data[slug];
      if (!t(proj, "name")) return;
      var art = buildWorksSection(slug, proj);
      anchor.appendChild(art);
      existing[slug] = art;
    });

    // apply overrides + visibility, then order + renumber
    var visible = [];
    slugs.forEach(function (slug) {
      var art = existing[slug];
      if (!art) return;
      var proj = data[slug];
      if (proj.hidden) { art.remove(); delete existing[slug]; return; }

      var name = t(proj, "name");
      var nameEl = art.querySelector(".w-name");
      if (name && nameEl) nameEl.textContent = name;

      var desc = t(proj, "desc");
      var descEl = art.querySelector(".w-text > p");
      if (desc && descEl) descEl.textContent = desc;

      visible.push({ slug: slug, art: art, place: t(proj, "place") });
    });

    // reorder in the DOM + renumber the "001 · Place" kickers
    visible.forEach(function (v, i) {
      anchor.appendChild(v.art);
      var idxEl = v.art.querySelector(".w-idx");
      if (idxEl) {
        var oldPlace = (idxEl.textContent.split("·")[1] || "").trim();
        idxEl.textContent = pad3(i + 1) + " · " + (v.place || oldPlace || (isHe ? "ישראל" : "Israel"));
      }
      hydrateGallery(v.art.querySelector(".w-gallery"), data[v.slug]);
    });
  }

  function buildWorksSection(slug, proj) {
    var art = document.createElement("article");
    art.className = "w-project reveal in";
    art.id = slug;

    var media = document.createElement("div");
    media.className = "w-media";
    var cover = document.createElement("img");
    cover.src = "/assets/project-" + slug + ".jpg";
    cover.alt = t(proj, "name");
    cover.loading = "lazy";
    cover.onload = function () { cover.classList.add("is-loaded"); };
    cover.onerror = function () {
      cover.onerror = null;
      var first = (proj.images || [])[0];
      if (first) cover.src = "/assets/" + first.file;
    };
    media.appendChild(cover);

    var text = document.createElement("div");
    text.className = "w-text";
    var idx = document.createElement("span"); idx.className = "w-idx"; idx.textContent = "· " + (t(proj, "place") || "");
    var h2 = document.createElement("h2"); h2.className = "w-name"; h2.textContent = t(proj, "name");
    var p = document.createElement("p"); p.textContent = t(proj, "desc");
    text.appendChild(idx); text.appendChild(h2);
    if (t(proj, "desc")) text.appendChild(p);

    var gal = document.createElement("div");
    gal.className = "w-gallery";
    gal.setAttribute("data-project", slug);

    art.appendChild(media); art.appendChild(text); art.appendChild(gal);
    return art;
  }

  /* gallery fully controlled by the manifest: order, adds, deletes */
  function hydrateGallery(gal, proj) {
    if (!gal) return;
    var imgs = (proj && proj.images) || [];
    if (!imgs.length) return; // nothing in manifest — leave the static gallery alone

    var have = {};
    gal.querySelectorAll("img").forEach(function (im) {
      var f = (im.getAttribute("src") || "").split("/").pop().split("?")[0];
      if (f) have[f] = im;
    });

    // remove photos the manifest no longer lists
    var listed = {};
    imgs.forEach(function (it) { listed[it.file] = true; });
    Object.keys(have).forEach(function (f) { if (!listed[f]) { have[f].remove(); delete have[f]; } });

    // append/reorder to match the manifest exactly
    imgs.forEach(function (it) {
      var im = have[it.file];
      if (!im) {
        im = document.createElement("img");
        im.src = "/assets/" + it.file;
        im.loading = "lazy";
        im.addEventListener("load", function () { im.classList.add("is-loaded"); });
      }
      im.alt = (isHe ? (it.alt_he || it.alt) : (it.alt || it.alt_he)) || t(proj, "name") || "";
      im.classList.toggle("w-wide", !!it.wide);
      gal.appendChild(im); // appendChild moves existing nodes → order follows manifest
    });
  }

  /* ---------- home reel ---------- */
  function hydrateReel(data, slugs) {
    var reel = document.getElementById("reel");
    if (!reel) return;

    var cardBySlug = {};
    reel.querySelectorAll(".card").forEach(function (card) {
      var href = card.getAttribute("href") || "";
      var m = /#([a-z0-9-]+)\s*$/i.exec(href);
      if (m) cardBySlug[m[1]] = card;
    });

    var template = reel.querySelector(".card");
    var visible = [];

    slugs.forEach(function (slug) {
      var proj = data[slug];
      var card = cardBySlug[slug];

      if (proj.hidden) { if (card) card.remove(); return; }

      if (!card && template && t(proj, "name")) {
        card = template.cloneNode(true);
        card.setAttribute("href", (isHe ? "/he/works/#" : "/works/#") + slug);
        var media = card.querySelector(".card-media");
        if (media) {
          media.classList.remove("is-wip");
          media.innerHTML = "";
          var im = document.createElement("img");
          im.src = "/assets/project-" + slug + ".jpg";
          im.alt = t(proj, "name");
          im.loading = "lazy";
          im.onload = function () { im.classList.add("is-loaded"); };
          im.onerror = function () {
            im.onerror = null;
            var first = (proj.images || [])[0];
            if (first) im.src = "/assets/" + first.file; else im.remove();
          };
          media.appendChild(im);
        }
        reel.appendChild(card);
      }
      if (!card) return;

      var name = t(proj, "name");
      var titleEl = card.querySelector(".card-title");
      if (name && titleEl) titleEl.textContent = name;
      var place = t(proj, "place");
      var placeEl = card.querySelector(".card-place");
      if (place && placeEl) placeEl.textContent = place;

      visible.push(card);
    });

    // order + renumber
    visible.forEach(function (card, i) {
      reel.appendChild(card);
      var idxEl = card.querySelector(".card-idx");
      if (idxEl) idxEl.textContent = pad3(i + 1);
    });

    // rebuild pager dots to match the visible cards
    var pager = document.getElementById("pager");
    if (pager) {
      pager.innerHTML = "";
      visible.forEach(function (_, i) {
        var d = document.createElement("span");
        d.className = "dot" + (i === 0 ? " is-active" : "");
        pager.appendChild(d);
      });
    }

    // let the carousel re-bind to the new cards/dots
    try { document.dispatchEvent(new CustomEvent("almog:reel-updated")); } catch (e) {}
  }
})();
