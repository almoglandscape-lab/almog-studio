/* ============================================================
   ALMOG STUDIO — Backstage projects editor + settings
   Full CMS control over the portfolio, from the phone:
   rename (EN/HE) · place · description · show/hide · reorder ·
   new project · delete project · contact settings.
   Writes assets/galleries.json via window.BS (admin-upload.js).
   ============================================================ */
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var BS = window.BS;
    if (!BS) return;

    var grid = document.getElementById("proj-grid");

    /* ---------- tiny sheet (modal) factory ---------- */
    function sheet(title) {
      var wrap = document.createElement("div");
      wrap.className = "sheet-wrap";
      var box = document.createElement("div");
      box.className = "sheet";
      var head = document.createElement("div");
      head.className = "sheet-head";
      var h = document.createElement("h3"); h.textContent = title;
      var x = document.createElement("button");
      x.type = "button"; x.className = "sheet-x"; x.textContent = "✕";
      x.setAttribute("aria-label", "סגור");
      head.appendChild(h); head.appendChild(x);
      box.appendChild(head);
      wrap.appendChild(box);
      document.body.appendChild(wrap);
      var close = function () { wrap.remove(); };
      x.addEventListener("click", close);
      wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
      return { box: box, close: close };
    }

    function field(box, label, value, opts) {
      opts = opts || {};
      var lab = document.createElement("label");
      lab.className = "field";
      var sp = document.createElement("span"); sp.textContent = label;
      var input = document.createElement(opts.textarea ? "textarea" : "input");
      if (!opts.textarea) input.type = "text";
      input.value = value || "";
      if (opts.dir) input.dir = opts.dir;
      if (opts.textarea) input.rows = 3;
      if (opts.placeholder) input.placeholder = opts.placeholder;
      lab.appendChild(sp); lab.appendChild(input);
      box.appendChild(lab);
      return input;
    }

    function note(box, txt) {
      var p = document.createElement("p");
      p.className = "up-note"; p.textContent = txt;
      box.appendChild(p);
      return p;
    }

    function needToken() {
      if (BS.hasToken()) return false;
      alert("כדי לערוך צריך להתחבר קודם: מדיה → הדבק את המפתח.");
      return true;
    }

    /* ---------- project editor sheet ---------- */
    function editProject(slug) {
      if (needToken()) return;
      BS.freshManifest().then(function (m) {
        var proj = m.data[slug];
        if (!proj) return;

        var s = sheet("עריכת פרויקט");
        var name = field(s.box, "שם (אנגלית)", proj.name, { dir: "ltr" });
        var nameHe = field(s.box, "שם (עברית)", proj.name_he || "", { placeholder: "לא חובה" });
        var place = field(s.box, "מיקום (אנגלית)", proj.place || "", { dir: "ltr", placeholder: "Private Residence" });
        var placeHe = field(s.box, "מיקום (עברית)", proj.place_he || "", { placeholder: "בית פרטי" });
        var desc = field(s.box, "תיאור (אנגלית)", proj.desc || "", { dir: "ltr", textarea: true, placeholder: "לא חובה — אם ריק, הטקסט הקיים באתר נשאר" });
        var descHe = field(s.box, "תיאור (עברית)", proj.desc_he || "", { textarea: true, placeholder: "לא חובה" });

        var vis = document.createElement("label");
        vis.className = "field field-check";
        var cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = !proj.hidden;
        var vt = document.createElement("span"); vt.textContent = "מוצג באתר";
        vis.appendChild(cb); vis.appendChild(vt);
        s.box.appendChild(vis);

        note(s.box, "שדה שנשאר ריק לא נוגע בטקסט הקיים באתר.");

        var st = note(s.box, "");
        var row = document.createElement("div"); row.className = "sheet-actions";
        var save = document.createElement("button"); save.className = "btn btn-primary"; save.textContent = "שמור ועדכן באתר";
        var del = document.createElement("button"); del.className = "btn btn-danger"; del.textContent = "מחק פרויקט";
        row.appendChild(save); row.appendChild(del);
        s.box.appendChild(row);

        save.addEventListener("click", function () {
          st.textContent = "שומר…";
          BS.freshManifest().then(function (m2) {
            var p2 = m2.data[slug]; if (!p2) throw new Error("gone");
            p2.name = name.value.trim() || p2.name;
            p2.name_he = nameHe.value.trim();
            p2.place = place.value.trim();
            p2.place_he = placeHe.value.trim();
            p2.desc = desc.value.trim();
            p2.desc_he = descHe.value.trim();
            p2.hidden = !cb.checked;
            return BS.putManifest(m2.data, m2.sha, "Backstage: edit project " + slug);
          }).then(function () {
            s.close();
            reload();
          }).catch(function (e) { st.textContent = "נכשל (" + (e && e.message) + ") — נסה שוב"; });
        });

        del.addEventListener("click", function () {
          var count = (proj.images || []).length;
          if (!confirm("למחוק את \"" + (proj.name_he || proj.name) + "\" מהאתר" + (count ? " כולל " + count + " תמונות" : "") + "? אי אפשר לבטל.")) return;
          st.textContent = "מוחק…";
          BS.freshManifest().then(function (m2) {
            var p2 = m2.data[slug]; if (!p2) return null;
            var files = (p2.images || []).map(function (it) { return it.file; });
            delete m2.data[slug];
            var chain = BS.putManifest(m2.data, m2.sha, "Backstage: delete project " + slug);
            files.forEach(function (f) {
              chain = chain.then(function () {
                return BS.contents("assets/" + f + "?ref=main").then(function (fi) {
                  if (!fi || !fi.sha) return null;
                  return BS.contents("assets/" + f, {
                    method: "DELETE",
                    body: JSON.stringify({ message: "Backstage: delete photo of removed project", sha: fi.sha, branch: "main" })
                  });
                });
              });
            });
            return chain;
          }).then(function () { s.close(); reload(); })
            .catch(function (e) { st.textContent = "נכשל (" + (e && e.message) + ")"; });
        });
      }).catch(function () { alert("לא הצלחתי לטעון את הנתונים — נסה שוב."); });
    }

    /* ---------- new project sheet ---------- */
    function newProject() {
      if (needToken()) return;
      var s = sheet("פרויקט חדש");
      var name = field(s.box, "שם (אנגלית) *", "", { dir: "ltr", placeholder: "Hidden Garden" });
      var nameHe = field(s.box, "שם (עברית)", "", { placeholder: "לא חובה" });
      var place = field(s.box, "מיקום", "", { dir: "ltr", placeholder: "Private Residence" });
      note(s.box, "הפרויקט ייווצר כמוסתר — תעלה תמונות, וכשמוכן תדליק \"מוצג באתר\".");
      var st = note(s.box, "");
      var row = document.createElement("div"); row.className = "sheet-actions";
      var create = document.createElement("button"); create.className = "btn btn-primary"; create.textContent = "צור פרויקט";
      row.appendChild(create); s.box.appendChild(row);

      create.addEventListener("click", function () {
        var n = name.value.trim();
        if (!n) { st.textContent = "צריך שם באנגלית (הוא קובע את הכתובת)"; return; }
        var slug = n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        if (!slug) slug = "project-" + Date.now().toString(36);
        st.textContent = "יוצר…";
        BS.freshManifest().then(function (m) {
          if (m.data[slug]) { st.textContent = "כבר יש פרויקט בשם הזה"; return null; }
          var maxOrder = 0;
          Object.keys(m.data).forEach(function (k) {
            if (k !== "_settings") maxOrder = Math.max(maxOrder, m.data[k].order || 0);
          });
          m.data[slug] = {
            name: n, name_he: nameHe.value.trim(), place: place.value.trim(),
            hidden: true, order: maxOrder + 10, images: []
          };
          return BS.putManifest(m.data, m.sha, "Backstage: new project " + slug).then(function () {
            s.close(); reload();
          });
        }).catch(function (e) { st.textContent = "נכשל (" + (e && e.message) + ")"; });
      });
    }

    /* ---------- reorder from the card arrows ---------- */
    function moveProject(slug, dir) {
      if (needToken()) return;
      BS.freshManifest().then(function (m) {
        var slugs = Object.keys(m.data).filter(function (k) { return k !== "_settings"; });
        slugs.sort(function (a, b) { return (m.data[a].order || 999) - (m.data[b].order || 999); });
        var i = slugs.indexOf(slug), j = i + dir;
        if (i < 0 || j < 0 || j >= slugs.length) return null;
        // renumber cleanly, then swap
        slugs.forEach(function (k, idx) { m.data[k].order = (idx + 1) * 10; });
        var tmp = m.data[slugs[i]].order;
        m.data[slugs[i]].order = m.data[slugs[j]].order;
        m.data[slugs[j]].order = tmp;
        return BS.putManifest(m.data, m.sha, "Backstage: reorder projects").then(reload);
      }).catch(function () {});
    }

    /* ---------- hook into the grid that admin.js renders ---------- */
    window.BSProjects = { edit: editProject, add: newProject, move: moveProject };

    function reload() {
      if (window.BSReloadData) window.BSReloadData();
      if (BS.refreshGallery) BS.refreshGallery();
    }

    /* ---------- settings: load + save contact details ---------- */
    var setEmail = document.getElementById("set-email"),
        setWa = document.getElementById("set-whatsapp"),
        setIg = document.getElementById("set-instagram"),
        setSave = document.getElementById("set-save"),
        setStatus = document.getElementById("set-status");

    if (setSave) {
      fetch("/assets/galleries.json", { cache: "no-cache" })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var s = data._settings || {};
          if (setEmail && s.email) setEmail.value = s.email;
          if (setWa && s.whatsapp) setWa.value = "+" + String(s.whatsapp).replace(/\D/g, "");
          if (setIg && s.instagram) setIg.value = "instagram.com/" + s.instagram;
        }).catch(function () {});

      setSave.addEventListener("click", function () {
        if (needToken()) return;
        setStatus.textContent = "שומר…";
        BS.freshManifest().then(function (m) {
          m.data._settings = m.data._settings || {};
          if (setEmail) m.data._settings.email = setEmail.value.trim();
          if (setWa) m.data._settings.whatsapp = setWa.value.replace(/\D/g, "");
          if (setIg) m.data._settings.instagram = setIg.value.trim().replace(/^.*instagram\.com\//, "").replace(/^@/, "").replace(/\/$/, "");
          return BS.putManifest(m.data, m.sha, "Backstage: update contact settings");
        }).then(function () {
          setStatus.textContent = "✓ נשמר — הקישורים באתר יתעדכנו תוך כדקה.";
        }).catch(function (e) {
          setStatus.textContent = "נכשל (" + (e && e.message) + ") — ודא שהמפתח מחובר במדיה.";
        });
      });
    }
  });
})();
