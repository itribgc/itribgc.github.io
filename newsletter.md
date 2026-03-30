---
layout: page
title: 電子報
permalink: /newsletter/
description: 守夜人桌遊社電子報
---

<style>
  .flipbook-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 1rem 0 2rem;
    overflow: hidden;
  }

  #book {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
  }

  /* 讓 StPageFlip 產生的父層也能置中 */
  .stf__parent {
    margin: 0 auto !important;
  }

  /* 避免頁面外面那層灰底看起來太擠 */
  .content .page {
    overflow: visible;
  }

  @media (max-width: 768px) {
    .flipbook-wrap {
      padding: 0.5rem 0 1.5rem;
    }
  }
</style>

<div class="flipbook-wrap">
  <div id="book"></div>
</div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/page-flip/dist/css/page-flip.css">
<script src="https://cdn.jsdelivr.net/npm/page-flip/dist/js/page-flip.browser.min.js"></script>

<script>
document.addEventListener("DOMContentLoaded", function () {
  const pageFlip = new St.PageFlip(document.getElementById("book"), {
    width: 1600,
    height: 2260,

    size: "stretch",
    minWidth: 300,
    maxWidth: 1600,
    minHeight: 400,
    maxHeight: 2260,

    showCover: true,
    usePortrait: true,
    autoSize: true,

    drawShadow: false,
    maxShadowOpacity: 0.2,

    mobileScrollSupport: false,
    useMouseEvents: true
  });

  const pages = [
    "/assets/newsletter/2025_05_08/p1.png",
    "/assets/newsletter/2025_05_08/p2.png",
    "/assets/newsletter/2025_05_08/p3.png",
    "/assets/newsletter/2025_05_08/p4.png",
    "/assets/newsletter/2025_05_08/p5.png",
    "/assets/newsletter/2025_05_08/p6.png",
    "/assets/newsletter/2025_05_08/p7.png",
    "/assets/newsletter/2025_05_08/p8.png",
    "/assets/newsletter/2025_05_08/p9.png",
    "/assets/newsletter/2025_05_08/p10.png",
    "/assets/newsletter/2025_05_08/p11.png",
    "/assets/newsletter/2025_05_08/p12.png"
  ];

  pageFlip.loadFromImages(pages);
});
</script>
