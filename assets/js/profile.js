console.log("profile.js 已載入");

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
  const MAX_LEVEL = 9999;

  let currentUser = null;
  let currentUserData = null;
  let isSavingDisplayName = false;

  const POST_XP_TABLE = {
    "桌遊攻略": 30,
    "活動心得": 20,
    "開箱分享": 20,
    "規則討論": 12,
    "揪團交流": 0
  };

  function isAdmin(user) {
    return user && user.email === ADMIN_EMAIL;
  }

  function getEmailPrefix(email) {
    if (!email || !email.includes("@")) return "社員";
    return email.split("@")[0] || "社員";
  }

  function sanitizeDisplayName(name) {
    return String(name || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function validateDisplayName(name) {
    const value = sanitizeDisplayName(name);

    if (!value) return "請輸入社員 ID。";
    if (value.length < 2) return "社員 ID 至少需要 2 個字。";
    if (value.length > 20) return "社員 ID 請控制在 20 個字以內。";
    if (/[<>]/.test(value)) return "社員 ID 不可包含 < 或 > 符號。";

    return "";
  }

  function getXpRequiredForLevel(level) {
    const lv = Math.max(Number(level || 1), 1);

    if (lv >= MAX_LEVEL) return 0;

    return Math.floor(30 + (lv - 1) * 12 + Math.pow(lv - 1, 1.35) * 4);
  }

  function calculateLevelFromXp(totalXp) {
    let xp = Math.max(Number(totalXp || 0), 0);
    let level = 1;

    while (level < MAX_LEVEL) {
      const need = getXpRequiredForLevel(level);

      if (xp < need) break;

      xp -= need;
      level += 1;
    }

    const currentLevelRequiredXp = getXpRequiredForLevel(level);

    return {
      level: level,
      totalXp: Math.max(Number(totalXp || 0), 0),
      currentXp: xp,
      nextLevelXp: currentLevelRequiredXp,
      progressPercent: currentLevelRequiredXp > 0
        ? Math.min(Math.round((xp / currentLevelRequiredXp) * 100), 100)
        : 100
    };
  }

  async function ensureUserDoc(user) {
    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const data = userDoc.data();

      const updateData = {
        email: user.email || data.email || "",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      let shouldUpdate = false;

      if (!data.email || data.email !== user.email) {
        shouldUpdate = true;
      }

      if (typeof data.mustChangePassword === "undefined") {
        updateData.mustChangePassword = false;
        shouldUpdate = true;
      }

      if (typeof data.displayNameConfirmed === "undefined") {
        updateData.displayNameConfirmed = false;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await userRef.update(updateData);
      }

      const refreshedDoc = await userRef.get();
      return refreshedDoc.exists ? refreshedDoc.data() : data;
    }

    const newData = {
      email: user.email || "",
      displayName: "",
      displayNameConfirmed: false,
      mustChangePassword: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(newData);

    return newData;
  }

  async function getPublishedGuides() {
    const snapshot = await db.collection("guides")
      .where("status", "==", "published")
      .get();

    return snapshot.docs.map(function (doc) {
      return {
        id: doc.id,
        data: doc.data()
      };
    });
  }

  function calculatePostXp(uid, guides) {
    let postXp = 0;
    let postCount = 0;
    const categoryBreakdown = {};

    guides.forEach(function (item) {
      const data = item.data || {};

      if (data.authorUid !== uid) return;

      const category = data.category || "桌遊攻略";
      const xp = POST_XP_TABLE[category] ?? 0;

      postXp += xp;
      postCount += 1;

      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          count: 0,
          xp: 0
        };
      }

      categoryBreakdown[category].count += 1;
      categoryBreakdown[category].xp += xp;
    });

    return {
      postXp: postXp,
      postCount: postCount,
      categoryBreakdown: categoryBreakdown
    };
  }

  function calculateArticleReceivedLikeXp(uid, guides) {
    let articleReceivedLikeXp = 0;
    let totalArticleLikes = 0;

    guides.forEach(function (item) {
      const data = item.data || {};

      if (data.authorUid !== uid) return;

      const likeCount = Number(data.likeCount || 0);

      totalArticleLikes += likeCount;
      articleReceivedLikeXp += Math.floor(likeCount / 10);
    });

    return {
      articleReceivedLikeXp: articleReceivedLikeXp,
      totalArticleLikes: totalArticleLikes
    };
  }

  function calculateArticleGivenLikeXp(uid, guides) {
    let articleGivenLikeXp = 0;
    let givenArticleLikeCount = 0;

    guides.forEach(function (item) {
      const data = item.data || {};
      const likedBy = data.likedBy || {};
      const authorUid = data.authorUid || "";

      const hasLikedThisArticle = likedBy[uid] === true;
      const isOwnArticle = authorUid === uid;

      if (hasLikedThisArticle && !isOwnArticle) {
        articleGivenLikeXp += 1;
        givenArticleLikeCount += 1;
      }
    });

    return {
      articleGivenLikeXp: articleGivenLikeXp,
      givenArticleLikeCount: givenArticleLikeCount
    };
  }

  async function calculateMemberXp(user) {
    if (!user) {
      return {
        totalXp: 0,
        postXp: 0,
        postCount: 0,
        articleReceivedLikeXp: 0,
        totalArticleLikes: 0,
        articleGivenLikeXp: 0,
        givenArticleLikeCount: 0,
        categoryBreakdown: {},
        commentLikeXp: 0,
        totalCommentLikes: 0
      };
    }

    if (isAdmin(user)) {
      return {
        totalXp: 0,
        postXp: 0,
        postCount: 0,
        articleReceivedLikeXp: 0,
        totalArticleLikes: 0,
        articleGivenLikeXp: 0,
        givenArticleLikeCount: 0,
        categoryBreakdown: {},
        commentLikeXp: 0,
        totalCommentLikes: 0,
        isAdmin: true
      };
    }

    try {
      const guides = await getPublishedGuides();

      const postResult = calculatePostXp(user.uid, guides);
      const receivedLikeResult = calculateArticleReceivedLikeXp(user.uid, guides);
      const givenLikeResult = calculateArticleGivenLikeXp(user.uid, guides);

      const totalXp =
        postResult.postXp +
        receivedLikeResult.articleReceivedLikeXp +
        givenLikeResult.articleGivenLikeXp;

      return {
        totalXp: totalXp,

        postXp: postResult.postXp,
        postCount: postResult.postCount,
        categoryBreakdown: postResult.categoryBreakdown,

        articleReceivedLikeXp: receivedLikeResult.articleReceivedLikeXp,
        totalArticleLikes: receivedLikeResult.totalArticleLikes,

        articleGivenLikeXp: givenLikeResult.articleGivenLikeXp,
        givenArticleLikeCount: givenLikeResult.givenArticleLikeCount,

        commentLikeXp: 0,
        totalCommentLikes: 0
      };
    } catch (error) {
      console.error("計算社員 XP 失敗：", error);

      return {
        totalXp: 0,
        postXp: 0,
        postCount: 0,
        articleReceivedLikeXp: 0,
        totalArticleLikes: 0,
        articleGivenLikeXp: 0,
        givenArticleLikeCount: 0,
        categoryBreakdown: {},
        commentLikeXp: 0,
        totalCommentLikes: 0
      };
    }
  }

  function injectProfileStyle() {
    if (document.getElementById("bgcProfileStyle")) return;

    const style = document.createElement("style");
    style.id = "bgcProfileStyle";
    style.innerHTML = `
      .bgc-member-profile-panel {
        margin-top: 1rem;
        padding: 0.85rem;
        border-radius: 16px;
        background: rgba(0, 0, 0, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.13);
        color: inherit;
        font-size: 0.92rem;
        line-height: 1.6;
      }

      .bgc-member-profile-name-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.55rem;
      }

      .bgc-member-profile-name {
        min-width: 0;
        font-weight: 800;
        line-height: 1.35;
        word-break: break-word;
      }

      .bgc-member-profile-level {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        padding: 3px 9px;
        border-radius: 999px;
        border: 1px solid rgba(79, 177, 186, 0.45);
        background: rgba(79, 177, 186, 0.13);
        font-size: 0.78rem;
        font-weight: 900;
        white-space: nowrap;
      }

      .bgc-member-profile-xp-text {
        opacity: 0.88;
        font-size: 0.82rem;
        line-height: 1.55;
        margin-bottom: 0.5rem;
      }

      .bgc-member-profile-progress {
        width: 100%;
        height: 8px;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.16);
        margin-bottom: 0.65rem;
      }

      .bgc-member-profile-progress-bar {
        height: 100%;
        width: 0%;
        border-radius: 999px;
        background: rgb(79, 177, 186);
        transition: width 0.25s ease;
      }

      .bgc-member-profile-xp-source {
        margin: 0.55rem 0 0.65rem;
        padding: 0.55rem 0.65rem;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 0.78rem;
        line-height: 1.65;
        opacity: 0.9;
      }

      .bgc-member-profile-actions {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        margin-top: 0.6rem;
      }

      .bgc-member-profile-actions button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 5px 9px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 0.78rem;
        font-weight: 800;
        cursor: pointer;
        line-height: 1.2;
      }

      .bgc-member-profile-actions button:hover {
        border-color: rgba(79, 177, 186, 0.65);
        background: rgba(79, 177, 186, 0.12);
      }

      .bgc-profile-modal {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.64);
        box-sizing: border-box;
      }

      .bgc-profile-modal.show {
        display: flex;
      }

      .bgc-profile-modal-card {
        width: 100%;
        max-width: 440px;
        background: #fff;
        color: #222;
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 18px 46px rgba(0, 0, 0, 0.36);
        box-sizing: border-box;
      }

      .bgc-profile-modal-card h3 {
        margin: 0 0 12px 0;
        color: #222;
        font-size: 22px;
      }

      .bgc-profile-modal-card p {
        margin: 0 0 15px 0;
        color: #555;
        line-height: 1.7;
        font-size: 14px;
      }

      .bgc-profile-modal-card label {
        display: block;
        margin-bottom: 0.45rem;
        color: #333;
        font-weight: 800;
      }

      .bgc-profile-modal-card input {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid #d0d0d0;
        background: #fff;
        color: #222;
        font: inherit;
      }

      .bgc-profile-modal-msg {
        min-height: 21px;
        margin-top: 0.8rem;
        color: #d93025;
        font-size: 14px;
        line-height: 1.55;
      }

      .bgc-profile-modal-msg.success {
        color: #188038;
      }

      .bgc-profile-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 18px;
      }

      .bgc-profile-modal-actions button {
        padding: 9px 14px;
        border: none;
        border-radius: 999px;
        cursor: pointer;
        font-weight: 800;
      }

      #bgcProfileCancelBtn {
        background: #e8e8e8;
        color: #333;
      }

      #bgcProfileSaveBtn {
        background: rgb(79, 177, 186);
        color: #fff;
      }

      @media (max-width: 640px) {
        .bgc-profile-modal-actions {
          flex-direction: column-reverse;
        }

        .bgc-profile-modal-actions button {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function findSidebarTarget() {
    return (
      document.querySelector(".sidebar-sticky") ||
      document.querySelector(".sidebar") ||
      document.querySelector("aside") ||
      document.body
    );
  }

  function ensureProfilePanel() {
    injectProfileStyle();

    let panel = document.getElementById("bgcMemberProfilePanel");

    if (panel) return panel;

    const target = findSidebarTarget();

    panel = document.createElement("div");
    panel.id = "bgcMemberProfilePanel";
    panel.className = "bgc-member-profile-panel";
    panel.innerHTML = `
      <div class="bgc-member-profile-name-row">
        <div class="bgc-member-profile-name" id="bgcProfileDisplayName">社員</div>
        <div class="bgc-member-profile-level" id="bgcProfileLevel">Lv.1</div>
      </div>

      <div class="bgc-member-profile-xp-text" id="bgcProfileXpText">
        XP 載入中...
      </div>

      <div class="bgc-member-profile-progress">
        <div class="bgc-member-profile-progress-bar" id="bgcProfileProgressBar"></div>
      </div>

      <div class="bgc-member-profile-xp-source" id="bgcProfileXpSource">
        經驗值來源載入中...
      </div>

      <div class="bgc-member-profile-actions">
        <button id="bgcChangeDisplayNameBtn" type="button">更改 ID</button>
        <button id="bgcLogoutBtn" type="button">登出</button>
      </div>
    `;

    target.appendChild(panel);

    const changeNameBtn = document.getElementById("bgcChangeDisplayNameBtn");
    const logoutBtn = document.getElementById("bgcLogoutBtn");

    if (changeNameBtn) {
      changeNameBtn.addEventListener("click", openDisplayNameModal);
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async function () {
        await auth.signOut();
        window.location.href = "/login/";
      });
    }

    return panel;
  }

  function createDisplayNameModal() {
    if (document.getElementById("bgcProfileModal")) return;

    const modal = document.createElement("div");
    modal.id = "bgcProfileModal";
    modal.className = "bgc-profile-modal";
    modal.innerHTML = `
      <div class="bgc-profile-modal-card">
        <h3>更改社員 ID</h3>
        <p>社員 ID 會顯示在留言、社員論壇文章與互動紀錄中。建議使用大家認得出你的暱稱。</p>

        <label for="bgcProfileDisplayNameInput">社員 ID</label>
        <input id="bgcProfileDisplayNameInput" type="text" maxlength="20" placeholder="請輸入新的社員 ID">

        <div id="bgcProfileModalMsg" class="bgc-profile-modal-msg"></div>

        <div class="bgc-profile-modal-actions">
          <button id="bgcProfileCancelBtn" type="button">取消</button>
          <button id="bgcProfileSaveBtn" type="button">儲存</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("bgcProfileCancelBtn").addEventListener("click", closeDisplayNameModal);
    document.getElementById("bgcProfileSaveBtn").addEventListener("click", saveDisplayName);

    document.getElementById("bgcProfileDisplayNameInput").addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        saveDisplayName();
      }
    });

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeDisplayNameModal();
    });
  }

  function setModalMsg(text, type) {
    const modalMsg = document.getElementById("bgcProfileModalMsg");
    if (!modalMsg) return;

    modalMsg.innerText = text || "";
    modalMsg.className = type === "success"
      ? "bgc-profile-modal-msg success"
      : "bgc-profile-modal-msg";
  }

  function openDisplayNameModal() {
    if (!currentUser) return;

    createDisplayNameModal();

    const modal = document.getElementById("bgcProfileModal");
    const input = document.getElementById("bgcProfileDisplayNameInput");

    if (!modal || !input) return;

    input.value =
      currentUserData && currentUserData.displayName
        ? currentUserData.displayName
        : getEmailPrefix(currentUser.email);

    setModalMsg("");
    modal.classList.add("show");

    setTimeout(function () {
      input.focus();
      input.select();
    }, 100);
  }

  function closeDisplayNameModal() {
    const modal = document.getElementById("bgcProfileModal");
    if (modal) modal.classList.remove("show");
  }

  async function saveDisplayName() {
    if (isSavingDisplayName) return;

    if (!currentUser) {
      setModalMsg("請先登入。");
      return;
    }

    const input = document.getElementById("bgcProfileDisplayNameInput");
    const saveBtn = document.getElementById("bgcProfileSaveBtn");

    const displayName = sanitizeDisplayName(input.value);
    const error = validateDisplayName(displayName);

    if (error) {
      setModalMsg(error);
      input.focus();
      return;
    }

    try {
      isSavingDisplayName = true;
      saveBtn.disabled = true;
      saveBtn.innerText = "儲存中...";
      setModalMsg("正在儲存...");

      await db.collection("users").doc(currentUser.uid).update({
        email: currentUser.email || "",
        displayName: displayName,
        displayNameConfirmed: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      currentUserData = {
        ...(currentUserData || {}),
        email: currentUser.email || "",
        displayName: displayName,
        displayNameConfirmed: true
      };

      setModalMsg("社員 ID 已更新。", "success");
      await renderProfile();

      window.dispatchEvent(new CustomEvent("bgc-profile-updated", {
        detail: {
          displayName: displayName
        }
      }));

      setTimeout(function () {
        closeDisplayNameModal();
      }, 700);
    } catch (error) {
      console.error("更新社員 ID 失敗：", error);
      setModalMsg("更新失敗，請稍後再試。");
    } finally {
      isSavingDisplayName = false;
      saveBtn.disabled = false;
      saveBtn.innerText = "儲存";
    }
  }

  function renderProfileContent(displayName, levelInfo, xpInfo) {
    ensureProfilePanel();

    const displayNameEl = document.getElementById("bgcProfileDisplayName");
    const levelEl = document.getElementById("bgcProfileLevel");
    const xpTextEl = document.getElementById("bgcProfileXpText");
    const progressBarEl = document.getElementById("bgcProfileProgressBar");
    const xpSourceEl = document.getElementById("bgcProfileXpSource");

    if (displayNameEl) {
      displayNameEl.innerText = displayName || "尚未設定 ID";
    }

    if (isAdmin(currentUser)) {
      if (levelEl) levelEl.innerText = "Lv.9999";
      if (xpTextEl) xpTextEl.innerText = "管理員帳號，等級固定為最高等級。";
      if (progressBarEl) progressBarEl.style.width = "100%";
      if (xpSourceEl) {
        xpSourceEl.innerHTML = `
          <div>管理員模式：不累積一般經驗值。</div>
        `;
      }
      return;
    }

    if (levelEl) {
      levelEl.innerText = "Lv." + levelInfo.level;
    }

    if (xpTextEl) {
      xpTextEl.innerText =
        "目前 XP：" +
        levelInfo.totalXp +
        "｜距離下一級：" +
        levelInfo.currentXp +
        " / " +
        levelInfo.nextLevelXp;
    }

    if (progressBarEl) {
      progressBarEl.style.width = levelInfo.progressPercent + "%";
    }

    if (xpSourceEl) {
      xpSourceEl.innerHTML = `
        <div>發文 XP：${xpInfo.postXp}（${xpInfo.postCount} 篇）</div>
        <div>文章獲讚 XP：${xpInfo.articleReceivedLikeXp}（文章總讚數 ${xpInfo.totalArticleLikes}，每 10 讚 +1 XP）</div>
        <div>按讚文章 XP：${xpInfo.articleGivenLikeXp}（已按讚 ${xpInfo.givenArticleLikeCount} 篇別人的文章）</div>
      `;
    }
  }

  async function renderProfile() {
    if (!currentUser) return;

    try {
      ensureProfilePanel();

      currentUserData = await ensureUserDoc(currentUser);

      const displayName =
        currentUserData.displayName ||
        getEmailPrefix(currentUser.email);

      const xpInfo = await calculateMemberXp(currentUser);

      if (isAdmin(currentUser)) {
        renderProfileContent(displayName, {
          level: MAX_LEVEL,
          totalXp: 0,
          currentXp: 0,
          nextLevelXp: 0,
          progressPercent: 100
        }, xpInfo);

        return;
      }

      const levelInfo = calculateLevelFromXp(xpInfo.totalXp);

      renderProfileContent(displayName, levelInfo, xpInfo);
    } catch (error) {
      console.error("渲染會員資料失敗：", error);
    }
  }

  function hideProfilePanel() {
    const panel = document.getElementById("bgcMemberProfilePanel");

    if (panel) {
      panel.remove();
    }
  }

  auth.onAuthStateChanged(async function (user) {
    currentUser = user;

    if (!user) {
      currentUserData = null;
      hideProfilePanel();
      return;
    }

    await renderProfile();
  });

  window.addEventListener("bgc-profile-updated", async function () {
    await renderProfile();
  });

  window.addEventListener("bgc-xp-refresh", async function () {
    await renderProfile();
  });

  document.addEventListener("DOMContentLoaded", function () {
    if (auth.currentUser) {
      currentUser = auth.currentUser;
      renderProfile();
    }
  });
})();
