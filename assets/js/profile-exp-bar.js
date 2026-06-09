console.log("profile-exp-bar.js 已載入");

(function () {
  function getXpTextElement() {
    const panel = document.querySelector(".member-profile-panel");
    if (!panel) return null;

    const allElements = panel.querySelectorAll("*");

    for (const el of allElements) {
      const text = el.innerText || "";

      if (
        text.includes("目前 XP") &&
        text.includes("距離下一級")
      ) {
        return el;
      }
    }

    return null;
  }

  function parseXpProgress(text) {
    const normalized = String(text || "").replace(/\s/g, "");

    const match = normalized.match(/距離下一級[:：](\d+)\/(\d+)/);

    if (!match) {
      return {
        current: 0,
        total: 1,
        percent: 0
      };
    }

    const current = Number(match[1]);
    const total = Number(match[2]);

    if (!total || Number.isNaN(current) || Number.isNaN(total)) {
      return {
        current: 0,
        total: 1,
        percent: 0
      };
    }

    const percent = Math.max(0, Math.min(100, (current / total) * 100));

    return {
      current,
      total,
      percent
    };
  }

  function createExpBar(percent) {
    const wrap = document.createElement("div");
    wrap.className = "member-exp-bar-wrap";

    const fill = document.createElement("div");
    fill.className = "member-exp-bar-fill";
    fill.style.width = percent + "%";

    const shine = document.createElement("div");
    shine.className = "member-exp-bar-shine";

    fill.appendChild(shine);
    wrap.appendChild(fill);

    return wrap;
  }

  function updateExpBar() {
    const xpTextEl = getXpTextElement();

    if (!xpTextEl) return;

    const text = xpTextEl.innerText || "";
    const progress = parseXpProgress(text);

    let existingBar = xpTextEl.parentElement.querySelector(".member-exp-bar-wrap");

    if (!existingBar) {
      existingBar = createExpBar(progress.percent);
      xpTextEl.parentElement.insertBefore(existingBar, xpTextEl);
    }

    const fill = existingBar.querySelector(".member-exp-bar-fill");

    if (fill) {
      fill.style.width = progress.percent + "%";
      fill.setAttribute(
        "title",
        "距離下一級：" + progress.current + " / " + progress.total + " XP"
      );
    }
  }

  function startObserver() {
    const target = document.body;

    if (!target) return;

    const observer = new MutationObserver(function () {
      updateExpBar();
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true
    });

    updateExpBar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else {
    startObserver();
  }
})();
