---
layout: page
title: 電子報
permalink: /newsletter/
---

<div id="book"></div>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/page-flip/dist/css/page-flip.css">
<script src="https://cdn.jsdelivr.net/npm/page-flip/dist/js/page-flip.browser.min.js"></script>

<script>
document.addEventListener("DOMContentLoaded", function() {
  const pageFlip = new St.PageFlip(
    document.getElementById("book"),
    {
      width: 600,
      height: 800,
      showCover: true,
      mobileScrollSupport: false
    }
  );

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
