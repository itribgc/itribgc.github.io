console.log("guide-list.js 已載入");

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyARLnYPUUSVIXiK3UJnlSw93AeAm3_sSz8",
    authDomain: "itribgc-0.firebaseapp.com",
    projectId: "itribgc-0",
    storageBucket: "itribgc-0.firebasestorage.app",
    messagingSenderId: "535892877472",
    appId: "1:535892877472:web:2270ac423ffd6f38b1e9c5"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.firestore();

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTime(timestamp) {
    if (!timestamp || !timestamp.toDate) return "";
    const date = timestamp.toDate();

    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function renderGuides(snapshot) {
    const guideList = document.getElementById("guideList");

    if (!guideList) return;

    if (snapshot.empty) {
      guideList.innerHTML = `<div class="guide-empty">目前還沒有桌遊攻略，快來發布第一篇吧！</div>`;
      return;
    }

    let html = "";

    snapshot.forEach(function (doc) {
      const data = doc.data();

      const coverImage = data.coverImage && data.coverImage.trim()
        ? data.coverImage.trim()
        : "/assets/img/home_page_img.png";

      html += `
        <a class="guide-card" href="/guides/post/?id=${encodeURIComponent(doc.id)}">
          <img class="guide-card-cover" src="${escapeHtml(coverImage)}" alt="${escapeHtml(data.title)}">

          <div class="guide-card-body">
            <h2>${escapeHtml(data.title || "未命名攻略")}</h2>

            <div class="guide-meta">
              ${escapeHtml(data.gameName || "未分類桌遊")}
              ・${escapeHtml(data.authorName || "未命名社員")}
              ・${escapeHtml(formatTime(data.createdAt))}
            </div>

            <p class="guide-summary">${escapeHtml(data.summary || "這篇攻略還沒有摘要。")}</p>
          </div>
        </a>
      `;
    });

    guideList.innerHTML = html;
  }

  db.collection("guides")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .onSnapshot(renderGuides, function (error) {
      console.error("讀取攻略列表失敗：", error);
      const guideList = document.getElementById("guideList");
      if (guideList) {
        guideList.innerHTML = `<div class="guide-empty">攻略列表讀取失敗，請稍後再試。</div>`;
      }
    });
})();
