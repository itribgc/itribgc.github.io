console.log("home-post-bento.js 已載入");

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

  function findLatestPostsSection() {
    const headings = Array.from(
      document.querySelectorAll("main h1, main h2, main h3, .content h1, .content h2, .content h3")
    );

    const latestHeading = headings.find(function (heading) {
      return heading.innerText && heading.innerText.trim().includes("最新文章");
    });

    if (!latestHeading) {
      return null;
    }

    let section = latestHeading.parentElement;

    while (
      section &&
      section !== document.body &&
      section.querySelectorAll("a[href]").length < 2
    ) {
      section = section.parentElement;
    }

    return section;
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

  function isIgnoredLink(link) {
    return !!link.closest(
      "nav, .sidebar, .sidebar-sticky, .menu, .navbar, footer, .footer, .social, .pagination, .breadcrumbs"
    );
  }

  function isCarouselCard(card) {
    if (!card) return false;

    return !!card.closest(
      ".carousel, .swiper, .slider, .slideshow, .hero, #homeCarousel, #carousel, [class*='carousel'], [class*='slider'], [id*='carousel'], [id*='slider']"
    );
  }

  function findHomePostCards() {
    const section = findLatestPostsSection();

    if (!section) {
      console.warn("找不到首頁最新文章區塊");
      return [];
    }

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

      seenPaths.add(path);

      results.push({
        path: path,
        postId: makePostId(path),
        card: card
      });
    });

    return results;
  }

  async function getViewCount(postId) {
    try {
      const doc = await db.collection("postStats").doc(postId).get();

      if (!doc.exists) {
        return 0;
      }

      const data = doc.data();
      return Number(data.viewCount || 0);
    } catch (error) {
      console.error("讀取文章瀏覽數失敗：", error);
      return 0;
    }
  }

  function clearBentoClasses(items) {
    items.forEach(function (item) {
      item.card.classList.remove(
        "home-post-bento-card",
        "home-post-bento-large",
        "home-post-bento-medium",
        "home-post-bento-normal"
      );
    });
  }

  function findCardsParent(items) {
    if (!items.length) return null;

    const parents = items.map(function (item) {
      return item.card.parentElement;
    });

    const firstParent = parents[0];

    const allSameParent = parents.every(function (parent) {
      return parent === firstParent;
    });

    if (allSameParent) {
      return firstParent;
    }

    return null;
  }

  function applyBentoLayout(itemsWithViews) {
    if (!itemsWithViews.length) return;

    const parent = findCardsParent(itemsWithViews);

    if (parent) {
      parent.classList.add("home-post-bento-grid");
    }

    clearBentoClasses(itemsWithViews);

    const sorted = itemsWithViews.slice().sort(function (a, b) {
      return b.viewCount - a.viewCount;
    });

    sorted.forEach(function (item, index) {
      item.card.classList.add("home-post-bento-card");

      if (index === 0 && item.viewCount > 0) {
        item.card.classList.add("home-post-bento-large");
      } else if (index === 1 && item.viewCount > 0) {
        item.card.classList.add("home-post-bento-medium");
      } else {
        item.card.classList.add("home-post-bento-normal");
      }

      item.card.dataset.viewCount = String(item.viewCount);
    });
  }

  function injectStyles() {
    if (document.getElementById("homePostBentoStyle")) return;

    const style = document.createElement("style");
    style.id = "homePostBentoStyle";
    style.innerHTML = `
      .home-post-bento-grid {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        grid-auto-flow: dense !important;
        gap: 1.35rem !important;
        align-items: stretch !important;
      }

      .home-post-bento-card {
        width: 100% !important;
        height: 100% !important;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease,
          border-color 0.2s ease;
      }

      .home-post-bento-card:hover {
        transform: translateY(-4px);
      }

      .home-post-bento-large {
        grid-column: span 2 !important;
        grid-row: span 2 !important;
      }

      .home-post-bento-medium {
        grid-column: span 2 !important;
        grid-row: span 1 !important;
      }

      .home-post-bento-normal {
        grid-column: span 1 !important;
        grid-row: span 1 !important;
      }

      .home-post-bento-card img {
        width: 100% !important;
        object-fit: cover !important;
      }

      .home-post-bento-large img {
        min-height: 360px !important;
        max-height: 430px !important;
      }

      .home-post-bento-medium img {
        min-height: 230px !important;
        max-height: 300px !important;
      }

      .home-post-bento-normal img {
        min-height: 210px !important;
        max-height: 260px !important;
      }

      .home-post-bento-large h1,
      .home-post-bento-large h2,
      .home-post-bento-large h3,
      .home-post-bento-large .card-title,
      .home-post-bento-large .post-title,
      .home-post-bento-large .project-title {
        font-size: 1.55rem !important;
        line-height: 1.25 !important;
      }

      .home-post-bento-medium h1,
      .home-post-bento-medium h2,
      .home-post-bento-medium h3,
      .home-post-bento-medium .card-title,
      .home-post-bento-medium .post-title,
      .home-post-bento-medium .project-title {
        font-size: 1.35rem !important;
        line-height: 1.3 !important;
      }

      .home-post-bento-normal h1,
      .home-post-bento-normal h2,
      .home-post-bento-normal h3,
      .home-post-bento-normal .card-title,
      .home-post-bento-normal .post-title,
      .home-post-bento-normal .project-title {
        font-size: 1.15rem !important;
        line-height: 1.3 !important;
      }

      @media (max-width: 980px) {
        .home-post-bento-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        .home-post-bento-large,
        .home-post-bento-medium {
          grid-column: span 2 !important;
          grid-row: span 1 !important;
        }
      }

      @media (max-width: 640px) {
        .home-post-bento-grid {
          display: block !important;
        }

        .home-post-bento-card {
          margin-bottom: 1.25rem !important;
        }

        .home-post-bento-large,
        .home-post-bento-medium,
        .home-post-bento-normal {
          grid-column: auto !important;
          grid-row: auto !important;
        }

        .home-post-bento-card img {
          min-height: unset !important;
          max-height: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  async function renderBentoLayout() {
    if (!isHomePage()) return;
    if (!currentUser) return;

    injectStyles();

    const items = findHomePostCards();

    if (!items.length) {
      console.warn("首頁沒有找到可套用 Bento 排版的最新文章卡片");
      return;
    }

    const itemsWithViews = [];

    for (const item of items) {
      const viewCount = await getViewCount(item.postId);

      itemsWithViews.push({
        ...item,
        viewCount: viewCount
      });
    }

    applyBentoLayout(itemsWithViews);
  }

  function scheduleRender() {
    if (!isHomePage()) return;

    setTimeout(renderBentoLayout, 400);
    setTimeout(renderBentoLayout, 1200);
    setTimeout(renderBentoLayout, 2200);
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
