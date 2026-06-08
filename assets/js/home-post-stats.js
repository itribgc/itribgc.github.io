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

  function ensureStyles() {
    if (document.getElementById("homePostStatsStyle")) return;

    const style = document.createElement("style");
    style.id = "homePostStatsStyle";
    style.innerHTML = `
      .home-post-title-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.55rem;
        margin: 0 0 0.35rem 0;
      }

      .home-post-title-row h1,
      .home-post-title-row h2,
      .home-post-title-row h3,
      .home-post-title-row .card-title,
      .home-post-title-row .post-title,
      .home-post-title-row .project-title,
      .home-post-title-row .flip-title {
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.25 !important;
      }

      .home-post-inline-stats {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.35rem;
        line-height: 1;
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
        font-size: 0.76rem;
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
        .home-post-title-row {
          align-items: flex-start;
          flex-direction: column;
          gap: 0.35rem;
        }

        .home-post-stat-pill {
          font-size: 0.72rem;
          padding: 3px 8px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function removeOldStats() {
    document.querySelectorAll(".home-post-inline-stats, .home-post-stats").forEach(function (el) {
      el.remove();
    });

    document.querySelectorAll(".home-post-title-row").forEach(function (row) {
      const title = row.querySelector("h1, h2, h3, .card-title, .post-title, .project-title, .flip-title");

      if (title && row.parentNode) {
        row.parentNode.insertBefore(title, row);
      }

      row.remove();
    });
  }

  function findLatestPostsSection() {
    const headings = Array.from(document.querySelectorAll("main h1, main h2, main h3, .content h1, .content h2, .content h3"));

    const latestHeading = headings.find(function (heading) {
      return heading.innerText && heading.innerText.trim().includes("最新文章");
    });

    if (!latestHeading) {
      return document.querySelector("main") || document.querySelector(".content") || document.body;
    }

    let section = latestHeading.parentElement;

    while (
      section &&
      section !== document.body &&
      section.querySelectorAll("a[href]").length < 2
    ) {
      section = section.parentElement;
    }

    return section || document.querySelector("main") || document.querySelector(".content") || document.body;
  }

  function findPostCard(link) {
    let el = link;

    while (el && el !== document.body) {
      const hasImage = !!el.querySelector("img");
      const hasTitle = !!el.querySelector("h1, h2, h3, .card-title, .post-title, .project-title, .flip-title");
      const rect = el.getBoundingClientRect();

      if (
        hasImage &&
        hasTitle &&
        rect.width >= 180 &&
        rect.height >= 180
      ) {
        return el;
      }

      el = el.parentElement;
    }

    return null;
  }

  function findTitleElement(card) {
    const selectors = [
      "h1",
      "h2",
      "h3",
      ".card-title",
      ".post-title",
      ".project-title",
      ".flip-title"
    ];

    for (const selector of selectors) {
      const el = card.querySelector(selector);

      if (el && el.innerText && el.innerText.trim()) {
        return el;
      }
    }

    return null;
  }

  function isCarouselCard(card) {
    if (!card) return false;

    return !!card.closest(
      ".carousel, .swiper, .slider, .slideshow, .hero, #homeCarousel, #carousel, [class*='carousel'], [class*='slider'], [id*='carousel'], [id*='slider']"
    );
  }

  function isIgnoredLink(link) {
    return !!link.closest(
      "nav, .sidebar, .sidebar-sticky, .menu, .navbar, footer, .footer, .social, .pagination, .breadcrumbs"
    );
  }

  function findHomePostCards() {
    const section = findLatestPostsSection();
    const links = Array.from(section.querySelectorAll("a[href]"));
    const seenPaths = new Set();
    const results = [];

    links.forEach(function (link) {
      if (isIgnoredLink(link)) return;

      const path = normalizePostPath(link.getAttribute("href"));
      if (shouldSkipPath(path)) return;
      if (seenPaths.has(path)) return;

      const card = findPostCard(link);
      if (!card) return;
      if (isCarouselCard(card)) return;

      const titleEl = findTitleElement(card);
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

    if (titleEl.parentElement && titleEl.parentElement.classList.contains("home-post-title-row")) {
      titleEl.parentElement.appendChild(stats);
      return stats;
    }

    const row = document.createElement("div");
    row.className = "home-post-title-row";

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
      console.warn("首頁沒有找到最新文章卡片，請確認最新文章區塊是否有 h2『最新文章』與文章卡片。");
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

    setTimeout(renderHomePostStats, 350);
    setTimeout(renderHomePostStats, 1100);
    setTimeout(renderHomePostStats, 2200);
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
