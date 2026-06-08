console.log("guide-editor.js 已載入");

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
  const allowedCategories = ["桌遊攻略", "活動心得", "規則討論", "開箱分享", "揪團交流"];

  let currentUser = null;
  let currentDisplayName = "";
  let hasAcceptedPostRules = false;

  const categoryInput = document.getElementById("guideCategory");
  const titleInput = document.getElementById("guideTitle");
  const gameInput = document.getElementById("guideGameName");
  const coverInput = document.getElementById("guideCoverImage");
  const coverPreviewWrap = document.getElementById("guideCoverPreviewWrap");
  const coverPreview = document.getElementById("guideCoverPreview");
  const summaryInput = document.getElementById("guideSummary");
  const contentInput = document.getElementById("guideContent");
  const fontSizeInput = document.getElementById("mdFontSizeInput");
  const previewBtn = document.getElementById("guidePreviewBtn");
  const publishBtn = document.getElementById("guidePublishBtn");
  const msg = document.getElementById("guideEditorMsg");
  const previewBox = document.getElementById("guidePreview");
  const previewContent = document.getElementById("guidePreviewContent");

  const imageModal = document.getElementById("mdImageModal");
  const imageAltInput = document.getElementById("mdImageAlt");
  const imageUrlInput = document.getElementById("mdImageUrl");
  const imageMsg = document.getElementById("mdImageMsg");
  const imageCancelBtn = document.getElementById("mdImageCancelBtn");
  const imageInsertBtn = document.getElementById("mdImageInsertBtn");

  const linkModal = document.getElementById("mdLinkModal");
  const linkTextInput = document.getElementById("mdLinkText");
  const linkUrlInput = document.getElementById("mdLinkUrl");
  const linkMsg = document.getElementById("mdLinkMsg");
  const linkCancelBtn = document.getElementById("mdLinkCancelBtn");
  const linkInsertBtn = document.getElementById("mdLinkInsertBtn");

  function isAdmin() {
    return currentUser && currentUser.email === ADMIN_EMAIL;
  }

  function setMsg(text, type) {
    if (!msg) return;
    msg.innerText = text || "";
    msg.className = type === "success" ? "guide-editor-msg success" : "guide-editor-msg";
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeImageUrl(url) {
    const value = String(url || "").trim();
    if (!value) return "";
    if (value.startsWith("/")) return value;
    return value;
  }

  function isValidUrl(url) {
    const value = String(url || "").trim();
    if (!value) return false;
    if (value.startsWith("/")) return true;

    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch (error) {
      return false;
    }
  }

  function isValidImageUrl(url) {
    const value = String(url || "").trim();
    if (!value) return true;
    if (value.startsWith("/")) return true;

    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch (error) {
      return false;
    }
  }

  function setEditorDisabled(disabled) {
    [
      categoryInput,
      titleInput,
      gameInput,
      coverInput,
      summaryInput,
      contentInput,
      fontSizeInput,
      previewBtn,
      publishBtn
    ].forEach(function (el) {
      if (el) el.disabled = disabled;
    });

    document.querySelectorAll(".md-toolbar button").forEach(function (btn) {
      btn.disabled = disabled;
    });
  }

  function canUseEditorNow() {
    return currentUser && currentDisplayName && hasAcceptedPostRules;
  }

  function refreshEditorState() {
    if (!currentUser) {
      setEditorDisabled(true);
      setMsg("請先登入後再投稿。");
      return;
    }

    if (!currentDisplayName) {
      setEditorDisabled(true);
      setMsg("請先設定社員 ID，才能投稿。請點左側「更改 ID」。");
      return;
    }

    if (!hasAcceptedPostRules) {
      setEditorDisabled(true);
      setMsg("請先閱讀並確認發文規範，確認後即可開始撰寫。");
      openPostRulesModal();
      return;
    }

    setEditorDisabled(false);

    if (isAdmin()) {
      setMsg("目前為管理員身分，文章會直接發布。", "success");
      if (publishBtn) publishBtn.innerText = "發布文章";
    } else {
      setMsg("目前投稿身分：" + currentDisplayName + "。送出後會先進入管理員審核。", "success");
      if (publishBtn) publishBtn.innerText = "送出審核";
    }
  }

  function createPostRulesModal() {
    if (document.getElementById("postRulesModal")) return;

    const modal = document.createElement("div");
    modal.id = "postRulesModal";
    modal.innerHTML = `
      <style>
        #postRulesModal {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.66);
          box-sizing: border-box;
        }

        #postRulesModal.show {
          display: flex;
        }

        .post-rules-card {
          width: 100%;
          max-width: 560px;
          max-height: calc(100vh - 40px);
          overflow: auto;
          background: #fff;
          color: #222;
          border-radius: 18px;
          padding: 26px;
          box-shadow: 0 18px 46px rgba(0, 0, 0, 0.36);
          box-sizing: border-box;
        }

        .post-rules-card h2 {
          margin: 0 0 12px 0;
          color: #222;
          font-size: 24px;
          line-height: 1.35;
        }

        .post-rules-intro {
          margin: 0 0 16px 0;
          color: #555;
          line-height: 1.7;
          font-size: 15px;
        }

        .post-rules-list {
          margin: 0;
          padding-left: 1.25rem;
          color: #333;
          line-height: 1.8;
          font-size: 15px;
        }

        .post-rules-list li {
          margin-bottom: 0.55rem;
        }

        .post-rules-notice {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(79, 177, 186, 0.12);
          border: 1px solid rgba(79, 177, 186, 0.28);
          color: #333;
          line-height: 1.7;
          font-size: 14px;
        }

        .post-rules-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .post-rules-actions button {
          padding: 10px 16px;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 800;
          font-size: 15px;
        }

        #postRulesCancelBtn {
          background: #e8e8e8;
          color: #333;
        }

        #postRulesConfirmBtn {
          background: rgb(79, 177, 186);
          color: #fff;
        }

        #postRulesConfirmBtn:hover {
          filter: brightness(1.05);
        }

        @media (max-width: 640px) {
          .post-rules-card {
            padding: 22px;
          }

          .post-rules-actions {
            flex-direction: column-reverse;
          }

          .post-rules-actions button {
            width: 100%;
          }
        }
      </style>

      <div class="post-rules-card">
        <h2>發文規範與投稿提醒</h2>

        <p class="post-rules-intro">
          歡迎在社員論壇分享桌遊攻略、活動心得、規則討論、開箱分享與揪團交流。
          為了讓論壇維持友善、清楚且適合社團交流的環境，發文前請先閱讀以下規範。
        </p>

        <ol class="post-rules-list">
          <li>
            發文內容請保持友善與尊重，避免煽動性、仇恨、歧視、攻擊、騷擾、過度煽情或不適合社團公開交流的言論。
          </li>
          <li>
            請勿發布違反法律、侵犯他人權益、未經授權使用圖片或文字，或可能造成他人困擾的內容。
          </li>
          <li>
            所有社員投稿文章都會先送交管理員審核，審核通過後才會公開顯示在社員論壇中。
          </li>
          <li>
            管理員可依社團規範，要求修改、退回審核、刪除或不予發布不適合的文章。
          </li>
          <li>
            一經發文送出，即視為投稿者同意該貼文之智慧財產、創作內容與後續展示使用權歸屬於「守夜人-桌遊社」，社團可用於網站展示、社團紀錄、活動推廣與相關非營利用途。
          </li>
        </ol>

        <div class="post-rules-notice">
          按下「我已閱讀並同意」後，即代表你已理解上述規範，並同意文章送出後進入審核流程。
        </div>

        <div class="post-rules-actions">
          <button id="postRulesCancelBtn" type="button">返回論壇</button>
          <button id="postRulesConfirmBtn" type="button">我已閱讀並同意</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("postRulesConfirmBtn").addEventListener("click", function () {
      hasAcceptedPostRules = true;
      closePostRulesModal();
      refreshEditorState();
    });

    document.getElementById("postRulesCancelBtn").addEventListener("click", function () {
      window.location.href = "/guides/";
    });
  }

  function openPostRulesModal() {
    createPostRulesModal();

    const modal = document.getElementById("postRulesModal");
    if (!modal) return;

    modal.classList.add("show");
  }

  function closePostRulesModal() {
    const modal = document.getElementById("postRulesModal");
    if (!modal) return;

    modal.classList.remove("show");
  }

  async function getDisplayName(user) {
    const userDoc = await db.collection("users").doc(user.uid).get();

    if (userDoc.exists && userDoc.data().displayName) {
      return userDoc.data().displayName;
    }

    return user.displayName || "";
  }

  function validateGuide() {
    const category = categoryInput.value.trim();
    const title = titleInput.value.trim();
    const gameName = gameInput.value.trim();
    const coverImage = coverInput.value.trim();
    const summary = summaryInput.value.trim();
    const content = contentInput.value.trim();

    if (!currentUser) return "請先登入後再投稿。";
    if (!currentDisplayName) return "請先設定社員 ID，才能投稿。";
    if (!hasAcceptedPostRules) return "請先閱讀並確認發文規範。";
    if (!allowedCategories.includes(category)) return "請選擇正確的文章分類。";
    if (!title) return "請輸入文章標題。";
    if (title.length > 60) return "文章標題請控制在 60 字以內。";
    if (!gameName) return "請輸入主題名稱。";
    if (gameName.length > 40) return "主題名稱請控制在 40 字以內。";
    if (!summary) return "請輸入文章摘要。";
    if (summary.length > 180) return "文章摘要請控制在 180 字以內。";
    if (!content) return "請輸入文章內容。";
    if (content.length > 10000) return "文章內容請控制在 10000 字以內。";
    if (coverImage && !isValidImageUrl(coverImage)) return "封面圖片網址格式不正確。";

    return "";
  }

  function renderPreview() {
    const content = contentInput.value.trim();

    if (!canUseEditorNow()) {
      setMsg("請先閱讀並確認發文規範。");
      openPostRulesModal();
      return;
    }

    if (!content) {
      setMsg("請先輸入文章內容再預覽。");
      return;
    }

    let rawHtml = "";

    if (window.marked) {
      rawHtml = window.marked.parse(content);
    } else {
      rawHtml = "<p>" + escapeHtml(content).replaceAll("\n", "<br>") + "</p>";
    }

    const safeHtml = window.DOMPurify
      ? window.DOMPurify.sanitize(rawHtml, { ADD_ATTR: ["style"] })
      : rawHtml;

    previewContent.innerHTML = safeHtml;
    previewBox.style.display = "block";
    setMsg("");
  }

  async function publishGuide() {
    const error = validateGuide();

    if (error) {
      setMsg(error);

      if (!hasAcceptedPostRules) {
        openPostRulesModal();
      }

      return;
    }

    try {
      publishBtn.disabled = true;
      previewBtn.disabled = true;

      const adminMode = isAdmin();

      publishBtn.innerText = adminMode ? "發布中..." : "送出審核中...";
      setMsg(adminMode ? "正在發布文章..." : "正在送出文章審核...");

      const payload = {
        title: titleInput.value.trim(),
        gameName: gameInput.value.trim(),
        category: categoryInput.value.trim(),
        coverImage: normalizeImageUrl(coverInput.value),
        summary: summaryInput.value.trim(),
        contentMarkdown: contentInput.value.trim(),

        authorUid: currentUser.uid,
        authorName: currentDisplayName,

        status: adminMode ? "published" : "pending",
        reviewStatus: adminMode ? "approved" : "pending",
        rejectionReason: "",

        likeCount: 0,
        viewCount: 0,
        likedBy: {},

        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),

        reviewedAt: adminMode ? firebase.firestore.FieldValue.serverTimestamp() : null,
        reviewedBy: adminMode ? currentUser.uid : "",
        reviewedByEmail: adminMode ? currentUser.email : ""
      };

      const docRef = await db.collection("guides").add(payload);

      setMsg(
        adminMode
          ? "文章已發布，即將前往文章頁。"
          : "文章已送出審核，審核通過後才會出現在社員論壇。",
        "success"
      );

      setTimeout(function () {
        window.location.href = "/guides/post/?id=" + encodeURIComponent(docRef.id);
      }, 900);
    } catch (error) {
      console.error("送出文章失敗：", error);
      setMsg("送出失敗，請稍後再試。");
      publishBtn.disabled = false;
      previewBtn.disabled = false;
      publishBtn.innerText = isAdmin() ? "發布文章" : "送出審核";
    }
  }

  function bindCoverPreview() {
    if (!coverInput) return;

    coverInput.addEventListener("input", function () {
      const url = coverInput.value.trim();

      if (!url || !isValidImageUrl(url)) {
        coverPreviewWrap.style.display = "none";
        coverPreview.src = "";
        return;
      }

      coverPreview.src = url;
      coverPreviewWrap.style.display = "block";
    });

    if (coverPreview) {
      coverPreview.addEventListener("error", function () {
        coverPreviewWrap.style.display = "none";
        setMsg("圖片預覽失敗，請確認是否為可公開瀏覽的圖片直接連結。");
      });

      coverPreview.addEventListener("load", function () {
        if (coverInput.value.trim()) {
          setMsg("");
        }
      });
    }
  }

  function getSelection() {
    return {
      start: contentInput.selectionStart,
      end: contentInput.selectionEnd,
      text: contentInput.value.substring(contentInput.selectionStart, contentInput.selectionEnd)
    };
  }

  function replaceSelection(insertText, selectStartOffset, selectEndOffset) {
    const start = contentInput.selectionStart;
    const end = contentInput.selectionEnd;
    const before = contentInput.value.substring(0, start);
    const after = contentInput.value.substring(end);

    contentInput.value = before + insertText + after;
    contentInput.focus();

    const newStart = start + (selectStartOffset ?? insertText.length);
    const newEnd = start + (selectEndOffset ?? insertText.length);

    contentInput.setSelectionRange(newStart, newEnd);
  }

  function ensureLinePrefix(prefix, placeholder) {
    const selection = getSelection();
    const selectedText = selection.text || placeholder;
    const start = selection.start;
    const value = contentInput.value;

    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const beforeLine = value.substring(0, lineStart);
    const afterLineStart = value.substring(lineStart);
    const newLineText = prefix + selectedText;

    contentInput.value = beforeLine + newLineText + afterLineStart.substring(selection.text.length);

    const cursorStart = lineStart + prefix.length;
    const cursorEnd = cursorStart + selectedText.length;

    contentInput.focus();
    contentInput.setSelectionRange(cursorStart, cursorEnd);
  }

  function wrapSelection(beforeText, afterText, placeholder) {
    const selection = getSelection();
    const selectedText = selection.text || placeholder;
    const insertText = beforeText + selectedText + afterText;

    replaceSelection(insertText, beforeText.length, beforeText.length + selectedText.length);
  }

  function insertAtCursor(text) {
    replaceSelection(text, text.length, text.length);
  }

  function addUnorderedList() {
    const selection = getSelection();
    const text = selection.text || "項目一\n項目二\n項目三";
    const lines = text.split("\n").map(function (line) {
      const trimmed = line.trim();
      return trimmed ? "- " + trimmed : "- ";
    });

    replaceSelection(lines.join("\n"));
  }

  function sanitizeFontSize(value) {
    const size = Number(String(value || "").trim());
    if (Number.isNaN(size)) return 16;
    if (size < 8) return 8;
    if (size > 40) return 40;
    return Math.round(size);
  }

  function applyFontSize() {
    if (!fontSizeInput) return;

    const size = sanitizeFontSize(fontSizeInput.value);
    fontSizeInput.value = size;

    const selection = getSelection();
    const openTag = `<span style="font-size: ${size}px;">`;
    const closeTag = `</span>`;

    if (selection.text) {
      wrapSelection(openTag, closeTag, selection.text);
    } else {
      const insertText = openTag + closeTag;
      replaceSelection(insertText, openTag.length, openTag.length);
    }
  }

  function openImageModal() {
    const selection = getSelection();

    imageAltInput.value = selection.text || "";
    imageUrlInput.value = "";
    imageMsg.innerText = "";
    imageModal.classList.add("show");

    setTimeout(function () {
      if (imageAltInput.value) imageUrlInput.focus();
      else imageAltInput.focus();
    }, 100);
  }

  function closeImageModal() {
    imageModal.classList.remove("show");
  }

  function insertImageFromModal() {
    const alt = imageAltInput.value.trim() || "圖片說明";
    const url = imageUrlInput.value.trim();

    imageMsg.innerText = "";

    if (!url) {
      imageMsg.innerText = "請輸入圖片網址。";
      imageUrlInput.focus();
      return;
    }

    if (!isValidUrl(url)) {
      imageMsg.innerText = "圖片網址格式不正確。";
      imageUrlInput.focus();
      return;
    }

    insertAtCursor(`\n![${alt}](${url})\n`);
    closeImageModal();
  }

  function openLinkModal() {
    const selection = getSelection();

    linkTextInput.value = selection.text || "";
    linkUrlInput.value = "";
    linkMsg.innerText = "";
    linkModal.classList.add("show");

    setTimeout(function () {
      if (linkTextInput.value) linkUrlInput.focus();
      else linkTextInput.focus();
    }, 100);
  }

  function closeLinkModal() {
    linkModal.classList.remove("show");
  }

  function insertLinkFromModal() {
    const text = linkTextInput.value.trim() || "連結文字";
    const url = linkUrlInput.value.trim();

    linkMsg.innerText = "";

    if (!url) {
      linkMsg.innerText = "請輸入連結網址。";
      linkUrlInput.focus();
      return;
    }

    if (!isValidUrl(url)) {
      linkMsg.innerText = "連結網址格式不正確。";
      linkUrlInput.focus();
      return;
    }

    insertAtCursor(`[${text}](${url})`);
    closeLinkModal();
  }

  function bindToolbar() {
    document.querySelectorAll(".md-toolbar button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!canUseEditorNow()) {
          openPostRulesModal();
          return;
        }

        const action = btn.dataset.mdAction;

        if (action === "h2") ensureLinePrefix("## ", "副標題1");
        else if (action === "h3") ensureLinePrefix("### ", "副標題2");
        else if (action === "bold") wrapSelection("**", "**", "加粗文字");
        else if (action === "mark") wrapSelection("<mark>", "</mark>", "螢光重點");
        else if (action === "ul") addUnorderedList();
        else if (action === "image") openImageModal();
        else if (action === "link") openLinkModal();
      });
    });
  }

  function bindFontSizeControl() {
    if (!fontSizeInput) return;

    fontSizeInput.addEventListener("change", function () {
      if (!canUseEditorNow()) {
        openPostRulesModal();
        return;
      }

      applyFontSize();
    });

    fontSizeInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();

        if (!canUseEditorNow()) {
          openPostRulesModal();
          return;
        }

        applyFontSize();
      }
    });

    fontSizeInput.addEventListener("dblclick", function () {
      fontSizeInput.select();
    });

    fontSizeInput.addEventListener("focus", function () {
      fontSizeInput.select();
    });
  }

  function bindModals() {
    imageCancelBtn.addEventListener("click", closeImageModal);
    imageInsertBtn.addEventListener("click", insertImageFromModal);
    linkCancelBtn.addEventListener("click", closeLinkModal);
    linkInsertBtn.addEventListener("click", insertLinkFromModal);

    imageModal.addEventListener("click", function (event) {
      if (event.target === imageModal) closeImageModal();
    });

    linkModal.addEventListener("click", function (event) {
      if (event.target === linkModal) closeLinkModal();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeImageModal();
        closeLinkModal();
      }
    });
  }

  setEditorDisabled(true);
  createPostRulesModal();

  auth.onAuthStateChanged(async function (user) {
    currentUser = user;

    if (!user) {
      currentDisplayName = "";
      refreshEditorState();
      return;
    }

    currentDisplayName = await getDisplayName(user);
    refreshEditorState();
  });

  bindCoverPreview();
  bindToolbar();
  bindFontSizeControl();
  bindModals();

  previewBtn.addEventListener("click", renderPreview);
  publishBtn.addEventListener("click", publishGuide);
})();
