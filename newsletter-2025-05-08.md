---
layout: page
title: 電子報
permalink: /newsletter-2025-05-08/
description: 守夜人桌遊社電子報 2025.05.08
---

<style>
  .pdf-actions {
    text-align: center;
    margin-bottom: 1rem;
  }

  .pdf-note {
    font-size: 0.9rem;
    color: #aaa;
    margin-top: 6px;
  }

  .desktop-controls,
  .mobile-controls {
    text-align: center;
    margin-bottom: 1rem;
  }

  .desktop-controls button,
  .mobile-controls button {
    margin: 0 8px;
    padding: 6px 14px;
    cursor: pointer;
  }

  /* ===== 桌機雙頁閱讀器 ===== */
  .desktop-reader-wrap {
    display: block;
    width: 100%;
    padding: 1rem 0 2rem;
    box-sizing: border-box;
  }

  .desktop-book {
    width: min(1100px, 100%);
    margin: 0 auto;
    display: flex;
    justify-content: center;
  }

  .desktop-book-spread {
    display: flex;
    width: min(980px, 100%);
    aspect-ratio: 2 / 1.42;
    background: transparent;
    gap: 0;
    position: relative;
    perspective: 1800px;
  }

  .desktop-page {
    width: 50%;
    height: 100%;
    background: white;
    overflow: hidden;
    position: relative;
    box-shadow: 0 4px 18px rgba(0,0,0,0.12);
  }

  .desktop-page img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    user-select: none;
    -webkit-user-select: none;
    -webkit-user-drag: none;
    pointer-events: none;
  }

  .desktop-page-empty {
    width: 100%;
    height: 100%;
    background: white;
  }

  .desktop-page.left {
    border-right: 1px solid rgba(0,0,0,0.08);
  }

  .desktop-page.right {
    border-left: 1px solid rgba(0,0,0,0.05);
  }

  /* 翻頁動畫層 */
  .desktop-flip-overlay {
    position: absolute;
    top: 0;
    width: 50%;
    height: 100%;
    transform-style: preserve-3d;
    pointer-events: none;
    z-index: 20;
    display: none;
  }

  .desktop-flip-overlay img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: white;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  }

  .desktop-flip-overlay.flip-next {
    right: 0;
    transform-origin: left center;
  }

  .desktop-flip-overlay.flip-prev {
    left: 0;
    transform-origin: right center;
  }

  .desktop-flip-overlay.animating-next {
    display: block;
    animation: desktopPageFlipNext 0.55s ease forwards;
  }

  .desktop-flip-overlay.animating-prev {
    display: block;
    animation: desktopPageFlipPrev 0.55s ease forwards;
  }

  @media (min-width: 769px) {
    .mobile-controls {
      display: none;
    }
  }

  @keyframes desktopPageFlipNext {
    0% {
      transform: rotateY(0deg);
      opacity: 1;
    }
    100% {
      transform: rotateY(-180deg);
      opacity: 0.98;
    }
  }

  @keyframes desktopPageFlipPrev {
    0% {
      transform: rotateY(0deg);
      opacity: 1;
    }
    100% {
      transform: rotateY(180deg);
      opacity: 0.98;
    }
  }

  /* ===== 手機單頁閱讀器 ===== */
  .mobile-reader-wrap {
    display: none;
    width: 100%;
    padding: 0.5rem 0 1rem;
    box-sizing: border-box;
  }

  .mobile-reader-frame {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    background: white;
    overflow: hidden;
    touch-action: pan-y pinch-zoom;
    border-radius: 8px;
  }

  .mobile-reader-stage {
    width: 100%;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
  }

  .mobile-reader-stage img {
    display: block;
    width: 100%;
    height: auto;
    user-select: none;
    -webkit-user-select: none;
    -webkit-user-drag: none;
  }

  .mobile-loading {
    color: #888;
    font-size: 0.95rem;
    padding: 2rem 1rem;
    text-align: center;
  }

  .mobile-tip {
    display: none;
    text-align: center;
    margin: 0.5rem 0 1rem;
    color: #888;
    font-size: 0.9rem;
    line-height: 1.6;
    padding: 0 12px;
  }

  @media (max-width: 768px) {
    .desktop-reader-wrap,
    .desktop-controls {
      display: none;
    }

    .mobile-reader-wrap,
    .mobile-tip {
      display: block;
    }

    .mobile-controls button {
      padding: 6px 10px;
      margin: 0 4px;
      font-size: 0.95rem;
    }

    .pdf-note {
      font-size: 0.8rem;
      line-height: 1.5;
      padding: 0 12px;
    }
  }
