console.log("admin-nav.js 已載入");

(function () {
  const ADMIN_EMAIL = "itribgc@gmail.com";

  function waitForFirebase(callback) {
    if (window.firebase && firebase.apps && firebase.auth) {
      callback();
      return;
    }

    setTimeout(function () {
      waitForFirebase(callback);
    }, 100);
  }

  function createAdminLink() {
    if (document.getElementById("adminReviewNavLink")) return;

    const link = document.createElement("a");
    link.id = "adminReviewNavLink";
    link.href = "/guides/admin/";
    link.textContent = "審核文章";
    link.className = "admin-review-nav-link";

    const style = document.createElement("style");
    style.id = "adminReviewNavStyle";
    style.innerHTML = `
      .admin-review-nav-link {
        display: block;
        margin-top: 0.55rem;
        color: inherit;
        text-decoration: none;
        font-weight: 700;
        line-height: 1.6;
      }

      .admin-review-nav-link:hover {
        color: rgb(79,177,186);
        text-decoration: none;
      }

      .admin-review-floating-link {
        position: fixed;
        left: 16px;
        bottom: 18px;
        z-index: 99999;
        padding: 8px 13px;
        border-radius: 999px;
        background: rgba(79,177,186,0.92);
        color: #fff;
        text-decoration: none;
        font-weight: 700;
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
      }
    `;

    if (!document.getElementById("adminReviewNavStyle")) {
      document.head.appendChild(style);
    }

    const sidebarSelectors = [
      ".sidebar-nav",
      ".sidebar-sticky nav",
      ".sidebar nav",
      "nav.sidebar",
      ".sidebar-sticky",
      ".sidebar"
    ];

    let target = null;

    for (const selector of sidebarSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        target = el;
        break;
      }
    }

    if (target) {
      target.appendChild(link);
      return;
    }

    link.classList.add("admin-review-floating-link");
    document.body.appendChild(link);
  }

  function removeAdminLink() {
    const link = document.getElementById("adminReviewNavLink");
    if (link) link.remove();
  }

  waitForFirebase(function () {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user && user.email === ADMIN_EMAIL) {
        createAdminLink();

        setTimeout(createAdminLink, 800);
        setTimeout(createAdminLink, 1600);
      } else {
        removeAdminLink();
      }
    });
  });
})();
