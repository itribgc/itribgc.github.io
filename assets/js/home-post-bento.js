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

  function clearOldLayout(items) {
    const parent = findCardsParent(items);

    if (parent) {
      parent.classList.remove("home-post-masonry-grid");
      parent.classList.remove("home-post-bento-grid");
    }

    items.forEach(function (item) {
      item.card.classList.remove(
        "home-post-bento-card",
        "home-post-bento-large",
        "home-post-bento-medium",
        "home-post-bento-normal",
        "home-post-masonry-card",
        "home-post-masonry-xl",
        "home-post-masonry-lg",
        "home-post-masonry-md",
        "home-post-masonry-sm"
      );

      item.card.style.order = "";
      item.card.dataset.viewCount = "";
    });
  }

  function classifyCardsByViewCount(itemsWithViews) {
    const sorted = itemsWithViews.slice().sort(function (a, b) {
      return b.viewCount - a.viewCount;
    });

    sorted.forEach(function (item, index) {
      item.card.classList.add("home-post-masonry-card");
      item.card.dataset.viewCount = String(item.viewCount);

      /*
        動態大小邏輯：
        第 1 名：最大卡
        第 2 名：大卡
        第 3、4 名：中卡
        其他：一般卡

        注意：這邊不是硬塞 CSS Grid，而是交給 CSS columns 自動瀑布流排列，
        所以卡片上下高度不同也比較不會中間破洞。
      */
      if (index === 0 && item.viewCount > 0) {
        item.card.classList.add("home-post-masonry-xl");
      } else if (index === 1 && item.viewCount > 0) {
        item.card.classList.add("home-post-masonry-lg");
      } else if (index <= 3 && item.viewCount > 0) {
        item.card.classList.add("home-post-masonry-md");
      } else {
        item.card.classList.add("home-post-masonry-sm");
      }

      /*
        讓高瀏覽數的文章優先排在前面。
        CSS columns 會依照 DOM / order 排列，所以這邊直接調整 order。
      */
      item.card.style.order = String(index + 1);
    });
  }

  function applyMasonryLayout(itemsWithViews) {
    if (!itemsWithViews.length) return;

    const parent = findCardsParent(itemsWithViews);

    clearOldLayout(itemsWithViews);

    if (parent) {
      parent.classList.add("home-post-masonry-grid");
    }

    classifyCardsByViewCount(itemsWithViews);
  }

  function injectStyles() {
    const oldStyle = document.getElementById("homePostBentoStyle");
    if (oldStyle) oldStyle.remove();

    const style = document.createElement("style");
    style.id = "homePostBentoStyle";
    style.innerHTML = `
      /*
        最新文章 Masonry / Bento 混合版
        目標：
        1. 文章依瀏覽數動態變大或變小
        2. 大小可以包含左右與上下
        3. 盡量自動補位，不要中間留空洞
        4. 小卡片不低於原本可讀性
      */

      .home-post-masonry-grid {
        column-count: 2 !important;
        column-gap: 1.35rem !important;
        display: block !important;
      }

      .home-post-masonry-card {
        display: inline-block !important;
        width: 100% !important;
        margin: 0 0 1.35rem 0 !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        -webkit-column-break-inside: avoid !important;
        vertical-align: top !important;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease,
          border-color 0.2s ease,
          opacity 0.2s ease;
      }

      .home-post-masonry-card:hover {
        transform: translateY(-4px);
      }

      /*
        圖片比例依熱門程度微調：
        - 熱門卡：圖片更有視覺份量
        - 一般卡：維持原本文章卡片感
      */

      .home-post-masonry-card img {
        width: 100% !important;
        display: block !important;
        object-fit: cover !important;
        height: auto !important;
      }

      .home-post-masonry-xl img {
        aspect-ratio: 16 / 10 !important;
      }

      .home-post-masonry-lg img {
        aspect-ratio: 16 / 9 !important;
      }

      .home-post-masonry-md img,
      .home-post-masonry-sm img {
        aspect-ratio: 16 / 9 !important;
      }

      /*
        用 padding / 字體微調視覺大小。
        不用把卡片寬度壓小，所以不會再出現又窄又小的卡片。
      */

      .home-post-masonry-xl h1,
      .home-post-masonry-xl h2,
      .home-post-masonry-xl h3,
      .home-post-masonry-xl .card-title,
      .home-post-masonry-xl .post-title,
      .home-post-masonry-xl .project-title {
        font-size: 1.55rem !important;
        line-height: 1.3 !important;
      }

      .home-post-masonry-lg h1,
      .home-post-masonry-lg h2,
      .home-post-masonry-lg h3,
      .home-post-masonry-lg .card-title,
      .home-post-masonry-lg .post-title,
      .home-post-masonry-lg .project-title {
        font-size: 1.42rem !important;
        line-height: 1.3 !important;
      }

      .home-post-masonry-md h1,
      .home-post-masonry-md h2,
      .home-post-masonry-md h3,
      .home-post-masonry-md .card-title,
      .home-post-masonry-md .post-title,
      .home-post-masonry-md .project-title {
        font-size: 1.28rem !important;
        line-height: 1.32 !important;
      }

      .home-post-masonry-sm h1,
      .home-post-masonry-sm h2,
      .home-post-masonry-sm h3,
      .home-post-masonry-sm .card-title,
      .home-post-masonry-sm .post-title,
      .home-post-masonry-sm .project-title {
        font-size: 1.22rem !important;
        line-height: 1.32 !important;
      }

      /*
        熱門文章描述文字可以多一點呼吸感。
      */

      .home-post-masonry-xl p,
      .home-post-masonry-xl .description,
      .home-post-masonry-xl .excerpt,
      .home-post-masonry-xl .card-text {
        font-size: 1.02rem !important;
        line-height: 1.75 !important;
      }

      .home-post-masonry-lg p,
      .home-post-masonry-lg .description,
      .home-post-masonry-lg .excerpt,
      .home-post-masonry-lg .card-text {
        font-size: 0.98rem !important;
        line-height: 1.72 !important;
      }

      /*
        寬螢幕時可以變 3 欄，會更像拼貼牆。
        但如果你的內容區本身不夠寬，會自動維持 2 欄。
      */

      @media (min-width: 1240px) {
        .home-post-masonry-grid {
          column-count: 3 !important;
        }

        .home-post-masonry-xl {
          /*
            CSS columns 無法真正跨欄，但可以透過內容高度與視覺比例讓熱門卡更醒目。
            這樣反而能避免 CSS grid 的大空洞問題。
          */
        }
      }

      @media (max-width: 980px) {
        .home-post-masonry-grid {
          column-count: 2 !important;
        }
      }

      @media (max-width: 640px) {
        .home-post-masonry-grid {
          column-count: 1 !important;
        }

        .home-post-masonry-card {
          margin-bottom: 1.25rem !important;
        }

        .home-post-masonry-card img {
          aspect-ratio: 16 / 9 !important;
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
      console.warn("首頁沒有找到可套用 Masonry 排版的最新文章卡片");
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

    applyMasonryLayout(itemsWithViews);
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
