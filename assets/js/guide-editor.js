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

  const allowedCategories = ["桌遊攻略", "活動心得", "規則討論", "開箱分享", "揪團交流"];

  let currentUser = null;
  let currentDisplayName = "";

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
      return;
    }

    try {
      publishBtn.disabled = true;
      previewBtn.disabled = true;
      publishBtn.innerText = "發布中...";
      setMsg("正在發布文章...");

      const payload = {
        title: titleInput.value.trim(),
        gameName: gameInput.value.trim(),
        category: categoryInput.value.trim(),
        coverImage: normalizeImageUrl(coverInput.value),
        summary: summaryInput.value.trim(),
        contentMarkdown: contentInput.value.trim(),
        authorUid: currentUser.uid,
        authorName: currentDisplayName,
        status: "published",
        likeCount: 0,
        viewCount: 0,
        likedBy: {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection("guides").add(payload);

      setMsg("文章發布成功，即將前往文章頁。", "success");

      setTimeout(function () {
        window.location.href = "/guides/post/?id=" + encodeURIComponent(docRef.id);
      }, 900);
    } catch (error) {
      console.error("發布文章失敗：", error);
      setMsg("發布失敗，請稍後再試。");
      publishBtn.disabled = false;
      previewBtn.disabled = false;
      publishBtn.innerText = "發布文章";
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

    fontSizeInput.addEventListener("change", applyFontSize);

    fontSizeInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
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

  auth.onAuthStateChanged(async function (user) {
    currentUser = user;

    if (!user) {
      currentDisplayName = "";
      setMsg("請先登入後再投稿。");
      publishBtn.disabled = true;
      previewBtn.disabled = true;
      return;
    }

    currentDisplayName = await getDisplayName(user);

    if (!currentDisplayName) {
      setMsg("請先設定社員 ID，才能投稿。請點右上角「設定 ID」。");
      publishBtn.disabled = true;
      previewBtn.disabled = false;
      return;
    }

    setMsg("目前投稿身分：" + currentDisplayName, "success");
    publishBtn.disabled = false;
    previewBtn.disabled = false;
  });

  bindCoverPreview();
  bindToolbar();
  bindFontSizeControl();
  bindModals();

  previewBtn.addEventListener("click", renderPreview);
  publishBtn.addEventListener("click", publishGuide);
})();
