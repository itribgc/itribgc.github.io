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
  let resizeTimer = null;
  let lastItemsWithViews = [];

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
      parent.classList.remove(
        "home-post-bento-grid",
        "home-post-masonry-grid",
        "home-post-js-masonry"
      );

      parent.style.position = "";
      parent.style.height = "";
      parent.style.width = "";
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
        "home-post-masonry-sm",
        "home-post-js-card",
        "home-post-js-xl",
        "home-post-js-lg",
        "home-post-js-md",
        "home-post-js-sm"
      );

      item.card.style.position = "";
      item.card.style.left = "";
      item.card.style.top = "";
      item.card.style.width = "";
      item.card.style.margin = "";
      item.card.style.transform = "";
      item.card.style.order = "";
      item.card.dataset.viewCount = "";
    });
  }

  function injectStyles() {
    const oldStyle = document.getElementById("homePostBentoStyle");
    if (oldStyle) oldStyle.remove();

    const style = document.createElement("style");
    style.id = "homePostBentoStyle";
    style.innerHTML = `
      /*
        最新文章 JS Masonry 版
        - 整個區塊吃滿寬度，盡量跟上方輪播橫幅對齊
        - 桌機以 2 欄大卡為主
        - 熱門文章只增加視覺份量，不把其他文章壓小
        - 用 JS 計算欄位高度，避免中間大空洞
      */

      .home-post-js-masonry {
        position: relative !important;
        display: block !important;
        width: 100% !important;
        max-width: none !important;
        box-sizing: border-box !important;
      }

      .home-post-js-card {
        position: absolute !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        transition:
          top 0.24s ease,
          left 0.24s ease,
          transform 0.2s ease,
          box-shadow 0.2s ease,
          border-color 0.2s ease;
      }

      .home-post-js-card:hover {
        transform: translateY(-4px);
      }

      .home-post-js-card img {
        width: 100% !important;
        display: block !important;
        object-fit: cover !important;
        height: auto !important;
      }

      .home-post-js-xl img {
        aspect-ratio: 16 / 10 !important;
      }

      .home-post-js-lg img {
        aspect-ratio: 16 / 9.5 !important;
      }

      .home-post-js-md img,
      .home-post-js-sm img {
        aspect-ratio: 16 / 9 !important;
      }

      .home-post-js-xl h1,
      .home-post-js-xl h2,
      .home-post-js-xl h3,
      .home-post-js-xl .card-title,
      .home-post-js-xl .post-title,
      .home-post-js-xl .project-title {
        font-size: 1.48rem !important;
        line-height: 1.3 !important;
      }

      .home-post-js-lg h1,
      .home-post-js-lg h2,
      .home-post-js-lg h3,
      .home-post-js-lg .card-title,
      .home-post-js-lg .post-title,
      .home-post-js-lg .project-title {
        font-size: 1.38rem !important;
        line-height: 1.3 !important;
      }

      .home-post-js-md h1,
      .home-post-js-md h2,
      .home-post-js-md h3,
      .home-post-js-md .card-title,
      .home-post-js-md .post-title,
      .home-post-js-md .project-title,
      .home-post-js-sm h1,
      .home-post-js-sm h2,
      .home-post-js-sm h3,
      .home-post-js-sm .card-title,
      .home-post-js-sm .post-title,
      .home-post-js-sm .project-title {
        font-size: 1.26rem !important;
        line-height: 1.32 !important;
      }

      .home-post-js-xl p,
      .home-post-js-xl .description,
      .home-post-js-xl .excerpt,
      .home-post-js-xl .card-text {
        font-size: 1.02rem !important;
        line-height: 1.75 !important;
      }

      .home-post-js-lg p,
      .home-post-js-lg .description,
      .home-post-js-lg .excerpt,
      .home-post-js-lg .card-text {
        font-size: 0.98rem !important;
        line-height: 1.72 !important;
      }

      @media (max-width: 640px) {
        .home-post-js-masonry {
          height: auto !important;
        }

        .home-post-js-card {
          position: static !important;
          width: 100% !important;
          margin-bottom: 1.25rem !important;
        }

        .home-post-js-card img {
          aspect-ratio: 16 / 9 !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getColumnCount(containerWidth) {
    /*
      這裡刻意不要切太多欄：
      你的首頁輪播約是寬版橫幅，所以最新文章也盡量維持大卡片感。
    */
    if (containerWidth < 641) return 1;
    if (containerWidth < 1320) return 2;
    return 3;
  }

  function getCardClass(index, viewCount) {
    if (index === 0 && viewCount > 0) return "home-post-js-xl";
    if (index === 1 && viewCount > 0) return "home-post-js-lg";
    if (index <= 3 && viewCount > 0) return "home-post-js-md";
    return "home-post-js-sm";
  }

  function waitForImages(parent) {
    const images = Array.from(parent.querySelectorAll("img"));

    if (!images.length) {
      return Promise.resolve();
    }

    const promises = images.map(function (img) {
      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise(function (resolve) {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    });

    return Promise.all(promises);
  }

  function applyJsMasonryLayout(itemsWithViews) {
    if (!itemsWithViews.length) return;

    const parent = findCardsParent(itemsWithViews);

    if (!parent) {
      console.warn("首頁最新文章卡片不是同一個父層，無法套用 JS Masonry");
      return;
    }

    clearOldLayout(itemsWithViews);

    parent.classList.add("home-post-js-masonry");

    const containerWidth = parent.clientWidth;
    const gap = 28;
    const columnCount = getColumnCount(containerWidth);

    if (columnCount === 1) {
      parent.style.height = "";

      itemsWithViews.forEach(function (item) {
        item.card.classList.add("home-post-js-card", "home-post-js-sm");
        item.card.style.position = "static";
        item.card.style.width = "100%";
        item.card.style.marginBottom = "1.25rem";
      });

      return;
    }

    const sorted = itemsWithViews.slice().sort(function (a, b) {
      return b.viewCount - a.viewCount;
    });

    const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
    const columnHeights = new Array(columnCount).fill(0);

    sorted.forEach(function (item, index) {
      const card = item.card;
      const visualClass = getCardClass(index, item.viewCount);

      card.classList.add("home-post-js-card", visualClass);
      card.dataset.viewCount = String(item.viewCount);

      card.style.position = "absolute";
      card.style.width = columnWidth + "px";
      card.style.left = "0px";
      card.style.top = "0px";
      card.style.margin = "0";

      /*
        先放進排版流以取得正確高度。
        等下一個 frame 量測會比較穩。
      */
    });

    requestAnimationFrame(function () {
      sorted.forEach(function (item) {
        const card = item.card;

        let targetColumn = 0;

        for (let i = 1; i < columnHeights.length; i++) {
          if (columnHeights[i] < columnHeights[targetColumn]) {
            targetColumn = i;
          }
        }

        const left = targetColumn * (columnWidth + gap);
        const top = columnHeights[targetColumn];

        card.style.left = left + "px";
        card.style.top = top + "px";
        card.style.width = columnWidth + "px";

        const rect = card.getBoundingClientRect();
        const cardHeight = rect.height;

        columnHeights[targetColumn] += cardHeight + gap;
      });

      const maxHeight = Math.max.apply(null, columnHeights);
      parent.style.height = Math.max(maxHeight - gap, 0) + "px";
    });
  }

  async function renderBentoLayout() {
    if (!isHomePage()) return;
    if (!currentUser) return;

    injectStyles();

    const items = findHomePostCards();

    if (!items.length) {
      console.warn("首頁沒有找到可套用 JS Masonry 排版的最新文章卡片");
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

    lastItemsWithViews = itemsWithViews;

    const parent = findCardsParent(itemsWithViews);

    if (parent) {
      await waitForImages(parent);
    }

    applyJsMasonryLayout(itemsWithViews);

    /*
      部分主題圖片 lazy load 或字型載入後高度會改變，
      再補排幾次讓版面貼合。
    */
    setTimeout(function () {
      applyJsMasonryLayout(lastItemsWithViews);
    }, 350);

    setTimeout(function () {
      applyJsMasonryLayout(lastItemsWithViews);
    }, 1000);
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

  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(function () {
      if (lastItemsWithViews.length) {
        applyJsMasonryLayout(lastItemsWithViews);
      }
    }, 220);
  });

  const pushStateEl = document.querySelector("hy-push-state");

  if (pushStateEl) {
    pushStateEl.addEventListener("load", scheduleRender);
  }
})();
