---
layout: page
title: 電子報
permalink: /newsletter/
description: 守夜人桌遊社電子報
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

  .flipbook-controls {
    text-align: center;
    margin-bottom: 1rem;
  }

  .flipbook-controls button {
    margin: 0 8px;
    padding: 6px 14px;
    cursor: pointer;
  }

  /* 保留原本可橫向捲動，但把書本起始位置往右挪 */
  .flipbook-wrap {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
    justify-content: flex-start;
    padding: 0.5rem 0 1.5rem 150px;
    box-sizing: border-box;
  }

  #flipbook {
    margin: 0;
    max-width: 100%;
  }

  #flipbook .page {
    background: white;
    overflow: hidden;
    position: relative;
    user-select: none;
    -webkit-user-select: none;
  }

  #flipbook .page img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-user-drag: none;
  }

  .mobile-tip {
    display: none;
    text-align: center;
    margin: 1rem 0;
  }

  @media (max-width: 768px) {
    .flipbook-wrap {
      display: none;
    }

    .flipbook-controls {
      display: none;
    }

    .mobile-tip {
      display: block;
    }
  }
</style>

<div class="pdf-actions">
  <a href="/assets/newsletter/2025_05_08/2025-05~08.pdf" target="_blank" rel="noopener">
    開啟 PDF 原檔
  </a>
  <div class="pdf-note">
    -- 若書本太小，可自行調整瀏覽器縮放大小 --
  </div>
</div>

<div class="flipbook-controls">
  <button id="prev-page">上一頁</button>
  <span id="page-num">第 1 頁</span>
  <button id="next-page">下一頁</button>
</div>

<div class="mobile-tip">
  手機閱讀建議直接點上方 PDF，可放大查看內容。
</div>

<div class="flipbook-wrap">
  <div id="flipbook"></div>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="/assets/vendor/turn.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>

<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

  const pdfUrl = "/assets/newsletter/2025_05_08/2025-05~08.pdf";

  // 單頁比例：寬 600、高 850
  const PAGE_RATIO = 850 / 600;

  let resizeTimer = null;

  function widenNewsletterLayout() {
    // 保留你原本的架構：只針對這個頁面把右側內容區撐寬
    document.body.classList.add("newsletter-page");

    const selectors = [
      "main#_main",
      "main.content",
      "article.page",
      ".content",
      ".page-content",
      ".post-content"
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.maxWidth = "1700px";
        el.style.width = "100%";
      });
    });
  }

  function getAvailableWidth() {
    const wrap = document.querySelector(".flipbook-wrap");
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      if (rect.width > 0) {
        // 扣掉左側 padding，避免書本算太大後又壓回 sidebar
        return rect.width - 120;
      }
    }

    // 備援：直接用視窗寬度扣 sidebar / 邊界
    return Math.max(760, window.innerWidth - 600);
  }

  function getFlipbookSize() {
    const availableWidth = Math.min(getAvailableWidth(), 1500);

    // 書本寬度上下限
    const bookWidth = Math.max(760, Math.min(availableWidth, 1350));
    const pageWidth = Math.floor(bookWidth / 2);
    const pageHeight = Math.floor(pageWidth * PAGE_RATIO);

    return {
      bookWidth,
      bookHeight: pageHeight,
      pageWidth,
      pageHeight
    };
  }

  async function renderPdfToFlipbook() {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const flipbook = document.getElementById("flipbook");

      if ($("#flipbook").data("turn")) {
        $("#flipbook").turn("destroy");
      }

      flipbook.innerHTML = "";

      const size = getFlipbookSize();

      flipbook.style.width = size.bookWidth + "px";
      flipbook.style.height = size.bookHeight + "px";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        const scale = 2.0;
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const imgData = canvas.toDataURL("image/png");

        const pageDiv = document.createElement("div");
        pageDiv.className = "page";
        pageDiv.style.width = size.pageWidth + "px";
        pageDiv.style.height = size.pageHeight + "px";

        const img = document.createElement("img");
        img.src = imgData;
        img.alt = "電子報第 " + i + " 頁";
        img.draggable = false;

        pageDiv.appendChild(img);
        flipbook.appendChild(pageDiv);
      }

      $("#flipbook").turn({
        width: size.bookWidth,
        height: size.bookHeight,
        autoCenter: false,
        display: "double",
        gradients: true,
        elevation: 50,
        when: {
          turned: function(event, page) {
            document.getElementById("page-num").textContent = "第 " + page + " 頁";
          }
        }
      });

      document.getElementById("prev-page").onclick = function() {
        $("#flipbook").turn("previous");
      };

      document.getElementById("next-page").onclick = function() {
        $("#flipbook").turn("next");
      };

    } catch (err) {
      console.error("PDF render failed:", err);
      document.getElementById("flipbook").innerHTML =
        "<p style='color:red; text-align:center;'>電子報載入失敗，請查看 Console。</p>";
    }
  }

  function initNewsletter() {
    widenNewsletterLayout();

    if (window.innerWidth > 768) {
      renderPdfToFlipbook();
    }
  }

  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 768) {
        renderPdfToFlipbook();
      }
    }, 300);
  });

  document.addEventListener("DOMContentLoaded", function () {
    initNewsletter();
  });
</script>
