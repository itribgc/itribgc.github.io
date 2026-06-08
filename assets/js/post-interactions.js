console.log("post-interactions.js 已載入");

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
  let currentDisplayName = "";
  let postId = "";
  let postPath = "";
  let postTitle = "";
  let postStats = {
    likeCount: 0,
    viewCount: 0,
    likedBy: {}
  };

  let unsubscribeStats = null;
  let unsubscribeComments = null;
  let currentComments = [];

  function isGuidePostPage() {
    return window.location.pathname.startsWith("/guides/post/");
  }

  function isNewsletterPage() {
    return window.location.pathname.startsWith("/newsletter");
  }

  function shouldRun() {
    if (!window.BGC_POST_PAGE) return false;
    if (isGuidePostPage()) return false;
    if (isNewsletterPage()) return false;
    return true;
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function makePostId(path) {
    return encodeURIComponent(path)
      .replaceAll(".", "%2E")
      .replaceAll("/", "%2F")
      .replaceAll("%", "_");
  }

  function getPostPath() {
    return window.BGC_POST_URL || window.location.pathname;
  }

  function getPostTitle() {
    const fromWindow = window.BGC_POST_TITLE || "";
    if (fromWindow && fromWindow !== "null") return fromWindow;

    const h1 = document.querySelector("h1");
    if (h1) return h1.innerText.trim();

    return document.title || "未命名文章";
  }

  function findArticleContainer() {
    const selectors = [
      "article",
      ".post",
      ".page",
      ".content",
      "main"
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    return document.body;
  }

  async function getDisplayName(user) {
    if (!user) return "";

    try {
      const userDoc = await db.collection("users").doc(user.uid).get();

      if (userDoc.exists && userDoc.data().displayName) {
        return userDoc.data().displayName;
      }
    } catch (error) {
      console.error("讀取社員 ID 失敗：", error);
    }

    return user.displayName || user.email || "未命名社員";
  }

  function ensureStyles() {
    if (document.getElementById("postInteractionsStyle")) return;

    const style = document.createElement("style");
    style.id = "postInteractionsStyle";
    style.innerHTML = `
      .post-interactions {
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(255,255,255,0.12);
      }

      .post-interaction-bar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.55rem;
        margin-bottom: 1.5rem;
      }

      .post-like-btn,
      .post-stat-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 13px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.055);
        color: inherit;
        font: inherit;
        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .post-like-btn {
        cursor: pointer;
      }

      .post-like-btn:hover,
      .post-like-btn.liked {
        border-color: rgb(79,177,186);
        background: rgba(79,177,186,0.16);
      }

      .post-comment-section {
        margin-top: 1.2rem;
      }

      .post-comment-section h2 {
        margin-bottom: 1rem;
      }

      .post-comment-form {
        margin-bottom: 1.4rem;
        padding: 1rem;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.10);
        background: rgba(255,255,255,0.04);
      }

      .post-comment-form textarea {
        width: 100%;
        min-height: 96px;
        box-sizing: border-box;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.06);
        color: inherit;
        font: inherit;
        line-height: 1.6;
        resize: vertical;
      }

      .post-comment-form textarea::placeholder {
        color: rgba(255,255,255,0.5);
      }

      .post-comment-form button,
      .post-comment-action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-top: 0.7rem;
        padding: 7px 13px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.18);
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 0.88rem;
        font-weight: 700;
        line-height: 1.2;
        cursor: pointer;
      }

      .post-comment-form button:hover,
      .post-comment-action-btn:hover {
        border-color: rgb(79,177,186);
        background: rgba(79,177,186,0.12);
      }

      .post-comment-form button:disabled,
      .post-comment-action-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .post-comment-msg {
        min-height: 22px;
        margin-top: 0.6rem;
        color: #ffb4a9;
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .post-comment-msg.success {
        color: #8fd19e;
      }

      .post-comment-list {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }

      .post-comment-card {
        padding: 0.95rem;
        border-radius: 16px;
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(255,255,255,0.08);
      }

      .post-comment-header {
        display: flex;
        justify-content: space-between;
        gap: 0.8rem;
        align-items: flex-start;
        margin-bottom: 0.5rem;
      }

      .post-comment-author {
        font-weight: 800;
      }

      .post-comment-time {
        opacity: 0.6;
        font-size: 0.82rem;
        white-space: nowrap;
      }

      .post-comment-content {
        line-height: 1.7;
        white-space: pre-wrap;
      }

      .post-comment-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-top: 0.75rem;
      }

      .post-comment-like-btn.liked {
        border-color: rgb(79,177,186);
        background: rgba(79,177,186,0.16);
      }

      .post-comment-edit-area {
        display: none;
        margin-top: 0.75rem;
      }

      .post-comment-edit-area.show {
        display: block;
      }

      .post-comment-edit-area textarea {
        width: 100%;
        min-height: 90px;
        box-sizing: border-box;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.06);
        color: inherit;
        font: inherit;
        line-height: 1.6;
        resize: vertical;
      }

      .post-comment-empty {
        padding: 1rem;
        border-radius: 12px;
        background: rgba(255,255,255,0.045);
        opacity: 0.75;
      }

      #postCommentDeleteModal {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(0,0,0,0.62);
        box-sizing: border-box;
      }

      #postCommentDeleteModal.show {
        display: flex;
      }

      .post-comment-delete-card {
        width: 100%;
        max-width: 420px;
        padding: 24px;
        border-radius: 14px;
        background: #fff;
        color: #222;
        box-shadow: 0 16px 40px rgba(0,0,0,0.34);
      }

      .post-comment-delete-card h3 {
        margin: 0 0 12px;
        color: #222;
      }

      .post-comment-delete-card p {
        margin: 0 0 14px;
        color: #555;
        line-height: 1.6;
        font-size: 14px;
      }

      .post-comment-delete-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 18px;
      }

      .post-comment-delete-actions button {
        padding: 9px 14px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 700;
      }

      #postCommentDeleteCancelBtn {
        background: #e8e8e8;
        color: #333;
      }

      #postCommentDeleteConfirmBtn {
        background: #d93025;
        color: #fff;
      }
    `;

    document.head.appendChild(style);
  }

  function createContainer() {
    if (document.getElementById("postInteractions")) return;

    const wrapper = document.createElement("section");
    wrapper.id = "postInteractions";
    wrapper.className = "post-interactions";
    wrapper.innerHTML = `
      <div class="post-interaction-bar">
        <button id="postLikeBtn" class="post-like-btn" type="button">👍 0</button>
        <span id="postViewCount" class="post-stat-pill">👁 0</span>
        <span id="postCommentCount" class="post-stat-pill">💬 0</span>
      </div>

      <div class="post-comment-section">
        <h2>留言區</h2>

        <div class="post-comment-form">
          <textarea id="postCommentInput" maxlength="500" placeholder="寫下你的留言吧！"></textarea>
          <br>
          <button id="postCommentSubmitBtn" type="button">送出留言</button>
          <div id="postCommentMsg" class="post-comment-msg"></div>
        </div>

        <div id="postCommentList" class="post-comment-list">
          <div class="post-comment-empty">留言載入中...</div>
        </div>
      </div>
    `;

    const target = findArticleContainer();
    target.appendChild(wrapper);

    document.getElementById("postLikeBtn").addEventListener("click", togglePostLike);
    document.getElementById("postCommentSubmitBtn").addEventListener("click", submitComment);

    createDeleteModal();
  }

  function createDeleteModal() {
    if (document.getElementById("postCommentDeleteModal")) return;

    const modal = document.createElement("div");
    modal.id = "postCommentDeleteModal";
    modal.innerHTML = `
      <div class="post-comment-delete-card">
        <h3>刪除留言</h3>
        <p>是否確定刪除留言？刪除後無法復原。</p>
        <div class="post-comment-delete-actions">
          <button id="postCommentDeleteCancelBtn" type="button">取消</button>
          <button id="postCommentDeleteConfirmBtn" type="button">確定</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("postCommentDeleteCancelBtn").addEventListener("click", closeDeleteModal);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeDeleteModal();
    });
  }

  function openDeleteModal(commentId) {
    const modal = document.getElementById("postCommentDeleteModal");
    const confirmBtn = document.getElementById("postCommentDeleteConfirmBtn");

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener("click", function () {
      deleteComment(commentId);
    });

    modal.classList.add("show");
  }

  function closeDeleteModal() {
    const modal = document.getElementById("postCommentDeleteModal");
    if (modal) modal.classList.remove("show");
  }

  async function ensurePostStatsDoc() {
    const ref = db.collection("postStats").doc(postId);
    const doc = await ref.get();

    if (!doc.exists) {
      await ref.set({
        postPath: postPath,
        title: postTitle,
        likeCount: 0,
        viewCount: 0,
        likedBy: {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  async function increaseViewCountOnce() {
    if (!currentUser) return;

    const storageKey = "post_viewed_" + postId;

    if (sessionStorage.getItem(storageKey) === "1") {
      return;
    }

    try {
      sessionStorage.setItem(storageKey, "1");

      await db.collection("postStats").doc(postId).set({
        postPath: postPath,
        title: postTitle,
        viewCount: firebase.firestore.FieldValue.increment(1),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("更新文章瀏覽數失敗：", error);
    }
  }

  function listenPostStats() {
    if (unsubscribeStats) unsubscribeStats();

    unsubscribeStats = db.collection("postStats").doc(postId)
      .onSnapshot(function (doc) {
        if (!doc.exists) return;

        postStats = doc.data();

        renderPostStats();
      }, function (error) {
        console.error("讀取文章互動資料失敗：", error);
      });
  }

  function renderPostStats() {
    const likeBtn = document.getElementById("postLikeBtn");
    const viewCount = document.getElementById("postViewCount");

    if (!likeBtn || !viewCount) return;

    const likeCount = Number(postStats.likeCount || 0);
    const views = Number(postStats.viewCount || 0);
    const liked = currentUser && postStats.likedBy && postStats.likedBy[currentUser.uid] === true;

    likeBtn.innerText = "👍 " + likeCount;
    likeBtn.classList.toggle("liked", !!liked);
    viewCount.innerText = "👁 " + views;
  }

  async function togglePostLike() {
    if (!currentUser) {
      alert("請先登入後再按讚。");
      return;
    }

    const ref = db.collection("postStats").doc(postId);

    try {
      await db.runTransaction(async function (transaction) {
        const snap = await transaction.get(ref);

        const data = snap.exists ? snap.data() : {
          postPath: postPath,
          title: postTitle,
          likedBy: {},
          likeCount: 0,
          viewCount: 0
        };

        const likedBy = data.likedBy || {};
        const uid = currentUser.uid;
        const alreadyLiked = likedBy[uid] === true;

        if (alreadyLiked) {
          delete likedBy[uid];

          transaction.set(ref, {
            postPath: postPath,
            title: postTitle,
            likedBy: likedBy,
            likeCount: Math.max(Number(data.likeCount || 0) - 1, 0),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } else {
          likedBy[uid] = true;

          transaction.set(ref, {
            postPath: postPath,
            title: postTitle,
            likedBy: likedBy,
            likeCount: Number(data.likeCount || 0) + 1,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      });
    } catch (error) {
      console.error("文章按讚失敗：", error);
      alert("按讚失敗，請稍後再試。");
    }
  }

  function setCommentMsg(text, type) {
    const msg = document.getElementById("postCommentMsg");
    if (!msg) return;

    msg.innerText = text || "";
    msg.className = type === "success" ? "post-comment-msg success" : "post-comment-msg";
  }

  async function submitComment() {
    if (!currentUser) {
      setCommentMsg("請先登入後再留言。");
      return;
    }

    const input = document.getElementById("postCommentInput");
    const submitBtn = document.getElementById("postCommentSubmitBtn");
    const content = input.value.trim();

    if (!content) {
      setCommentMsg("請輸入留言內容。");
      input.focus();
      return;
    }

    if (content.length > 500) {
      setCommentMsg("留言請控制在 500 字以內。");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = "送出中...";

      if (!currentDisplayName) {
        currentDisplayName = await getDisplayName(currentUser);
      }

      await db.collection("comments").add({
        postPath: postPath,
        uid: currentUser.uid,
        displayName: currentDisplayName,
        content: content,
        likedBy: {},
        likeCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      input.value = "";
      setCommentMsg("留言已送出。", "success");
    } catch (error) {
      console.error("送出留言失敗：", error);
      setCommentMsg("留言送出失敗，請稍後再試。");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "送出留言";
    }
  }

  function listenComments() {
    if (unsubscribeComments) unsubscribeComments();

    unsubscribeComments = db.collection("comments")
      .where("postPath", "==", postPath)
      .onSnapshot(function (snapshot) {
        currentComments = snapshot.docs.map(function (doc) {
          return {
            id: doc.id,
            data: doc.data()
          };
        });

        currentComments.sort(function (a, b) {
          const aTime = a.data.createdAt && a.data.createdAt.toMillis ? a.data.createdAt.toMillis() : 0;
          const bTime = b.data.createdAt && b.data.createdAt.toMillis ? b.data.createdAt.toMillis() : 0;
          return aTime - bTime;
        });

        renderComments();
      }, function (error) {
        console.error("讀取留言失敗：", error);

        const list = document.getElementById("postCommentList");
        if (list) {
          list.innerHTML = `<div class="post-comment-empty">留言讀取失敗，請稍後再試。</div>`;
        }
      });
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

  function renderComments() {
    const list = document.getElementById("postCommentList");
    const commentCount = document.getElementById("postCommentCount");

    if (!list) return;

    if (commentCount) {
      commentCount.innerText = "💬 " + currentComments.length;
    }

    if (currentComments.length === 0) {
      list.innerHTML = `<div class="post-comment-empty">目前還沒有留言，快來留下第一則吧！</div>`;
      return;
    }

    let html = "";

    currentComments.forEach(function (item) {
      const data = item.data;
      const isOwner = currentUser && data.uid === currentUser.uid;
      const liked = currentUser && data.likedBy && data.likedBy[currentUser.uid] === true;

      html += `
        <div class="post-comment-card" data-comment-id="${escapeHtml(item.id)}">
          <div class="post-comment-header">
            <div>
              <div class="post-comment-author">${escapeHtml(data.displayName || "未命名社員")}</div>
              <div class="post-comment-time">${escapeHtml(formatTime(data.createdAt))}</div>
            </div>
          </div>

          <div id="postCommentContent-${escapeHtml(item.id)}" class="post-comment-content">${escapeHtml(data.content || "")}</div>

          <div id="postCommentEditArea-${escapeHtml(item.id)}" class="post-comment-edit-area">
            <textarea id="postCommentEditInput-${escapeHtml(item.id)}" maxlength="500">${escapeHtml(data.content || "")}</textarea>
            <div class="post-comment-actions">
              <button class="post-comment-action-btn post-comment-save-btn" type="button" data-comment-id="${escapeHtml(item.id)}">儲存</button>
              <button class="post-comment-action-btn post-comment-cancel-edit-btn" type="button" data-comment-id="${escapeHtml(item.id)}">取消</button>
            </div>
          </div>

          <div class="post-comment-actions">
            <button class="post-comment-action-btn post-comment-like-btn ${liked ? "liked" : ""}" type="button" data-comment-id="${escapeHtml(item.id)}">
              👍 ${Number(data.likeCount || 0)}
            </button>

            ${
              isOwner
                ? `
                  <button class="post-comment-action-btn post-comment-edit-btn" type="button" data-comment-id="${escapeHtml(item.id)}">編輯</button>
                  <button class="post-comment-action-btn post-comment-delete-btn" type="button" data-comment-id="${escapeHtml(item.id)}">刪除</button>
                `
                : ""
            }
          </div>
        </div>
      `;
    });

    list.innerHTML = html;

    list.querySelectorAll(".post-comment-like-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        toggleCommentLike(btn.dataset.commentId);
      });
    });

    list.querySelectorAll(".post-comment-edit-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openCommentEdit(btn.dataset.commentId);
      });
    });

    list.querySelectorAll(".post-comment-cancel-edit-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        closeCommentEdit(btn.dataset.commentId);
      });
    });

    list.querySelectorAll(".post-comment-save-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        saveCommentEdit(btn.dataset.commentId);
      });
    });

    list.querySelectorAll(".post-comment-delete-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openDeleteModal(btn.dataset.commentId);
      });
    });
  }

  async function toggleCommentLike(commentId) {
    if (!currentUser) {
      alert("請先登入後再按讚。");
      return;
    }

    const ref = db.collection("comments").doc(commentId);

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
            likeCount: Math.max(Number(data.likeCount || 0) - 1, 0),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        } else {
          likedBy[uid] = true;

          transaction.update(ref, {
            likedBy: likedBy,
            likeCount: Number(data.likeCount || 0) + 1,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      });
    } catch (error) {
      console.error("留言按讚失敗：", error);
      alert("留言按讚失敗，請稍後再試。");
    }
  }

  function openCommentEdit(commentId) {
    const area = document.getElementById("postCommentEditArea-" + commentId);
    const content = document.getElementById("postCommentContent-" + commentId);

    if (area) area.classList.add("show");
    if (content) content.style.display = "none";
  }

  function closeCommentEdit(commentId) {
    const area = document.getElementById("postCommentEditArea-" + commentId);
    const content = document.getElementById("postCommentContent-" + commentId);

    if (area) area.classList.remove("show");
    if (content) content.style.display = "";
  }

  async function saveCommentEdit(commentId) {
    const input = document.getElementById("postCommentEditInput-" + commentId);

    if (!input) return;

    const content = input.value.trim();

    if (!content) {
      alert("留言內容不能空白。");
      input.focus();
      return;
    }

    if (content.length > 500) {
      alert("留言請控制在 500 字以內。");
      return;
    }

    try {
      await db.collection("comments").doc(commentId).update({
        content: content,
        editedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      closeCommentEdit(commentId);
    } catch (error) {
      console.error("編輯留言失敗：", error);
      alert("編輯留言失敗，請稍後再試。");
    }
  }

  async function deleteComment(commentId) {
    try {
      await db.collection("comments").doc(commentId).delete();
      closeDeleteModal();
    } catch (error) {
      console.error("刪除留言失敗：", error);
      alert("刪除留言失敗，請稍後再試。");
    }
  }

  async function init() {
    if (!shouldRun()) return;

    ensureStyles();

    postPath = getPostPath();
    postTitle = getPostTitle();
    postId = makePostId(postPath);

    createContainer();

    auth.onAuthStateChanged(async function (user) {
      currentUser = user;

      if (user) {
        currentDisplayName = await getDisplayName(user);
        await ensurePostStatsDoc();
        await increaseViewCountOnce();
      }

      renderPostStats();
      renderComments();
    });

    listenPostStats();
    listenComments();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