</style>

<div class="pdf-actions">
  <a href="/assets/newsletter/2025_05_08/2025-05~08.pdf" target="_blank" rel="noopener">
    開啟 PDF 原檔
  </a>
  <div class="pdf-note">
    若電子書文字過小，可自行調整網頁縮放查看
  </div>
</div>

<div class="desktop-controls">
  <button id="prev-page-desktop">上一頁</button>
  <span id="page-num-desktop">第 0 頁</span>
  <button id="next-page-desktop">下一頁</button>
</div>

<div class="mobile-controls">
  <button id="prev-page-mobile">上一頁</button>
  <span id="page-num-mobile">第 0 頁</span>
  <button id="next-page-mobile">下一頁</button>
</div>

<div class="mobile-tip">
  手機版可左右滑動切頁；若文字過小，可直接使用瀏覽器縮放查看。
</div>

<!-- 桌機雙頁閱讀器 -->
<div class="desktop-reader-wrap">
  <div class="desktop-book">
    <div class="desktop-book-spread" id="desktop-book-spread">
      <div class="desktop-page left" id="desktop-left-page"></div>
      <div class="desktop-page right" id="desktop-right-page"></div>

      <div class="desktop-flip-overlay flip-next" id="desktop-flip-next"></div>
      <div class="desktop-flip-overlay flip-prev" id="desktop-flip-prev"></div>
    </div>
  </div>
</div>

<!-- 手機單頁閱讀器 -->
<div class="mobile-reader-wrap">
  <div class="mobile-reader-frame">
    <div class="mobile-reader-stage" id="mobile-reader-stage">
      <div class="mobile-loading">載入中...</div>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>

