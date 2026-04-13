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
    display: flex;
    justify-content: center;
    padding: 1rem 0 2rem;
  }

  #flipbook {
    width: 920px;
    height: 650px;
  }

  #flipbook .page {
    background: white;
    width: 460px;
    height: 650px;
  }

  #flipbook .page img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* 手機閱讀模式 */
  .mobile-reader {
    display: none;
    padding: 0 10px;
  }

  .mobile-reader img {
    width: 100%;
    height: auto;
    margin-bottom: 12px;
  }

  @media (max-width: 768px) {

    .flipbook-wrap,
    .flipbook-controls {
      display: none;
    }

    .mobile-reader {
      display: block;
    }
  }
</style>

<div class="pdf-actions">
  <a href="/assets/newsletter/2025_05_08/2025-05~08.pdf" target="_blank">
    開啟 PDF 原檔
  </a>
  <div class="pdf-note">
    若電子書文字過小，可自行調整網頁縮放查看
  </div>
</div>

<div class="flipbook-controls">
  <button id="prev-page">上一頁</button>
  <span id="page-num">第 1 頁</span>
  <button id="next-page">下一頁</button>
</div>

<!-- 桌機 flipbook -->
<div class="flipbook-wrap">
  <div id="flipbook"></div>
</div>

<!-- 手機閱讀模式 -->
<div class="mobile-reader" id="mobile-reader"></div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="/assets/vendor/turn.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>

<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

  const pdfUrl = "/assets/newsletter/2025_05_08/2025-05~08.pdf";

  async function renderDesktop(pdf) {
    const flipbook = document.getElementById("flipbook");
    flipbook.innerHTML = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      const img = document.createElement("img");
      img.src = canvas.toDataURL();

      const div = document.createElement("div");
      div.className = "page";
      div.appendChild(img);

      flipbook.appendChild(div);
    }

    $("#flipbook").turn({
      width: 920,
      height: 650,
      display: "double",
      autoCenter: true
    });

    document.getElementById("prev-page").onclick = () => {
      $("#flipbook").turn("previous");
    };

    document.getElementById("next-page").onclick = () => {
      $("#flipbook").turn("next");
    };
  }

  async function renderMobile(pdf) {
    const container = document.getElementById("mobile-reader");
    container.innerHTML = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      const img = document.createElement("img");
      img.src = canvas.toDataURL();

      container.appendChild(img);
    }
  }

  async function init() {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    if (window.innerWidth <= 768) {
      renderMobile(pdf);
    } else {
      renderDesktop(pdf);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
</script>
