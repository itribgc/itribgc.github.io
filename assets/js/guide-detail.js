console.log("guide-detail.js 已載入");

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

  function getGuideId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

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

  async function loadGuide() {
    const guideDetail = document.getElementById("guideDetail");
    const guideId = getGuideId();

    if (!guideDetail) {
      return;
    }

    if (!guideId) {
      guideDetail.innerHTML = `<div class="guide-empty">找不到文章 ID。</div>`;
      return;
    }

    try {
      const doc = await db.collection("guides").doc(guideId).get();

      if (!doc.exists) {
        guideDetail.innerHTML = `<div class="guide-empty">找不到這篇攻略文章。</div>`;
        return;
      }

      const data = doc.data();

      if (data.status !== "published") {
        guideDetail.innerHTML = `<div class="guide-empty">這篇文章目前未公開。</div>`;
        return;
      }

      const coverImage = data.coverImage && data.coverImage.trim()
        ? data.coverImage.trim()
        : "";

      let rawHtml = "";

      if (window.marked) {
        rawHtml = window.marked.parse(data.contentMarkdown || "");
      } else {
        rawHtml = "<p>" + escapeHtml(data.contentMarkdown || "").replaceAll("\n", "<br>") + "</p>";
      }

      const safeHtml = window.DOMPurify
        ? window.DOMPurify.sanitize(rawHtml, {
            ADD_ATTR: ["style"]
          })
        : rawHtml;

      document.title = (data.title || "桌遊攻略文章") + " | " + document.title;

      guideDetail.innerHTML = `
        ${coverImage ? `<img class="guide-detail-cover" src="${escapeHtml(coverImage)}" alt="${escapeHtml(data.title)}">` : ""}

        <h1>${escapeHtml(data.title || "未命名攻略")}</h1>

        <div class="guide-detail-meta">
          ${escapeHtml(data.gameName || "未分類桌遊")}
          ・${escapeHtml(data.authorName || "未命名社員")}
          ・${escapeHtml(formatTime(data.createdAt))}
        </div>

        <div class="guide-detail-summary">
          ${escapeHtml(data.summary || "")}
        </div>

        <div class="guide-detail-content">
          ${safeHtml}
        </div>

        <div class="guide-detail-actions">
          <a href="/guides/">返回桌遊攻略</a>
        </div>
      `;
    } catch (error) {
      console.error("讀取攻略文章失敗：", error);
      guideDetail.innerHTML = `<div class="guide-empty">文章讀取失敗，請稍後再試。</div>`;
    }
  }

  document.addEventListener("DOMContentLoaded", loadGuide);
})();
