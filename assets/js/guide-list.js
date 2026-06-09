console.log("guide-list.js 已載入");

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

  const ADMIN_EMAIL = "itribgc@gmail.com";

  let currentUser = null;
  let allGuides = [];
  let currentCategory = "all";

  const guideList = document.getElementById("guideList");
  const guideListMsg = document.getElementById("guideListMsg");
  const filterButtons = document.querySelectorAll(".guide-filter-btn");

  function setMsg(text, type) {
    if (!guideListMsg) return;

    guideListMsg.innerText = text || "";
    guideListMsg.className = type === "success" ? "guide-list-msg success" : "guide-list-msg";
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function isAdmin() {
    return currentUser && currentUser.email === ADMIN_EMAIL;
  }

  function canManageGuide(guide) {
    return (
      currentUser &&
      guide &&
      (
        guide.authorUid === currentUser.uid ||
        isAdmin()
      )
    );
  }

  function formatDate(timestamp) {
    if (!timestamp || !timestamp.toDate) return "";

    const date = timestamp.toDate();

    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  async function getCommentCount(guideId) {
    try {
      const snapshot = await db.collection("comments")
        .where("postPath", "==", "guide:" + guideId)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error("讀取留言數失敗：", error);
      return 0;
    }
  }

  function getFilteredGuides() {
    if (currentCategory === "all") {
      return allGuides;
    }

    return allGuides.filter(function (item) {
      return item.data.category === currentCategory;
    });
  }

  function renderEmptyMessage() {
    if (!guideList) return;

    const text = currentCategory === "all"
      ? "目前還沒有社員論壇文章。"
      : "目前沒有「" + currentCategory + "」分類的文章。";

    guideList.innerHTML = `
      <div class="guide-empty">${escapeHtml(text)}</div>
    `;
  }

  async function renderGuides() {
    if (!guideList) return;

    const filteredGuides = getFilteredGuides();

    if (filteredGuides.length === 0) {
      renderEmptyMessage();
      return;
    }

    guideList.innerHTML = `
      <div class="guide-empty">文章載入中...</div>
    `;

    let html = "";

    for (const item of filteredGuides) {
      const guide = item.data;
      const guideId = item.id;

      const title = guide.title || "未命名文章";
      const gameName = guide.gameName || "未分類主題";
      const category = guide.category || "未分類";
      const authorName = guide.authorName || "未命名社員";
      const summary = guide.summary || "這篇文章沒有摘要。";
      const coverImage = guide.coverImage || "";
      const likeCount = Number(guide.likeCount || 0);
      const viewCount = Number(guide.viewCount || 0);
      const commentCount = await getCommentCount(guideId);
      const createdAt = formatDate(guide.createdAt);

      html += `
        <article class="guide-card" data-guide-id="${escapeHtml(guideId)}" data-category="${escapeHtml(category)}">
          ${
            coverImage
              ? `
                <a class="guide-card-cover-link" href="/guides/post/?id=${encodeURIComponent(guideId)}">
                  <img class="guide-card-cover" src="${escapeHtml(coverImage)}" alt="${escapeHtml(title)}">
                </a>
              `
              : `
                <a class="guide-card-cover-link" href="/guides/post/?id=${encodeURIComponent(guideId)}">
                  <div class="guide-card-cover guide-card-cover-empty">無封面</div>
                </a>
              `
          }

          <div class="guide-card-body">
            <div class="guide-card-title-row">
              <a href="/guides/post/?id=${encodeURIComponent(guideId)}">
                <h2>${escapeHtml(title)}</h2>
              </a>
            </div>

            <div class="guide-card-meta">
              <span>主題：${escapeHtml(gameName)}</span>
              <span>・${escapeHtml(authorName)}</span>
              ${createdAt ? `<span>・${escapeHtml(createdAt)}</span>` : ""}
              <span class="guide-card-category">${escapeHtml(category)}</span>
              <span class="guide-card-stat">👁 ${viewCount}</span>
              <span class="guide-card-stat">💬 ${commentCount}</span>
              <span class="guide-card-stat">👍 ${likeCount}</span>
            </div>

            <p class="guide-card-summary">${escapeHtml(summary)}</p>

            <div class="guide-card-actions">
              <a href="/guides/post/?id=${encodeURIComponent(guideId)}">閱讀全文</a>

              ${
                canManageGuide(guide)
                  ? `
                    <a href="/guides/edit/?id=${encodeURIComponent(guideId)}">編輯文章</a>
                    <button type="button" class="guide-delete-btn" data-guide-id="${escapeHtml(guideId)}" data-title="${escapeHtml(title)}">
                      刪除文章
                    </button>
                  `
                  : ""
              }
            </div>
          </div>
        </article>
      `;
    }

    guideList.innerHTML = html;

    bindDeleteButtons();
  }

  function bindFilterButtons() {
    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const selectedCategory = btn.dataset.category || "all";

        currentCategory = selectedCategory;

        filterButtons.forEach(function (item) {
          item.classList.remove("active");
        });

        btn.classList.add("active");

        renderGuides();
      });
    });
  }

  async function loadGuides() {
    if (!guideList) return;

    try {
      setMsg("");
      guideList.innerHTML = `
        <div class="guide-empty">社員論壇文章載入中...</div>
      `;

      const snapshot = await db.collection("guides")
        .where("status", "==", "published")
        .get();

      allGuides = snapshot.docs.map(function (doc) {
        return {
          id: doc.id,
          data: doc.data()
        };
      });

      allGuides.sort(function (a, b) {
        const aTime = a.data.createdAt && a.data.createdAt.toMillis ? a.data.createdAt.toMillis() : 0;
        const bTime = b.data.createdAt && b.data.createdAt.toMillis ? b.data.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

      renderGuides();
    } catch (error) {
      console.error("讀取社員論壇文章失敗：", error);

      guideList.innerHTML = `
        <div class="guide-empty">文章讀取失敗，請稍後再試。</div>
      `;

      setMsg("文章讀取失敗，請確認 Firestore 權限或網路狀態。");
    }
  }

  function createDeleteModal() {
    if (document.getElementById("guideListDeleteModal")) return;

    const modal = document.createElement("div");
    modal.id = "guideListDeleteModal";
    modal.innerHTML = `
      <style>
        #guideListDeleteModal {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.62);
          box-sizing: border-box;
        }

        #guideListDeleteModal.show {
          display: flex;
        }

        .guide-list-delete-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          color: #222;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.34);
          box-sizing: border-box;
        }

        .guide-list-delete-card h3 {
          margin: 0 0 12px 0;
          color: #222;
        }

        .guide-list-delete-card p {
          margin: 0 0 16px 0;
          color: #555;
          font-size: 14px;
          line-height: 1.6;
        }

        #guideListDeleteMsg {
          min-height: 20px;
          color: #d93025;
          font-size: 14px;
          line-height: 1.5;
        }

        .guide-list-delete-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .guide-list-delete-actions button {
          padding: 9px 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        #guideListDeleteCancelBtn {
          background: #e8e8e8;
          color: #333;
        }

        #guideListDeleteConfirmBtn {
          background: #d93025;
          color: #fff;
        }

        .guide-list-delete-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      </style>

      <div class="guide-list-delete-card">
        <h3>刪除文章</h3>
        <p id="guideListDeleteText">是否確定刪除文章？刪除後無法復原。</p>
        <div id="guideListDeleteMsg"></div>

        <div class="guide-list-delete-actions">
          <button id="guideListDeleteCancelBtn" type="button">取消</button>
          <button id="guideListDeleteConfirmBtn" type="button">確定刪除</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("guideListDeleteCancelBtn").addEventListener("click", closeDeleteModal);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeDeleteModal();
      }
    });
  }

  function openDeleteModal(guideId, title) {
    createDeleteModal();

    const modal = document.getElementById("guideListDeleteModal");
    const text = document.getElementById("guideListDeleteText");
    const msg = document.getElementById("guideListDeleteMsg");
    const confirmBtn = document.getElementById("guideListDeleteConfirmBtn");

    text.innerText = `是否確定刪除文章「${title || "未命名文章"}」？刪除後無法復原。`;
    msg.innerText = "";

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener("click", function () {
      deleteGuide(guideId, newConfirmBtn, msg);
    });

    modal.classList.add("show");
  }

  function closeDeleteModal() {
    const modal = document.getElementById("guideListDeleteModal");

    if (modal) {
      modal.classList.remove("show");
    }
  }

  async function deleteGuide(guideId, confirmBtn, msg) {
    try {
      confirmBtn.disabled = true;
      confirmBtn.innerText = "刪除中...";

      await db.collection("guides").doc(guideId).delete();

      allGuides = allGuides.filter(function (item) {
        return item.id !== guideId;
      });

      closeDeleteModal();
      setMsg("文章已刪除。", "success");
      renderGuides();
    } catch (error) {
      console.error("刪除文章失敗：", error);
      msg.innerText = "刪除失敗，請稍後再試。";
      confirmBtn.disabled = false;
      confirmBtn.innerText = "確定刪除";
    }
  }

  function bindDeleteButtons() {
    document.querySelectorAll(".guide-delete-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openDeleteModal(btn.dataset.guideId, btn.dataset.title);
      });
    });
  }

  function init() {
    bindFilterButtons();
    createDeleteModal();

    auth.onAuthStateChanged(function (user) {
      currentUser = user;
      loadGuides();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