<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

  const pdfUrl = "/assets/newsletter/2025_05_08/2025-05~08.pdf";

  let pdfDoc = null;
  let pageCache = new Map();

  let mobileCurrentPage = 1;

  // 1 => [封面, 空白]
  // 2 => [PDF第2頁, PDF第3頁] => 顯示第1–2頁
  // 4 => [PDF第4頁, PDF第5頁] => 顯示第3–4頁
  let desktopSpreadStart = 1;
  let desktopAnimating = false;

  function isMobileView() {
    return window.innerWidth <= 768;
  }

  async function getPdfDoc() {
    if (pdfDoc) return pdfDoc;
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    pdfDoc = await loadingTask.promise;
    return pdfDoc;
  }

  async function renderPageToDataUrl(pageNumber, scale) {
    const cacheKey = `${pageNumber}@${scale}`;
    if (pageCache.has(cacheKey)) {
      return pageCache.get(cacheKey);
    }

    const pdf = await getPdfDoc();
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      return null;
    }

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    const dataUrl = canvas.toDataURL("image/png");
    pageCache.set(cacheKey, dataUrl);
    return dataUrl;
  }

  function buildDesktopPageContent(imgSrc, altText) {
    if (!imgSrc) {
      return '<div class="desktop-page-empty"></div>';
    }
    return `<img src="${imgSrc}" alt="${altText}">`;
  }

  async function updateDesktopPageText(startPage) {
    const pdf = await getPdfDoc();
    const pageText = document.getElementById("page-num-desktop");

    // 封面
    if (startPage === 1) {
      pageText.textContent = "第 0 頁";
      return;
    }

    // 以顯示頁碼 = PDF頁碼 - 1
    const left = startPage - 1;
    const rightPdfPage = startPage + 1;

    if (rightPdfPage > pdf.numPages) {
      pageText.textContent = "第 " + left + " 頁";
    } else {
      const right = rightPdfPage - 1;
      pageText.textContent = "第 " + left + "–" + right + " 頁";
    }
  }

  async function updateMobilePageText(pageNumber) {
    const pageText = document.getElementById("page-num-mobile");

    // 手機是單頁，所以只顯示單頁頁碼
    // 封面 PDF第1頁 => 第0頁
    pageText.textContent = "第 " + (pageNumber - 1) + " 頁";
  }

  async function getDesktopSpreadImages(startPage) {
    const pdf = await getPdfDoc();

    if (startPage === 1) {
      const cover = await renderPageToDataUrl(1, 2.0);
      return {
        leftImg: cover,
        leftPageNum: 1,
        rightImg: null,
        rightPageNum: null
      };
    }

    const leftPageNum = startPage;
    const rightPageNum = startPage + 1 <= pdf.numPages ? startPage + 1 : null;

    const [leftImg, rightImg] = await Promise.all([
      renderPageToDataUrl(leftPageNum, 2.0),
      rightPageNum ? renderPageToDataUrl(rightPageNum, 2.0) : Promise.resolve(null)
    ]);

    return {
      leftImg,
      leftPageNum,
      rightImg,
      rightPageNum
    };
  }

  async function renderDesktopSpread(startPage) {
    const spread = await getDesktopSpreadImages(startPage);

    const left = document.getElementById("desktop-left-page");
    const right = document.getElementById("desktop-right-page");

    left.innerHTML = buildDesktopPageContent(
      spread.leftImg,
      spread.leftPageNum ? `電子報第 ${spread.leftPageNum} 頁` : ""
    );

    right.innerHTML = buildDesktopPageContent(
      spread.rightImg,
      spread.rightPageNum ? `電子報第 ${spread.rightPageNum} 頁` : ""
    );

    desktopSpreadStart = startPage;
    await updateDesktopPageText(startPage);
    preloadDesktopNeighbors(startPage);
  }

  async function preloadDesktopNeighbors(startPage) {
    const pdf = await getPdfDoc();
    const targets = [];

    if (startPage === 1) {
      if (pdf.numPages >= 2) {
        targets.push(2, 3);
      }
    } else {
      const prevStart = startPage === 2 ? 1 : startPage - 2;
      const nextStart = startPage + 2;

      targets.push(prevStart);
      targets.push(prevStart + 1);
      targets.push(nextStart);
      targets.push(nextStart + 1);
    }

    targets.forEach(async (p) => {
      if (p >= 1 && p <= pdf.numPages) {
        try {
          await renderPageToDataUrl(p, 2.0);
        } catch (e) {
          console.warn("Desktop preload failed:", p, e);
        }
      }
    });
  }

  async function goDesktopNext() {
    if (desktopAnimating) return;

    const pdf = await getPdfDoc();
    let nextStart;

    if (desktopSpreadStart === 1) {
      nextStart = 2;
    } else {
      nextStart = desktopSpreadStart + 2;
    }

    if (nextStart > pdf.numPages) return;

    desktopAnimating = true;

    const currentSpread = await getDesktopSpreadImages(desktopSpreadStart);
    const overlay = document.getElementById("desktop-flip-next");

    overlay.innerHTML = buildDesktopPageContent(
      currentSpread.rightImg || currentSpread.leftImg,
      "翻頁動畫"
    );
    overlay.classList.remove("animating-prev");
    overlay.classList.add("animating-next");

    overlay.addEventListener("animationend", async function handler() {
      overlay.classList.remove("animating-next");
      overlay.innerHTML = "";
      overlay.removeEventListener("animationend", handler);

      await renderDesktopSpread(nextStart);
      desktopAnimating = false;
    }, { once: true });
  }

  async function goDesktopPrev() {
    if (desktopAnimating) return;

    let prevStart;

    if (desktopSpreadStart === 1) return;
    if (desktopSpreadStart === 2) {
      prevStart = 1;
    } else {
      prevStart = desktopSpreadStart - 2;
    }

    desktopAnimating = true;

    const currentSpread = await getDesktopSpreadImages(desktopSpreadStart);
    const overlay = document.getElementById("desktop-flip-prev");

    overlay.innerHTML = buildDesktopPageContent(
      currentSpread.leftImg,
      "翻頁動畫"
    );
    overlay.classList.remove("animating-next");
    overlay.classList.add("animating-prev");

    overlay.addEventListener("animationend", async function handler() {
      overlay.classList.remove("animating-prev");
      overlay.innerHTML = "";
      overlay.removeEventListener("animationend", handler);

      await renderDesktopSpread(prevStart);
      desktopAnimating = false;
    }, { once: true });
  }

  async function initDesktopReader() {
    await renderDesktopSpread(1);

    document.getElementById("prev-page-desktop").onclick = function() {
      goDesktopPrev();
    };

    document.getElementById("next-page-desktop").onclick = function() {
      goDesktopNext();
    };
  }

  async function preloadMobileNeighbors(pageNumber) {
    const pdf = await getPdfDoc();
    const targets = [pageNumber - 1, pageNumber + 1];

    targets.forEach(async (p) => {
      if (p >= 1 && p <= pdf.numPages) {
        try {
          await renderPageToDataUrl(p, 2.2);
        } catch (e) {
          console.warn("Mobile preload failed:", p, e);
        }
      }
    });
  }

  async function renderMobilePage(pageNumber) {
    const pdf = await getPdfDoc();
    if (pageNumber < 1 || pageNumber > pdf.numPages) return;

    mobileCurrentPage = pageNumber;
    await updateMobilePageText(pageNumber);

    const stage = document.getElementById("mobile-reader-stage");
    stage.innerHTML = '<div class="mobile-loading">載入中...</div>';

    try {
      const dataUrl = await renderPageToDataUrl(pageNumber, 2.2);
      const img = document.createElement("img");
      img.src = dataUrl;
      img.alt = "電子報第 " + pageNumber + " 頁";
      img.draggable = false;

      stage.innerHTML = "";
      stage.appendChild(img);

      preloadMobileNeighbors(pageNumber);
    } catch (err) {
      console.error("Mobile page render failed:", err);
      stage.innerHTML = '<div class="mobile-loading">載入失敗，請重新整理頁面。</div>';
    }
  }

  async function initMobileReader() {
    const pdf = await getPdfDoc();

    document.getElementById("prev-page-mobile").onclick = function() {
      if (mobileCurrentPage > 1) {
        renderMobilePage(mobileCurrentPage - 1);
      }
    };

    document.getElementById("next-page-mobile").onclick = function() {
      if (mobileCurrentPage < pdf.numPages) {
        renderMobilePage(mobileCurrentPage + 1);
      }
    };

    renderMobilePage(1);

    const stage = document.getElementById("mobile-reader-stage");
    let touchStartX = 0;
    let touchStartY = 0;
    let isMultiTouch = false;

    stage.addEventListener("touchstart", function(e) {
      if (e.touches.length > 1) {
        isMultiTouch = true;
        return;
      }
      isMultiTouch = false;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    stage.addEventListener("touchend", function(e) {
      if (isMultiTouch) return;
      if (!e.changedTouches || !e.changedTouches.length) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
        if (diffX < 0 && mobileCurrentPage < pdf.numPages) {
          renderMobilePage(mobileCurrentPage + 1);
        } else if (diffX > 0 && mobileCurrentPage > 1) {
          renderMobilePage(mobileCurrentPage - 1);
        }
      }
    }, { passive: true });
  }

  async function init() {
    try {
      await getPdfDoc();

      if (isMobileView()) {
        await initMobileReader();
      } else {
        await initDesktopReader();
      }
    } catch (err) {
      console.error("Init failed:", err);
      const stage = document.getElementById("mobile-reader-stage");
      if (stage) {
        stage.innerHTML = '<div class="mobile-loading">載入失敗，請重新整理頁面。</div>';
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
</script>
