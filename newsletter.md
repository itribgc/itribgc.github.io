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
    width: 700,
    height: 990,

    size: "stretch",
    minWidth: 280,
    maxWidth: 700,
    minHeight: 396,
    maxHeight: 990,

    showCover: true,
    usePortrait: true,
    autoSize: true,

    drawShadow: false,
    maxShadowOpacity: 0.2,

    mobileScrollSupport: true,
    useMouseEvents: true
  });

  const pages = [
    "/assets/newsletter/2025_05_08/p1.jpg",
    "/assets/newsletter/2025_05_08/p2.jpg",
    "/assets/newsletter/2025_05_08/p3.jpg",
    "/assets/newsletter/2025_05_08/p4.jpg",
    "/assets/newsletter/2025_05_08/p5.jpg",
    "/assets/newsletter/2025_05_08/p6.jpg",
    "/assets/newsletter/2025_05_08/p7.jpg",
    "/assets/newsletter/2025_05_08/p8.jpg",
    "/assets/newsletter/2025_05_08/p9.jpg",
    "/assets/newsletter/2025_05_08/p10.jpg",
    "/assets/newsletter/2025_05_08/p11.jpg",
    "/assets/newsletter/2025_05_08/p12.jpg"
  ];

  pageFlip.loadFromImages(pages);
});
</script>
