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

  function isHomePage() {
    const path = window.location.pathname;
    return path === "/" || path === "/index.html";
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
      "/admin/",
      "/tags/",
      "/about/",
      "/search/"
    ];

    return skipPrefixes.some(function (prefix) {
      return path.startsWith(prefix);
    });
  }

  function isInsideIgnoredArea(link) {
    return !!link.closest(
      "nav, .sidebar, .sidebar-sticky, .menu, .navbar, footer, .footer, .social, .pagination, .breadcrumbs"
    );
  }

  function findCardFromLink(link) {
    return link.closest(
      "article, .card, .project-card, .post-card, .hy-card, .grid__item, .grid-item, li"
    );
  }

  function findTitleInCard(card, link) {
    const titleSelectors = [
      "h1",
      "h2",
      "h3",
      ".card-title",
      ".post-title",
      ".project-title",
      ".heading",
      ".flip-title"
    ];

    for (const selector of titleSelectors) {
      const el = card.querySelector(selector);

      if (el && el.innerText && el.innerText.trim()) {
        return el;
      }
    }

    if (link && link.innerText && link.innerText.trim()) {
      return link;
    }

    return null;
  }

  function cardLooksLikePostCard(card) {
    if (!card) return false;

    const hasTitle = !!card.querySelector("h1, h2, h3, .card-title, .post-title, .project-title, .heading, .flip-title");
    const hasText = card.innerText && card.innerText.trim().length > 0;

    return hasTitle && hasText;
  }

  function ensureStyles() {
    if (document.getElementById("homePostStatsStyle")) return;

    const style = document.createElement("style");
    style.id = "homePostStatsStyle";
    style.innerHTML = `
      .home-post-title-stat-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.55rem;
        margin: 0 0 0.45rem 0;
      }

      .home-post-title-stat-row > h1,
      .home-post-title-stat-row > h2,
      .home-post-title-stat-row > h3,
      .home-post-title-stat-row > .card-title,
      .home-post-title-stat-row > .post-title,
      .home-post-title-stat-row > .project-title,
      .home-post-title-stat-row > .heading,
      .home-post-title-stat-row > .flip-title {
        margin-top: 0 !important;
        margin-bottom: 0 !important;
        display: inline-block;
      }

      .home-post-inline-stats {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.35rem;
        vertical-align: middle;
      }

      .home-post-stat-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 3px 9px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.055);
        color: inherit;
        font-size: 0.78rem;
        font-weight: 700;
        line-height: 1.25;
        white-space: nowrap;
        opacity: 0.9;
      }

      .home-post-stat-pill.like {
        border-color: rgba(79,177,186,0.38);
        background: rgba(79,177,186,0.12);
      }

      .home-post-stat-loading {
        opacity: 0.55;
      }

      @media (max-width: 640px) {
        .home-post-title-stat-row {
          gap: 0.45rem;
        }

        .home-post-inline-stats {
          gap: 0.3rem;
        }

        .home-post-stat-pill {
          font-size: 0.74rem;
          padding: 3px 8px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function removeOldStats() {
    document.querySelectorAll(".home-post-stats, .home-post-inline-stats").forEach(function (el) {
      el.remove();
    });

    document.querySelectorAll(".home-post-title-stat-row").forEach(function (row) {
      const title = row.querySelector("h1, h2, h3, .card-title, .post-title, .project-title, .heading, .flip-title, a");

      if (title && row.parentNode) {
        row.parentNode.insertBefore(title, row);
        row.remove();
      }
    });
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
      if (!cardLooksLikePostCard(card)) return;

      const titleEl = findTitleInCard(card, link);
      if (!titleEl) return;

      seenPaths.add(path);

      results.push({
        path: path,
        postId: makePostId(path),
        card: card,
        titleEl: titleEl
      });
    });

    return results;
  }

  function createStatsElement(item) {
    const stats = document.createElement("span");
    stats.className = "home-post-inline-stats";
    stats.dataset.postPath = item.path;
    stats.dataset.postId = item.postId;
    stats.innerHTML = `
      <span class="home-post-stat-pill like home-post-stat-loading" data-stat="likes">👍 0</span>
      <span class="home-post-stat-pill home-post-stat-loading" data-stat="views">👁 0</span>
      <span class="home-post-stat-pill home-post-stat-loading" data-stat="comments">💬 0</span>
    `;

    const titleEl = item.titleEl;

    if (titleEl.parentElement && titleEl.parentElement.classList.contains("home-post-title-stat-row")) {
      titleEl.parentElement.appendChild(stats);
      return stats;
    }

    const row = document.createElement("div");
    row.className = "home-post-title-stat-row";

    const parent = titleEl.parentNode;

    parent.insertBefore(row, titleEl);
    row.appendChild(titleEl);
    row.appendChild(stats);

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
    removeOldStats();

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
  }

  function scheduleRender() {
    if (!isHomePage()) {
      removeOldStats();
      return;
    }

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

  const pushStateEl = document.querySelector("hy-push-state");

  if (pushStateEl) {
    pushStateEl.addEventListener("load", scheduleRender);
  }
})();
