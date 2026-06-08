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

  let currentUser = null;
  let currentDisplayName = "";
  let currentLevelInfo = null;

  const CATEGORY_XP = {
    "桌遊攻略": 30,
    "活動心得": 20,
    "開箱分享": 20,
    "規則討論": 12,
    "揪團交流": 0
  };

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function xpNeededForNextLevel(level) {
    return 30 + (level - 1) * 15;
  }

  function calculateLevel(totalXP) {
    let level = 1;
    let xpAtLevelStart = 0;
    let needed = xpNeededForNextLevel(level);

    while (totalXP >= xpAtLevelStart + needed) {
      xpAtLevelStart += needed;
      level += 1;
      needed = xpNeededForNextLevel(level);
    }

    const xpInCurrentLevel = totalXP - xpAtLevelStart;
    const xpToNextLevel = needed - xpInCurrentLevel;
    const progressPercent = needed > 0
      ? Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / needed) * 100)))
      : 0;

    return {
      level: level,
      totalXP: totalXP,
      xpInCurrentLevel: xpInCurrentLevel,
      xpNeededForNextLevel: needed,
      xpToNextLevel: xpToNextLevel,
      progressPercent: progressPercent
    };
  }

  function getCategoryXP(category) {
    return CATEGORY_XP[category] ?? 0;
  }

  async function loadUserProfile(user) {
    const ref = db.collection("users").doc(user.uid);
    const doc = await ref.get();

    if (doc.exists && doc.data().displayName) {
      return doc.data().displayName;
    }

    const fallbackName = user.displayName || user.email.split("@")[0];

    await ref.set({
      displayName: fallbackName,
      email: user.email
    }, { merge: true });

    return fallbackName;
  }

  async function calculateUserXP(user) {
    const uid = user.uid;

    let postBaseXP = 0;
    let postLikeXP = 0;
    let commentLikeXP = 0;

    let postCount = 0;
    let articleLikeCount = 0;
    let commentLikeCount = 0;

    try {
      const guideSnapshot = await db.collection("guides")
        .where("authorUid", "==", uid)
        .get();

      guideSnapshot.forEach(function (doc) {
        const data = doc.data();

        if (data.status !== "published") return;

        postCount += 1;

        const category = data.category || "桌遊攻略";
        const likeCount = Number(data.likeCount || 0);

        postBaseXP += getCategoryXP(category);
        articleLikeCount += likeCount;
      });

      postLikeXP = Math.floor(articleLikeCount / 10);
    } catch (error) {
      console.error("計算文章經驗值失敗：", error);
    }

    try {
      const commentSnapshot = await db.collection("comments")
        .where("uid", "==", uid)
        .get();

      commentSnapshot.forEach(function (doc) {
        const data = doc.data();
        commentLikeCount += Number(data.likeCount || 0);
      });

      commentLikeXP = Math.floor(commentLikeCount / 10);
    } catch (error) {
      console.error("計算留言經驗值失敗：", error);
    }

    const totalXP = postBaseXP + postLikeXP + commentLikeXP;
    const levelInfo = calculateLevel(totalXP);

    return {
      ...levelInfo,
      postCount: postCount,
      articleLikeCount: articleLikeCount,
      commentLikeCount: commentLikeCount,
      postBaseXP: postBaseXP,
      postLikeXP: postLikeXP,
      commentLikeXP: commentLikeXP
    };
  }

  function ensureProfileStyles() {
    if (document.getElementById("memberProfileStyle")) return;

    const style = document.createElement("style");
    style.id = "memberProfileStyle";
    style.innerHTML = `
      .member-profile-panel {
        margin: 1rem auto 0;
        padding: 0.85rem 0.9rem;
        width: calc(100% - 1.4rem);
        max-width: 260px;
        border-radius: 16px;
        background: rgba(0, 0, 0, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.14);
        box-sizing: border-box;
        color: inherit;
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .member-profile-name-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 0.45rem;
      }

      .member-profile-name {
        min-width: 0;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .member-profile-edit-btn,
      .member-profile-logout-btn {
        flex: 0 0 auto;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.06);
        color: inherit;
        border-radius: 999px;
        padding: 4px 9px;
        font: inherit;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        line-height: 1.2;
      }

      .member-profile-edit-btn:hover,
      .member-profile-logout-btn:hover {
        border-color: rgba(79,177,186,0.75);
        background: rgba(79,177,186,0.12);
      }

      .member-profile-level-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        margin-top: 0.45rem;
        font-size: 0.84rem;
        opacity: 0.95;
      }

      .member-profile-level-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 3px 9px;
        border-radius: 999px;
        border: 1px solid rgba(79,177,186,0.5);
        background: rgba(79,177,186,0.14);
        font-weight: 800;
        white-space: nowrap;
      }

      .member-profile-xp-text {
        min-width: 0;
        opacity: 0.82;
        font-size: 0.78rem;
        text-align: right;
      }

      .member-profile-progress {
        width: 100%;
        height: 7px;
        margin-top: 0.55rem;
        border-radius: 999px;
        background: rgba(255,255,255,0.11);
        overflow: hidden;
      }

      .member-profile-progress-bar {
        height: 100%;
        width: 0%;
        border-radius: 999px;
        background: rgba(79,177,186,0.92);
        transition: width 0.25s ease;
      }

      .member-profile-breakdown {
        margin-top: 0.55rem;
        font-size: 0.76rem;
        opacity: 0.72;
        line-height: 1.55;
      }

      .member-profile-loading {
        opacity: 0.75;
        font-size: 0.85rem;
      }

      .member-profile-floating {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 99998;
        width: 260px;
        margin: 0;
        box-shadow: 0 8px 26px rgba(0,0,0,0.28);
        backdrop-filter: blur(10px);
      }

      #memberProfileModal {
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

      #memberProfileModal.show {
        display: flex;
      }

      .member-profile-modal-card {
        width: 100%;
        max-width: 420px;
        background: #fff;
        color: #222;
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 16px 40px rgba(0,0,0,0.34);
        box-sizing: border-box;
      }

      .member-profile-modal-card h3 {
        margin: 0 0 12px 0;
        color: #222;
      }

      .member-profile-modal-card p {
        margin: 0 0 14px 0;
        color: #555;
        line-height: 1.6;
        font-size: 14px;
      }

      .member-profile-modal-card input {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid #d6d6d6;
        color: #222;
        background: #fff;
        font: inherit;
      }

      #memberProfileModalMsg {
        min-height: 20px;
        margin-top: 10px;
        color: #d93025;
        font-size: 14px;
        line-height: 1.5;
      }

      #memberProfileModalMsg.success {
        color: #188038;
      }

      .member-profile-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 16px;
      }

      .member-profile-modal-actions button {
        padding: 9px 14px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 700;
      }

      #memberProfileCancelBtn {
        background: #e8e8e8;
        color: #333;
      }

      #memberProfileSaveBtn {
        background: rgb(79,177,186);
        color: #fff;
      }

      @media (max-width: 768px) {
        .member-profile-floating {
          right: 10px;
          bottom: 10px;
          width: calc(100vw - 20px);
          max-width: 300px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function findProfileTarget() {
    const selectors = [
      ".sidebar-nav",
      ".sidebar-sticky nav",
      ".sidebar nav",
      "nav.sidebar",
      ".sidebar-sticky",
      ".sidebar"
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    return null;
  }

  function createProfilePanel() {
    let panel = document.getElementById("memberProfilePanel");

    if (panel) return panel;

    panel = document.createElement("div");
    panel.id = "memberProfilePanel";
    panel.className = "member-profile-panel";
    panel.innerHTML = `
      <div class="member-profile-loading">社員資料載入中...</div>
    `;

    const target = findProfileTarget();

    if (target) {
      target.appendChild(panel);
    } else {
      panel.classList.add("member-profile-floating");
      document.body.appendChild(panel);
    }

    return panel;
  }

  function renderProfilePanel() {
    const panel = createProfilePanel();

    if (!currentUser) {
      panel.innerHTML = `
        <div class="member-profile-loading">尚未登入</div>
      `;
      return;
    }

    const level = currentLevelInfo || calculateLevel(0);

    panel.innerHTML = `
      <div class="member-profile-name-row">
        <div class="member-profile-name" title="${escapeHtml(currentDisplayName)}">
          ${escapeHtml(currentDisplayName || "未命名社員")}
        </div>
        <button id="memberProfileEditBtn" class="member-profile-edit-btn" type="button">更改ID</button>
      </div>

      <div class="member-profile-level-row">
        <span class="member-profile-level-badge">Lv.${level.level}</span>
        <span class="member-profile-xp-text">
          EXP ${level.xpInCurrentLevel} / ${level.xpNeededForNextLevel}
        </span>
      </div>

      <div class="member-profile-progress" title="距離下一級還需要 ${level.xpToNextLevel} XP">
        <div class="member-profile-progress-bar" style="width: ${level.progressPercent}%;"></div>
      </div>

      <div class="member-profile-breakdown">
        總經驗 ${level.totalXP || 0} XP<br>
        發文 ${level.postBaseXP || 0} XP・文章讚 ${level.postLikeXP || 0} XP・留言讚 ${level.commentLikeXP || 0} XP
      </div>

      <div style="margin-top: 0.65rem;">
        <button id="memberProfileLogoutBtn" class="member-profile-logout-btn" type="button">登出</button>
      </div>
    `;

    const editBtn = document.getElementById("memberProfileEditBtn");
    const logoutBtn = document.getElementById("memberProfileLogoutBtn");

    if (editBtn) {
      editBtn.addEventListener("click", openProfileModal);
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async function () {
        await auth.signOut();
        window.location.href = "/login/";
      });
    }
  }

  function createProfileModal() {
    if (document.getElementById("memberProfileModal")) return;

    const modal = document.createElement("div");
    modal.id = "memberProfileModal";
    modal.innerHTML = `
      <div class="member-profile-modal-card">
        <h3>更改社員 ID</h3>
        <p>社員 ID 會顯示在留言與文章作者資訊中，建議使用大家認得出你的暱稱。</p>

        <input id="memberProfileNameInput" type="text" maxlength="20" placeholder="請輸入 1–20 字的社員 ID">

        <div id="memberProfileModalMsg"></div>

        <div class="member-profile-modal-actions">
          <button id="memberProfileCancelBtn" type="button">取消</button>
          <button id="memberProfileSaveBtn" type="button">儲存</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("memberProfileCancelBtn").addEventListener("click", closeProfileModal);
    document.getElementById("memberProfileSaveBtn").addEventListener("click", saveDisplayName);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeProfileModal();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeProfileModal();
    });
  }

  function openProfileModal() {
    createProfileModal();

    const modal = document.getElementById("memberProfileModal");
    const input = document.getElementById("memberProfileNameInput");
    const msg = document.getElementById("memberProfileModalMsg");

    input.value = currentDisplayName || "";
    msg.innerText = "";
    msg.className = "";

    modal.classList.add("show");

    setTimeout(function () {
      input.focus();
      input.select();
    }, 100);
  }

  function closeProfileModal() {
    const modal = document.getElementById("memberProfileModal");

    if (modal) {
      modal.classList.remove("show");
    }
  }

  async function saveDisplayName() {
    const input = document.getElementById("memberProfileNameInput");
    const msg = document.getElementById("memberProfileModalMsg");
    const saveBtn = document.getElementById("memberProfileSaveBtn");

    if (!currentUser) {
      msg.innerText = "請先登入。";
      return;
    }

    const name = input.value.trim();

    if (!name) {
      msg.innerText = "社員 ID 不能空白。";
      input.focus();
      return;
    }

    if (name.length > 20) {
      msg.innerText = "社員 ID 請控制在 20 字以內。";
      input.focus();
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.innerText = "儲存中...";

      await db.collection("users").doc(currentUser.uid).set({
        displayName: name,
        email: currentUser.email
      }, { merge: true });

      currentDisplayName = name;

      msg.className = "success";
      msg.innerText = "已更新社員 ID。";

      renderProfilePanel();

      setTimeout(closeProfileModal, 800);
    } catch (error) {
      console.error("更新社員 ID 失敗：", error);
      msg.className = "";
      msg.innerText = "更新失敗，請稍後再試。";
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerText = "儲存";
    }
  }

  async function refreshProfile(user) {
    currentUser = user;

    if (!user) {
      currentDisplayName = "";
      currentLevelInfo = null;
      renderProfilePanel();
      return;
    }

    try {
      currentDisplayName = await loadUserProfile(user);
    } catch (error) {
      console.error("讀取社員 ID 失敗：", error);
      currentDisplayName = user.displayName || user.email.split("@")[0];
    }

    renderProfilePanel();

    try {
      currentLevelInfo = await calculateUserXP(user);
    } catch (error) {
      console.error("計算社員等級失敗：", error);
      currentLevelInfo = calculateLevel(0);
    }

    renderProfilePanel();
  }

  function init() {
    ensureProfileStyles();
    createProfilePanel();
    createProfileModal();

    auth.onAuthStateChanged(function (user) {
      refreshProfile(user);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
