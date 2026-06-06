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

function checkAuth() {
  const currentPath = normalizePath(window.location.pathname);

  const publicPages = [
    "/login/",
    "/login/index.html/"
  ];

  const isPublicPage = publicPages.includes(currentPath);

  console.log("目前路徑：", currentPath);
  console.log("是否公開頁：", isPublicPage);

  auth.onAuthStateChanged(function(user) {
    console.log("目前登入狀態：", user);

    if (!user && !isPublicPage) {
      console.log("尚未登入，導向 /login/");
      window.location.replace("/login/");
      return;
    }

    console.log("驗證通過");
  });
}

checkAuth();
