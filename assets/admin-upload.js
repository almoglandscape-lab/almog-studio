/* ============================================================
   ALMOG STUDIO — Backstage gallery manager
   iPhone → GitHub → live site, no computer needed.
   Upload · reorder · delete · set cover — all through the
   GitHub API, committed to `main`, driven by assets/galleries.json.
   The token lives ONLY in this device's localStorage.
   ============================================================ */
(function () {
  var OWNER = "almoglandscape-lab", REPO = "almog-studio", BRANCH = "main";
  var API = "https://api.github.com/repos/" + OWNER + "/" + REPO;
  var LS_KEY = "bs_gh_token";
  var MAX_EDGE = 1600, JPEG_Q = 0.82;

  function el(id) { return document.getElementById(id); }
  var setupCard = el("up-setup"), panel = el("up-panel");
  if (!setupCard || !panel) return;

  var tokenInput = el("up-token"), saveBtn = el("up-save-token"),
      forgetBtn = el("up-forget"), projectSel = el("up-project"),
      filesInput = el("up-files"), pickBtn = el("up-pick"),
      logList = el("up-log"), statusEl = el("up-status");

  function getToken() { try { return localStorage.getItem(LS_KEY) || ""; } catch (e) { return ""; } }
  function setToken(t) { try { t ? localStorage.setItem(LS_KEY, t) : localStorage.removeItem(LS_KEY); } catch (e) {} }

  function swap() {
    var has = !!getToken();
    setupCard.hidden = has;
    panel.hidden = !has;
  }
  swap();

  function status(msg, isErr) {
    statusEl.textContent = msg || "";
    statusEl.style.color = isErr ? "#b23b3b" : "";
  }

  function logItem(name) {
    var li = document.createElement("li");
    var main = document.createElement("div"); main.className = "li-main";
    var b = document.createElement("b"); b.textContent = name;
    var s = document.createElement("span"); s.textContent = "ממתין…";
    main.appendChild(b); main.appendChild(s);
    li.appendChild(main);
    logList.appendChild(li);
    return { set: function (txt) { s.textContent = txt; } };
  }

  /* ---- GitHub API ---- */
  function gh(path, opts) {
    opts = opts || {};
    opts.headers = {
      "Authorization": "Bearer " + getToken(),
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (opts.body) opts.headers["Content-Type"] = "application/json";
    return fetch(API + "/" + path, opts).then(function (r) {
      if (r.status === 401) throw new Error("bad-token");
      if (r.status === 403) throw new Error("no-write");
      if (!r.ok && r.status !== 404) throw new Error("api-" + r.status);
      return r.status === 404 ? null : r.json();
    });
  }
  function contents(path, opts) { return gh("contents/" + path, opts); }

  function b64ToUtf8(b64) {
    var bin = atob((b64 || "").replace(/\n/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function utf8ToB64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  /* ---- manifest helpers (always fresh, so shas never clash) ---- */
  function freshManifest() {
    return contents("assets/galleries.json?ref=" + BRANCH).then(function (res) {
      if (!res) throw new Error("no-manifest");
      return { data: JSON.parse(b64ToUtf8(res.content)), sha: res.sha };
    });
  }
  function putManifest(data, sha, msg) {
    return contents("assets/galleries.json", {
      method: "PUT",
      body: JSON.stringify({
        message: msg, sha: sha, branch: BRANCH,
        content: utf8ToB64(JSON.stringify(data, null, 2))
      })
    });
  }

  /* ---- client-side resize ---- */
  function resizeToJpegB64(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth, h = img.naturalHeight;
          var s = Math.min(1, MAX_EDGE / Math.max(w, h));
          var c = document.createElement("canvas");
          c.width = Math.round(w * s); c.height = Math.round(h * s);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          resolve(c.toDataURL("image/jpeg", JPEG_Q).split(",")[1]);
        } catch (e) { reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  /* ---- setup flow: verify the token can actually WRITE ---- */
  saveBtn.addEventListener("click", function () {
    var t = (tokenInput.value || "").trim();
    if (!t) { status("הדבק את המפתח קודם", true); return; }
    setToken(t);
    status("בודק את המפתח…");
    gh("").then(function (repo) {
      if (!repo || !repo.permissions || !repo.permissions.push) throw new Error("no-write");
      status("✓ מחובר! אפשר להעלות ולנהל.");
      tokenInput.value = "";
      swap();
    }).catch(function (e) {
      setToken("");
      if (e.message === "no-write")
        status("למפתח הזה אין הרשאת כתיבה. צור מפתח חדש: Add permissions → Contents → Read and write → ואז Generate.", true);
      else
        status("המפתח לא עובד — ודא שהעתקת אותו במלואו ושבחרת את הריפו almog-studio.", true);
    });
  });

  forgetBtn.addEventListener("click", function () {
    setToken(""); status(""); swap();
  });

  /* ---- upload flow ---- */
  pickBtn.addEventListener("click", function () { filesInput.click(); });

  function putFile(path, b64, msg) {
    return contents(path, {
      method: "PUT",
      body: JSON.stringify({ message: msg, content: b64, branch: BRANCH })
    }).catch(function (e) {
      if (e.message !== "api-422") throw e;
      return contents(path + "?ref=" + BRANCH).then(function (existing) {
        if (!existing || !existing.sha) throw e;
        return contents(path, {
          method: "PUT",
          body: JSON.stringify({ message: msg, content: b64, branch: BRANCH, sha: existing.sha })
        });
      });
    });
  }

  function reason(e) {
    if (e.message === "bad-token") return "✗ בעיית מפתח";
    if (e.message === "no-write") return "✗ אין הרשאת כתיבה למפתח";
    if (e.message === "decode") return "✗ פורמט תמונה לא נתמך";
    if (/^api-/.test(e.message)) return "✗ שגיאת רשת (" + e.message.replace("api-", "") + ")";
    return "✗ נכשל";
  }
  function opFail(e) {
    if (!e) return;
    if (e.message === "bad-token") { status("המפתח נדחה — הדבק מפתח חדש", true); setToken(""); swap(); }
    else if (e.message === "no-write") status("למפתח אין הרשאת כתיבה — צור חדש עם Contents: Read and write", true);
    else status("משהו נכשל — נסה שוב (" + e.message + ")", true);
  }

  filesInput.addEventListener("change", function () {
    var files = Array.prototype.slice.call(filesInput.files || []);
    filesInput.value = "";
    if (!files.length) return;
    var slug = projectSel.value;
    logList.innerHTML = "";
    status("מתחיל…");

    freshManifest().then(function (m) {
      var manifest = m.data, sha = m.sha;
      var proj = manifest[slug] || (manifest[slug] = { name: slug, images: [] });

      var next = 1;
      proj.images.forEach(function (it) {
        var mm = /-(\d+)\.jpg$/.exec(it.file || "");
        if (mm) next = Math.max(next, parseInt(mm[1], 10));
      });
      next += 1; if (next < 2) next = 2;

      var okCount = 0;
      var chain = Promise.resolve();
      files.forEach(function (file) {
        var item = logItem(file.name);
        chain = chain.then(function () {
          item.set("מקטין…");
          return resizeToJpegB64(file).then(function (b64) {
            var fname = "project-" + slug + "-" + next + ".jpg";
            next += 1;
            item.set("מעלה…");
            return putFile("assets/" + fname, b64, "Backstage: add photo to " + slug).then(function () {
              proj.images.push({ file: fname, alt: proj.name || slug, alt_he: proj.name || slug });
              okCount += 1;
              item.set("✓ עלה");
            });
          }).catch(function (e) {
            if (e.message === "bad-token" || e.message === "no-write") throw e;
            item.set(reason(e));
          });
        });
      });

      return chain.then(function () {
        if (!okCount) throw new Error("none-ok");
        status("מעדכן את הגלריה…");
        return putManifest(manifest, sha, "Backstage: update gallery manifest (" + slug + ")")
          .then(function () { return { ok: okCount, total: files.length, manifest: manifest }; });
      });
    }).then(function (r) {
      renderGallery(r.manifest);
      status(r.ok === r.total
        ? "✓ הכל באוויר! התמונות יופיעו באתר תוך כדקה."
        : "✓ עלו " + r.ok + " מתוך " + r.total + " — השאר מסומנות למעלה עם הסיבה.");
    }).catch(function (e) {
      if (e.message === "none-ok") status("אף תמונה לא עלתה — הסיבות מסומנות למעלה.", true);
      else opFail(e);
    });
  });

  /* ============================================================
     GALLERY MANAGER — tap a photo, then use its tools:
     ⭐ ראשית · ⇢ הזז ימינה · ⇠ הזז שמאלה · 🗑 מחק
     ============================================================ */
  var galGrid = el("up-gallery"), galTitle = el("up-gal-title"),
      galEmpty = el("up-gal-empty"), galSite = el("up-gal-site");
  var busy = false;
  var selectedFile = null;   /* keep selection across re-renders */

  function setBusy(b) {
    busy = b;
    if (galGrid) galGrid.style.opacity = b ? "0.5" : "";
    if (galGrid) galGrid.style.pointerEvents = b ? "none" : "";
  }

  function renderGallery(manifest) {
    if (!galGrid) return;
    var slug = projectSel.value;
    if (galSite) galSite.href = "/works/#" + slug;

    var done = function (data) {
      var proj = (data && data[slug]) || { images: [] };
      var imgs = proj.images || [];
      if (galTitle) galTitle.textContent = "בגלריה עכשיו · " + (proj.name || slug) + " (" + imgs.length + ")";
      if (galEmpty) galEmpty.hidden = imgs.length > 0;
      galGrid.innerHTML = "";

      imgs.forEach(function (it) {
        var wrap = document.createElement("div");
        wrap.className = "mt-wrap";
        if (it.file === selectedFile) wrap.classList.add("is-selected");

        var img = document.createElement("img");
        img.src = "/assets/" + it.file;
        img.alt = it.alt_he || it.alt || "";
        img.loading = "lazy";
        img.onerror = function () {
          img.onerror = null;
          setTimeout(function () { img.src = "/assets/" + it.file + "?r=" + Date.now(); }, 45000);
        };
        wrap.appendChild(img);

        var tools = document.createElement("div");
        tools.className = "mt-tools";
        [
          { icon: "⭐", label: "קבע כתמונה ראשית", act: function () { makeCover(slug, it.file); } },
          { icon: "⇢", label: "הזז ימינה — מוקדם יותר בגלריה", act: function () { moveImage(slug, it.file, -1); } },
          { icon: "⇠", label: "הזז שמאלה — מאוחר יותר בגלריה", act: function () { moveImage(slug, it.file, +1); } },
          { icon: "🗑", label: "מחק מהאתר", act: function () { removeImage(slug, it.file); }, danger: true }
        ].forEach(function (t) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "mt-btn" + (t.danger ? " mt-danger" : "");
          b.textContent = t.icon;
          b.title = t.label;
          b.setAttribute("aria-label", t.label);
          b.addEventListener("click", function (ev) { ev.stopPropagation(); if (!busy) t.act(); });
          tools.appendChild(b);
        });
        wrap.appendChild(tools);

        wrap.addEventListener("click", function () {
          var was = wrap.classList.contains("is-selected");
          Array.prototype.forEach.call(galGrid.children, function (c) { c.classList.remove("is-selected"); });
          if (!was) { wrap.classList.add("is-selected"); selectedFile = it.file; }
          else selectedFile = null;
        });

        galGrid.appendChild(wrap);
      });
    };

    if (manifest) { done(manifest); return; }
    fetch("/assets/galleries.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); }).then(done).catch(function () {});
  }

  function indexOfFile(imgs, file) {
    for (var i = 0; i < imgs.length; i++) if (imgs[i].file === file) return i;
    return -1;
  }

  /* move a photo one step earlier (-1) or later (+1) in the gallery order */
  function moveImage(slug, file, delta) {
    setBusy(true); status("משנה סדר…");
    freshManifest().then(function (m) {
      var imgs = (m.data[slug] || {}).images || [];
      var i = indexOfFile(imgs, file), j = i + delta;
      if (i < 0 || j < 0 || j >= imgs.length) { status(""); return null; }
      var tmp = imgs[i]; imgs[i] = imgs[j]; imgs[j] = tmp;
      return putManifest(m.data, m.sha, "Backstage: reorder gallery (" + slug + ")")
        .then(function () {
          renderGallery(m.data);
          status("✓ הסדר עודכן — באתר תוך כדקה.");
        });
    }).catch(opFail).then(function () { setBusy(false); });
  }

  /* delete a photo: remove the file + pull it out of the manifest */
  function removeImage(slug, file) {
    if (!confirm("למחוק את התמונה מהאתר? אי אפשר לבטל.")) return;
    setBusy(true); status("מוחק…");
    freshManifest().then(function (m) {
      var proj = m.data[slug] || { images: [] };
      proj.images = (proj.images || []).filter(function (it) { return it.file !== file; });
      if (selectedFile === file) selectedFile = null;
      return contents("assets/" + file + "?ref=" + BRANCH).then(function (f) {
        var delP = f && f.sha
          ? contents("assets/" + file, {
              method: "DELETE",
              body: JSON.stringify({ message: "Backstage: delete photo (" + slug + ")", sha: f.sha, branch: BRANCH })
            })
          : Promise.resolve();
        return delP.then(function () {
          return putManifest(m.data, m.sha, "Backstage: remove photo from manifest (" + slug + ")");
        }).then(function () {
          renderGallery(m.data);
          status("✓ נמחק — ייעלם מהאתר תוך כדקה.");
        });
      });
    }).catch(opFail).then(function () { setBusy(false); });
  }

  /* set a gallery photo as the project's cover (project-<slug>.jpg) */
  function makeCover(slug, file) {
    setBusy(true); status("קובע תמונה ראשית…");
    contents("assets/" + file + "?ref=" + BRANCH).then(function (f) {
      if (f && f.content) return f.content.replace(/\n/g, "");
      /* contents API returns empty content above ~1MB — fall back to raw */
      return fetch("https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/" + BRANCH + "/assets/" + file)
        .then(function (r) { if (!r.ok) throw new Error("api-" + r.status); return r.blob(); })
        .then(function (blob) {
          return new Promise(function (resolve, reject) {
            var rd = new FileReader();
            rd.onload = function () { resolve(String(rd.result).split(",")[1]); };
            rd.onerror = function () { reject(new Error("decode")); };
            rd.readAsDataURL(blob);
          });
        });
    }).then(function (b64) {
      return putFile("assets/project-" + slug + ".jpg", b64, "Backstage: set cover (" + slug + ")");
    }).then(function () {
      status("✓ התמונה הראשית הוחלפה — תתעדכן בעמוד הבית ובראש הפרויקט תוך כדקה.");
    }).catch(opFail).then(function () { setBusy(false); });
  }

  projectSel.addEventListener("change", function () { selectedFile = null; renderGallery(null); });
  renderGallery(null);

  /* shared toolbox for the other Backstage modules (projects editor, settings) */
  window.BS = {
    gh: gh, contents: contents,
    freshManifest: freshManifest, putManifest: putManifest, putFile: putFile,
    getToken: getToken, hasToken: function () { return !!getToken(); },
    b64ToUtf8: b64ToUtf8, utf8ToB64: utf8ToB64,
    refreshGallery: function () { renderGallery(null); }
  };
})();
