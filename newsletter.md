---
layout: page
title: 電子報報
permalink: /newsletter/
description: 守夜人桌遊社電子報總覽
---

<style>
  .newsletter-list-wrap {
    max-width: 820px;
    margin-top: 2rem;
  }

  .newsletter-intro {
    margin-bottom: 1.5rem;
    line-height: 1.8;
    opacity: 0.82;
  }

  .newsletter-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .newsletter-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    padding: 18px 22px;
    box-sizing: border-box;
    border-radius: 16px;
    border: 1px solid rgba(79,177,186,0.38);
    background: rgba(255,255,255,0.035);
    color: inherit;
    text-decoration: none;
    transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
  }

  .newsletter-item:hover {
    transform: translateY(-2px);
    border-color: rgba(79,177,186,0.75);
    background: rgba(79,177,186,0.10);
    text-decoration: none;
  }

  .newsletter-item-main {
    min-width: 0;
  }

  .newsletter-item-title {
    margin: 0;
    font-size: 1.25rem;
    line-height: 1.35;
    font-weight: 800;
  }

  .newsletter-item-desc {
    margin: 0.35rem 0 0 0;
    line-height: 1.6;
    opacity: 0.75;
    font-size: 0.95rem;
  }

  .newsletter-item-arrow {
    flex: 0 0 auto;
    opacity: 0.75;
    font-size: 1.05rem;
    font-weight: 700;
  }

  .newsletter-empty {
    padding: 1rem;
    border-radius: 12px;
    background: rgba(255,255,255,0.055);
    opacity: 0.82;
  }

  @media (max-width: 640px) {
    .newsletter-item {
      align-items: flex-start;
      padding: 16px 18px;
    }

    .newsletter-item-title {
      font-size: 1.12rem;
    }

    .newsletter-item-arrow {
      font-size: 0.95rem;
    }
  }
</style>

<div class="newsletter-list-wrap">
  <p class="newsletter-intro">
    請選擇想閱讀的電子報月份。點選後會進入該期電子報翻頁閱讀頁面。
  </p>

  <div class="newsletter-list">
    {% assign newsletter_pages = site.pages | sort: "newsletter_sort" | reverse %}
    {% assign newsletter_count = 0 %}

    {% for item in newsletter_pages %}
      {% if item.newsletter_issue == true %}
        {% assign newsletter_count = newsletter_count | plus: 1 %}
        <a class="newsletter-item" href="{{ item.url | relative_url }}">
          <div class="newsletter-item-main">
            <h2 class="newsletter-item-title">
              {{ item.newsletter_label | default: item.title }}
            </h2>

            {% if item.description %}
              <p class="newsletter-item-desc">
                {{ item.description }}
              </p>
            {% endif %}
          </div>

          <span class="newsletter-item-arrow">前往閱讀 →</span>
        </a>
      {% endif %}
    {% endfor %}

    {% if newsletter_count == 0 %}
      <div class="newsletter-empty">
        目前尚未找到電子報頁面。請確認電子報 md 檔案有設定 <code>newsletter_issue: true</code>。
      </div>
    {% endif %}
  </div>
</div>
