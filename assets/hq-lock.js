/* מרכז שליטה — נעילת זיהוי פנים (WebAuthn, מאחורי סיסמת ה-edge בפרודקשן).
   Face ID באייפון · Windows Hello במחשב. הרשמה פעם אחת לכל מכשיר. */
(function () {
  "use strict";

  var lock = document.getElementById("lock");
  if (!lock || lock.hidden) return;

  var KEY = "hq_cred_" + location.hostname;
  var btn = document.getElementById("lock-btn");
  var txt = document.getElementById("lock-btn-txt");
  var sub = document.getElementById("lock-sub");
  var status = document.getElementById("lock-status");
  var reset = document.getElementById("lock-reset");

  function b64(buf) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function unb64(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s), a = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a.buffer;
  }
  function challenge() {
    var a = new Uint8Array(32);
    crypto.getRandomValues(a);
    return a;
  }
  function unlock() {
    sessionStorage.setItem("hq_unlocked", "1");
    lock.classList.add("open");
    document.documentElement.classList.remove("locked");
    setTimeout(function () { lock.remove(); }, 450);
  }
  function hasCred() { return !!localStorage.getItem(KEY); }
  function fail(msg, label) {
    status.textContent = msg;
    txt.textContent = label;
    reset.hidden = !hasCred();
  }

  /* מכשיר בלי ביומטריה: בפרודקשן כבר עברת את הסיסמה — נותנים להיכנס בכנות */
  function fallbackMode(msg) {
    sub.textContent = msg;
    txt.textContent = "כניסה";
    status.textContent = "";
    btn.onclick = unlock;
  }

  var supported = !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
  if (!supported || !window.isSecureContext) {
    fallbackMode("הדפדפן הזה לא תומך בזיהוי ביומטרי");
    return;
  }

  function register() {
    txt.textContent = "מגדיר…";
    status.textContent = "";
    navigator.credentials.create({
      publicKey: {
        challenge: challenge(),
        rp: { name: "Almog Studio", id: location.hostname },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: "almog",
          displayName: "אלמוג"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 }
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred"
        },
        timeout: 60000
      }
    }).then(function (cred) {
      localStorage.setItem(KEY, b64(cred.rawId));
      unlock();
    }).catch(function () {
      fail("ההגדרה לא הושלמה — נסה שוב", "הפעל זיהוי פנים במכשיר הזה");
    });
  }

  function verify() {
    txt.textContent = "מזהה…";
    status.textContent = "";
    navigator.credentials.get({
      publicKey: {
        challenge: challenge(),
        allowCredentials: [{
          type: "public-key",
          id: unb64(localStorage.getItem(KEY)),
          transports: ["internal"]
        }],
        userVerification: "required",
        timeout: 60000
      }
    }).then(unlock).catch(function () {
      fail("לא זוהה — נסה שוב", "כניסה עם זיהוי פנים");
    });
  }

  function go() { hasCred() ? verify() : register(); }

  if (hasCred()) {
    txt.textContent = "כניסה עם זיהוי פנים";
  } else {
    sub.textContent = "פעם ראשונה במכשיר הזה — הפעל זיהוי פנים";
    txt.textContent = "הפעל זיהוי פנים במכשיר הזה";
  }
  btn.addEventListener("click", go);
  reset.addEventListener("click", function () {
    localStorage.removeItem(KEY);
    sub.textContent = "פעם ראשונה במכשיר הזה — הפעל זיהוי פנים";
    txt.textContent = "הפעל זיהוי פנים במכשיר הזה";
    status.textContent = "";
    reset.hidden = true;
  });

  /* אם אין במכשיר מזהה ביומטרי זמין — עוברים למצב כניסה פשוטה */
  if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(function (ok) {
      if (!ok) fallbackMode("אין במכשיר הזה זיהוי פנים/טביעת אצבע פעילים");
    });
  }
})();
