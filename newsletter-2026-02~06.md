---
layout: page
title: 2026 年 02–06 月電子報
permalink: /newsletter-2026-02~06/
description: 守夜人桌遊社電子報 2026 年 02~06 月
newsletter_issue: true
newsletter_label: 2026 年 02–06 月
newsletter_sort: 20260206
pdf_url: assets/newsletter/2026_02_06/2026-02~06.pdf
---

<style>
  .newsletter-reader {
    max-width: 1180px;
    width: min(94vw, 1180px);
    margin: 0 auto;
  }

  .newsletter-reader-header {
    margin: 0.35rem 0 0.7rem;
  }

  .newsletter-toolbar,
  .newsletter-pager {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .newsletter-toolbar {
    margin: 0.35rem 0 0.45rem;
  }

  .newsletter-pager {
    margin: 0 0 0.85rem;
  }

  .newsletter-note {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.78;
    font-size: 0.9rem;
    line-height: 1.4;
    margin-right: 4px;
  }

  .newsletter-toolbar a,
  .newsletter-pager button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.18);
    background: transparent;
    color: inherit;
    text-decoration: none;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    line-height: 1.2;
  }

  .newsletter-toolbar a:hover,
  .newsletter-pager button:hover {
    border-color: rgb(79,177,186);
    background: rgba(79,177,186,0.08);
    text-decoration: none;
  }

  .newsletter-pager button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .newsletter-page-info {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.045);
    opacity: 0.86;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .newsletter-error {
    display: none;
    text-align: center;
    padding: 0.8rem 1rem;
    margin: 0.75rem 0;
    border-radius: 12px;
    background: rgba(255, 120, 120, 0.12);
    border: 1px solid rgba(255, 120, 120, 0.25);
    color: #ffb4a9;
    line-height: 1.7;
  }

  .desktop-reader {
    display: block;
  }

  .desktop-spread-wrap {
    width: 100%;
    padding: 0.75rem;
    box-sizing: border-box;
    border-radius: 16px;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .desktop-spread {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
    max-width: 1080px;
    margin: 0 auto;
  }

  .desktop-page {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    min-height: 390px;
    background: rgba(255,255,255,0.10);
    border-radius: 10px;
    overflow: hidden;
  }

  .desktop-page.blank {
    background: rgba(255,255,255,0.045);
    border: 1px dashed rgba(255,255,255,0.14);
  }

  .desktop-page canvas {
    width: 100%;
    height: auto;
    display: block;
    background: white;
  }

  .mobile-reader {
    display: none;
  }

  .mobile-page-wrap {
    width: 100%;
    padding: 0.5rem;
    box-sizing: border-box;
    border-radius: 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .mobile-page {
    display: flex;
    justify-content: center;
    background: white;
    border-radius: 10px;
    overflow: hidden;
  }

  .mobile-page canvas {
    width: 100%;
    height: auto;
    display: block;
    background: white;
  }

  @media (max-width: 768px) {
    .newsletter-reader {
      width: 100%;
      max-width: 100%;
    }

    .desktop-reader {
      display: none;
    }

    .mobile-reader {
      display: block;
    }

    .newsletter-toolbar,
    .newsletter-pager {
      gap: 6px;
    }

    .newsletter-note {
      width: 100%;
      font-size: 0.82rem;
      margin-right: 0;
    }

    .newsletter-toolbar a,
    .newsletter-pager button,
    .newsletter-page-info {
      padding: 6px 10px;
      font-size: 0.84rem;
    }
  }
</style>

<div class="newsletter-reader">
  <div class="newsletter-reader-header">
    <div class="newsletter-toolbar">
      <span class="newsletter-note">電腦雙頁／手機單頁，高解析度渲染</span>
      <a href="/newsletter/">返回電子報列表</a>
      <a href="{{ page.pdf_url }}" target="_blank" rel="noopener">開啟 PDF 原檔</a>
      <span id="pageInfo" class="newsletter-page-info">PDF 載入中...</span>
    </div>

    <div class="newsletter-pager">
      <button id="prevPageBtn" type="button">上一頁</button>
      <button id="nextPageBtn" type="button">下一頁</button>
    </div>
  </div>

  <div id="readerError" class="newsletter-error"></div>

  <div class="desktop-reader">
    <div class="desktop-spread-wrap">
      <div class="desktop-spread">
        <div id="desktopLeftPage" class="desktop-page">
          <canvas id="desktopLeftCanvas"></canvas>
        </div>

        <div id="desktopRightPage" class="desktop-page blank">
          <canvas id="desktopRightCanvas"></canvas>
        </div>
      </div>
    </div>
  </div>

  <div class="mobile-reader">
    <div class="mobile-page-wrap">
      <div class="mobile-page">
        <canvas id="mobileCanvas"></canvas>
      </div>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>

<script>
  const NEWSLETTER_PDF_URL = "{{ page.pdf_url }}";

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

  let pdfDoc = null;
  let totalPages = 0;
  let currentMobilePage = 1;
  let currentDesktopStartPage = 1;
  let isRendering = false;

  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  const errorBox = document.getElementById("readerError");

  const desktopLeftPage = document.getElementById("desktopLeftPage");
  const desktopRightPage = document.getElementById("desktopRightPage");
  const desktopLeftCanvas = document.getElementById("desktopLeftCanvas");
  const desktopRightCanvas = document.getElementById("desktopRightCanvas");
  const mobileCanvas = document.getElementById("mobileCanvas");

  function isMobileView() {
    return window.innerWidth <= 768;
  }

  function getRenderPixelRatio() {
    const deviceRatio = window.devicePixelRatio || 1;
    return Math.min(Math.max(deviceRatio, 2), 3);
  }

  function showError(message) {
    errorBox.style.display = "block";
    errorBox.innerHTML = message;
  }

  function hideError() {
    errorBox.style.display = "none";
    errorBox.innerHTML = "";
  }

  function updateControls() {
    if (!pdfDoc) {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    if (isMobileView()) {
      pageInfo.textContent = "第 " + currentMobilePage + " / " + totalPages + " 頁";
      prevBtn.disabled = currentMobilePage <= 1 || isRendering;
      nextBtn.disabled = currentMobilePage >= totalPages || isRendering;
      return;
    }

    if (currentDesktopStartPage === 1) {
      pageInfo.textContent = "封面";
      prevBtn.disabled = true || isRendering;
      nextBtn.disabled = totalPages <= 1 || isRendering;
      return;
    }

    const left = currentDesktopStartPage;
    const right = Math.min(currentDesktopStartPage + 1, totalPages);

    pageInfo.textContent = left === right
      ? "第 " + left + " 頁"
      : "第 " + left + "–" + right + " 頁";

    prevBtn.disabled = currentDesktopStartPage <= 1 || isRendering;
    nextBtn.disabled = currentDesktopStartPage + 2 > totalPages || isRendering;
  }

  async function renderPdfPageToCanvas(pageNumber, canvas, cssMaxWidth) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewportBase = page.getViewport({ scale: 1 });

    const cssScale = cssMaxWidth / viewportBase.width;
    const pixelRatio = getRenderPixelRatio();
    const renderScale = cssScale * pixelRatio;

    const renderViewport = page.getViewport({ scale: renderScale });

    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);

    canvas.style.width = Math.floor(viewportBase.width * cssScale) + "px";
    canvas.style.height = Math.floor(viewportBase.height * cssScale) + "px";

    const context = canvas.getContext("2d", { alpha: false });

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: renderViewport
    }).promise;
  }

  function clearCanvas(canvas) {
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 1;
    canvas.height = 1;
    canvas.style.width = "1px";
    canvas.style.height = "1px";
  }

  async function renderMobilePage(pageNumber) {
    if (!pdfDoc || isRendering) return;

    try {
      isRendering = true;
      hideError();
      updateControls();

      const wrapWidth = document.querySelector(".mobile-page-wrap").clientWidth - 18;
      await renderPdfPageToCanvas(pageNumber, mobileCanvas, wrapWidth);

      currentMobilePage = pageNumber;
      isRendering = false;
      updateControls();
    } catch (error) {
      console.error("手機版 PDF 渲染失敗：", error);
      isRendering = false;
      showError("PDF 頁面載入失敗，請確認 PDF 檔案路徑是否正確。");
      updateControls();
    }
  }

  async function renderDesktopSpread(startPage) {
    if (!pdfDoc || isRendering) return;

    try {
      isRendering = true;
      hideError();
      updateControls();

      const spreadWidth = document.querySelector(".desktop-spread").clientWidth;
      const pageMaxWidth = Math.min(Math.floor((spreadWidth - 12) / 2), 520);

      currentDesktopStartPage = startPage;

      desktopLeftPage.classList.remove("blank");
      desktopRightPage.classList.remove("blank");

      if (startPage === 1) {
        await renderPdfPageToCanvas(1, desktopLeftCanvas, pageMaxWidth);
        clearCanvas(desktopRightCanvas);
        desktopRightPage.classList.add("blank");
      } else {
        await renderPdfPageToCanvas(startPage, desktopLeftCanvas, pageMaxWidth);

        if (startPage + 1 <= totalPages) {
          await renderPdfPageToCanvas(startPage + 1, desktopRightCanvas, pageMaxWidth);
        } else {
          clearCanvas(desktopRightCanvas);
          desktopRightPage.classList.add("blank");
        }
      }

      isRendering = false;
      updateControls();
    } catch (error) {
      console.error("電腦版 PDF 渲染失敗：", error);
      isRendering = false;
      showError("PDF 頁面載入失敗，請確認 PDF 檔案路徑是否正確。");
      updateControls();
    }
  }

  function goPrev() {
    if (!pdfDoc || isRendering) return;

    if (isMobileView()) {
      if (currentMobilePage > 1) renderMobilePage(currentMobilePage - 1);
      return;
    }

    if (currentDesktopStartPage === 1) return;

    if (currentDesktopStartPage === 2) {
      renderDesktopSpread(1);
    } else {
      renderDesktopSpread(Math.max(1, currentDesktopStartPage - 2));
    }
  }

  function goNext() {
    if (!pdfDoc || isRendering) return;

    if (isMobileView()) {
      if (currentMobilePage < totalPages) renderMobilePage(currentMobilePage + 1);
      return;
    }

    if (currentDesktopStartPage === 1) {
      if (totalPages >= 2) renderDesktopSpread(2);
      return;
    }

    if (currentDesktopStartPage + 2 <= totalPages) {
      renderDesktopSpread(currentDesktopStartPage + 2);
    }
  }

  async function initReader() {
    try {
      hideError();
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      pageInfo.textContent = "PDF 載入中...";

      pdfDoc = await pdfjsLib.getDocument({
        url: NEWSLETTER_PDF_URL,
        disableAutoFetch: false,
        disableStream: false
      }).promise;

      totalPages = pdfDoc.numPages;

      if (isMobileView()) {
        await renderMobilePage(1);
      } else {
        await renderDesktopSpread(1);
      }
    } catch (error) {
      console.error("PDF 載入失敗：", error);
      pageInfo.textContent = "載入失敗";
      showError(
        "PDF 載入失敗，請確認檔案是否存在：<br><code>" +
        NEWSLETTER_PDF_URL +
        "</code>"
      );
    }
  }

  prevBtn.addEventListener("click", goPrev);
  nextBtn.addEventListener("click", goNext);

  document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowLeft") goPrev();
    if (event.key === "ArrowRight") goNext();
  });

  let resizeTimer = null;

  window.addEventListener("resize", function() {
    if (!pdfDoc) return;

    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(function() {
      if (isMobileView()) {
        renderMobilePage(currentMobilePage);
      } else {
        renderDesktopSpread(currentDesktopStartPage);
      }
    }, 250);
  });

  document.addEventListener("DOMContentLoaded", initReader);
</script>
