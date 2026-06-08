console.log("first-login-id.js 已載入");

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
  let isSaving = false;

  function isHomePage() {
    const path = window.location.pathname;
    return path === "/" || path === "/index.html";
  }

  function getEmailPrefix(email) {
    if (!email || !email.includes("@")) return "";
    return email.split("@")[0] || "";
  }

  function sanitizeDisplayName(name) {
    return String(name || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function validateDisplayName(name) {
    const value = sanitizeDisplayName(name);

    if (!value) {
      return "請輸入社員 ID。";
    }

    if (value.length < 2) {
      return "社員 ID 至少需要 2 個字。";
    }

    if (value.length > 20) {
      return "社員 ID 請控制在 20 個字以內。";
    }

    if (/[<>]/.test(value)) {
      return "社員 ID 不可包含 < 或 > 符號。";
    }

    return "";
  }

  function createModal() {
    if (document.getElementById("firstLoginIdModal")) return;

    const modal = document.createElement("div");
    modal.id = "firstLoginIdModal";

    modal.innerHTML = `
      <style>
        #firstLoginIdModal {
          position: fixed;
          inset: 0;
          z-index: 100000;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.68);
          box-sizing: border-box;
        }

        #firstLoginIdModal.show {
          display: flex;
        }

        .first-login-id-card {
          width: 100%;
          max-width: 500px;
          background: #fff;
          color: #222;
          border-radius: 18px;
          padding: 26px;
          box-shadow: 0 18px 46px rgba(0, 0, 0, 0.38);
          box-sizing: border-box;
        }

        .first-login-id-card h2 {
          margin: 0 0 12px 0;
          color: #222;
          font-size: 24px;
          line-height: 1.35;
        }

        .first-login-id-card p {
          margin: 0 0 16px 0;
          color: #555;
          line-height: 1.7;
          font-size: 15px;
        }

        .first-login-id-field {
          margin-top: 1rem;
        }

        .first-login-id-field label {
          display: block;
          margin-bottom: 0.45rem;
          color: #333;
          font-weight: 800;
        }

        .first-login-id-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 13px;
          border-radius: 12px;
          border: 1px solid #d0d0d0;
          background: #fff;
          color: #222;
          font: inherit;
        }

        .first-login-id-hint {
          margin-top: 0.55rem;
          color: #666;
          font-size: 13px;
          line-height: 1.6;
        }

        #firstLoginIdMsg {
          min-height: 22px;
          margin-top: 0.9rem;
          color: #d93025;
          font-size: 14px;
          line-height: 1.6;
        }

        #firstLoginIdMsg.success {
          color: #188038;
        }

        .first-login-id-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .first-login-id-actions button {
          padding: 10px 16px;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 800;
          font-size: 15px;
        }

        #firstLoginIdSaveBtn {
          background: rgb(79, 177, 186);
          color: #fff;
        }

        #firstLoginIdSaveBtn:hover {
          filter: brightness(1.05);
        }

        @media (max-width: 640px) {
          .first-login-id-card {
            padding: 22px;
          }

          .first-login-id-actions button {
            width: 100%;
          }
        }
      </style>

      <div class="first-login-id-card">
        <h2>設定你的社員 ID</h2>

        <p>
          歡迎來到守夜人桌遊社網站！第一次進入首頁時，請先設定你想在網站上顯示的社員 ID。
          之後你在留言、社員論壇發文、回覆互動時，都會顯示這個名稱。
        </p>

        <div class="first-login-id-field">
          <label for="firstLoginDisplayName">社員 ID</label>
          <input id="firstLoginDisplayName" type="text" maxlength="20" placeholder="請輸入你想顯示的名稱">
          <div class="first-login-id-hint">
            建議使用大家認得出你的暱稱，最多 20 個字。之後仍可透過左側「更改 ID」修改。
          </div>
        </div>

        <div id="firstLoginIdMsg"></div>

        <div class="first-login-id-actions">
          <button id="firstLoginIdSaveBtn" type="button">確認並進入網站</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = document.getElementById("firstLoginDisplayName");
    const saveBtn = document.getElementById("firstLoginIdSaveBtn");

    saveBtn.addEventListener("click", saveDisplayName);

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        saveDisplayName();
      }
    });
  }

  function openModal(defaultName) {
    createModal();

    const modal = document.getElementById("firstLoginIdModal");
    const input = document.getElementById("firstLoginDisplayName");
    const msg = document.getElementById("firstLoginIdMsg");

    if (!modal || !input || !msg) return;

    input.value = defaultName || "";
    msg.innerText = "";
    msg.className = "";

    modal.classList.add("show");

    setTimeout(function () {
      input.focus();
      input.select();
    }, 120);
  }

  function closeModal() {
    const modal = document.getElementById("firstLoginIdModal");

    if (modal) {
      modal.classList.remove("show");
    }
  }

  function setModalMsg(text, type) {
    const msg = document.getElementById("firstLoginIdMsg");

    if (!msg) return;

    msg.innerText = text || "";
    msg.className = type === "success" ? "success" : "";
  }

  async function saveDisplayName() {
    if (isSaving) return;

    if (!currentUser) {
      setModalMsg("請先登入。");
      return;
    }

    const input = document.getElementById("firstLoginDisplayName");
    const saveBtn = document.getElementById("firstLoginIdSaveBtn");

    const displayName = sanitizeDisplayName(input.value);
    const error = validateDisplayName(displayName);

    if (error) {
      setModalMsg(error);
      input.focus();
      return;
    }

    try {
      isSaving = true;
      saveBtn.disabled = true;
      saveBtn.innerText = "儲存中...";
      setModalMsg("正在儲存社員 ID...");

      const userRef = db.collection("users").doc(currentUser.uid);
      const userDoc = await userRef.get();

      const payload = {
        email: currentUser.email || "",
        displayName: displayName,
        displayNameConfirmed: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (userDoc.exists) {
        await userRef.update(payload);
      } else {
        await userRef.set({
          ...payload,
          mustChangePassword: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      setModalMsg("社員 ID 已設定完成！", "success");

      setTimeout(function () {
        closeModal();

        window.dispatchEvent(new CustomEvent("bgc-profile-updated", {
          detail: {
            displayName: displayName
          }
        }));

        window.location.reload();
      }, 700);
    } catch (error) {
      console.error("設定社員 ID 失敗：", error);
      setModalMsg("儲存失敗，請稍後再試。");

      isSaving = false;
      saveBtn.disabled = false;
      saveBtn.innerText = "確認並進入網站";
    }
  }

  async function shouldAskForDisplayName(user) {
    try {
      const userRef = db.collection("users").doc(user.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return {
          shouldAsk: true,
          defaultName: getEmailPrefix(user.email)
        };
      }

      const data = userDoc.data();

      if (data.mustChangePassword === true) {
        return {
          shouldAsk: false,
          defaultName: ""
        };
      }

      if (data.displayNameConfirmed === true && data.displayName) {
        return {
          shouldAsk: false,
          defaultName: data.displayName
        };
      }

      return {
        shouldAsk: true,
        defaultName: data.displayName || getEmailPrefix(user.email)
      };
    } catch (error) {
      console.error("檢查社員 ID 狀態失敗：", error);

      return {
        shouldAsk: false,
        defaultName: ""
      };
    }
  }

  auth.onAuthStateChanged(async function (user) {
    currentUser = user;

    if (!isHomePage()) return;
    if (!user) return;

    const result = await shouldAskForDisplayName(user);

    if (result.shouldAsk) {
      openModal(result.defaultName);
    }
  });
})();
