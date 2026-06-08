console.log("auth-guard.js 已載入");

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

  function getPath() {
    return window.location.pathname;
  }

  function isLoginPage() {
    return getPath().startsWith("/login/");
  }

  function isChangePasswordPage() {
    return getPath().startsWith("/change-password/");
  }

  function isStandaloneAuthPage() {
    return isLoginPage() || isChangePasswordPage();
  }

  async function getMustChangePassword(user) {
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();

      if (!userDoc.exists) {
        return false;
      }

      return userDoc.data().mustChangePassword === true;
    } catch (error) {
      console.error("檢查 mustChangePassword 失敗：", error);

      /*
        如果檢查失敗，為了避免誤放行第一次登入者，
        這裡保守處理：不讓進一般頁面，導回 login。
      */
      if (!isStandaloneAuthPage()) {
        window.location.replace("/login/");
      }

      return false;
    }
  }

  function redirectToLogin() {
    if (!isLoginPage()) {
      window.location.replace("/login/");
    }
  }

  function redirectToChangePassword() {
    if (!isChangePasswordPage()) {
      window.location.replace("/change-password/");
    }
  }

  function redirectToHome() {
    if (isLoginPage() || isChangePasswordPage()) {
      window.location.replace("/");
    }
  }

  auth.onAuthStateChanged(async function (user) {
    if (!user) {
      /*
        未登入者：
        login 頁、change-password 頁可以停留。
        其他所有桌遊社頁面都導回 login。
      */
      if (!isStandaloneAuthPage()) {
        redirectToLogin();
      }

      return;
    }

    const mustChangePassword = await getMustChangePassword(user);

    if (mustChangePassword) {
      /*
        已登入但尚未修改初始密碼：
        只能待在 /change-password/
        任何其他頁面都強制踢回 /change-password/
      */
      redirectToChangePassword();
      return;
    }

    /*
      已登入且已完成密碼修改：
      如果還停在 login 或 change-password，才導回首頁。
      其他一般頁面可以正常瀏覽。
    */
    redirectToHome();
  });
})();
