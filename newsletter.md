---
layout: page
title: 電子報
permalink: /newsletter/
description: 守夜人桌遊社電子報
---

<style>
  .flipbook-wrap {
    width: 100%;
    overflow-x: auto;
    display: flex;
    justify-content: center;
    padding: 1rem 0 2rem;
  }

  #flipbook {
    width: 900px;
    height: 650px;
  }

  #flipbook .page {
    background: white;
  }

  #flipbook canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  .pdf-actions {
    text-align: center;
    margin-bottom: 1rem;
  }

  @media (max-width: 768px) {
    #flipbook {
      width: 320px;
      height: 460px;
    }
  }
</style>

<div class="pdf-actions">
  <a href="/assets/newsletter/2025_05_08/2025-05~08.pdf" target="_blank" rel="noopener">
    開啟 PDF 原檔
  </a>
</div>

<div class="flipbook-wrap">
  <div id="flipbook"></div>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="/assets/vendor/turn.min.js"></script>

<script type="module">
  import * as pdfjsLib from "https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.min.mjs";

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs";

  const pdfUrl = "/assets/newsletter/2025_05_08/2025-05~08.pdf";
  const flipbook = document.getElementById("flipbook");

  async function renderPdfToFlipbook() {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);

      // 提高 scale，讓文字更清楚
      const scale = window.innerWidth < 768 ? 1.8 : 2.2;
      const viewport = page.getViewport({ scale });

      const pageDiv = document.createElement("div");
      pageDiv.className = "page";

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      // HiDPI 支援
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const transform =
        outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      pageDiv.appendChild(canvas);
      flipbook.appendChild(pageDiv);

      await page.render({
        canvasContext: context,
        viewport,
        transform
      }).promise;
    }

    $("#flipbook").turn({
      width: window.innerWidth < 768 ? 320 : 900,
      height: window.innerWidth < 768 ? 460 : 650,
      autoCenter: true,
      display: window.innerWidth < 768 ? "single" : "double",
      gradients: true,
      acceleration: true
    });
  }

  renderPdfToFlipbook();
</script>
