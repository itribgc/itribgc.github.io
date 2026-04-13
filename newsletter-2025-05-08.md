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

  .flipbook-wrap {
    width: 100%;
    overflow-x: auto;
    display: flex;
    justify-content: center;
    padding: 1rem 0 2rem;
    box-sizing: border-box;
  }

  #flipbook {
    width: 920px;
    height: 650px;
    margin: 0 auto;
  }

  #flipbook .page {
    background: white;
    overflow: hidden;
    width: 460px;
    height: 650px;
  }

  #flipbook .page img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* 手機單頁閱讀器 */
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
    .flipbook-wrap,
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

<!-- 桌機 flipbook -->
<div class="flipbook-wrap">
  <div id="flipbook"></div>
</div>

<!-- 手機單頁閱讀器 -->
<div class="mobile-reader-wrap">
  <div class="mobile-reader-frame">
    <div class="mobile-reader-stage" id="mobile-reader-stage">
      <div class="mobile-loading">載入中...</div>
    </div>
  </div>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="/assets/vendor/turn.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>

<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

  const pdfUrl = "/assets/newsletter/2025_05_08/2025-05~08.pdf";

  let pdfDoc = null;
  let pageCache = new Map();
  let mobileCurrentPage = 1;
  let desktopInitialized = false;

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

  async function preloadMobileNeighbors(pageNumber) {
    const pdf = await getPdfDoc();
    const targets = [pageNumber - 1, pageNumber + 1];

    targets.forEach(async (p) => {
      if (p >= 1 && p <= pdf.numPages) {
        try {
          await renderPageToDataUrl(p, 2.2);
        } catch (e) {
          console.warn("Preload failed:", p, e);
        }
      }
    });
  }

  function updateMobilePageText(pageNumber) {
    document.getElementById("page-num-mobile").textContent = "第 " + (pageNumber - 1) + " 頁";
  }

  function updateDesktopPageText(pageNumber) {
    document.getElementById("page-num-desktop").textContent = "第 " + (pageNumber - 1) + " 頁";
  }

  async function renderMobilePage(pageNumber) {
    const pdf = await getPdfDoc();
    if (pageNumber < 1 || pageNumber > pdf.numPages) return;

    mobileCurrentPage = pageNumber;
    updateMobilePageText(pageNumber);

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

  async function initDesktopFlipbook() {
    const pdf = await getPdfDoc();
    const flipbook = document.getElementById("flipbook");
    flipbook.innerHTML = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const imgData = await renderPageToDataUrl(i, 2.0);

      const pageDiv = document.createElement("div");
      pageDiv.className = "page";

      const img = document.createElement("img");
      img.src = imgData;
      img.alt = "電子報第 " + i + " 頁";
      img.draggable = false;

      pageDiv.appendChild(img);
      flipbook.appendChild(pageDiv);
    }

    if ($("#flipbook").data("turn")) {
      $("#flipbook").turn("destroy");
    }

    $("#flipbook").turn({
      width: 920,
      height: 650,
      autoCenter: true,
      display: "double",
      gradients: true,
      elevation: 50,
      when: {
        turned: function(event, page) {
          updateDesktopPageText(page);
        }
      }
    });

    updateDesktopPageText(1);

    document.getElementById("prev-page-desktop").onclick = function() {
      $("#flipbook").turn("previous");
    };

    document.getElementById("next-page-desktop").onclick = function() {
      $("#flipbook").turn("next");
    };

    desktopInitialized = true;
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

    // 初始顯示第 1 頁（對應顯示第 0 頁）
    renderMobilePage(1);

    // 左右滑動切頁
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

      // 水平滑動明顯大於垂直才切頁
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
        await initDesktopFlipbook();
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
