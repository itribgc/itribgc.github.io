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

  async function renderPdfToFlipbook() {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const flipbook = document.getElementById("flipbook");

      flipbook.innerHTML = "";

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

        const img = document.createElement("img");
        img.src = imgData;
        img.alt = "電子報第 " + i + " 頁";

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
            document.getElementById("page-num").textContent = "第 " + page + " 頁";
          }
        }
      });

      document.getElementById("prev-page").addEventListener("click", function() {
        $("#flipbook").turn("previous");
      });

      document.getElementById("next-page").addEventListener("click", function() {
        $("#flipbook").turn("next");
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
