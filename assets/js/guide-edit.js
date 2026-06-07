console.log("guide-edit.js 已載入");

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
  let guideId = "";
  let guideData = null;
  let isLoaded = false;

  const titleInput = document.getElementById("guideTitle");
  const gameInput = document.getElementById("guideGameName");
  const coverInput = document.getElementById("guideCoverImage");
  const currentCoverWrap = document.getElementById("guideCurrentCover");
  const currentCoverImg = document.getElementById("guideCurrentCoverImg");
  const coverPreviewWrap = document.getElementById("guideCoverPreviewWrap");
  const coverPreview = document.getElementById("guideCoverPreview");
  const summaryInput = document.getElementById("guideSummary");
  const contentInput = document.getElementById("guideContent");
  const previewBtn = document.getElementById("guidePreviewBtn");
  const saveBtn = document.getElementById("guideSaveBtn");
  const msg = document.getElementById("guideEditorMsg");
  const previewBox = document.getElementById("guidePreview");
  const previewContent = document.getElementById("guidePreviewContent");
  const backLink = document.getElementById("guideBackLink");

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

  function getGuideId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
  }

  function setMsg(text, type) {
    if (!msg) return;

    msg.innerText = text || "";
    msg.className = type === "success"
      ? "guide-editor-msg success"
      : "guide-editor-msg";
  }

  function setFormDisabled(disabled) {
    if (titleInput) titleInput.disabled = disabled;
    if (gameInput) gameInput.disabled = disabled;
    if (coverInput) coverInput.disabled = disabled;
    if (summaryInput) summaryInput.disabled = disabled;
    if (contentInput) contentInput.disabled = disabled;
    if (previewBtn) previewBtn.disabled = disabled;
    if (saveBtn) saveBtn.disabled = disabled;

    document.querySelectorAll(".md-toolbar button").forEach(function (btn) {
      btn.disabled = disabled;
    });
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

  function updateCoverPreview(url) {
    const value = String(url || "").trim();

    if (!coverPreviewWrap || !coverPreview) {
      return;
    }

    if (!value || !isValidImageUrl(value)) {
      coverPreviewWrap.style.display = "none";
      coverPreview.src = "";
      return;
    }

    coverPreview.src = value;
    coverPreviewWrap.style.display = "block";
  }

  function fillForm(data) {
    if (!data) return;

    titleInput.value = data.title || "";
    gameInput.value = data.gameName || "";
    coverInput.value = data.coverImage || "";
    summaryInput.value = data.summary || "";
    contentInput.value = data.contentMarkdown || "";

    if (data.coverImage) {
      currentCoverImg.src = data.coverImage;
      currentCoverWrap.style.display = "block";
    } else {
      currentCoverImg.src = "";
      currentCoverWrap.style.display = "none";
    }

    updateCoverPreview(data.coverImage || "");

    if (backLink) {
      backLink.href = "/guides/post/?id=" + encodeURIComponent(guideId);
    }
  }

  function validateGuide() {
    const title = titleInput.value.trim();
    const gameName = gameInput.value.trim();
    const coverImage = coverInput.value.trim();
    const summary = summaryInput.value.trim();
    const content = contentInput.value.trim();

    if (!currentUser) return "請先登入。";
    if (!isLoaded) return "文章資料尚未載入完成，請稍候。";
    if (!guideData) return "找不到文章資料。";
    if (guideData.authorUid !== currentUser.uid) return "只能編輯自己的文章。";
    if (!title) return "請輸入文章標題。";
    if (title.length > 60) return "文章標題請控制在 60 字以內。";
    if (!gameName) return "請輸入桌遊名稱。";
    if (gameName.length > 40) return "桌遊名稱請控制在 40 字以內。";
    if (!summary) return "請輸入文章摘要。";
    if (summary.length > 180) return "文章摘要請控制在 180 字以內。";
    if (!content) return "請輸入攻略內容。";
    if (content.length > 10000) return "攻略內容請控制在 10000 字以內。";
    if (coverImage && !isValidImageUrl(coverImage)) return "封面圖片網址格式不正確。";

    return "";
  }

  function renderPreview() {
    const content = contentInput.value.trim();

    if (!content) {
      setMsg("請先輸入攻略內容再預覽。");
      return;
    }

    let rawHtml = "";

    if (window.marked) {
      rawHtml = window.marked.parse(content);
    } else {
      rawHtml = "<p>" + escapeHtml(content).replaceAll("\n", "<br>") + "</p>";
    }

    const safeHtml = window.DOMPurify
      ? window.DOMPurify.sanitize(rawHtml)
      : rawHtml;

    previewContent.innerHTML = safeHtml;
    previewBox.style.display = "block";
    setMsg("");
  }

  async function loadGuide() {
    guideId = getGuideId();

    isLoaded = false;
    guideData = null;
    setFormDisabled(true);
    setMsg("正在載入原文章資料...");

    if (!guideId) {
      setMsg("找不到文章 ID。請從桌遊攻略列表點選「編輯文章」進入。");
      return;
    }

    if (!currentUser) {
      setMsg("請先登入後再編輯文章。");
      return;
    }

    try {
      const ref = db.collection("guides").doc(guideId);
      const snap = await ref.get();

      if (!snap.exists) {
        setMsg("找不到這篇文章。可能已被刪除，或文章 ID 不正確。");
        return;
      }

      guideData = snap.data();

      if (guideData.authorUid !== currentUser.uid) {
        setMsg("只能編輯自己的文章。");
        return;
      }

      fillForm(guideData);

      isLoaded = true;
      setFormDisabled(false);
      setMsg("原文章資料已載入，可以開始修改。", "success");
    } catch (error) {
      console.error("讀取文章失敗：", error);

      if (error.code === "permission-denied") {
        setMsg("沒有權限讀取這篇文章，請確認 Firestore Rules 是否允許作者讀取自己的文章。");
      } else {
        setMsg("文章讀取失敗，請稍後再試。");
      }
    }
  }

  async function saveGuide() {
    const error = validateGuide();

    if (error) {
      setMsg(error);
      return;
    }

    try {
      setFormDisabled(true);
      saveBtn.innerText = "儲存中...";
      setMsg("正在儲存文章...");

      const payload = {
        title: titleInput.value.trim(),
        gameName: gameInput.value.trim(),
        summary: summaryInput.value.trim(),
        contentMarkdown: contentInput.value.trim(),
        coverImage: normalizeImageUrl(coverInput.value),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("guides").doc(guideId).update(payload);

      setMsg("修改成功，即將回到文章頁。", "success");

      setTimeout(function () {
        window.location.href = "/guides/post/?id=" + encodeURIComponent(guideId);
      }, 800);
    } catch (error) {
      console.error("儲存文章失敗：", error);

      if (error.code === "permission-denied") {
        setMsg("沒有權限修改這篇文章，請確認 Firestore Rules 是否允許作者更新自己的文章。");
      } else {
        setMsg("儲存失敗，請稍後再試。");
      }

      setFormDisabled(false);
      saveBtn.innerText = "儲存修改";
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

    const newStart = start + (selectStartOffset || insertText.length);
    const newEnd = start + (selectEndOffset || insertText.length);

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

    replaceSelection(
      insertText,
      beforeText.length,
      beforeText.length + selectedText.length
    );
  }

  function insertAtCursor(text) {
    replaceSelection(text, text.length, text.length);
  }

  function addUnorderedList() {
    const selection = getSelection();
    const text = selection.text || "項目一\n項目二\n項目三";
    const lines = text.split("\n").map(line => {
      const trimmed = line.trim();
      return trimmed ? "- " + trimmed : "- ";
    });

    replaceSelection(lines.join("\n"));
  }

  function openImageModal() {
    const selection = getSelection();

    imageAltInput.value = selection.text || "";
    imageUrlInput.value = "";
    imageMsg.innerText = "";
    imageModal.classList.add("show");

    setTimeout(function () {
      if (imageAltInput.value) {
        imageUrlInput.focus();
      } else {
        imageAltInput.focus();
      }
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
      if (linkTextInput.value) {
        linkUrlInput.focus();
      } else {
        linkTextInput.focus();
      }
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

        if (action === "h2") {
          ensureLinePrefix("## ", "副標題1");
        } else if (action === "h3") {
          ensureLinePrefix("### ", "副標題2");
        } else if (action === "bold") {
          wrapSelection("**", "**", "加粗文字");
        } else if (action === "mark") {
          wrapSelection("<mark>", "</mark>", "螢光重點");
        } else if (action === "large") {
          wrapSelection('<span class="md-size-lg">', "</span>", "大字文字");
        } else if (action === "small") {
          wrapSelection('<span class="md-size-sm">', "</span>", "小字文字");
        } else if (action === "ul") {
          addUnorderedList();
        } else if (action === "image") {
          openImageModal();
        } else if (action === "link") {
          openLinkModal();
        }
      });
    });
  }

  function bindModals() {
    imageCancelBtn.addEventListener("click", closeImageModal);
    imageInsertBtn.addEventListener("click", insertImageFromModal);

    linkCancelBtn.addEventListener("click", closeLinkModal);
    linkInsertBtn.addEventListener("click", insertLinkFromModal);

    imageModal.addEventListener("click", function (event) {
      if (event.target === imageModal) {
        closeImageModal();
      }
    });

    linkModal.addEventListener("click", function (event) {
      if (event.target === linkModal) {
        closeLinkModal();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeImageModal();
        closeLinkModal();
      }
    });
  }

  function bindCoverPreview() {
    if (!coverInput) return;

    coverInput.addEventListener("input", function () {
      updateCoverPreview(coverInput.value);
    });

    if (coverPreview) {
      coverPreview.addEventListener("error", function () {
        coverPreviewWrap.style.display = "none";

        if (coverInput.value.trim()) {
          setMsg("圖片預覽失敗，請確認是否為可公開瀏覽的圖片直接連結。");
        }
      });

      coverPreview.addEventListener("load", function () {
        if (coverInput.value.trim() && isLoaded) {
          setMsg("圖片預覽已更新。", "success");
        }
      });
    }
  }

  auth.onAuthStateChanged(async function (user) {
    currentUser = user;

    if (!user) {
      setFormDisabled(true);
      setMsg("請先登入後再編輯文章。");
      return;
    }

    await loadGuide();
  });

  bindCoverPreview();
  bindToolbar();
  bindModals();

  if (previewBtn) {
    previewBtn.addEventListener("click", renderPreview);
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveGuide);
  }

  setFormDisabled(true);
})();
