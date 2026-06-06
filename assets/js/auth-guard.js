console.log("auth-guard.js 已載入");

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

function normalizePath(path) {
  if (!path.endsWith("/")) {
    return path + "/";
  }
  return path;
}

function isPublicPage(path) {
  const normalizedPath = normalizePath(path);

  const publicPages = [
    "/login/",
    "/login/index.html/"
  ];

  return publicPages.includes(normalizedPath);
}

function addLogoutButton() {
  if (document.getElementById("siteLogoutBtn")) {
    return;
  }

  const logoutBtn = document.createElement("button");
  logoutBtn.id = "siteLogoutBtn";
  logoutBtn.innerText = "登出";

  logoutBtn.style.position = "fixed";
  logoutBtn.style.top = "16px";
  logoutBtn.style.right = "16px";
  logoutBtn.style.zIndex = "99999";
  logoutBtn.style.padding = "8px 14px";
  logoutBtn.style.border = "none";
  logoutBtn.style.borderRadius = "8px";
  logoutBtn.style.background = "#3366cc";
  logoutBtn.style.color = "#ffffff";
  logoutBtn.style.fontSize = "14px";
  logoutBtn.style.fontWeight = "600";
  logoutBtn.style.cursor = "pointer";
  logoutBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.25)";

  logoutBtn.addEventListener("mouseover", function () {
    logoutBtn.style.background = "#2855aa";
  });

  logoutBtn.addEventListener("mouseout", function () {
    logoutBtn.style.background = "#3366cc";
  });

  logoutBtn.addEventListener("click", async function () {
    try {
      logoutBtn.disabled = true;
      logoutBtn.innerText = "登出中...";

      await auth.signOut();

      window.location.replace("/login/");
    } catch (error) {
      console.error("登出失敗：", error);
      alert("登出失敗，請稍後再試。");
      logoutBtn.disabled = false;
      logoutBtn.innerText = "登出";
    }
  });

  document.body.appendChild(logoutBtn);
}

function removeLogoutButton() {
  const logoutBtn = document.getElementById("siteLogoutBtn");

  if (logoutBtn) {
    logoutBtn.remove();
  }
}

function checkAuth() {
  const currentPath = window.location.pathname;
  const publicPage = isPublicPage(currentPath);

  console.log("目前路徑：", currentPath);
  console.log("是否公開頁：", publicPage);

  auth.onAuthStateChanged(function(user) {
    console.log("目前登入狀態：", user);

    if (!user && !publicPage) {
      console.log("尚未登入，導向 /login/");
      removeLogoutButton();
      window.location.replace("/login/");
      return;
    }

    if (user && !publicPage) {
      console.log("已登入，顯示登出按鈕");
      addLogoutButton();
      return;
    }

    removeLogoutButton();
    console.log("驗證通過");
  });
}

checkAuth();
