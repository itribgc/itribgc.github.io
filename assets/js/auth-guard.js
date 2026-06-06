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

const currentPath = window.location.pathname;

const publicPages = [
  "/login/",
  "/login/index.html"
];

const isPublicPage = publicPages.includes(currentPath);

auth.onAuthStateChanged(function(user) {
  if (!user && !isPublicPage) {
    window.location.replace("/login/");
  }
});
