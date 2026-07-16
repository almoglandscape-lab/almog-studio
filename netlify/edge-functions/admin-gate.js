// ============================================================
// Almog Studio — Backstage gate (Netlify Edge Function)
// Real auth: password lives in env vars, never in client code.
// Serves the pretty Hebrew login for unauthenticated requests;
// only passes through to the dashboard when the signed cookie is valid.
// ============================================================
const MSG = "almog-backstage-v1";
const COOKIE = "bs";
const MAXAGE = 60 * 60 * 24 * 30; // 30 days

const enc = new TextEncoder();

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function makeToken(secret) {
  const exp = Date.now() + MAXAGE * 1000;
  return `${exp}.${await hmac(secret, MSG + exp)}`;
}
async function validToken(secret, token) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return sig === (await hmac(secret, MSG + exp));
}
function getCookie(req, name) {
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function html(body, status = 200, cookie) {
  const headers = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" };
  if (cookie) headers["set-cookie"] = cookie;
  return new Response(body, { status, headers });
}

function shell(inner) {
  return `<!DOCTYPE html><html lang="he" dir="rtl"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
<meta name="robots" content="noindex, nofollow"/><meta name="theme-color" content="#16140f"/>
<title>Backstage — סטודיו אלמוג</title>
<link rel="icon" type="image/png" href="/assets/symbol.png"/>
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600&f[]=satoshi@300,400,500,700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/assets/admin.css?v=3"/></head><body>${inner}</body></html>`;
}

function loginPage(error) {
  return shell(`<div class="login" style="display:flex"><div class="login-card">
    <img class="login-mark" src="/assets/symbol.png" alt=""/>
    <h1>Backstage</h1>
    <p class="login-sub">סטודיו אלמוג · הכניסה שלך</p>
    <form method="post" action="/admin/" autocomplete="off">
      <label class="field"><span>שם משתמש</span><input type="text" name="username" placeholder="אלמוג"/></label>
      <label class="field"><span>סיסמה</span><input type="password" name="password" placeholder="••••••••" autofocus/></label>
      ${error ? `<p style="color:#b23b3b;font-size:13px;margin:-4px 0 12px">${error}</p>` : ``}
      <button type="submit" class="btn btn-primary btn-block">כניסה</button>
    </form>
    <p class="login-fine">כניסה מאובטחת · רק לך יש גישה</p>
  </div></div>`);
}

function setupPage() {
  return shell(`<div class="login" style="display:flex"><div class="login-card" style="max-width:460px;text-align:right">
    <img class="login-mark" src="/assets/symbol.png" alt="" style="margin-inline:auto"/>
    <h1 style="text-align:center">כמעט מוכן</h1>
    <p class="login-sub" style="text-align:center">צריך להגדיר סיסמה פעם אחת ב-Netlify</p>
    <ol style="font-family:'Assistant',sans-serif;font-size:14px;line-height:1.9;color:#3a352c;padding-inline-start:20px;margin:18px 0">
      <li>היכנס ל-Netlify → הפרויקט → <b>Site configuration → Environment variables</b></li>
      <li>הוסף שלושה משתנים:<br>
        <code>ADMIN_USER</code> — שם המשתמש שלך<br>
        <code>ADMIN_PASS</code> — הסיסמה שלך<br>
        <code>ADMIN_SECRET</code> — מחרוזת אקראית ארוכה (לחתימה)</li>
      <li>שמור — ותוך דקה הכניסה תעבוד.</li>
    </ol>
    <p class="login-fine" style="text-align:center">עד אז הדשבורד חסום — מאובטח כברירת מחדל.</p>
  </div></div>`);
}

export default async (request, context) => {
  const url = new URL(request.url);
  const USER = Netlify.env.get("ADMIN_USER") || "";
  const PASS = Netlify.env.get("ADMIN_PASS") || "";
  const SECRET = Netlify.env.get("ADMIN_SECRET") || "";

  // not configured yet → safe setup notice (dashboard stays hidden)
  if (!PASS || !SECRET) return html(setupPage());

  // logout
  if (url.searchParams.get("logout") === "1") {
    return html(loginPage(""), 200, `${COOKIE}=; Path=/admin; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  }

  // login attempt
  if (request.method === "POST") {
    let u = "", p = "";
    try { const f = await request.formData(); u = (f.get("username") || "").toString().trim(); p = (f.get("password") || "").toString(); } catch (_) {}
    if (p === PASS && (!USER || u === USER)) {
      const token = await makeToken(SECRET);
      return new Response(null, {
        status: 303,
        headers: { location: "/admin/", "cache-control": "no-store",
          "set-cookie": `${COOKIE}=${token}; Path=/admin; Max-Age=${MAXAGE}; HttpOnly; Secure; SameSite=Lax` },
      });
    }
    return html(loginPage("שם משתמש או סיסמה שגויים"), 401);
  }

  // authenticated GET → serve the dashboard file
  if (await validToken(SECRET, getCookie(request, COOKIE))) return context.next();

  // otherwise → login screen
  return html(loginPage(""), 401);
};

export const config = { path: ["/admin", "/admin/*"] };
