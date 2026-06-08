console.log("home-post-stats.js 已載入");

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

  const auth = firebase.auth();
  const db = firebase.firestore();

  let currentUser = null;
  let hasRenderedOnce = false;

  function isHomePage() {
    const path = window.location.pathname;
    return path === "/" || path === "/index.html";
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function makePostId(path) {
    return encodeURIComponent(path)
      .replaceAll(".", "%2E")
      .replaceAll("/", "%2F")
      .replaceAll("%", "_");
  }

  function normalizePostPath(href) {
    try {
      const url = new URL(href, window.location.origin);
      let path = url.pathname;

      if (!path.startsWith("/")) {
        path = "/" + path;
      }

      return path;
    } catch (error) {
      return "";
    }
  }

  function shouldSkipPath(path) {
    if (!path) return true;
    if (path === "/" || path === "/index.html") return true;

    const skipPrefixes = [
      "/assets/",
      "/login/",
      "/guides/",
      "/newsletter/",
      "/admin/"
    ];

    return skipPrefixes.some(function (prefix) {
      return path.startsWith(prefix);
    });
  }

  function findCardFromLink(link) {
    return link.closest(
      "article, .card, .project-card, .post-card, .grid__item, .list-item, li"
    );
  }

  function isInsideIgnoredArea(link) {
    return !!link.closest(
      "nav, .sidebar, .sidebar-sticky, .menu, .navbar, footer, .footer, .social, .pagination"
    );
  }

  function getCardTitle(card, link) {
    const titleEl = card.querySelector("h1, h2, h3, .heading, .card-title, .post-title");
    if (titleEl && titleEl.innerText.trim()) {
      return titleEl.innerText.trim();
    }

    if (link && link.innerText.trim()) {
      return link.innerText.trim();
    }

    return "未命名文章";
  }

  function ensureStyles() {
    if (document.getElementById("homePostStatsStyle")) return;

    const style = document.createElement("style");
    style.id = "homePostStatsStyle";
    style.innerHTML = `
      .home-post-stats {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-top: 0.65rem;
        margin-bottom: 0.2rem;
      }

      .home-post-stat-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.055);
        color: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        line-height: 1.25;
        white-space: nowrap;
        opacity: 0.9;
      }

      .home-post-stat-pill.like {
        border-color: rgba(79,177,186,0.36);
        background: rgba(79,177,186,0.10);
      }

      .home-post-stat-loading {
        opacity: 0.55;
      }
    `;

    document.head.appendChild(style);
  }

  function findHomePostCards() {
    const links = Array.from(document.querySelectorAll("main a[href], article a[href], .content a[href]"));
    const seenPaths = new Set();
    const results = [];

    links.forEach(function (link) {
      if (isInsideIgnoredArea(link)) return;

      const path = normalizePostPath(link.getAttribute("href"));
      if (shouldSkipPath(path)) return;

      if (seenPaths.has(path)) return;

      const card = findCardFromLink(link);
      if (!card) return;

      if (card.querySelector(".home-post-stats")) return;

      seenPaths.add(path);

      results.push({
        path: path,
        postId: makePostId(path),
        title: getCardTitle(card, link),
        card: card,
        link: link
      });
    });

    return results;
  }

  function createStatsElement(item) {
    const stats = document.createElement("div");
    stats.className = "home-post-stats";
    stats.dataset.postPath = item.path;
    stats.dataset.postId = item.postId;
    stats.innerHTML = `
      <span class="home-post-stat-pill like home-post-stat-loading" data-stat="likes">👍 0</span>
      <span class="home-post-stat-pill home-post-stat-loading" data-stat="views">👁 0</span>
      <span class="home-post-stat-pill home-post-stat-loading" data-stat="comments">💬 0</span>
    `;

    const titleEl = item.card.querySelector("h1, h2, h3, .heading, .card-title, .post-title");

    if (titleEl && titleEl.parentNode) {
      titleEl.insertAdjacentElement("afterend", stats);
    } else {
      item.card.appendChild(stats);
    }

    return stats;
  }

  async function getPostStats(postId) {
    try {
      const doc = await db.collection("postStats").doc(postId).get();

      if (!doc.exists) {
        return {
          likeCount: 0,
          viewCount: 0
        };
      }

      const data = doc.data();

      return {
        likeCount: Number(data.likeCount || 0),
        viewCount: Number(data.viewCount || 0)
      };
    } catch (error) {
      console.error("讀取首頁文章統計失敗：", error);
      return {
        likeCount: 0,
        viewCount: 0
      };
    }
  }

  async function getCommentCount(postPath) {
    try {
      const snapshot = await db.collection("comments")
        .where("postPath", "==", postPath)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error("讀取首頁文章留言數失敗：", error);
      return 0;
    }
  }

  function updateStatsElement(statsEl, values) {
    const likesEl = statsEl.querySelector('[data-stat="likes"]');
    const viewsEl = statsEl.querySelector('[data-stat="views"]');
    const commentsEl = statsEl.querySelector('[data-stat="comments"]');

    if (likesEl) {
      likesEl.innerText = "👍 " + values.likeCount;
      likesEl.classList.remove("home-post-stat-loading");
    }

    if (viewsEl) {
      viewsEl.innerText = "👁 " + values.viewCount;
      viewsEl.classList.remove("home-post-stat-loading");
    }

    if (commentsEl) {
      commentsEl.innerText = "💬 " + values.commentCount;
      commentsEl.classList.remove("home-post-stat-loading");
    }
  }

  async function renderHomePostStats() {
    if (!isHomePage()) return;
    if (!currentUser) return;

    ensureStyles();

    const items = findHomePostCards();

    if (items.length === 0) {
      console.warn("首頁沒有找到可加統計資訊的文章卡片");
      return;
    }

    for (const item of items) {
      const statsEl = createStatsElement(item);

      const postStats = await getPostStats(item.postId);
      const commentCount = await getCommentCount(item.path);

      updateStatsElement(statsEl, {
        likeCount: postStats.likeCount,
        viewCount: postStats.viewCount,
        commentCount: commentCount
      });
    }

    hasRenderedOnce = true;
  }

  function clearOldStatsIfNeeded() {
    if (!isHomePage()) {
      document.querySelectorAll(".home-post-stats").forEach(function (el) {
        el.remove();
      });
      hasRenderedOnce = false;
    }
  }

  function scheduleRender() {
    clearOldStatsIfNeeded();

    if (!isHomePage()) return;

    setTimeout(renderHomePostStats, 250);
    setTimeout(renderHomePostStats, 900);
    setTimeout(renderHomePostStats, 1600);
  }

  auth.onAuthStateChanged(function (user) {
    currentUser = user;

    if (user) {
      scheduleRender();
    }
  });

  document.addEventListener("DOMContentLoaded", scheduleRender);

  window.addEventListener("load", scheduleRender);

  document.addEventListener("click", function () {
    setTimeout(scheduleRender, 600);
  });

  const pushStateEl = document.querySelector("hy-push-state");

  if (pushStateEl) {
    pushStateEl.addEventListener("load", scheduleRender);
  }
})();
