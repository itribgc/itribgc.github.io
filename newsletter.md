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

  .flipbook-wrap {
    width: 100%;
    overflow-x: auto;
    display: flex;
    justify-content: center;
    padding: 1rem 0 2rem;
  }

  #flipbook {
    width: 920px;
    height: 650px;
    margin: 0 auto;
  }

  #flipbook .page {
    background: white;
    overflow: hidden;
  }

  #flipbook canvas {
    display: block;
    width: 100%;
    height: 100%;
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

    .mobile-tip {
      display: block;
    }
  }
</style>

<div class="pdf-actions">
  <a href="/assets/newsletter/2025_05_08/2025-05~08.pdf" target="_blank" rel="noopener">
    開啟 PDF 原檔
  </a>
</div>

<div class="mobile-tip">
  手機閱讀建議直接開啟上方 PDF，可放大查看內容。
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

  async function renderPdfToFlipbook() {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const flipbook = document.getElementById("flipbook");

      // 先清空
      flipbook.innerHTML = "";

      // 先 render 所有頁
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        // 桌機顯示比例
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });

        const pageDiv = document.createElement("div");
        pageDiv.className = "page";

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        pageDiv.style.width = "460px";
        pageDiv.style.height = "650px";

        pageDiv.appendChild(canvas);
        flipbook.appendChild(pageDiv);

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      }

      // 所有頁畫完之後再初始化 turn.js
      $("#flipbook").turn({
        width: 920,
        height: 650,
        autoCenter: true,
        display: "double",
        gradients: true,
        elevation: 50
      });

    } catch (err) {
      console.error("PDF render failed:", err);
      document.getElementById("flipbook").innerHTML =
        "<p style='color:red; text-align:center;'>電子報載入失敗，請查看 Console。</p>";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (window.innerWidth > 768) {
      renderPdfToFlipbook();
    }
  });
</script>
