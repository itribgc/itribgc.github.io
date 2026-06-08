console.log("my-guides.js 已載入");

(function () {
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
  const db = firebase.firestore();

  let currentUser = null;
  let currentFilter = "all";
  let myGuides = [];
  let unsubscribeGuides = null;

  const listEl = document.getElementById("myGuidesList");
  const msgEl = document.getElementById("myGuidesMsg");

  function setMsg(text, type) {
    if (!msgEl) return;
    msgEl.innerText = text || "";
    msgEl.className = type === "success" ? "my-guides-msg success" : "my-guides-msg";
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTime(timestamp) {
    if (!timestamp || !timestamp.toDate) return "";

    const date = timestamp.toDate();

    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getStatusInfo(data) {
    const status = data.status || "pending";
    const reviewStatus = data.reviewStatus || "";

    if (status === "published") {
      return {
        key: "published",
        label: "已發布",
        className: "published",
        description: "文章已公開顯示在社員論壇。"
      };
    }

    if (status === "rejected" || reviewStatus === "rejected") {
      return {
        key: "rejected",
        label: "審核失敗",
        className: "rejected",
        description: "文章未通過審核，可編輯後重新送審，或自行刪除。"
      };
    }

    return {
      key: "pending",
      label: "審核中",
      className: "pending",
      description: "文章已送出，目前等待管理員審核。"
    };
  }

  function getSortTime(data) {
    const candidates = [
      data.updatedAt,
      data.submittedAt,
      data.createdAt
    ];

    for (const item of candidates) {
      if (item && item.toMillis) return item.toMillis();
    }

    return 0;
  }

  function getFilteredGuides() {
    if (currentFilter === "all") {
      return myGuides;
    }

    return myGuides.filter(function (item) {
      const info = getStatusInfo(item.data);
      return info.key === currentFilter;
    });
  }

  function renderGuides() {
    if (!listEl) return;

    if (!currentUser) {
      listEl.innerHTML = `<div class="my-guides-empty">請先登入後再查看自己的貼文。</div>`;
      return;
    }

    const filtered = getFilteredGuides();

    if (filtered.length === 0) {
      const emptyText = currentFilter === "all"
        ? "目前還沒有任何貼文。可以先到社員論壇撰寫第一篇文章！"
        : "目前沒有這個狀態的貼文。";

      listEl.innerHTML = `<div class="my-guides-empty">${emptyText}</div>`;
      return;
    }

    let html = "";

    filtered.forEach(function (item) {
      const data = item.data;
      const statusInfo = getStatusInfo(data);
      const title = data.title || "未命名文章";
      const category = data.category || "未分類";
      const gameName = data.gameName || "";
      const summary = data.summary || "";
      const coverImage = data.coverImage || "";

      const timeText = data.updatedAt
        ? "更新：" + formatTime(data.updatedAt)
        : "建立：" + formatTime(data.createdAt);

      html += `
        <article class="my-guide-card">
          ${
            coverImage
              ? `
                <a class="my-guide-cover-link" href="/guides/post/?id=${encodeURIComponent(item.id)}">
                  <img class="my-guide-cover" src="${escapeHtml(coverImage)}" alt="${escapeHtml(title)}">
                </a>
              `
              : `<div class="my-guide-cover my-guide-cover-empty">無封面</div>`
          }

          <div class="my-guide-body">
            <div class="my-guide-title-row">
              <a href="/guides/post/?id=${encodeURIComponent(item.id)}">
                <h2>${escapeHtml(title)}</h2>
              </a>
              <span class="my-guide-status ${escapeHtml(statusInfo.className)}">${escapeHtml(statusInfo.label)}</span>
            </div>

            <div class="my-guide-meta">
              <span>主題：${escapeHtml(gameName || "未分類主題")}</span>
              <span>・${escapeHtml(timeText)}</span>
              <span class="my-guide-category">${escapeHtml(category)}</span>
            </div>

            <p class="my-guide-summary">${escapeHtml(summary || "這篇文章沒有摘要。")}</p>

            ${
              statusInfo.key === "rejected"
                ? `
                  <div class="my-guide-reason">
                    <strong>審核結果：</strong>${escapeHtml(data.rejectionReason || "這篇文章未通過審核，可修改後重新送審。")}
                  </div>
                `
                : ""
            }

            <div class="my-guide-actions">
              <a href="/guides/post/?id=${encodeURIComponent(item.id)}">查看文章</a>
              <a href="/guides/edit/?id=${encodeURIComponent(item.id)}">
                ${statusInfo.key === "published" ? "編輯並重新送審" : "編輯文章"}
              </a>
              <button class="my-guide-delete-btn" type="button" data-guide-id="${escapeHtml(item.id)}" data-title="${escapeHtml(title)}">刪除文章</button>
            </div>
          </div>
        </article>
      `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll(".my-guide-delete-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteMyGuide(btn.dataset.guideId, btn.dataset.title);
      });
    });
  }

  async function deleteMyGuide(guideId, title) {
    if (!currentUser) {
      setMsg("請先登入。");
      return;
    }

    const ok = confirm(`確定刪除文章「${title || "未命名文章"}」嗎？刪除後無法復原。`);

    if (!ok) return;

    try {
      await db.collection("guides").doc(guideId).delete();
      setMsg("文章已刪除。", "success");
    } catch (error) {
      console.error("刪除我的貼文失敗：", error);
      setMsg("刪除失敗，請稍後再試。");
    }
  }

  function listenMyGuides() {
    if (!currentUser) return;

    if (unsubscribeGuides) {
      unsubscribeGuides();
      unsubscribeGuides = null;
    }

    unsubscribeGuides = db.collection("guides")
      .where("authorUid", "==", currentUser.uid)
      .onSnapshot(function (snapshot) {
        myGuides = snapshot.docs.map(function (doc) {
          return {
            id: doc.id,
            data: doc.data()
          };
        });

        myGuides.sort(function (a, b) {
          return getSortTime(b.data) - getSortTime(a.data);
        });

        renderGuides();
      }, function (error) {
        console.error("讀取我的貼文失敗：", error);
        listEl.innerHTML = `<div class="my-guides-empty">讀取我的貼文失敗，請稍後再試。</div>`;
      });
  }

  function bindFilters() {
    document.querySelectorAll(".my-guides-filter button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentFilter = btn.dataset.filter || "all";

        document.querySelectorAll(".my-guides-filter button").forEach(function (item) {
          item.classList.remove("active");
        });

        btn.classList.add("active");

        renderGuides();
      });
    });
  }

  bindFilters();

  auth.onAuthStateChanged(function (user) {
    currentUser = user;

    if (!user) {
      setMsg("請先登入後再查看我的貼文。");
      if (listEl) listEl.innerHTML = `<div class="my-guides-empty">請先登入。</div>`;
      return;
    }

    setMsg("");
    listenMyGuides();
  });
})();
