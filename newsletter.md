---
layout: page
title: 電子報
permalink: /newsletter/
description: 守夜人桌遊社電子報總覽
---

<style>
  .newsletter-intro {
    opacity: 0.82;
    line-height: 1.8;
    margin-bottom: 1.5rem;
  }

  .newsletter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px;
    margin-top: 2rem;
  }

  .newsletter-card {
    display: block;
    padding: 24px 20px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    text-decoration: none;
    background: rgba(255,255,255,0.03);
    color: inherit;
    transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  }

  .newsletter-card:hover {
    transform: translateY(-4px);
    border-color: rgba(79,177,186,0.55);
    background: rgba(79,177,186,0.08);
    text-decoration: none;
  }

  .newsletter-card h2 {
    margin: 0 0 8px 0;
    font-size: 1.35rem;
    line-height: 1.35;
  }

  .newsletter-card p {
    margin: 0;
    opacity: 0.85;
    line-height: 1.7;
  }

  .newsletter-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(79,177,186,0.45);
    background: rgba(79,177,186,0.12);
    font-size: 0.85rem;
    font-weight: 700;
  }
</style>

<p class="newsletter-intro">
  請選擇想閱讀的電子報月份。點選月份後，就會進入該期電子報翻頁閱讀頁面。
</p>

<div class="newsletter-grid">
  <a class="newsletter-card" href="/newsletter-2025-05-08/">
    <span class="newsletter-tag">最新一期</span>
    <h2>2025 年 05–08 月</h2>
    <p>活動回顧、桌遊競賽、名人專欄、守夜人天地</p>
  </a>

  <a class="newsletter-card" href="/newsletter-2025-03+04/">
    <span class="newsletter-tag">電子報</span>
    <h2>2025 年 03–04 月</h2>
    <p>點擊進入閱讀本期電子報</p>
  </a>
</div>
