console.log("my-guides-nav.js 已載入");

(function () {
  function isGuidesIndexPage() {
    const path = window.location.pathname;
    return path === "/guides/" || path === "/guides/index.html";
  }

  function insertMyGuidesButton() {
    if (!isGuidesIndexPage()) return;
    if (document.getElementById("myGuidesNavBtn")) return;

    const writeBtn =
      document.querySelector('a[href="/guides/new/"]') ||
      document.querySelector('a[href="/guides/new"]');

    const btn = document.createElement("a");
    btn.id = "myGuidesNavBtn";
    btn.href = "/guides/my-posts/";
    btn.innerText = "我的貼文";
    btn.className = writeBtn ? writeBtn.className : "guide-write-btn";

    if (writeBtn && writeBtn.parentNode) {
      writeBtn.insertAdjacentElement("afterend", btn);
      return;
    }

    const heading = Array.from(document.querySelectorAll("h1, h2")).find(function (el) {
      return el.innerText && el.innerText.includes("社員論壇");
    });

    if (heading) {
      const wrap = document.createElement("div");
      wrap.style.margin = "1rem 0";
      wrap.appendChild(btn);
      heading.insertAdjacentElement("afterend", wrap);
    }
  }

  function injectStyle() {
    if (document.getElementById("myGuidesNavStyle")) return;

    const style = document.createElement("style");
    style.id = "myGuidesNavStyle";
    style.innerHTML = `
      #myGuidesNavBtn {
        margin-left: 0.65rem;
      }

      @media (max-width: 640px) {
        #myGuidesNavBtn {
          margin-left: 0;
          margin-top: 0.55rem;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function init() {
    injectStyle();
    insertMyGuidesButton();
    setTimeout(insertMyGuidesButton, 500);
    setTimeout(insertMyGuidesButton, 1200);
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);

  const pushStateEl = document.querySelector("hy-push-state");

  if (pushStateEl) {
    pushStateEl.addEventListener("load", init);
  }
})();
