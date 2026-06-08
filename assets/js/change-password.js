console.log("change-password.js 已載入");

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

  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const msg = document.getElementById("changePasswordMsg");

  let currentUser = null;

  function setMsg(text, type) {
    if (!msg) return;
    msg.innerText = text || "";
    msg.className = type === "success" ? "change-password-msg success" : "change-password-msg";
  }

  function validatePassword(password, confirmPassword) {
    if (!password) return "請輸入新密碼。";
    if (password.length < 8) return "新密碼至少需要 8 碼。";
    if (password === "00000000") return "新密碼不能繼續使用初始密碼 00000000。";
    if (password !== confirmPassword) return "兩次輸入的密碼不一致。";

    return "";
  }

  async function updateUserPasswordFlag(user) {
    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const data = userDoc.data();

      await userRef.update({
        email: user.email || data.email || "",
        mustChangePassword: false,
        passwordChangedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await userRef.set({
        email: user.email || "",
        displayName: "",
        displayNameConfirmed: false,
        mustChangePassword: false,
        passwordChangedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  async function changePassword() {
    if (!currentUser) {
      setMsg("請先登入後再修改密碼。");

      setTimeout(function () {
        window.location.href = "/login/";
      }, 900);

      return;
    }

    const password = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    const error = validatePassword(password, confirmPassword);

    if (error) {
      setMsg(error);
      return;
    }

    try {
      changePasswordBtn.disabled = true;
      changePasswordBtn.innerText = "修改中...";
      setMsg("正在修改密碼...");

      await currentUser.updatePassword(password);
      await updateUserPasswordFlag(currentUser);

      setMsg("密碼已修改完成，系統即將登出。請使用新密碼重新登入。", "success");

      setTimeout(async function () {
        await auth.signOut();
        window.location.href = "/login/?passwordChanged=1";
      }, 1300);
    } catch (error) {
      console.error("修改密碼失敗：", error);

      if (error.code === "auth/requires-recent-login") {
        setMsg("登入時間過久，請重新登入後再修改密碼。");

        setTimeout(async function () {
          await auth.signOut();
          window.location.href = "/login/?reauth=1";
        }, 1200);
      } else if (error.code === "auth/weak-password") {
        setMsg("密碼強度不足，請使用更安全的密碼。");
      } else {
        setMsg("修改密碼失敗，請稍後再試。");
      }

      changePasswordBtn.disabled = false;
      changePasswordBtn.innerText = "修改密碼";
    }
  }

  auth.onAuthStateChanged(async function (user) {
    currentUser = user;

    if (!user) {
      setMsg("請先登入後再修改密碼。");

      setTimeout(function () {
        window.location.href = "/login/";
      }, 900);

      return;
    }

    try {
      const userDoc = await db.collection("users").doc(user.uid).get();

      if (userDoc.exists && userDoc.data().mustChangePassword === false) {
        setMsg("你已經完成密碼修改，即將返回首頁。", "success");

        setTimeout(function () {
          window.location.href = "/";
        }, 900);

        return;
      }

      setMsg("請設定你的新密碼。", "success");
    } catch (error) {
      console.error("檢查密碼狀態失敗：", error);
      setMsg("目前無法確認帳號狀態，但仍可嘗試修改密碼。");
    }
  });

  changePasswordBtn.addEventListener("click", changePassword);

  [newPasswordInput, confirmPasswordInput].forEach(function (input) {
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        changePassword();
      }
    });
  });
})();
