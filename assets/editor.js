/* ============================================================
   ALMOG STUDIO — מצב עריכה ויזואלי
   - תמיד: טוען שינויים שמורים (צבעים + טקסטים) מ-localStorage
   - עם ?edit בכתובת: פותח כלי עריכה מלאים
   ============================================================ */

(function () {
  const STORE_KEY = "almog-studio-edits";

  // אילו אלמנטים ניתנים לעריכה (טקסט)
  const EDITABLE = [
    ".hero-en", ".hero-he",
    ".works-en", ".works-he",
    ".project-index", ".project-place", ".title-en", ".title-he", ".project-desc",
    ".about-statement", ".about-note", ".about-credo",
    ".shop-title", ".shop-sub",
    ".product-name", ".product-price",
    ".footer-credo"
  ];

  // משתני צבע/גודל שניתן לשנות
  const VARS = {
    "--white":     { label: "רקע בהיר",  type: "color" },
    "--black":     { label: "צבע ראשי",  type: "color" },
    "--grey":      { label: "אפור משני", type: "color" },
    "--hero-logo": { label: "גודל לוגו", type: "range", min: 240, max: 640, unit: "px" }
  };

  // --- תיוג אלמנטים עם מפתח יציב ---
  function tagEditables() {
    EDITABLE.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.setAttribute("data-edit", sel + "#" + i);
      });
    });
  }

  // --- טעינת שינויים שמורים ---
  function loadEdits() {
    let data;
    try { data = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch { data = {}; }

    // צבעים / משתנים
    if (data.vars) {
      Object.entries(data.vars).forEach(([k, v]) => {
        document.documentElement.style.setProperty(k, v);
      });
    }
    // טקסטים
    if (data.texts) {
      Object.entries(data.texts).forEach(([key, html]) => {
        const el = document.querySelector('[data-edit="' + CSS.escape(key) + '"]');
        if (el) el.innerHTML = html;
      });
    }
    return data;
  }

  // --- שמירה ---
  function save(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  function currentVarValue(name) {
    const inline = document.documentElement.style.getPropertyValue(name).trim();
    if (inline) return inline;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // הרץ תמיד:
  tagEditables();
  const state = loadEdits();
  state.vars = state.vars || {};
  state.texts = state.texts || {};

  // אם לא במצב עריכה — סיים כאן
  const params = new URLSearchParams(location.search);
  if (!params.has("edit")) return;

  // ====================== מצב עריכה ======================

  // כפתור צף
  const fab = document.createElement("button");
  fab.id = "edit-fab";
  fab.textContent = "✎ עריכה";
  document.body.appendChild(fab);

  // פאנל
  const panel = document.createElement("div");
  panel.id = "edit-panel";
  panel.innerHTML =
    '<div class="edit-panel-title">עריכת האתר</div>' +
    '<p class="edit-panel-hint">לחץ על כל טקסט באתר כדי לערוך אותו ישירות.</p>' +
    '<h3>צבעים ומידות</h3>' +
    '<div id="edit-vars"></div>' +
    '<h3>שמירה</h3>' +
    '<button class="edit-btn primary" id="edit-download">💾 שמור והורד אתר מעודכן</button>' +
    '<button class="edit-btn ghost" id="edit-reset">↺ אפס הכל</button>';
  document.body.appendChild(panel);

  // בניית פקדי הצבעים/מידות
  const varsBox = panel.querySelector("#edit-vars");
  Object.entries(VARS).forEach(([name, cfg]) => {
    const row = document.createElement("label");
    row.className = "edit-row";
    const val = state.vars[name] || currentVarValue(name);
    if (cfg.type === "color") {
      row.innerHTML = '<span>' + cfg.label + '</span>' +
        '<input type="color" value="' + toHex(val) + '" data-var="' + name + '">';
    } else {
      const num = parseInt(val) || cfg.max;
      row.innerHTML = '<span>' + cfg.label + '</span>' +
        '<input type="range" min="' + cfg.min + '" max="' + cfg.max + '" value="' + num + '" data-var="' + name + '" data-unit="' + cfg.unit + '">';
    }
    varsBox.appendChild(row);
  });

  // האזנה לשינוי משתנים
  varsBox.addEventListener("input", (e) => {
    const input = e.target;
    const name = input.getAttribute("data-var");
    if (!name) return;
    const v = input.type === "range" ? input.value + (input.getAttribute("data-unit") || "") : input.value;
    document.documentElement.style.setProperty(name, v);
    state.vars[name] = v;
    save(state);
  });

  // הפעלת/כיבוי מצב עריכת טקסט
  let editing = false;
  function setEditing(on) {
    editing = on;
    document.body.classList.toggle("editing", on);
    fab.classList.toggle("active", on);
    fab.textContent = on ? "✓ סיום" : "✎ עריכה";
    panel.classList.toggle("open", on);
    document.querySelectorAll("[data-edit]").forEach((el) => {
      el.contentEditable = on ? "true" : "false";
    });
    let badge = document.querySelector(".edit-badge");
    if (on && !badge) {
      badge = document.createElement("div");
      badge.className = "edit-badge";
      badge.textContent = "מצב עריכה פעיל";
      document.body.appendChild(badge);
    } else if (!on && badge) {
      badge.remove();
    }
  }

  fab.addEventListener("click", () => setEditing(!editing));

  // שמירת טקסטים בזמן הקלדה
  document.addEventListener("input", (e) => {
    const el = e.target.closest && e.target.closest("[data-edit]");
    if (!el || !editing) return;
    state.texts[el.getAttribute("data-edit")] = el.innerHTML;
    save(state);
  });

  // איפוס
  panel.querySelector("#edit-reset").addEventListener("click", () => {
    if (!confirm("לאפס את כל השינויים ולחזור למקור?")) return;
    localStorage.removeItem(STORE_KEY);
    location.reload();
  });

  // ====================== ייצוא קובץ מעודכן ======================
  panel.querySelector("#edit-download").addEventListener("click", () => {
    setEditing(false); // סגור מצב עריכה לפני שכפול

    const clone = document.documentElement.cloneNode(true);

    // נקה אלמנטים/תכונות של העורך מהעותק
    clone.querySelectorAll("#edit-fab, #edit-panel, .edit-badge, script[src*='editor']").forEach(n => n.remove());
    clone.querySelectorAll("[data-edit]").forEach(n => {
      n.removeAttribute("contenteditable");
      n.removeAttribute("data-edit");
    });
    clone.querySelectorAll("body").forEach(b => b.classList.remove("editing"));

    // הזרק את הצבעים/מידות שנבחרו כ-style קבוע
    const overrides = Object.entries(state.vars)
      .map(([k, v]) => "  " + k + ": " + v + ";").join("\n");
    if (overrides) {
      const styleTag = clone.querySelector("style#user-overrides") || document.createElement("style");
      styleTag.id = "user-overrides";
      styleTag.textContent = ":root {\n" + overrides + "\n}";
      clone.querySelector("head").appendChild(styleTag);
    }

    const html = "<!DOCTYPE html>\n" + clone.outerHTML;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "index.html";
    a.click();
    URL.revokeObjectURL(a.href);

    alert("הורד קובץ index.html מעודכן.\nשמור אותו בתיקיית האתר (במקום הקיים) כדי שהשינויים יהיו קבועים.");
  });

  // פתח אוטומטית במצב עריכה
  setEditing(true);

  // המרת rgb/שם צבע ל-hex עבור input[type=color]
  function toHex(c) {
    c = (c || "").trim();
    if (c.startsWith("#")) return c.length === 4
      ? "#" + c[1]+c[1]+c[2]+c[2]+c[3]+c[3] : c;
    const m = c.match(/\d+/g);
    if (!m) return "#000000";
    return "#" + m.slice(0,3).map(n => (+n).toString(16).padStart(2,"0")).join("");
  }
})();
