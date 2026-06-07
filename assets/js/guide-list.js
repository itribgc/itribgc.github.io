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

  let currentUser = null;
  let unsubscribeGuides = null;
  let pendingDeleteGuideId = "";
  let pendingDeleteGuideTitle = "";

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

    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function getCategory(data) {
    return data.category || "桌遊攻略";
  }

  function createDeleteModal() {
    if (document.getElementById("guideDeleteModal")) return;

    const modal = document.createElement("div");
    modal.id = "guideDeleteModal";
    modal.innerHTML = `
      <style>
        #guideDeleteModal {
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

        #guideDeleteModal.show {
          display: flex;
        }

        .guide-delete-modal-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          color: #222;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.34);
          box-sizing: border-box;
        }

        .guide-delete-modal-card h3 {
          margin: 0 0 12px 0;
          font-size: 20px;
          color: #222;
        }

        .guide-delete-modal-card p {
          margin: 0 0 16px 0;
          color: #555;
          font-size: 14px;
          line-height: 1.6;
        }

        #guideDeleteMsg {
          min-height: 20px;
          margin-top: 10px;
          color: #d93025;
          font-size: 14px;
          line-height: 1.5;
        }

        .guide-delete-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .guide-delete-actions button {
          padding: 9px 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        #guideDeleteCancelBtn {
          background: #e8e8e8;
          color: #333;
        }

        #guideDeleteConfirmBtn {
          background: #d93025;
          color: #fff;
        }

        .guide-delete-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      </style>

      <div class="guide-delete-modal-card">
        <h3>刪除文章</h3>
        <p id="guideDeleteText">是否確定刪除文章？刪除後將無法復原。</p>
        <div id="guideDeleteMsg"></div>

        <div class="guide-delete-actions">
          <button id="guideDeleteCancelBtn" type="button">取消</button>
          <button id="guideDeleteConfirmBtn" type="button">確定</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("guideDeleteCancelBtn").addEventListener("click", closeDeleteModal);
    document.getElementById("guideDeleteConfirmBtn").addEventListener("click", deleteGuide);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeDeleteModal();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeDeleteModal();
    });
  }

  function openDeleteModal(guideId, guideTitle) {
    createDeleteModal();

    pendingDeleteGuideId = guideId;
    pendingDeleteGuideTitle = guideTitle || "";

    const modal = document.getElementById("guideDeleteModal");
    const text = document.getElementById("guideDeleteText");
    const msg = document.getElementById("guideDeleteMsg");
    const confirmBtn = document.getElementById("guideDeleteConfirmBtn");

    text.innerText = `是否確定刪除文章「${pendingDeleteGuideTitle || "未命名文章"}」？刪除後將無法復原。`;
    msg.innerText = "";
    confirmBtn.disabled = false;
    confirmBtn.innerText = "確定";

    modal.classList.add("show");
  }

  function closeDeleteModal() {
    const modal = document.getElementById("guideDeleteModal");

    if (modal) {
      modal.classList.remove("show");
    }

    pendingDeleteGuideId = "";
    pendingDeleteGuideTitle = "";
  }

  async function deleteGuide() {
    const msg = document.getElementById("guideDeleteMsg");
    const confirmBtn = document.getElementById("guideDeleteConfirmBtn");

    if (!currentUser) {
      msg.innerText = "請先登入。";
      return;
    }

    if (!pendingDeleteGuideId) {
      msg.innerText = "找不到文章資料，請重新整理後再試。";
      return;
    }

    try {
      confirmBtn.disabled = true;
      confirmBtn.innerText = "刪除中...";

      const ref = db.collection("guides").doc(pendingDeleteGuideId);
      const snap = await ref.get();

      if (!snap.exists) {
        closeDeleteModal();
        return;
      }

      const data = snap.data();

      if (data.authorUid !== currentUser.uid) {
        msg.innerText = "只能刪除自己的文章。";
        confirmBtn.disabled = false;
        confirmBtn.innerText = "確定";
        return;
      }

      await ref.delete();
      closeDeleteModal();
    } catch (error) {
      console.error("刪除文章失敗：", error);
      msg.innerText = "刪除失敗，請稍後再試。";
      confirmBtn.disabled = false;
      confirmBtn.innerText = "確定";
    }
  }

  function renderGuides(snapshot) {
    const guideList = document.getElementById("guideList");

    if (!guideList) return;

    if (snapshot.empty) {
      guideList.innerHTML = `<div class="guide-empty">目前還沒有文章，快來發布第一篇吧！</div>`;
      return;
    }

    let html = "";

    snapshot.forEach(function (doc) {
      const data = doc.data();
      const isOwner = currentUser && data.authorUid === currentUser.uid;
      const category = getCategory(data);

      const coverImage = data.coverImage && data.coverImage.trim()
        ? data.coverImage.trim()
        : "/assets/img/home_page_img.png";

      html += `
        <article class="guide-card">
          <a class="guide-card-cover-link" href="/guides/post/?id=${encodeURIComponent(doc.id)}">
            <img class="guide-card-cover" src="${escapeHtml(coverImage)}" alt="${escapeHtml(data.title || "文章封面")}">
          </a>

          <div class="guide-card-body">
            <a class="guide-card-title-link" href="/guides/post/?id=${encodeURIComponent(doc.id)}">
              <h2>${escapeHtml(data.title || "未命名文章")}</h2>
            </a>

            <div class="guide-meta">
              主題：${escapeHtml(data.gameName || "未分類主題")}
              ・${escapeHtml(data.authorName || "未命名社員")}
              ・${escapeHtml(formatTime(data.createdAt))}
              ・${escapeHtml(category)}
            </div>

            <p class="guide-summary">${escapeHtml(data.summary || "這篇文章還沒有摘要。")}</p>

            <div class="guide-card-actions">
              <a class="guide-read-btn" href="/guides/post/?id=${encodeURIComponent(doc.id)}">閱讀全文</a>

              ${
                isOwner
                  ? `
                    <a class="guide-edit-btn" href="/guides/edit/?id=${encodeURIComponent(doc.id)}">編輯文章</a>
                    <button
                      class="guide-delete-btn"
                      type="button"
                      data-guide-id="${escapeHtml(doc.id)}"
                      data-guide-title="${escapeHtml(data.title || "未命名文章")}">
                      刪除文章
                    </button>
                  `
                  : ""
              }
            </div>
          </div>
        </article>
      `;
    });

    guideList.innerHTML = html;

    guideList.querySelectorAll(".guide-delete-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openDeleteModal(btn.dataset.guideId, btn.dataset.guideTitle);
      });
    });
  }

  function loadGuides() {
    if (unsubscribeGuides) {
      unsubscribeGuides();
      unsubscribeGuides = null;
    }

    unsubscribeGuides = db.collection("guides")
      .where("status", "==", "published")
      .orderBy("createdAt", "desc")
      .onSnapshot(renderGuides, function (error) {
        console.error("讀取文章列表失敗：", error);

        const guideList = document.getElementById("guideList");

        if (guideList) {
          guideList.innerHTML = `<div class="guide-empty">文章列表讀取失敗，請稍後再試。</div>`;
        }
      });
  }

  function injectExtraStyles() {
    if (document.getElementById("guideListOwnerStyle")) return;

    const style = document.createElement("style");
    style.id = "guideListOwnerStyle";
    style.innerHTML = `
      .guide-card {
        display: grid;
        grid-template-columns: 240px minmax(0, 1fr);
        gap: 1.35rem;
        align-items: center;
        padding: 1rem;
        border-radius: 16px;
        background: rgba(255,255,255,0.055);
        border: 1px solid rgba(255,255,255,0.08);
        color: inherit;
      }

      .guide-card-cover-link {
        display: block;
        line-height: 0;
      }

      .guide-card-cover {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 12px;
        background: #303437;
        display: block;
      }

      .guide-card-body {
        min-width: 0;
        display: block;
      }

      .guide-card-title-link {
        display: block !important;
        color: inherit;
        text-decoration: none;
        margin: 0 !important;
        padding: 0 !important;
      }

      .guide-card-title-link:hover {
        text-decoration: none;
      }

      .guide-card-title-link h2 {
        margin: 0 0 0.45rem 0 !important;
        padding: 0 !important;
        line-height: 1.25 !important;
        font-size: 1.45rem;
      }

      .guide-meta {
        opacity: 0.78;
        font-size: 0.92rem;
        line-height: 1.55;
        margin: 0 !important;
        padding: 0 !important;
      }

      .guide-summary {
        margin: 0.45rem 0 0 0 !important;
        padding: 0 !important;
        line-height: 1.65;
      }

      .guide-card-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: center;
        margin-top: 0.95rem;
      }

      .guide-read-btn,
      .guide-edit-btn,
      .guide-delete-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 7px 12px;
        border-radius: 999px;
        font-size: 0.88rem;
        font-weight: 700;
        text-decoration: none;
        border: 1px solid rgba(255,255,255,0.18);
        background: transparent;
        color: inherit;
        cursor: pointer;
        line-height: 1.2;
      }

      .guide-read-btn:hover,
      .guide-edit-btn:hover {
        border-color: rgb(79,177,186);
        text-decoration: none;
      }

      .guide-delete-btn:hover {
        border-color: #ff8a80;
        color: #ffb4a9;
      }

      @media (max-width: 720px) {
        .guide-card {
          grid-template-columns: 1fr;
          align-items: start;
        }

        .guide-card-cover {
          height: 190px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  createDeleteModal();
  injectExtraStyles();

  auth.onAuthStateChanged(function (user) {
    currentUser = user;
    loadGuides();
  });
})();
