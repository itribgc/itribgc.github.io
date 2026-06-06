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

  let currentUser = null;
  let currentDisplayName = "";

  const titleInput = document.getElementById("guideTitle");
  const gameInput = document.getElementById("guideGameName");
  const coverInput = document.getElementById("guideCoverImage");
  const summaryInput = document.getElementById("guideSummary");
  const contentInput = document.getElementById("guideContent");
  const previewBtn = document.getElementById("guidePreviewBtn");
  const publishBtn = document.getElementById("guidePublishBtn");
  const msg = document.getElementById("guideEditorMsg");
  const previewBox = document.getElementById("guidePreview");
  const previewContent = document.getElementById("guidePreviewContent");

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

  async function getDisplayName(user) {
    const userDoc = await db.collection("users").doc(user.uid).get();

    if (userDoc.exists && userDoc.data().displayName) {
      return userDoc.data().displayName;
    }

    return user.displayName || "";
  }

  function validateGuide() {
    const title = titleInput.value.trim();
    const gameName = gameInput.value.trim();
    const summary = summaryInput.value.trim();
    const content = contentInput.value.trim();

    if (!currentUser) return "請先登入後再投稿。";
    if (!currentDisplayName) return "請先設定社員 ID，才能投稿。";
    if (!title) return "請輸入文章標題。";
    if (title.length > 60) return "文章標題請控制在 60 字以內。";
    if (!gameName) return "請輸入桌遊名稱。";
    if (gameName.length > 40) return "桌遊名稱請控制在 40 字以內。";
    if (!summary) return "請輸入文章摘要。";
    if (summary.length > 180) return "文章摘要請控制在 180 字以內。";
    if (!content) return "請輸入攻略內容。";
    if (content.length > 10000) return "攻略內容請控制在 10000 字以內。";

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

  async function publishGuide() {
    const error = validateGuide();

    if (error) {
      setMsg(error);
      return;
    }

    try {
      publishBtn.disabled = true;
      publishBtn.innerText = "發布中...";
      setMsg("");

      const payload = {
        title: titleInput.value.trim(),
        gameName: gameInput.value.trim(),
        coverImage: coverInput.value.trim(),
        summary: summaryInput.value.trim(),
        contentMarkdown: contentInput.value.trim(),
        authorUid: currentUser.uid,
        authorName: currentDisplayName,
        status: "published",
        likeCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection("guides").add(payload);

      setMsg("發布成功，即將前往文章頁。", "success");

      setTimeout(function () {
        window.location.href = "/guides/post/?id=" + encodeURIComponent(docRef.id);
      }, 800);
    } catch (error) {
      console.error("發布攻略失敗：", error);
      setMsg("發布失敗，請稍後再試。");
      publishBtn.disabled = false;
      publishBtn.innerText = "發布文章";
    }
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

  previewBtn.addEventListener("click", renderPreview);
  publishBtn.addEventListener("click", publishGuide);
})();
