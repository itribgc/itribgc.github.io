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

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function createProfileModal() {
    if (document.getElementById("profileModal")) {
      return;
    }

    const modal = document.createElement("div");
    modal.id = "profileModal";
    modal.innerHTML = `
      <style>
        #profileModal {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: none;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.58);
          padding: 20px;
          box-sizing: border-box;
        }

        #profileModal.show {
          display: flex;
        }

        .profile-modal-card {
          width: 100%;
          max-width: 380px;
          background: #ffffff;
          color: #222;
          border-radius: 14px;
          padding: 28px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.32);
          box-sizing: border-box;
        }

        .profile-modal-card h2 {
          margin: 0 0 12px 0;
          font-size: 22px;
          color: #222;
        }

        .profile-modal-card p {
          margin: 0 0 18px 0;
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }

        .profile-modal-card label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          color: #333;
        }

        #profileNameInput {
          width: 100%;
          padding: 11px 12px;
          box-sizing: border-box;
          border: 1px solid #d6d6d6;
          border-radius: 8px;
          font-size: 15px;
          outline: none;
        }

        #profileNameInput:focus {
          border-color: rgb(79,177,186);
          box-shadow: 0 0 0 2px rgba(79,177,186,0.18);
        }

        .profile-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        .profile-modal-actions button {
          flex: 1;
          padding: 10px 12px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        #profileSaveBtn {
          background: rgb(79,177,186);
          color: #fff;
        }

        #profileCancelBtn {
          background: #e8e8e8;
          color: #333;
        }

        #profileMsg {
          margin-top: 12px;
          min-height: 20px;
          color: #d93025;
          font-size: 14px;
          line-height: 1.5;
        }
      </style>

      <div class="profile-modal-card">
        <h2>設定你的社員 ID</h2>
        <p>這個名稱會顯示在留言區，不會直接公開你的 Email。之後也可以再修改。</p>

        <label for="profileNameInput">社員 ID</label>
        <input id="profileNameInput" type="text" maxlength="20" placeholder="例如：伊布、阿豪、桌遊小天才">

        <div class="profile-modal-actions">
          <button id="profileCancelBtn" type="button">取消</button>
          <button id="profileSaveBtn" type="button">儲存</button>
        </div>

        <div id="profileMsg"></div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("profileSaveBtn").addEventListener("click", saveProfileName);
    document.getElementById("profileCancelBtn").addEventListener("click", function () {
      hideProfileModal();
    });
  }

  function showProfileModal(force) {
    createProfileModal();

    const modal = document.getElementById("profileModal");
    const input = document.getElementById("profileNameInput");
    const cancelBtn = document.getElementById("profileCancelBtn");
    const msg = document.getElementById("profileMsg");

    input.value = currentDisplayName || "";
    msg.innerText = "";

    if (force) {
      cancelBtn.style.display = "none";
    } else {
      cancelBtn.style.display = "block";
    }

    modal.classList.add("show");
    setTimeout(function () {
      input.focus();
    }, 100);
  }

  function hideProfileModal() {
    const modal = document.getElementById("profileModal");
    if (modal) {
      modal.classList.remove("show");
    }
  }

  function validateDisplayName(name) {
    if (!name) {
      return "請輸入社員 ID。";
    }

    if (name.length < 2) {
      return "社員 ID 至少需要 2 個字。";
    }

    if (name.length > 20) {
      return "社員 ID 請控制在 20 個字以內。";
    }

    const forbidden = /[<>\/\\{}[\]$#]/;

    if (forbidden.test(name)) {
      return "社員 ID 請不要使用特殊符號。";
    }

    return "";
  }

  async function saveProfileName() {
    const input = document.getElementById("profileNameInput");
    const msg = document.getElementById("profileMsg");
    const saveBtn = document.getElementById("profileSaveBtn");

    if (!currentUser) {
      msg.innerText = "請先登入。";
      return;
    }

    const displayName = input.value.trim();
    const error = validateDisplayName(displayName);

    if (error) {
      msg.innerText = error;
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.innerText = "儲存中...";

      await currentUser.updateProfile({
        displayName: displayName
      });

      const userRef = db.collection("users").doc(currentUser.uid);
      const userSnap = await userRef.get();

      const payload = {
        displayName: displayName,
        email: currentUser.email || "",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (!userSnap.exists) {
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      }

      await userRef.set(payload, { merge: true });

      currentDisplayName = displayName;
      updateProfileButtonText();

      hideProfileModal();
    } catch (error) {
      console.error("儲存社員 ID 失敗：", error);
      msg.innerText = "儲存失敗，請稍後再試。";
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerText = "儲存";
    }
  }

  function createProfileButton() {
    if (document.getElementById("profileEditBtn")) {
      return;
    }

    const btn = document.createElement("button");
    btn.id = "profileEditBtn";
    btn.type = "button";
    btn.innerText = "設定 ID";
    btn.style.position = "fixed";
    btn.style.top = "16px";
    btn.style.right = "88px";
    btn.style.zIndex = "99999";
    btn.style.padding = "8px 14px";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.background = "rgb(79,177,186)";
    btn.style.color = "#ffffff";
    btn.style.fontSize = "14px";
    btn.style.fontWeight = "600";
    btn.style.cursor = "pointer";
    btn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.25)";

    btn.addEventListener("click", function () {
      showProfileModal(false);
    });

    document.body.appendChild(btn);
  }

  function updateProfileButtonText() {
    const btn = document.getElementById("profileEditBtn");

    if (!btn) {
      return;
    }

    if (currentDisplayName) {
      btn.innerText = "ID：" + currentDisplayName;
    } else {
      btn.innerText = "設定 ID";
    }
  }

  async function loadUserProfile(user) {
    currentUser = user;

    if (!user) {
      return;
    }

    createProfileButton();

    const userRef = db.collection("users").doc(user.uid);
    const userSnap = await userRef.get();

    if (userSnap.exists && userSnap.data().displayName) {
      currentDisplayName = userSnap.data().displayName;
    } else if (user.displayName) {
      currentDisplayName = user.displayName;

      await userRef.set({
        displayName: user.displayName,
        email: user.email || "",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } else {
      currentDisplayName = "";
    }

    updateProfileButtonText();

    if (!currentDisplayName) {
      showProfileModal(true);
    }
  }

  auth.onAuthStateChanged(function (user) {
    if (user) {
      loadUserProfile(user);
    }
  });
})();
