/* ============================================================
   ALMOG STUDIO — Backstage interactions
   One live data source (assets/galleries.json) powers the
   dashboard numbers AND the projects screen. No fake data.
   ============================================================ */
(function () {
  // time-aware Hebrew greeting
  var greetEl = document.getElementById("greeting");
  if (greetEl) {
    var h = new Date().getHours();
    var part = h < 12 ? "בוקר טוב" : h < 18 ? "צהריים טובים" : h < 22 ? "ערב טוב" : "לילה טוב";
    greetEl.textContent = part + ", אלמוג.";
  }

  // view switching
  var navItems = document.querySelectorAll(".nav-item[data-view]");
  var views = document.querySelectorAll(".view");
  var main = document.querySelector(".main");
  function show(view) {
    navItems.forEach(function (n) { n.classList.toggle("is-active", n.dataset.view === view); });
    views.forEach(function (v) { v.classList.toggle("is-active", v.dataset.view === view); });
    closeDrawer();
    if (location.hash !== "#" + view) history.replaceState(null, "", "#" + view);
    if (main) main.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }
  navItems.forEach(function (n) {
    n.addEventListener("click", function (e) { e.preventDefault(); show(n.dataset.view); });
  });
  document.querySelectorAll("[data-jump]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); show(a.dataset.jump); });
  });
  var initial = (location.hash || "").replace("#", "");
  if (initial && document.querySelector('.view[data-view="' + initial + '"]')) show(initial);

  // mobile drawer
  var app = document.getElementById("app");
  var menuBtn = document.getElementById("menu-btn");
  var scrim = document.getElementById("scrim");
  function closeDrawer() { if (app) app.classList.remove("nav-open"); }
  if (menuBtn) menuBtn.addEventListener("click", function () { app.classList.toggle("nav-open"); });
  if (scrim) scrim.addEventListener("click", closeDrawer);

  /* ---- jump straight into managing one project's gallery ---- */
  function manageProject(slug) {
    var sel = document.getElementById("up-project");
    if (sel && slug) {
      sel.value = slug;
      sel.dispatchEvent(new Event("change"));
    }
    show("media");
  }

  /* ---- live data: one fetch feeds everything ---- */
  function projectSlugs(data) {
    return Object.keys(data)
      .filter(function (k) { return k !== "_settings"; })
      .sort(function (a, b) { return (data[a].order || 999) - (data[b].order || 999); });
  }

  function renderStats(data) {
    var stP = document.getElementById("st-projects");
    var stPh = document.getElementById("st-photos");
    var live = 0, photos = 0, total = 0;
    projectSlugs(data).forEach(function (k) {
      total += 1;
      var n = (data[k].images || []).length;
      photos += n;
      if (n > 0 && !data[k].hidden) live += 1;
    });
    if (stP) {
      stP.textContent = live;
      var s = document.getElementById("st-projects-sub");
      if (s) s.textContent = "מתוך " + total + " בתיק";
    }
    if (stPh) {
      stPh.textContent = photos;
      var s2 = document.getElementById("st-photos-sub");
      if (s2) s2.textContent = "בכל הפרויקטים";
    }
  }

  /* keep the media screen's project picker in sync with the manifest */
  function renderPicker(data) {
    var sel = document.getElementById("up-project");
    if (!sel) return;
    var current = sel.value;
    sel.innerHTML = "";
    projectSlugs(data).forEach(function (slug) {
      var o = document.createElement("option");
      o.value = slug;
      o.textContent = (data[slug].name_he || data[slug].name || slug) + (data[slug].hidden ? " · מוסתר" : "");
      sel.appendChild(o);
    });
    if (current && data[current]) sel.value = current;
  }

  function renderProjects(data) {
    var grid = document.getElementById("proj-grid");
    if (!grid) return;
    grid.innerHTML = "";
    var slugs = projectSlugs(data);

    slugs.forEach(function (slug, idx) {
      var proj = data[slug] || {};
      var imgs = proj.images || [];
      var isLive = imgs.length > 0 && !proj.hidden;

      var card = document.createElement("article");
      card.className = "proj" + (proj.hidden ? " proj--hidden" : "");
      card.title = "נהל את הגלריה של " + (proj.name_he || proj.name || slug);

      var thumb = document.createElement("div");
      thumb.className = "proj-thumb";
      var img = document.createElement("img");
      img.alt = proj.name || slug;
      img.loading = "lazy";
      img.src = "/assets/project-" + slug + ".jpg";
      img.onerror = function () {
        img.onerror = null;
        if (imgs.length) img.src = "/assets/" + imgs[0].file;
        else img.remove();
      };
      thumb.appendChild(img);

      // floating tools: edit + reorder
      var tools = document.createElement("div");
      tools.className = "proj-tools";
      [
        { icon: "✎", label: "ערוך פרטים", act: function () { if (window.BSProjects) window.BSProjects.edit(slug); } },
        { icon: "↑", label: "הזז למעלה בתיק", act: function () { if (window.BSProjects) window.BSProjects.move(slug, -1); } },
        { icon: "↓", label: "הזז למטה בתיק", act: function () { if (window.BSProjects) window.BSProjects.move(slug, +1); } }
      ].forEach(function (tdef) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "mt-btn"; b.textContent = tdef.icon;
        b.title = tdef.label; b.setAttribute("aria-label", tdef.label);
        b.addEventListener("click", function (e) { e.stopPropagation(); tdef.act(); });
        tools.appendChild(b);
      });
      thumb.appendChild(tools);

      var body = document.createElement("div");
      body.className = "proj-body";
      var name = document.createElement("b");
      name.textContent = proj.name_he || proj.name || slug;
      var meta = document.createElement("span");
      meta.className = "tag " + (proj.hidden ? "" : (isLive ? "live" : "wip"));
      meta.textContent = proj.hidden ? "מוסתר" : (isLive ? imgs.length + " תמונות · באוויר" : "בעבודה");
      body.appendChild(name);
      body.appendChild(meta);

      card.appendChild(thumb);
      card.appendChild(body);
      card.addEventListener("click", function () { manageProject(slug); });

      grid.appendChild(card);
    });

    var add = document.createElement("button");
    add.type = "button";
    add.className = "proj proj-add";
    add.innerHTML = "<span>＋</span>פרויקט חדש";
    add.addEventListener("click", function () {
      if (window.BSProjects) window.BSProjects.add();
    });
    grid.appendChild(add);
  }

  function loadData() {
    fetch("/assets/galleries.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        renderStats(data);
        renderPicker(data);
        renderProjects(data);
      })
      .catch(function () {
        var grid = document.getElementById("proj-grid");
        if (grid) grid.innerHTML = '<p class="up-note">לא הצלחתי לטעון את הנתונים — רענן את הדף.</p>';
      });
  }
  loadData();
  window.BSReloadData = loadData;

  /* ---- quick actions: every button leads somewhere real ---- */
  document.querySelectorAll("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () {
      var target = b.dataset.go;
      if (target === "media" || target === "projects" || target === "messages" || target === "settings" || target === "shop") show(target);
      else if (target === "site-he") window.open("/he/", "_blank");
      else if (target === "site") window.open("/", "_blank");
    });
  });
})();
