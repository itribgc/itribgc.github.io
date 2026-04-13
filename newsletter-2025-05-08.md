---
layout: page
title: 電子報
permalink: /newsletter-2025-05-08/
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

  .flipbook-wrap {
    width: 100%;
    overflow-x: auto;
    display: flex;
    justify-content: center;
    padding: 1rem 0 2rem;
    box-sizing: border-box;
  }

  #flipbook {
    margin: 0 auto;
  }

  #flipbook .page {
    background: white;
    overflow: hidden;
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
      padding: 0.5rem 0 1rem;
    }

    .flipbook-controls {
      margin-bottom: 0.75rem;
    }

    .flipbook-controls button {
      padding: 6px 10px;
      margin: 0 4px;
      font-size: 0.95rem;
    }

    .pdf-note {
      font-size: 0.8rem;
      line-height: 1.5;
      padding: 0 12px;
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
    若電子書文字過小，可自行調整網頁縮放查看
  </div>
</div>

<div class="flipbook-controls">
  <button id="prev-page">上一頁</button>
  <span id="page-num">第 0 頁</span>
  <button id="next-page">下一頁</button>
</div>

<div class="mobile-tip">
  手機版為單頁翻頁顯示。
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
  let resizeTimer = null;

  function getBookConfig() {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      return {
        width: 320,
        height: 453,
        pageWidth: 320,
        pageHeight: 453,
        display: "single"
      };
    }

    return {
      width: 920,
      height: 650,
      pageWidth: 460,
      pageHeight: 650,
      display: "double"
    };
  }

  async function renderPdfToFlipbook() {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const flipbook = document.getElementById("flipbook");
      const config = getBookConfig();

      if ($("#flipbook").data("turn")) {
        $("#flipbook").turn("destroy");
      }

      flipbook.innerHTML = "";
      flipbook.style.width = config.width + "px";
      flipbook.style.height = config.height + "px";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        const scale = window.innerWidth <= 768 ? 1.5 : 2.0;
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
        pageDiv.style.width = config.pageWidth + "px";
        pageDiv.style.height = config.pageHeight + "px";

        const img = document.createElement("img");
        img.src = imgData;
        img.alt = "電子報第 " + i + " 頁";
        img.draggable = false;

        pageDiv.appendChild(img);
        flipbook.appendChild(pageDiv);
      }

      $("#flipbook").turn({
        width: config.width,
        height: config.height,
        autoCenter: true,
        display: config.display,
        gradients: true,
        elevation: 50,
        when: {
          turned: function(event, page) {
            document.getElementById("page-num").textContent = "第 " + (page - 1) + " 頁";
          }
        }
      });

      document.getElementById("page-num").textContent = "第 0 頁";

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

  document.addEventListener("DOMContentLoaded", function () {
    renderPdfToFlipbook();
  });

  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderPdfToFlipbook();
    }, 300);
  });
</script>
