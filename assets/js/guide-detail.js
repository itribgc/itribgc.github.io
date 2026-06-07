console.log("guide-detail.js 已載入");

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
  let currentGuideId = "";
  let currentGuideData = null;
  let currentCommentCount = 0;
  let hasCountedView = false;

  function getGuideId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
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

    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function getCategory(data) {
    return data.category || "桌遊攻略";
  }

  function getLikeCount(data) {
    return data.likeCount || 0;
  }

  function getViewCount(data) {
    return data.viewCount || 0;
  }

  function hasLiked() {
    if (!currentUser || !currentGuideData || !currentGuideData.likedBy) return false;
    return currentGuideData.likedBy[currentUser.uid] === true;
  }

  function isOwner() {
    return currentUser && currentGuideData && currentGuideData.authorUid === currentUser.uid;
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

  async function increaseViewCountOnce() {
    if (hasCountedView || !currentGuideId || !currentUser) return;

    const storageKey = "guide_viewed_" + currentGuideId;

    if (sessionStorage.getItem(storageKey) === "1") {
      hasCountedView = true;
      return;
    }

    try {
      hasCountedView = true;
      sessionStorage.setItem(storageKey, "1");

      await db.collection("guides").doc(currentGuideId).update({
        viewCount: firebase.firestore.FieldValue.increment(1),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error("更新瀏覽數失敗：", error);
    }
  }

  async function toggleGuideLike() {
    if (!currentUser) {
      alert("請先登入後再按讚。");
      return;
    }

    if (!currentGuideId) return;

    const ref = db.collection("guides").doc(currentGuideId);

    try {
      await db.runTransaction(async function (transaction) {
        const snap = await transaction.get(ref);

        if (!snap.exists) return;

        const data = snap.data();
        const likedBy = data.likedBy || {};
        const uid = currentUser.uid;
        const alreadyLiked = likedBy[uid] === true;

        if (alreadyLiked) {
          delete likedBy[uid];

          transaction.update(ref, {
            likedBy: likedBy,
            likeCount: Math.max((data.likeCount || 0) - 1, 0),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        } else {
          likedBy[uid] = true;

          transaction.update(ref, {
            likedBy: likedBy,
            likeCount: (data.likeCount || 0) + 1,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      });
    } catch (error) {
      console.error("文章按讚失敗：", error);
      alert("按讚失敗，請稍後再試。");
    }
  }

  function createDeleteModal() {
    if (document.getElementById("guideDetailDeleteModal")) return;

    const modal = document.createElement("div");
    modal.id = "guideDetailDeleteModal";
    modal.innerHTML = `
      <style>
        #guideDetailDeleteModal {
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

        #guideDetailDeleteModal.show {
          display: flex;
        }

        .guide-detail-delete-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          color: #222;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.34);
          box-sizing: border-box;
        }

        .guide-detail-delete-card h3 {
          margin: 0 0 12px 0;
          font-size: 20px;
          color: #222;
        }

        .guide-detail-delete-card p {
          margin: 0 0 16px 0;
          color: #555;
          font-size: 14px;
          line-height: 1.6;
        }

        #guideDetailDeleteMsg {
          min-height: 20px;
          margin-top: 10px;
          color: #d93025;
          font-size: 14px;
          line-height: 1.5;
        }

        .guide-detail-delete-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .guide-detail-delete-actions button {
          padding: 9px 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        #guideDetailDeleteCancelBtn {
          background: #e8e8e8;
          color: #333;
        }

        #guideDetailDeleteConfirmBtn {
          background: #d93025;
          color: #fff;
        }

        .guide-detail-delete-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      </style>

      <div class="guide-detail-delete-card">
        <h3>刪除文章</h3>
        <p id="guideDetailDeleteText">是否確定刪除文章？刪除後將無法復原。</p>
        <div id="guideDetailDeleteMsg"></div>

        <div class="guide-detail-delete-actions">
          <button id="guideDetailDeleteCancelBtn" type="button">取消</button>
          <button id="guideDetailDeleteConfirmBtn" type="button">確定</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("guideDetailDeleteCancelBtn").addEventListener("click", closeDeleteModal);
    document.getElementById("guideDetailDeleteConfirmBtn").addEventListener("click", deleteCurrentGuide);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeDeleteModal();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeDeleteModal();
    });
  }

  function openDeleteModal() {
    if (!isOwner()) return;

    createDeleteModal();

    const modal = document.getElementById("guideDetailDeleteModal");
    const text = document.getElementById("guideDetailDeleteText");
    const msg = document.getElementById("guideDetailDeleteMsg");
    const confirmBtn = document.getElementById("guideDetailDeleteConfirmBtn");

    text.innerText = `是否確定刪除文章「${currentGuideData.title || "未命名文章"}」？刪除後將無法復原。`;
    msg.innerText = "";
    confirmBtn.disabled = false;
    confirmBtn.innerText = "確定";

    modal.classList.add("show");
  }

  function closeDeleteModal() {
    const modal = document.getElementById("guideDetailDeleteModal");

    if (modal) {
      modal.classList.remove("show");
    }
  }

  async function deleteCurrentGuide() {
    const msg = document.getElementById("guideDetailDeleteMsg");
    const confirmBtn = document.getElementById("guideDetailDeleteConfirmBtn");

    if (!currentUser) {
      msg.innerText = "請先登入。";
      return;
    }

    if (!currentGuideId || !currentGuideData) {
      msg.innerText = "找不到文章資料，請重新整理後再試。";
      return;
    }

    if (!isOwner()) {
      msg.innerText = "只能刪除自己的文章。";
      return;
    }

    try {
      confirmBtn.disabled = true;
      confirmBtn.innerText = "刪除中...";

      await db.collection("guides").doc(currentGuideId).delete();

      window.location.href = "/guides/";
    } catch (error) {
      console.error("刪除文章失敗：", error);
      msg.innerText = "刪除失敗，請稍後再試。";
      confirmBtn.disabled = false;
      confirmBtn.innerText = "確定";
    }
  }

  function injectDetailStyle() {
    if (document.getElementById("guideDetailExtraStyle")) return;

    const style = document.createElement("style");
    style.id = "guideDetailExtraStyle";
    style.innerHTML = `
      .guide-detail-top-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }

      .guide-detail-title-wrap {
        min-width: 0;
      }

      .guide-detail-title-wrap h1 {
        margin-bottom: 0.5rem;
      }

      .guide-detail-side-info {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 0.45rem;
        flex: 0 0 auto;
        margin-top: 0.25rem;
      }

      .guide-detail-category,
      .guide-detail-stat,
      .guide-detail-like-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        padding: 5px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.055);
        color: inherit;
        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1.2;
        white-space: nowrap;
      }

      .guide-detail-category {
        background: rgba(79,177,186,0.16);
        border-color: rgba(79,177,186,0.35);
      }

      .guide-detail-like-btn {
        cursor: pointer;
      }

      .guide-detail-like-btn:hover,
      .guide-detail-like-btn.liked {
        border-color: rgb(79,177,186);
        background: rgba(79,177,186,0.16);
      }

      .guide-detail-owner-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 1.25rem;
        margin-bottom: 1.5rem;
      }

      .guide-detail-edit-btn,
      .guide-detail-delete-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 13px;
        border-radius: 999px;
        font-size: 0.9rem;
        font-weight: 700;
        text-decoration: none;
        border: 1px solid rgba(255,255,255,0.18);
        background: transparent;
        color: inherit;
        cursor: pointer;
        line-height: 1.2;
      }

      .guide-detail-edit-btn:hover {
        border-color: rgb(79,177,186);
        text-decoration: none;
      }

      .guide-detail-delete-btn:hover {
        border-color: #ff8a80;
        color: #ffb4a9;
      }

      .guide-detail-content mark {
        padding: 0.1em 0.25em;
        border-radius: 0.25em;
        background: #fff176;
        color: #222;
      }

      @media (max-width: 640px) {
        .guide-detail-top-row {
          flex-direction: column-reverse;
          align-items: flex-start;
        }

        .guide-detail-side-info {
          justify-content: flex-start;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function renderGuide() {
    const guideDetail = document.getElementById("guideDetail");

    if (!guideDetail || !currentGuideData) return;

    const data = currentGuideData;
    const category = getCategory(data);
    const likeCount = getLikeCount(data);
    const viewCount = getViewCount(data);
    const liked = hasLiked();

    const coverImage = data.coverImage && data.coverImage.trim()
      ? data.coverImage.trim()
      : "";

    let rawHtml = "";

    if (window.marked) {
      rawHtml = window.marked.parse(data.contentMarkdown || "");
    } else {
      rawHtml = "<p>" + escapeHtml(data.contentMarkdown || "").replaceAll("\n", "<br>") + "</p>";
    }

    const safeHtml = window.DOMPurify
      ? window.DOMPurify.sanitize(rawHtml, {
          ADD_ATTR: ["style"]
        })
      : rawHtml;

    document.title = (data.title || "社員論壇文章") + " | " + document.title;

    guideDetail.innerHTML = `
      ${coverImage ? `<img class="guide-detail-cover" src="${escapeHtml(coverImage)}" alt="${escapeHtml(data.title || "文章封面")}">` : ""}

      <div class="guide-detail-top-row">
        <div class="guide-detail-title-wrap">
          <h1>${escapeHtml(data.title || "未命名文章")}</h1>

          <div class="guide-detail-meta">
            主題：${escapeHtml(data.gameName || "未分類主題")}
            ・${escapeHtml(data.authorName || "未命名社員")}
            ・${escapeHtml(formatTime(data.createdAt))}
          </div>
        </div>

        <div class="guide-detail-side-info">
          <span class="guide-detail-category">${escapeHtml(category)}</span>
          <button id="guideLikeBtn" class="guide-detail-like-btn ${liked ? "liked" : ""}" type="button">👍 ${likeCount}</button>
          <span class="guide-detail-stat">👁 ${viewCount}</span>
          <span class="guide-detail-stat">💬 ${currentCommentCount}</span>
        </div>
      </div>

      ${
        isOwner()
          ? `
            <div class="guide-detail-owner-actions">
              <a class="guide-detail-edit-btn" href="/guides/edit/?id=${encodeURIComponent(currentGuideId)}">編輯文章</a>
              <button class="guide-detail-delete-btn" id="guideDetailDeleteBtn" type="button">刪除文章</button>
            </div>
          `
          : ""
      }

      <div class="guide-detail-summary">
        ${escapeHtml(data.summary || "")}
      </div>

      <div class="guide-detail-content">
        ${safeHtml}
      </div>

      <div class="guide-detail-actions">
        <a href="/guides/">返回社員論壇</a>
      </div>
    `;

    const deleteBtn = document.getElementById("guideDetailDeleteBtn");
    const likeBtn = document.getElementById("guideLikeBtn");

    if (deleteBtn) {
      deleteBtn.addEventListener("click", openDeleteModal);
    }

    if (likeBtn) {
      likeBtn.addEventListener("click", toggleGuideLike);
    }
  }

  function listenGuide() {
    if (!currentGuideId) return;

    db.collection("guides").doc(currentGuideId).onSnapshot(async function (doc) {
      if (!doc.exists) {
        const guideDetail = document.getElementById("guideDetail");
        if (guideDetail) {
          guideDetail.innerHTML = `<div class="guide-empty">找不到這篇文章。</div>`;
        }
        return;
      }

      const data = doc.data();

      if (data.status !== "published") {
        const guideDetail = document.getElementById("guideDetail");
        if (guideDetail) {
          guideDetail.innerHTML = `<div class="guide-empty">這篇文章目前未公開。</div>`;
        }
        return;
      }

      currentGuideData = data;
      currentCommentCount = await getCommentCount(currentGuideId);

      injectDetailStyle();
      renderGuide();

      await increaseViewCountOnce();
    }, function (error) {
      console.error("讀取文章失敗：", error);
      const guideDetail = document.getElementById("guideDetail");
      if (guideDetail) {
        guideDetail.innerHTML = `<div class="guide-empty">文章讀取失敗，請稍後再試。</div>`;
      }
    });
  }

  function init() {
    const guideDetail = document.getElementById("guideDetail");
    const guideId = getGuideId();

    if (!guideDetail) return;

    if (!guideId) {
      guideDetail.innerHTML = `<div class="guide-empty">找不到文章 ID。</div>`;
      return;
    }

    currentGuideId = guideId;
    listenGuide();
  }

  createDeleteModal();

  auth.onAuthStateChanged(function (user) {
    currentUser = user;

    if (currentGuideData) {
      renderGuide();
      increaseViewCountOnce();
    }
  });

  document.addEventListener("DOMContentLoaded", init);
})();
