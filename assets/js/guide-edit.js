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
  const storage = firebase.storage();

  const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

  let currentUser = null;
  let guideId = "";
  let guideData = null;

  const titleInput = document.getElementById("guideTitle");
  const gameInput = document.getElementById("guideGameName");
  const coverFileInput = document.getElementById("guideCoverFile");
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

  function getGuideId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
  }

  function setMsg(text, type) {
    msg.innerText = text || "";
    msg.className = type === "success"
      ? "guide-editor-msg success"
      : "guide-editor-msg";
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function validateImageFile(file) {
    if (!file) return "";

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "封面圖片只支援 JPG、PNG、WEBP。";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "封面圖片請小於 1MB。";
    }

    return "";
  }

  function validateGuide() {
    const title = titleInput.value.trim();
    const gameName = gameInput.value.trim();
    const summary = summaryInput.value.trim();
    const content = contentInput.value.trim();
    const file = coverFileInput.files[0];

    if (!currentUser) return "請先登入。";
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

    const imageError = validateImageFile(file);
    if (imageError) return imageError;

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

  function getFileExtension(file) {
    if (file.type === "image/jpeg") return "jpg";
    if (file.type === "image/png") return "png";
    if (file.type === "image/webp") return "webp";
    return "jpg";
  }

  async function uploadCoverImage(file) {
    if (!file) return "";

    const ext = getFileExtension(file);
    const fileName = Date.now() + "-" + Math.random().toString(36).slice(2) + "." + ext;
    const filePath = "guide-covers/" + currentUser.uid + "/" + fileName;
    const fileRef = storage.ref().child(filePath);

    await fileRef.put(file, {
      contentType: file.type
    });

    return await fileRef.getDownloadURL();
  }

  async function loadGuide() {
    guideId = getGuideId();

    if (!guideId) {
      setMsg("找不到文章 ID。");
      saveBtn.disabled = true;
      previewBtn.disabled = true;
      return;
    }

    try {
      const snap = await db.collection("guides").doc(guideId).get();

      if (!snap.exists) {
        setMsg("找不到這篇文章。");
        saveBtn.disabled = true;
        previewBtn.disabled = true;
        return;
      }

      guideData = snap.data();

      if (!currentUser || guideData.authorUid !== currentUser.uid) {
        setMsg("只能編輯自己的文章。");
        saveBtn.disabled = true;
        previewBtn.disabled = true;
        return;
      }

      titleInput.value = guideData.title || "";
      gameInput.value = guideData.gameName || "";
      summaryInput.value = guideData.summary || "";
      contentInput.value = guideData.contentMarkdown || "";

      if (guideData.coverImage) {
        currentCoverImg.src = guideData.coverImage;
        currentCoverWrap.style.display = "block";
      }

      backLink.href = "/guides/post/?id=" + encodeURIComponent(guideId);

      setMsg("文章已載入，可以開始編輯。", "success");
      saveBtn.disabled = false;
      previewBtn.disabled = false;
    } catch (error) {
      console.error("讀取文章失敗：", error);
      setMsg("文章讀取失敗，請稍後再試。");
      saveBtn.disabled = true;
      previewBtn.disabled = true;
    }
  }

  async function saveGuide() {
    const error = validateGuide();

    if (error) {
      setMsg(error);
      return;
    }

    try {
      saveBtn.disabled = true;
      previewBtn.disabled = true;
      saveBtn.innerText = "儲存中...";
      setMsg("正在儲存文章...");

      const file = coverFileInput.files[0];
      let coverImageUrl = guideData.coverImage || "";

      if (file) {
        setMsg("正在上傳新封面圖片...");
        coverImageUrl = await uploadCoverImage(file);
      }

      const payload = {
        title: titleInput.value.trim(),
        gameName: gameInput.value.trim(),
        summary: summaryInput.value.trim(),
        contentMarkdown: contentInput.value.trim(),
        coverImage: coverImageUrl,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("guides").doc(guideId).update(payload);

      setMsg("修改成功，即將回到文章頁。", "success");

      setTimeout(function () {
        window.location.href = "/guides/post/?id=" + encodeURIComponent(guideId);
      }, 800);
    } catch (error) {
      console.error("儲存文章失敗：", error);
      setMsg("儲存失敗，請稍後再試。");
      saveBtn.disabled = false;
      previewBtn.disabled = false;
      saveBtn.innerText = "儲存修改";
    }
  }

  function bindImagePreview() {
    coverFileInput.addEventListener("change", function () {
      const file = coverFileInput.files[0];

      if (!file) {
        coverPreviewWrap.style.display = "none";
        coverPreview.src = "";
        setMsg("");
        return;
      }

      const error = validateImageFile(file);

      if (error) {
        setMsg(error);
        coverFileInput.value = "";
        coverPreviewWrap.style.display = "none";
        coverPreview.src = "";
        return;
      }

      const url = URL.createObjectURL(file);
      coverPreview.src = url;
      coverPreviewWrap.style.display = "block";
      setMsg("");
    });
  }

  auth.onAuthStateChanged(async function (user) {
    currentUser = user;

    if (!user) {
      setMsg("請先登入後再編輯文章。");
      saveBtn.disabled = true;
      previewBtn.disabled = true;
      return;
    }

    await loadGuide();
  });

  bindImagePreview();
  previewBtn.addEventListener("click", renderPreview);
  saveBtn.addEventListener("click", saveGuide);
})();
