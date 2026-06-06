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

  function getGuideIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
  }

  function isGuidePostPage() {
    return window.location.pathname === "/guides/post/" || window.location.pathname === "/guides/post/index.html";
  }

  function getPostPath() {
    if (isGuidePostPage()) {
      const guideId = getGuideIdFromUrl();
      return guideId ? "guide:" + guideId : normalizePath(window.location.pathname);
    }

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

  function getCommentMountTarget() {
    if (isGuidePostPage()) {
      const mount = document.getElementById("guideCommentMount");
      if (mount) return mount;
    }

    const article = document.querySelector("article");
    if (article) return article;

    return null;
  }

  function createCommentSection() {
    if (document.getElementById("firebaseCommentSection")) {
      return;
    }

    const target = getCommentMountTarget();

    if (!target) {
      console.warn("找不到留言區插入位置");
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

        .firebase-comment-edited {
          opacity: 0.7;
          font-size: 0.82rem;
        }

        .firebase-comment-content {
          white-space: pre-wrap;
          line-height: 1.75;
          margin-bottom: 0.85rem;
        }

        .firebase-comment-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .firebase-comment-left-actions,
        .firebase-comment-owner-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .firebase-like-btn,
        .firebase-edit-btn,
        .firebase-delete-btn {
          padding: 6px 11px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 0.86rem;
        }

        .firebase-like-btn:hover,
        .firebase-edit-btn:hover {
          border-color: rgb(79,177,186);
        }

        .firebase-delete-btn:hover {
          border-color: #ff8a80;
          color: #ffb4a9;
        }

        .firebase-like-btn.liked {
          background: rgba(79,177,186,0.18);
          border-color: rgb(79,177,186);
        }

        .firebase-like-btn:disabled,
        .firebase-edit-btn:disabled,
        .firebase-delete-btn:disabled {
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

        .comment-modal {
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

        .comment-modal.show {
          display: flex;
        }

        .comment-modal-card {
          width: 100%;
          max-width: 460px;
          background: #fff;
          color: #222;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.34);
          box-sizing: border-box;
        }

        .comment-modal-card h3 {
          margin: 0 0 12px 0;
          font-size: 20px;
          color: #222;
        }

        .comment-modal-card p {
          margin: 0 0 16px 0;
          color: #555;
          font-size: 14px;
          line-height: 1.6;
        }

        .comment-modal-textarea {
          width: 100%;
          min-height: 130px;
          padding: 12px;
          box-sizing: border-box;
          border: 1px solid #d6d6d6;
          border-radius: 10px;
          font: inherit;
          resize: vertical;
          outline: none;
        }

        .comment-modal-textarea:focus {
          border-color: rgb(79,177,186);
          box-shadow: 0 0 0 2px rgba(79,177,186,0.18);
        }

        .comment-modal-count {
          margin-top: 8px;
          font-size: 13px;
          color: #777;
          text-align: right;
        }

        .comment-modal-msg {
          min-height: 20px;
          margin-top: 10px;
          color: #d93025;
          font-size: 14px;
          line-height: 1.5;
        }

        .comment-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .comment-modal-actions button {
          padding: 9px 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        .comment-modal-cancel {
          background: #e8e8e8;
          color: #333;
        }

        .comment-modal-save {
          background: rgb(79,177,186);
          color: #fff;
        }

        .comment-modal-delete {
          background: #d93025;
          color: #fff;
        }

        .comment-modal-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .firebase-comment-actions-row {
            align-items: stretch;
            flex-direction: column;
          }

          .firebase-comment-submit {
            width: 100%;
          }

          .firebase-comment-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .comment-modal-actions {
            flex-direction: column-reverse;
          }

          .comment-modal-actions button {
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

      <div id="editCommentModal" class="comment-modal">
        <div class="comment-modal-card">
          <h3>編輯留言</h3>
          <p>修改完成後，請點擊「儲存修改」。</p>
          <textarea id="editCommentInput" class="comment-modal-textarea" maxlength="500"></textarea>
          <div id="editCommentCount" class="comment-modal-count">0 / 500</div>
          <div id="editCommentMsg" class="comment-modal-msg"></div>
          <div class="comment-modal-actions">
            <button id="editCommentCancelBtn" class="comment-modal-cancel" type="button">取消</button>
            <button id="editCommentSaveBtn" class="comment-modal-save" type="button">儲存修改</button>
          </div>
        </div>
      </div>

      <div id="deleteCommentModal" class="comment-modal">
        <div class="comment-modal-card">
          <h3>刪除留言</h3>
          <p>是否確定刪除留言？刪除後將無法復原。</p>
          <div id="deleteCommentMsg" class="comment-modal-msg"></div>
          <div class="comment-modal-actions">
            <button id="deleteCommentCancelBtn" class="comment-modal-cancel" type="button">取消</button>
            <button id="deleteCommentConfirmBtn" class="comment-modal-delete" type="button">確定</button>
          </div>
        </div>
      </div>
    `;

    target.appendChild(section);
  }

  function setMessage(text, type) {
    const commentMessage = document.getElementById("commentMessage");

    if (!commentMessage) return;

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

    if (!commentUser || !commentInput || !commentSubmitBtn || !warning) return;

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

    if (!commentList) return;

    if (snapshot.empty) {
      commentList.innerHTML = `<div class="firebase-comment-empty">目前還沒有留言，快來當第一個留言的人吧！</div>`;
      return;
    }

    let html = "";

    snapshot.forEach(function (doc) {
      const data = doc.data();
      const likedBy = data.likedBy || {};
      const uid = currentUser ? currentUser.uid : "";
      const isOwner = uid && data.uid === uid;
      const isLiked = uid && likedBy[uid] === true;
      const likeCount = data.likeCount || 0;
      const editedText = data.editedAt ? `<span class="firebase-comment-edited">已編輯</span>` : "";

      html += `
        <div class="firebase-comment-item">
          <div class="firebase-comment-meta">
            <span class="firebase-comment-name">${escapeHtml(data.displayName || "未命名社員")}</span>
            <span>・</span>
            <span>${escapeHtml(formatTime(data.createdAt))}</span>
            ${editedText ? `<span>・</span>${editedText}` : ""}
          </div>

          <div class="firebase-comment-content">${escapeHtml(data.content)}</div>

          <div class="firebase-comment-footer">
            <div class="firebase-comment-left-actions">
              <button
                class="firebase-like-btn ${isLiked ? "liked" : ""}"
                type="button"
                data-comment-id="${doc.id}">
                👍 ${likeCount}
              </button>
            </div>

            ${
              isOwner
                ? `
                  <div class="firebase-comment-owner-actions">
                    <button
                      class="firebase-edit-btn"
                      type="button"
                      data-comment-id="${doc.id}"
                      data-comment-content="${escapeHtml(data.content)}">
                      編輯
                    </button>

                    <button
                      class="firebase-delete-btn"
                      type="button"
                      data-comment-id="${doc.id}">
                      刪除
                    </button>
                  </div>
                `
                : ""
            }
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

    commentList.querySelectorAll(".firebase-edit-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openEditModal(btn.dataset.commentId, btn.dataset.commentContent || "");
      });
    });

    commentList.querySelectorAll(".firebase-delete-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openDeleteModal(btn.dataset.commentId);
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

    if (!commentInput || !commentSubmitBtn) return;

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

    if (!commentId) return;

    const ref = db.collection("comments").doc(commentId);

    try {
      await db.runTransaction(async function (transaction) {
        const snap = await transaction.get(ref);

        if (!snap.exists) return;

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

  function openEditModal(commentId, content) {
    const modal = document.getElementById("editCommentModal");
    const input = document.getElementById("editCommentInput");
    const msg = document.getElementById("editCommentMsg");
    const saveBtn = document.getElementById("editCommentSaveBtn");

    if (!modal || !input || !saveBtn) return;

    modal.dataset.commentId = commentId;
    input.value = content;
    msg.innerText = "";
    saveBtn.disabled = false;
    saveBtn.innerText = "儲存修改";

    updateEditCount();
    modal.classList.add("show");

    setTimeout(function () {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }, 100);
  }

  function closeEditModal() {
    const modal = document.getElementById("editCommentModal");

    if (modal) {
      modal.classList.remove("show");
      modal.dataset.commentId = "";
    }
  }

  async function saveEditedComment() {
    const modal = document.getElementById("editCommentModal");
    const input = document.getElementById("editCommentInput");
    const msg = document.getElementById("editCommentMsg");
    const saveBtn = document.getElementById("editCommentSaveBtn");

    if (!modal || !input || !saveBtn || !currentUser) return;

    const commentId = modal.dataset.commentId;
    const newContent = input.value.trim();

    msg.innerText = "";

    if (!commentId) {
      msg.innerText = "找不到留言資料，請重新整理後再試。";
      return;
    }

    if (!newContent) {
      msg.innerText = "留言內容不能為空。";
      input.focus();
      return;
    }

    if (newContent.length > 500) {
      msg.innerText = "留言請控制在 500 字以內。";
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.innerText = "儲存中...";

      const ref = db.collection("comments").doc(commentId);
      const snap = await ref.get();

      if (!snap.exists) {
        msg.innerText = "這則留言不存在，可能已被刪除。";
        saveBtn.disabled = false;
        saveBtn.innerText = "儲存修改";
        return;
      }

      if (snap.data().uid !== currentUser.uid) {
        msg.innerText = "只能編輯自己的留言。";
        saveBtn.disabled = false;
        saveBtn.innerText = "儲存修改";
        return;
      }

      await ref.update({
        content: newContent,
        editedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      closeEditModal();
    } catch (error) {
      console.error("編輯留言失敗：", error);
      msg.innerText = "編輯失敗，請稍後再試。";
      saveBtn.disabled = false;
      saveBtn.innerText = "儲存修改";
    }
  }

  function updateEditCount() {
    const input = document.getElementById("editCommentInput");
    const count = document.getElementById("editCommentCount");

    if (!input || !count) return;

    count.innerText = input.value.length + " / 500";
  }

  function openDeleteModal(commentId) {
    const modal = document.getElementById("deleteCommentModal");
    const msg = document.getElementById("deleteCommentMsg");
    const confirmBtn = document.getElementById("deleteCommentConfirmBtn");

    if (!modal || !confirmBtn) return;

    modal.dataset.commentId = commentId;
    msg.innerText = "";
    confirmBtn.disabled = false;
    confirmBtn.innerText = "確定";

    modal.classList.add("show");
  }

  function closeDeleteModal() {
    const modal = document.getElementById("deleteCommentModal");

    if (modal) {
      modal.classList.remove("show");
      modal.dataset.commentId = "";
    }
  }

  async function confirmDeleteComment() {
    const modal = document.getElementById("deleteCommentModal");
    const msg = document.getElementById("deleteCommentMsg");
    const confirmBtn = document.getElementById("deleteCommentConfirmBtn");

    if (!modal || !confirmBtn || !currentUser) return;

    const commentId = modal.dataset.commentId;

    if (!commentId) {
      msg.innerText = "找不到留言資料，請重新整理後再試。";
      return;
    }

    try {
      confirmBtn.disabled = true;
      confirmBtn.innerText = "刪除中...";

      const ref = db.collection("comments").doc(commentId);
      const snap = await ref.get();

      if (!snap.exists) {
        closeDeleteModal();
        return;
      }

      if (snap.data().uid !== currentUser.uid) {
        msg.innerText = "只能刪除自己的留言。";
        confirmBtn.disabled = false;
        confirmBtn.innerText = "確定";
        return;
      }

      await ref.delete();

      closeDeleteModal();
    } catch (error) {
      console.error("刪除留言失敗：", error);
      msg.innerText = "刪除失敗，請稍後再試。";
      confirmBtn.disabled = false;
      confirmBtn.innerText = "確定";
    }
  }

  function updateTextCount() {
    const commentInput = document.getElementById("commentInput");
    const commentCount = document.getElementById("commentCount");

    if (!commentInput || !commentCount) return;

    commentCount.innerText = commentInput.value.length + " / 500";
  }

  function bindEvents() {
    const commentInput = document.getElementById("commentInput");
    const commentSubmitBtn = document.getElementById("commentSubmitBtn");

    const editInput = document.getElementById("editCommentInput");
    const editCancelBtn = document.getElementById("editCommentCancelBtn");
    const editSaveBtn = document.getElementById("editCommentSaveBtn");

    const deleteCancelBtn = document.getElementById("deleteCommentCancelBtn");
    const deleteConfirmBtn = document.getElementById("deleteCommentConfirmBtn");

    const editModal = document.getElementById("editCommentModal");
    const deleteModal = document.getElementById("deleteCommentModal");

    if (commentInput) {
      commentInput.addEventListener("input", updateTextCount);
    }

    if (commentSubmitBtn) {
      commentSubmitBtn.addEventListener("click", submitComment);
    }

    if (editInput) {
      editInput.addEventListener("input", updateEditCount);
    }

    if (editCancelBtn) {
      editCancelBtn.addEventListener("click", closeEditModal);
    }

    if (editSaveBtn) {
      editSaveBtn.addEventListener("click", saveEditedComment);
    }

    if (deleteCancelBtn) {
      deleteCancelBtn.addEventListener("click", closeDeleteModal);
    }

    if (deleteConfirmBtn) {
      deleteConfirmBtn.addEventListener("click", confirmDeleteComment);
    }

    if (editModal) {
      editModal.addEventListener("click", function (event) {
        if (event.target === editModal) {
          closeEditModal();
        }
      });
    }

    if (deleteModal) {
      deleteModal.addEventListener("click", function (event) {
        if (event.target === deleteModal) {
          closeDeleteModal();
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeEditModal();
        closeDeleteModal();
      }
    });
  }

  function initCommentSection() {
    createCommentSection();

    if (!document.getElementById("firebaseCommentSection")) {
      console.warn("留言區尚未建立完成");
      return;
    }

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
    setTimeout(initCommentSection, 500);
  });
})();
