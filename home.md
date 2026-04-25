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
}

.carousel-slide img {
  width: 100%;
  height: 360px;
  object-fit: cover;
  display: block;
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
}

.prev { left: 10px; }
.next { right: 10px; }

.carousel-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
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

    <div class="carousel-slide">
      <a href="/newsletter/">
        <img src="/assets/img/home/slide1.jpg" alt="電子刊物">
      </a>
    </div>

    <div class="carousel-slide">
      <a href="/about/">
        <img src="/assets/img/home/slide2.jpg" alt="近期活動">
      </a>
    </div>

    <div class="carousel-slide">
      <a href="/newsletter-2025-05-08/">
        <img src="/assets/img/home/slide3.jpg" alt="最新內容">
      </a>
    </div>

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
