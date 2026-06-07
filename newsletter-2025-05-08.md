---
layout: page
title: 2025 年 05–08 月電子報
permalink: /newsletter-2025-05-08/
description: 守夜人桌遊社電子報 2025.05~08
---

<style>
  .newsletter-reader {
    max-width: 980px;
    margin: 0 auto;
  }

  .newsletter-reader-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .newsletter-reader-header p {
    opacity: 0.8;
    line-height: 1.7;
  }

  .newsletter-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin: 1rem 0;
    flex-wrap: wrap;
  }

  .newsletter-actions a,
  .newsletter-actions button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.18);
    background: transparent;
    color: inherit;
    text-decoration: none;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    line-height: 1.2;
  }

  .newsletter-actions a:hover,
  .newsletter-actions button:hover {
    border-color: rgb(79,177,186);
    text-decoration: none;
  }

  .newsletter-actions button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .newsletter-page-info {
    text-align: center;
    margin: 0.75rem 0 1rem;
    opacity: 0.85;
    font-weight: 700;
  }

  .newsletter-canvas-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 1rem;
    box-sizing: border-box;
    border-radius: 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
  }

  #newsletterCanvas {
    width: 100%;
    max-width: 860px;
    height: auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.22);
  }

  .newsletter-loading {
    text-align: center;
    padding: 2rem 1rem;
    opacity: 0.85;
  }

  .newsletter-error {
    text-align: center;
    padding: 1rem;
    border-radius: 12px;
    background: rgba(255, 120, 120, 0.12);
    border: 1px solid rgba(255, 120, 120, 0.25);
    color: #ffb4a9;
    line-height: 1.7;
  }

  @media (max-width: 720px) {
    .newsletter-canvas-wrap {
      padding: 0.5rem;
    }

    .newsletter-actions {
      gap: 8px;
    }

    .newsletter-actions a,
    .newsletter-actions button {
      padding: 7px 12px;
      font-size: 0.92rem;
    }
  }
</style>

<div class="newsletter-reader">
  <div class="newsletter-reader-header">
    <h1>2025 年 05–08 月電子報</h1>
    <p>使用「上一頁 / 下一頁」切換頁面。若文字太小，也可以直接開啟 PDF 原檔查看。</p>
  </div>

  <div class="newsletter-actions">
    <a href="/newsletter/">返回電子報列表</a>
    <a href="/assets/newsletter/2025_05_08/2025-05~08.pdf" target="_blank" rel="noopener">開啟 PDF 原檔</a>
  </div>

  <div class="newsletter-actions">
    <button id="prevPageBtn" type="button">上一頁</button>
    <button id="nextPageBtn" type="button">下一頁</button>
  </div>

  <div id="pageInfo" class="newsletter-page-info">載入中...</div>

  <div id="readerError" class="newsletter-error" style="display:none;"></div>

  <div class="newsletter-canvas-wrap">
    <canvas id="newsletterCanvas"></canvas>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>

<script>
  const NEWSLETTER_PDF_URL = "/assets/newsletter/2025_05_08/2025-05~08.pdf";

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 0;
  let isRendering = false;

  const canvas = document.getElementById("newsletterCanvas");
  const context = canvas.getContext("2d");
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  const errorBox = document.getElementById("readerError");

  function showError(message) {
    errorBox.style.display = "block";
    errorBox.innerHTML = message;
  }

  function updateControls() {
    pageInfo.textContent = "第 " + currentPage + " / " + totalPages + " 頁";
    prevBtn.disabled = currentPage <= 1 || isRendering;
    nextBtn.disabled = currentPage >= totalPages || isRendering;
  }

  async function renderPage(pageNumber) {
    if (!pdfDoc || isRendering) return;

    try {
      isRendering = true;
      updateControls();

      const page = await pdfDoc.getPage(pageNumber);
      const containerWidth = document.querySelector(".newsletter-canvas-wrap").clientWidth - 24;

      const originalViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(containerWidth / originalViewport.width, 1.8);
      const viewport = page.getViewport({ scale: scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      currentPage = pageNumber;
      isRendering = false;
      updateControls();
    } catch (error) {
      console.error("PDF 頁面渲染失敗：", error);
      isRendering = false;
      showError("PDF 頁面載入失敗，請確認 PDF 檔案路徑是否正確。");
      updateControls();
    }
  }

  async function initNewsletterReader() {
    try {
      pageInfo.textContent = "PDF 載入中...";

      pdfDoc = await pdfjsLib.getDocument(NEWSLETTER_PDF_URL).promise;
      totalPages = pdfDoc.numPages;

      await renderPage(1);
    } catch (error) {
      console.error("PDF 載入失敗：", error);
      pageInfo.textContent = "載入失敗";

      showError(
        "PDF 載入失敗。請檢查檔案是否存在：<br><code>" +
        NEWSLETTER_PDF_URL +
        "</code>"
      );
    }
  }

  prevBtn.addEventListener("click", function () {
    if (currentPage > 1) {
      renderPage(currentPage - 1);
    }
  });

  nextBtn.addEventListener("click", function () {
    if (currentPage < totalPages) {
      renderPage(currentPage + 1);
    }
  });

  window.addEventListener("resize", function () {
    if (pdfDoc && !isRendering) {
      renderPage(currentPage);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft" && currentPage > 1) {
      renderPage(currentPage - 1);
    }

    if (event.key === "ArrowRight" && currentPage < totalPages) {
      renderPage(currentPage + 1);
    }
  });

  document.addEventListener("DOMContentLoaded", initNewsletterReader);
</script>
