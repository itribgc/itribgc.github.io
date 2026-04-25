---
layout: page
title: 守夜人-桌遊社
description: >
  這是工研院院內社團"守夜人-桌遊社"的單一通道網頁，供社員進行電子刊物了解以及最新活動等功能查閱。
last_modified_at: 2018-08-03
no_link_title: false
no_excerpt: false
hide_image: false
cover: true
permalink: /home/
---

{% assign blog_posts = site.posts | where_exp: "post", "post.name contains '-blog.md'" | sort: "date" | reverse %}
{% assign newsletter_posts = site.posts | where_exp: "post", "post.name contains 'newsletter'" | sort: "date" | reverse %}
{% assign latest_newsletter = newsletter_posts | first %}

<style>
.member-bar {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto 1rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.member-email {
  font-size: 0.95rem;
  color: #aaa;
}

.logout-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
}

.home-carousel {
  position: relative;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto 2rem;
  overflow: hidden;
  border-radius: 16px;
}

.carousel-track {
  display: flex;
  transition: transform 0.6s ease;
}

.carousel-slide {
  min-width: 100%;
  position: relative;
}

.carousel-slide img {
  width: 100%;
  height: 360px;
  object-fit: cover;
  display: block;
}

.carousel-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px 24px;
  color: white;
  background: linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0));
}

.carousel-caption span {
  font-size: 14px;
  opacity: 0.9;
}

.carousel-caption h3 {
  margin: 6px 0 0;
  font-size: 24px;
  line-height: 1.3;
  color: white;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.4);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 3;
}

.prev { left: 10px; }
.next { right: 10px; }

.carousel-dots {
  position: absolute;
  bottom: 10px;
  right: 16px;
  z-index: 4;
}

.carousel-dots button {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  margin: 0 4px;
  background: rgba(255,255,255,0.5);
}

.carousel-dots .active {
  background: white;
}
</style>

<div class="member-bar">
  <span class="member-email" id="memberEmail"></span>
  <button class="logout-btn" onclick="logoutMember()">登出</button>
</div>

<div class="home-carousel" id="carousel">
  <div class="carousel-track">

    {% for post in blog_posts limit:3 %}
      {% assign filename = post.name | remove: ".md" %}
      <div class="carousel-slide">
        <a href="{{ post.url | relative_url }}">
          <img src="/assets/img/blog/{{ filename }}-titleImg.png" alt="{{ post.title }}">
          <div class="carousel-caption">
            <span>最新文章</span>
            <h3>{{ post.title }}</h3>
          </div>
        </a>
      </div>
    {% endfor %}

    {% if latest_newsletter %}
      {% assign newsletter_filename = latest_newsletter.name | remove: ".md" %}
      <div class="carousel-slide">
        <a href="{{ latest_newsletter.url | relative_url }}">
          <img src="/assets/img/blog/{{ newsletter_filename }}-titleImg.png" alt="{{ latest_newsletter.title }}">
          <div class="carousel-caption">
            <span>最新電子報</span>
            <h3>{{ latest_newsletter.title }}</h3>
          </div>
        </a>
      </div>
    {% endif %}

  </div>

  <button class="carousel-btn prev">‹</button>
  <button class="carousel-btn next">›</button>

  <div class="carousel-dots"></div>
</div>

<script>
const track = document.querySelector(".carousel-track");
const slides = document.querySelectorAll(".carousel-slide");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");
const dotsContainer = document.querySelector(".carousel-dots");

let index = 0;
let timer;

if (slides.length > 0) {
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.addEventListener("click", () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll("button");

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === index));
  }

  function goToSlide(i) {
    index = (i + slides.length) % slides.length;
    update();
  }

  function next() {
    goToSlide(index + 1);
  }

  function prev() {
    goToSlide(index - 1);
  }

  nextBtn.onclick = next;
  prevBtn.onclick = prev;

  function start() {
    timer = setInterval(next, 3000);
  }

  function stop() {
    clearInterval(timer);
  }

  document.getElementById("carousel").addEventListener("mouseenter", stop);
  document.getElementById("carousel").addEventListener("mouseleave", start);

  update();
  start();
}
</script>

<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>

<script>
const firebaseConfig = {
  apiKey: "AIzaSyARLnYPUUSVIXiK3UJnlSw93AeAm3_sSz8",
  authDomain: "itribgc-0.firebaseapp.com",
  projectId: "itribgc-0",
  storageBucket: "itribgc-0.firebasestorage.app",
  messagingSenderId: "535892877472",
  appId: "1:535892877472:web:2270ac423ffd6f38b1e9c5"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

auth.onAuthStateChanged(function(user) {
  if (!user) {
    window.location.replace("/login.html");
    return;
  }

  const memberEmail = document.getElementById("memberEmail");
  if (memberEmail) {
    memberEmail.textContent = user.email;
  }
});

function logoutMember() {
  auth.signOut().then(function() {
    window.location.replace("/login.html");
  });
}
</script>
