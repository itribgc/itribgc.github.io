console.log("comment-section.js 已載入");

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
  let unsubscribeComments = null;

  function normalizePath(path) {
    if (!path.endsWith("/")) {
      return path + "/";
    }
    return path;
  }

  function getPostPath() {
    return normalizePath(window.location.pathname);
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
    if (!timestamp || !timestamp.toDate) {
      return "剛剛";
    }

    const date = timestamp.toDate();

    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  async function getCurrentDisplayName(user) {
    if (!user) {
      return "";
    }

    try {
      const userDoc = await db.collection("users").doc(user.uid).get();

      if (userDoc.exists && userDoc.data().displayName) {
        return userDoc.data().displayName;
      }

      if (user.displayName) {
        return user.displayName;
      }

      return "";
    } catch (error) {
      console.error("讀取社員 ID 失敗：", error);
      return user.displayName || "";
    }
  }

  function createCommentSection() {
    if (document.getElementById("firebaseCommentSection")) {
      return;
    }

    const article = document.querySelector("article");

    if (!article) {
      console.warn("找不到 article，無法插入留言區");
      return;
    }

    const section = document.createElement("section");
    section.id = "firebaseCommentSection";
    section.className = "firebase-comment-section";

    section.innerHTML = `
      <style>
        .firebase-comment-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.14);
        }

        .firebase-comment-title {
          margin: 0 0 0.75rem 0;
          font-size: 1.55rem;
          font-weight: 700;
        }

        .firebase-comment-subtitle {
          margin: 0 0 1.25rem 0;
          opacity: 0.76;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .firebase-comment-profile-warning {
          display: none;
          margin-bottom: 1rem;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(255, 193, 7, 0.16);
          border: 1px solid rgba(255, 193, 7, 0.38);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .firebase-comment-user {
          margin-bottom: 0.75rem;
          font-size: 0.92rem;
          opacity: 0.86;
        }

        .firebase-comment-form {
          margin-bottom: 1.7rem;
        }

        .firebase-comment-textarea {
          width: 100%;
          min-height: 100px;
          padding: 12px 14px;
          box-sizing: border-box;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          color: inherit;
          font: inherit;
          resize: vertical;
          outline: none;
        }

        .firebase-comment-textarea:focus {
          border-color: rgb(79,177,186);
          box-shadow: 0 0 0 2px rgba(79,177,186,0.22);
        }

        .firebase-comment-textarea:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .firebase-comment-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 0.75rem;
        }

        .firebase-comment-count {
          font-size: 0.85rem;
          opacity: 0.65;
        }

        .firebase-comment-submit {
          padding: 9px 16px;
          border: none;
          border-radius: 9px;
          background: rgb(79,177,186);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        .firebase-comment-submit:hover {
          filter: brightness(1.05);
        }

        .firebase-comment-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .firebase-comment-message {
          margin-top: 0.75rem;
          min-height: 20px;
          font-size: 0.9rem;
          color: #ffb4a9;
          line-height: 1.5;
        }

        .firebase-comment-message.success {
          color: #8fd19e;
        }

        .firebase-comment-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .firebase-comment-item {
          padding: 1rem;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .firebase-comment-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.65rem;
          font-size: 0.86rem;
          opacity: 0.78;
        }

        .firebase-comment-name {
          font-weight: 700;
          opacity: 0.98;
        }

        .firebase-comment-content {
          white-space: pre-wrap;
          line-height: 1.75;
          margin-bottom: 0.85rem;
        }

        .firebase-comment-footer {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .firebase-like-btn {
          padding: 6px 11px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 0.86rem;
        }

        .firebase-like-btn:hover {
          border-color: rgb(79,177,186);
        }

        .firebase-like-btn.liked {
          background: rgba(79,177,186,0.18);
          border-color: rgb(79,177,186);
        }

        .firebase-like-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .firebase-comment-empty {
          padding: 1rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.045);
          opacity: 0.74;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        @media (max-width: 600px) {
          .firebase-comment-actions-row {
            align-items: stretch;
            flex-direction: column;
          }

          .firebase-comment-submit {
            width: 100%;
          }
        }
      </style>

      <h2 class="firebase-comment-title">留言區</h2>
      <p class="firebase-comment-subtitle">登入社員可以針對這篇文章留言，也可以幫喜歡的留言按讚。</p>

      <div id="commentProfileWarning" class="firebase-comment-profile-warning">
        請先設定社員 ID，才能留言。你可以點右上角的「設定 ID」進行設定。
      </div>

      <div class="firebase-comment-form">
        <div id="commentUser" class="firebase-comment-user">正在確認登入狀態...</div>

        <textarea
          id="commentInput"
          class="firebase-comment-textarea"
          maxlength="500"
          placeholder="留下你的想法..."
          disabled></textarea>

        <div class="firebase-comment-actions-row">
          <span id="commentCount" class="firebase-comment-count">0 / 500</span>
          <button id="commentSubmitBtn" class="firebase-comment-submit" type="button" disabled>送出留言</button>
        </div>

        <div id="commentMessage" class="firebase-comment-message"></div>
      </div>

      <div id="commentList" class="firebase-comment-list">
        <div class="firebase-comment-empty">留言載入中...</div>
      </div>
    `;

    article.appendChild(section);
  }

  function setMessage(text, type) {
    const commentMessage = document.getElementById("commentMessage");

    if (!commentMessage) {
      return;
    }

    commentMessage.innerText = text || "";
    commentMessage.className = type === "success"
      ? "firebase-comment-message success"
      : "firebase-comment-message";
  }

  function updateFormState() {
    const commentUser = document.getElementById("commentUser");
    const commentInput = document.getElementById("commentInput");
    const commentSubmitBtn = document.getElementById("commentSubmitBtn");
    const warning = document.getElementById("commentProfileWarning");

    if (!commentUser || !commentInput || !commentSubmitBtn || !warning) {
      return;
    }

    if (!currentUser) {
      commentUser.innerText = "請先登入後再留言。";
      commentInput.disabled = true;
      commentSubmitBtn.disabled = true;
      warning.style.display = "none";
      return;
    }

    if (!currentDisplayName) {
      commentUser.innerText = "目前已登入，但尚未設定社員 ID。";
      commentInput.disabled = true;
      commentSubmitBtn.disabled = true;
      warning.style.display = "block";
      return;
    }

    commentUser.innerText = "目前身分：" + currentDisplayName;
    commentInput.disabled = false;
    commentSubmitBtn.disabled = false;
    warning.style.display = "none";
  }

  function renderComments(snapshot) {
    const commentList = document.getElementById("commentList");

    if (!commentList) {
      return;
    }

    if (snapshot.empty) {
      commentList.innerHTML = `<div class="firebase-comment-empty">目前還沒有留言，快來當第一個留言的人吧！</div>`;
      return;
    }

    let html = "";

    snapshot.forEach(function (doc) {
      const data = doc.data();
      const likedBy = data.likedBy || {};
      const uid = currentUser ? currentUser.uid : "";
      const isLiked = uid && likedBy[uid] === true;
      const likeCount = data.likeCount || 0;

      html += `
        <div class="firebase-comment-item">
          <div class="firebase-comment-meta">
            <span class="firebase-comment-name">${escapeHtml(data.displayName || "未命名社員")}</span>
            <span>・</span>
            <span>${escapeHtml(formatTime(data.createdAt))}</span>
          </div>

          <div class="firebase-comment-content">${escapeHtml(data.content)}</div>

          <div class="firebase-comment-footer">
            <button
              class="firebase-like-btn ${isLiked ? "liked" : ""}"
              type="button"
              data-comment-id="${doc.id}">
              👍 ${likeCount}
            </button>
          </div>
        </div>
      `;
    });

    commentList.innerHTML = html;

    commentList.querySelectorAll(".firebase-like-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        toggleLike(btn.dataset.commentId);
      });
    });
  }

  function listenComments() {
    const postPath = getPostPath();

    if (unsubscribeComments) {
      unsubscribeComments();
      unsubscribeComments = null;
    }

    unsubscribeComments = db.collection("comments")
      .where("postPath", "==", postPath)
      .orderBy("createdAt", "desc")
      .onSnapshot(function (snapshot) {
        renderComments(snapshot);
      }, function (error) {
        console.error("讀取留言失敗：", error);

        const commentList = document.getElementById("commentList");

        if (commentList) {
          commentList.innerHTML = `<div class="firebase-comment-empty">留言讀取失敗，請稍後再試。</div>`;
        }
      });
  }

  async function submitComment() {
    const commentInput = document.getElementById("commentInput");
    const commentSubmitBtn = document.getElementById("commentSubmitBtn");

    if (!commentInput || !commentSubmitBtn) {
      return;
    }

    setMessage("");

    if (!currentUser) {
      setMessage("請先登入後再留言。");
      return;
    }

    if (!currentDisplayName) {
      setMessage("請先設定社員 ID，才能留言。");
      return;
    }

    const content = commentInput.value.trim();

    if (!content) {
      setMessage("請先輸入留言內容。");
      commentInput.focus();
      return;
    }

    if (content.length > 500) {
      setMessage("留言請控制在 500 字以內。");
      return;
    }

    try {
      commentSubmitBtn.disabled = true;
      commentSubmitBtn.innerText = "送出中...";

      await db.collection("comments").add({
        postPath: getPostPath(),
        uid: currentUser.uid,
        displayName: currentDisplayName,
        content: content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        likedBy: {},
        likeCount: 0
      });

      commentInput.value = "";
      updateTextCount();
      setMessage("留言已送出。", "success");
    } catch (error) {
      console.error("新增留言失敗：", error);
      setMessage("留言送出失敗，請稍後再試。");
    } finally {
      updateFormState();
      commentSubmitBtn.innerText = "送出留言";
    }
  }

  async function toggleLike(commentId) {
    if (!currentUser) {
      alert("請先登入後再按讚。");
      return;
    }

    if (!commentId) {
      return;
    }

    const ref = db.collection("comments").doc(commentId);

    try {
      await db.runTransaction(async function (transaction) {
        const snap = await transaction.get(ref);

        if (!snap.exists) {
          return;
        }

        const data = snap.data();
        const likedBy = data.likedBy || {};
        const uid = currentUser.uid;
        const hasLiked = likedBy[uid] === true;

        if (hasLiked) {
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
      console.error("按讚失敗：", error);
      alert("按讚失敗，請稍後再試。");
    }
  }

  function updateTextCount() {
    const commentInput = document.getElementById("commentInput");
    const commentCount = document.getElementById("commentCount");

    if (!commentInput || !commentCount) {
      return;
    }

    commentCount.innerText = commentInput.value.length + " / 500";
  }

  function bindEvents() {
    const commentInput = document.getElementById("commentInput");
    const commentSubmitBtn = document.getElementById("commentSubmitBtn");

    if (commentInput) {
      commentInput.addEventListener("input", updateTextCount);
    }

    if (commentSubmitBtn) {
      commentSubmitBtn.addEventListener("click", submitComment);
    }
  }

  function initCommentSection() {
    createCommentSection();
    bindEvents();
    listenComments();

    auth.onAuthStateChanged(async function (user) {
      currentUser = user;

      if (!user) {
        currentDisplayName = "";
        updateFormState();
        return;
      }

      currentDisplayName = await getCurrentDisplayName(user);

      updateFormState();
      listenComments();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(initCommentSection, 300);
  });
})();
