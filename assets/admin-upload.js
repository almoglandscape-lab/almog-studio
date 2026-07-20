/* ============================================================
   ALMOG STUDIO — Backstage photo uploader
   iPhone → GitHub → live site, no computer needed.
   - One-time setup: paste a fine-grained GitHub token
     (stored ONLY in this device's localStorage).
   - Photos are resized client-side (max 1600px JPEG),
     committed to the `main` branch via the GitHub API,
     and appended to assets/galleries.json — the manifest
     that gallery-render.js reads on the works pages.
   ============================================================ */
(function () {
  var OWNER = "almoglandscape-lab", REPO = "almog-studio", BRANCH = "main";
  var API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/";
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
    return fetch(API + path, opts).then(function (r) {
      if (r.status === 401 || r.status === 403) throw new Error("bad-token");
      if (!r.ok && r.status !== 404) throw new Error("api-" + r.status);
      return r.status === 404 ? null : r.json();
    });
  }

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

  /* ---- setup flow ---- */
  saveBtn.addEventListener("click", function () {
    var t = (tokenInput.value || "").trim();
    if (!t) { status("הדבק את המפתח קודם", true); return; }
    setToken(t);
    status("בודק את המפתח…");
    gh("assets/galleries.json?ref=" + BRANCH)
      .then(function (res) {
        if (!res) throw new Error("no-manifest");
        status("✓ מחובר! אפשר להעלות.");
        tokenInput.value = "";
        swap();
      })
      .catch(function () {
        setToken("");
        status("המפתח לא עובד — ודא שנתת הרשאת Contents: Read and write לריפו almog-studio", true);
      });
  });

  forgetBtn.addEventListener("click", function () {
    setToken(""); status(""); swap();
  });

  /* ---- upload flow ---- */
  pickBtn.addEventListener("click", function () { filesInput.click(); });

  // PUT a file; if it already exists (422), fetch its sha and overwrite.
  function putFile(path, b64, msg) {
    return gh(path, {
      method: "PUT",
      body: JSON.stringify({ message: msg, content: b64, branch: BRANCH })
    }).catch(function (e) {
      if (e.message !== "api-422") throw e;
      return gh(path + "?ref=" + BRANCH).then(function (existing) {
        if (!existing || !existing.sha) throw e;
        return gh(path, {
          method: "PUT",
          body: JSON.stringify({ message: msg, content: b64, branch: BRANCH, sha: existing.sha })
        });
      });
    });
  }

  function reason(e) {
    if (e.message === "bad-token") return "✗ בעיית מפתח";
    if (e.message === "decode") return "✗ פורמט תמונה לא נתמך";
    if (/^api-/.test(e.message)) return "✗ שגיאת רשת (" + e.message.replace("api-", "") + ")";
    return "✗ נכשל";
  }

  filesInput.addEventListener("change", function () {
    var files = Array.prototype.slice.call(filesInput.files || []);
    filesInput.value = "";
    if (!files.length) return;
    var slug = projectSel.value;
    logList.innerHTML = "";
    status("מתחיל…");

    // 1) fresh manifest (content + sha) straight from the API
    gh("assets/galleries.json?ref=" + BRANCH).then(function (res) {
      if (!res) throw new Error("no-manifest");
      var manifest = JSON.parse(b64ToUtf8(res.content));
      var sha = res.sha;
      var proj = manifest[slug] || (manifest[slug] = { name: slug, images: [] });

      // next number: continue from the highest -N suffix in the manifest
      var next = 1;
      proj.images.forEach(function (it) {
        var m = /-(\d+)\.jpg$/.exec(it.file || "");
        if (m) next = Math.max(next, parseInt(m[1], 10));
      });
      next += 1; if (next < 2) next = 2;

      // 2) photos one by one — a single failure never kills the batch
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
            if (e.message === "bad-token") throw e;   // no point continuing
            item.set(reason(e));                       // mark this one, keep going
          });
        });
      });

      // 3) if anything made it up, write the manifest so it shows on the site
      return chain.then(function () {
        if (!okCount) throw new Error("none-ok");
        status("מעדכן את הגלריה…");
        return gh("assets/galleries.json", {
          method: "PUT",
          body: JSON.stringify({
            message: "Backstage: update gallery manifest (" + slug + ")",
            content: utf8ToB64(JSON.stringify(manifest, null, 2)),
            sha: sha,
            branch: BRANCH
          })
        }).then(function () { return { ok: okCount, total: files.length }; });
      });
    }).then(function (r) {
      status(r.ok === r.total
        ? "✓ הכל באוויר! התמונות יופיעו באתר תוך כדקה."
        : "✓ עלו " + r.ok + " מתוך " + r.total + " — השאר מסומנות למעלה עם הסיבה. מה שעלה יופיע באתר תוך כדקה.");
    }).catch(function (e) {
      if (e.message === "bad-token") { status("המפתח נדחה — הדבק מפתח חדש", true); setToken(""); swap(); }
      else if (e.message === "none-ok") status("אף תמונה לא עלתה — הסיבות מסומנות למעלה. נסה שוב.", true);
      else status("משהו נכשל — נסה שוב (" + e.message + ")", true);
    });
  });
})();
