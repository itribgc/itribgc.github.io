console.log("guide-admin.js 已載入");

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

  let currentUser = null;
  let unsubscribeReports = null;

  const listEl = document.getElementById("reportedGuideList");
  const msgEl = document.getElementById("guideAdminMsg");

  function setMsg(text, type) {
    if (!msgEl) return;
    msgEl.innerText = text || "";
    msgEl.className = type === "success" ? "guide-admin-msg success" : "guide-admin-msg";
  }

  function isAdmin(user) {
    return user && user.email === ADMIN_EMAIL;
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTime(timestamp) {
    if (!timestamp || !timestamp.toDate) return "";

    const date = timestamp.toDate();

    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function createDeleteModal() {
    if (document.getElementById("adminDeleteGuideModal")) return;

    const modal = document.createElement("div");
    modal.id = "adminDeleteGuideModal";
    modal.innerHTML = `
      <style>
        #adminDeleteGuideModal {
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

        #adminDeleteGuideModal.show {
          display: flex;
        }

        .admin-delete-card {
          width: 100%;
          max-width: 430px;
          background: #fff;
          color: #222;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.34);
          box-sizing: border-box;
        }

        .admin-delete-card h3 {
          margin: 0 0 12px 0;
          color: #222;
        }

        .admin-delete-card p {
          margin: 0 0 16px 0;
          color: #555;
          line-height: 1.6;
          font-size: 14px;
        }

        #adminDeleteMsg {
          min-height: 20px;
          color: #d93025;
          font-size: 14px;
          line-height: 1.5;
        }

        .admin-delete-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .admin-delete-actions button {
          padding: 9px 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        #adminDeleteCancelBtn {
          background: #e8e8e8;
          color: #333;
        }

        #adminDeleteConfirmBtn {
          background: #d93025;
          color: #fff;
        }
      </style>

      <div class="admin-delete-card">
        <h3>刪除文章</h3>
        <p id="adminDeleteText">確定要刪除這篇文章嗎？刪除後無法復原。</p>
        <div id="adminDeleteMsg"></div>

        <div class="admin-delete-actions">
          <button id="adminDeleteCancelBtn" type="button">取消</button>
          <button id="adminDeleteConfirmBtn" type="button">確定刪除</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("adminDeleteCancelBtn").addEventListener("click", closeDeleteModal);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeDeleteModal();
    });
  }

  function closeDeleteModal() {
    const modal = document.getElementById("adminDeleteGuideModal");
    if (modal) modal.classList.remove("show");
  }

  function openDeleteModal(guideId, reportId, title) {
    createDeleteModal();

    const modal = document.getElementById("adminDeleteGuideModal");
    const text = document.getElementById("adminDeleteText");
    const msg = document.getElementById("adminDeleteMsg");
    const confirmBtn = document.getElementById("adminDeleteConfirmBtn");

    text.innerText = `確定要刪除文章「${title || "未命名文章"}」嗎？刪除後無法復原。`;
    msg.innerText = "";

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener("click", function () {
      deleteGuideByAdmin(guideId, reportId, newConfirmBtn, msg);
    });

    modal.classList.add("show");
  }

  async function deleteGuideByAdmin(guideId, reportId, confirmBtn, msg) {
    if (!isAdmin(currentUser)) {
      msg.innerText = "你沒有管理員權限。";
      return;
    }

    try {
      confirmBtn.disabled = true;
      confirmBtn.innerText = "刪除中...";

      await db.collection("guides").doc(guideId).delete();

      await db.collection("reports").doc(reportId).update({
        status: "deleted",
        handledBy: currentUser.uid,
        handledByEmail: currentUser.email,
        handledAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      closeDeleteModal();
      setMsg("文章已刪除。", "success");
    } catch (error) {
      console.error("管理員刪除文章失敗：", error);
      msg.innerText = "刪除失敗，請稍後再試。";
      confirmBtn.disabled = false;
      confirmBtn.innerText = "確定刪除";
    }
  }

  async function markReportResolved(reportId) {
    if (!isAdmin(currentUser)) {
      setMsg("你沒有管理員權限。");
      return;
    }

    const ok = confirm("確定將這筆疑慮回報標記為已處理嗎？");
    if (!ok) return;

    try {
      await db.collection("reports").doc(reportId).update({
        status: "resolved",
        handledBy: currentUser.uid,
        handledByEmail: currentUser.email,
        handledAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      setMsg("已標記為已處理。", "success");
    } catch (error) {
      console.error("標記已處理失敗：", error);
      setMsg("標記失敗，請稍後再試。");
    }
  }

  async function loadGuideData(guideId) {
    try {
      const doc = await db.collection("guides").doc(guideId).get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        data: doc.data()
      };
    } catch (error) {
      console.error("讀取被回報文章失敗：", error);
      return null;
    }
  }

  async function renderReports(snapshot) {
    if (!listEl) return;

    if (!isAdmin(currentUser)) {
      listEl.innerHTML = `<div class="reported-guide-empty">你沒有審核文章權限。</div>`;
      return;
    }

    if (snapshot.empty) {
      listEl.innerHTML = `<div class="reported-guide-empty">目前沒有被回報有疑慮的文章。</div>`;
      return;
    }

    const reportDocs = snapshot.docs.slice().sort(function (a, b) {
      const aTime = a.data().createdAt && a.data().createdAt.toMillis ? a.data().createdAt.toMillis() : 0;
      const bTime = b.data().createdAt && b.data().createdAt.toMillis ? b.data().createdAt.toMillis() : 0;
      return bTime - aTime;
    });

    const rows = [];

    for (const reportDoc of reportDocs) {
      const report = reportDoc.data();
      const guide = await loadGuideData(report.guideId);

      rows.push({
        reportId: reportDoc.id,
        report: report,
        guide: guide
      });
    }

    let html = "";

    rows.forEach(function (row) {
      const report = row.report;
      const guide = row.guide;
      const guideData = guide ? guide.data : null;

      const title = guideData ? guideData.title : report.guideTitle;
      const category = guideData ? guideData.category : report.guideCategory;
      const gameName = guideData ? guideData.gameName : report.guideGameName;
      const summary = guideData ? guideData.summary : report.guideSummary;
      const coverImage = guideData && guideData.coverImage ? guideData.coverImage : report.guideCoverImage;
      const authorName = guideData ? guideData.authorName : report.guideAuthorName;

      html += `
        <article class="reported-guide-card">
          ${
            coverImage
              ? `
                <a class="reported-guide-cover-link" href="/guides/post/?id=${encodeURIComponent(report.guideId)}">
                  <img class="reported-guide-cover" src="${escapeHtml(coverImage)}" alt="${escapeHtml(title || "文章封面")}">
                </a>
              `
              : `
                <div class="reported-guide-cover reported-guide-cover-empty">無封面</div>
              `
          }

          <div class="reported-guide-body">
            <a class="reported-guide-title-link" href="/guides/post/?id=${encodeURIComponent(report.guideId)}">
              <h2>${escapeHtml(title || "未命名文章")}</h2>
            </a>

            <div class="reported-guide-meta">
              <span>主題：${escapeHtml(gameName || "未分類主題")}</span>
              <span>・${escapeHtml(authorName || "未命名社員")}</span>
              <span class="reported-guide-pill">${escapeHtml(category || "未分類")}</span>
            </div>

            <p class="reported-guide-summary">${escapeHtml(summary || "這篇文章沒有摘要。")}</p>

            <div class="reported-reason-box">
              <strong>疑慮內容：</strong>
              <div>${escapeHtml(report.reason || "未填寫")}</div>
              <small>
                回報者：${escapeHtml(report.reporterName || "未命名社員")}
                ・${escapeHtml(report.reporterEmail || "")}
                ・${escapeHtml(formatTime(report.createdAt))}
              </small>
            </div>

            ${
              guide
                ? `
                  <div class="reported-guide-actions">
                    <a class="reported-guide-read-btn" href="/guides/post/?id=${encodeURIComponent(report.guideId)}">查看文章</a>
                    <button
                      class="reported-guide-delete-btn"
                      type="button"
                      data-guide-id="${escapeHtml(report.guideId)}"
                      data-report-id="${escapeHtml(row.reportId)}"
                      data-title="${escapeHtml(title || "未命名文章")}">
                      刪除文章
                    </button>
                    <button
                      class="reported-guide-resolve-btn"
                      type="button"
                      data-report-id="${escapeHtml(row.reportId)}">
                      標記已處理
                    </button>
                  </div>
                `
                : `
                  <div class="reported-guide-actions">
                    <button
                      class="reported-guide-resolve-btn"
                      type="button"
                      data-report-id="${escapeHtml(row.reportId)}">
                      文章已不存在，標記已處理
                    </button>
                  </div>
                `
            }
          </div>
        </article>
      `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll(".reported-guide-delete-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openDeleteModal(btn.dataset.guideId, btn.dataset.reportId, btn.dataset.title);
      });
    });

    listEl.querySelectorAll(".reported-guide-resolve-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        markReportResolved(btn.dataset.reportId);
      });
    });
  }

  function injectStyles() {
    if (document.getElementById("guideAdminExtraStyle")) return;

    const style = document.createElement("style");
    style.id = "guideAdminExtraStyle";
    style.innerHTML = `
      .reported-guide-card {
        display: grid;
        grid-template-columns: 240px minmax(0, 1fr);
        gap: 1.35rem;
        align-items: center;
        padding: 1rem;
        border-radius: 16px;
        background: rgba(255,255,255,0.055);
        border: 1px solid rgba(255,255,255,0.08);
        color: inherit;
      }

      .reported-guide-cover-link {
        display: block;
        line-height: 0;
      }

      .reported-guide-cover {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 12px;
        background: #303437;
        display: block;
      }

      .reported-guide-cover-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.65;
        line-height: 1.2;
      }

      .reported-guide-body {
        min-width: 0;
        display: block;
      }

      .reported-guide-title-link {
        display: block !important;
        color: inherit;
        text-decoration: none;
        margin: 0 !important;
        padding: 0 !important;
      }

      .reported-guide-title-link:hover {
        text-decoration: none;
      }

      .reported-guide-title-link h2 {
        margin: 0 0 0.45rem 0 !important;
        padding: 0 !important;
        line-height: 1.25 !important;
        font-size: 1.45rem;
      }

      .reported-guide-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.35rem;
        opacity: 0.78;
        font-size: 0.92rem;
        line-height: 1.55;
        margin: 0 !important;
        padding: 0 !important;
      }

      .reported-guide-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 3px 10px;
        border-radius: 999px;
        border: 1px solid rgba(79,177,186,0.45);
        background: rgba(79,177,186,0.12);
        color: inherit;
        font-size: 0.82rem;
        font-weight: 700;
        line-height: 1.25;
        white-space: nowrap;
        opacity: 1;
      }

      .reported-guide-summary {
        margin: 0.45rem 0 0 0 !important;
        padding: 0 !important;
        line-height: 1.65;
      }

      .reported-reason-box {
        margin-top: 0.8rem;
        padding: 0.85rem;
        border-radius: 12px;
        background: rgba(255,180,169,0.10);
        border: 1px solid rgba(255,180,169,0.28);
        line-height: 1.65;
      }

      .reported-reason-box small {
        display: block;
        margin-top: 0.55rem;
        opacity: 0.72;
        line-height: 1.5;
      }

      .reported-guide-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: center;
        margin-top: 0.95rem;
      }

      .reported-guide-read-btn,
      .reported-guide-delete-btn,
      .reported-guide-resolve-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 7px 12px;
        border-radius: 999px;
        font-size: 0.88rem;
        font-weight: 700;
        text-decoration: none;
        border: 1px solid rgba(255,255,255,0.18);
        background: transparent;
        color: inherit;
        cursor: pointer;
        line-height: 1.2;
      }

      .reported-guide-read-btn:hover,
      .reported-guide-resolve-btn:hover {
        border-color: rgb(79,177,186);
        text-decoration: none;
      }

      .reported-guide-delete-btn:hover {
        border-color: #ff8a80;
        color: #ffb4a9;
      }

      @media (max-width: 720px) {
        .reported-guide-card {
          grid-template-columns: 1fr;
          align-items: start;
        }

        .reported-guide-cover {
          height: 190px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function listenReports() {
    if (unsubscribeReports) {
      unsubscribeReports();
      unsubscribeReports = null;
    }

    unsubscribeReports = db.collection("reports")
      .where("status", "==", "open")
      .onSnapshot(renderReports, function (error) {
        console.error("讀取疑慮回報失敗：", error);

        if (listEl) {
          listEl.innerHTML = `<div class="reported-guide-empty">讀取疑慮回報失敗，請確認權限或稍後再試。</div>`;
        }
      });
  }

  createDeleteModal();
  injectStyles();

  auth.onAuthStateChanged(function (user) {
    currentUser = user;

    if (!user) {
      setMsg("請先登入。");
      if (listEl) {
        listEl.innerHTML = `<div class="reported-guide-empty">請先登入後再進入審核頁。</div>`;
      }
      return;
    }

    if (!isAdmin(user)) {
      setMsg("你沒有審核文章權限。");
      if (listEl) {
        listEl.innerHTML = `<div class="reported-guide-empty">你沒有審核文章權限。</div>`;
      }
      return;
    }

    setMsg("目前登入管理員：" + user.email, "success");
    listenReports();
  });
})();
