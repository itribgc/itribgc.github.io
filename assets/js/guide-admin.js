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
  let unsubscribePendingGuides = null;
  let unsubscribeReports = null;

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

  function ensureAdminLayout() {
    const page =
      document.querySelector(".guide-admin-page") ||
      document.querySelector("main") ||
      document.querySelector(".content") ||
      document.body;

    if (!document.getElementById("pendingGuideList")) {
      const pendingSection = document.createElement("section");
      pendingSection.className = "guide-admin-section";
      pendingSection.innerHTML = `
        <h2>貼文發布審核</h2>
        <p class="guide-admin-section-desc">社員送出的文章會先出現在這裡，管理員審核通過後才會公開。</p>
        <div id="pendingGuideList" class="reported-guide-list">
          <div class="reported-guide-empty">待審核貼文載入中...</div>
        </div>
      `;

      page.appendChild(pendingSection);
    }

    if (!document.getElementById("reportedGuideList")) {
      const reportSection = document.createElement("section");
      reportSection.className = "guide-admin-section";
      reportSection.innerHTML = `
        <h2>疑慮審核</h2>
        <p class="guide-admin-section-desc">社員回報「文章有疑慮」的內容會出現在這裡。</p>
        <div id="reportedGuideList" class="reported-guide-list">
          <div class="reported-guide-empty">疑慮回報載入中...</div>
        </div>
      `;

      page.appendChild(reportSection);
    }
  }

  function getPendingListEl() {
    return document.getElementById("pendingGuideList");
  }

  function getReportListEl() {
    return document.getElementById("reportedGuideList");
  }

  async function approveGuide(guideId) {
    if (!isAdmin(currentUser)) {
      setMsg("你沒有管理員權限。");
      return;
    }

    const ok = confirm("確定審核通過並公開這篇文章嗎？");
    if (!ok) return;

    try {
      await db.collection("guides").doc(guideId).update({
        status: "published",
        reviewStatus: "approved",
        reviewedBy: currentUser.uid,
        reviewedByEmail: currentUser.email,
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      setMsg("文章已審核通過並公開。", "success");
    } catch (error) {
      console.error("審核通過失敗：", error);
      setMsg("審核通過失敗，請稍後再試。");
    }
  }

  async function rejectGuide(guideId) {
    if (!isAdmin(currentUser)) {
      setMsg("你沒有管理員權限。");
      return;
    }

    const reason = prompt("請輸入審核失敗原因，社員會在「我的貼文」看到這段說明：");

    if (reason === null) return;

    const reasonText = reason.trim() || "這篇文章未通過審核，可修改後重新送審。";

    try {
      await db.collection("guides").doc(guideId).update({
        status: "rejected",
        reviewStatus: "rejected",
        rejectionReason: reasonText,
        reviewedBy: currentUser.uid,
        reviewedByEmail: currentUser.email,
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      setMsg("文章已標記為審核失敗。", "success");
    } catch (error) {
      console.error("標記審核失敗失敗：", error);
      setMsg("標記審核失敗失敗，請稍後再試。");
    }
  }

  async function deleteGuideByAdmin(guideId, title) {
    if (!isAdmin(currentUser)) {
      setMsg("你沒有管理員權限。");
      return;
    }

    const ok = confirm(`確定刪除文章「${title || "未命名文章"}」嗎？刪除後無法復原。`);
    if (!ok) return;

    try {
      await db.collection("guides").doc(guideId).delete();
      setMsg("文章已刪除。", "success");
    } catch (error) {
      console.error("刪除文章失敗：", error);
      setMsg("刪除文章失敗，請稍後再試。");
    }
  }

  async function loadGuideData(guideId) {
    try {
      const doc = await db.collection("guides").doc(guideId).get();

      if (!doc.exists) return null;

      return {
        id: doc.id,
        data: doc.data()
      };
    } catch (error) {
      console.error("讀取文章失敗：", error);
      return null;
    }
  }

  function renderPendingGuides(snapshot) {
    const listEl = getPendingListEl();
    if (!listEl) return;

    if (!isAdmin(currentUser)) {
      listEl.innerHTML = `<div class="reported-guide-empty">你沒有審核文章權限。</div>`;
      return;
    }

    if (snapshot.empty) {
      listEl.innerHTML = `<div class="reported-guide-empty">目前沒有待審核貼文。</div>`;
      return;
    }

    const docs = snapshot.docs.slice().sort(function (a, b) {
      const aTime = a.data().submittedAt && a.data().submittedAt.toMillis ? a.data().submittedAt.toMillis() : 0;
      const bTime = b.data().submittedAt && b.data().submittedAt.toMillis ? b.data().submittedAt.toMillis() : 0;
      return bTime - aTime;
    });

    let html = "";

    docs.forEach(function (doc) {
      const data = doc.data();
      const title = data.title || "未命名文章";
      const category = data.category || "未分類";
      const gameName = data.gameName || "";
      const summary = data.summary || "";
      const coverImage = data.coverImage || "";
      const authorName = data.authorName || "未命名社員";

      html += `
        <article class="reported-guide-card">
          ${
            coverImage
              ? `
                <a class="reported-guide-cover-link" href="/guides/post/?id=${encodeURIComponent(doc.id)}">
                  <img class="reported-guide-cover" src="${escapeHtml(coverImage)}" alt="${escapeHtml(title)}">
                </a>
              `
              : `<div class="reported-guide-cover reported-guide-cover-empty">無封面</div>`
          }

          <div class="reported-guide-body">
            <a class="reported-guide-title-link" href="/guides/post/?id=${encodeURIComponent(doc.id)}">
              <h2>${escapeHtml(title)}</h2>
            </a>

            <div class="reported-guide-meta">
              <span>主題：${escapeHtml(gameName || "未分類主題")}</span>
              <span>・${escapeHtml(authorName)}</span>
              <span class="reported-guide-pill">${escapeHtml(category)}</span>
              <span class="reported-guide-pill pending">待審核</span>
            </div>

            <p class="reported-guide-summary">${escapeHtml(summary || "這篇文章沒有摘要。")}</p>

            <div class="reported-reason-box pending-box">
              <strong>送審時間：</strong>
              <div>${escapeHtml(formatTime(data.submittedAt) || "未記錄")}</div>
            </div>

            <div class="reported-guide-actions">
              <a class="reported-guide-read-btn" href="/guides/post/?id=${encodeURIComponent(doc.id)}">查看文章</a>
              <button class="reported-guide-approve-btn" type="button" data-guide-id="${escapeHtml(doc.id)}">審核通過</button>
              <button class="reported-guide-reject-btn" type="button" data-guide-id="${escapeHtml(doc.id)}">審核失敗</button>
              <button class="reported-guide-delete-btn" type="button" data-guide-id="${escapeHtml(doc.id)}" data-title="${escapeHtml(title)}">刪除文章</button>
            </div>
          </div>
        </article>
      `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll(".reported-guide-approve-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        approveGuide(btn.dataset.guideId);
      });
    });

    listEl.querySelectorAll(".reported-guide-reject-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        rejectGuide(btn.dataset.guideId);
      });
    });

    listEl.querySelectorAll(".reported-guide-delete-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteGuideByAdmin(btn.dataset.guideId, btn.dataset.title);
      });
    });
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

  async function deleteReportedGuide(guideId, reportId, title) {
    if (!isAdmin(currentUser)) {
      setMsg("你沒有管理員權限。");
      return;
    }

    const ok = confirm(`確定刪除被回報文章「${title || "未命名文章"}」嗎？刪除後無法復原。`);
    if (!ok) return;

    try {
      await db.collection("guides").doc(guideId).delete();

      await db.collection("reports").doc(reportId).update({
        status: "deleted",
        handledBy: currentUser.uid,
        handledByEmail: currentUser.email,
        handledAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      setMsg("文章已刪除，疑慮回報已標記為 deleted。", "success");
    } catch (error) {
      console.error("刪除被回報文章失敗：", error);
      setMsg("刪除失敗，請稍後再試。");
    }
  }

  async function renderReports(snapshot) {
    const listEl = getReportListEl();
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
              : `<div class="reported-guide-cover reported-guide-cover-empty">無封面</div>`
          }

          <div class="reported-guide-body">
            <a class="reported-guide-title-link" href="/guides/post/?id=${encodeURIComponent(report.guideId)}">
              <h2>${escapeHtml(title || "未命名文章")}</h2>
            </a>

            <div class="reported-guide-meta">
              <span>主題：${escapeHtml(gameName || "未分類主題")}</span>
              <span>・${escapeHtml(authorName || "未命名社員")}</span>
              <span class="reported-guide-pill">${escapeHtml(category || "未分類")}</span>
              <span class="reported-guide-pill danger">疑慮回報</span>
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
                    <button class="reported-guide-delete-btn" type="button" data-guide-id="${escapeHtml(report.guideId)}" data-report-id="${escapeHtml(row.reportId)}" data-title="${escapeHtml(title || "未命名文章")}">刪除文章</button>
                    <button class="reported-guide-resolve-btn" type="button" data-report-id="${escapeHtml(row.reportId)}">標記已處理</button>
                  </div>
                `
                : `
                  <div class="reported-guide-actions">
                    <button class="reported-guide-resolve-btn" type="button" data-report-id="${escapeHtml(row.reportId)}">文章已不存在，標記已處理</button>
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
        deleteReportedGuide(btn.dataset.guideId, btn.dataset.reportId, btn.dataset.title);
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
      .guide-admin-section {
        margin-top: 2.2rem;
      }

      .guide-admin-section h2 {
        margin-bottom: 0.35rem;
      }

      .guide-admin-section-desc {
        opacity: 0.78;
        line-height: 1.7;
        margin-bottom: 1rem;
      }

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
        margin-bottom: 1rem;
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

      .reported-guide-pill.pending {
        border-color: rgba(255, 214, 102, 0.6);
        background: rgba(255, 214, 102, 0.16);
      }

      .reported-guide-pill.danger {
        border-color: rgba(255, 138, 128, 0.6);
        background: rgba(255, 138, 128, 0.13);
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

      .reported-reason-box.pending-box {
        background: rgba(255, 214, 102, 0.10);
        border-color: rgba(255, 214, 102, 0.28);
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
      .reported-guide-resolve-btn,
      .reported-guide-approve-btn,
      .reported-guide-reject-btn {
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
      .reported-guide-resolve-btn:hover,
      .reported-guide-approve-btn:hover {
        border-color: rgb(79,177,186);
        text-decoration: none;
      }

      .reported-guide-approve-btn {
        border-color: rgba(79,177,186,0.45);
        background: rgba(79,177,186,0.12);
      }

      .reported-guide-reject-btn {
        border-color: rgba(255, 214, 102, 0.45);
        background: rgba(255, 214, 102, 0.10);
      }

      .reported-guide-reject-btn:hover {
        border-color: rgba(255, 214, 102, 0.8);
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

  function listenPendingGuides() {
    if (unsubscribePendingGuides) {
      unsubscribePendingGuides();
      unsubscribePendingGuides = null;
    }

    unsubscribePendingGuides = db.collection("guides")
      .where("status", "==", "pending")
      .onSnapshot(renderPendingGuides, function (error) {
        console.error("讀取待審核貼文失敗：", error);

        const listEl = getPendingListEl();
        if (listEl) {
          listEl.innerHTML = `<div class="reported-guide-empty">讀取待審核貼文失敗，請確認權限或稍後再試。</div>`;
        }
      });
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

        const listEl = getReportListEl();
        if (listEl) {
          listEl.innerHTML = `<div class="reported-guide-empty">讀取疑慮回報失敗，請確認權限或稍後再試。</div>`;
        }
      });
  }

  ensureAdminLayout();
  injectStyles();

  auth.onAuthStateChanged(function (user) {
    currentUser = user;

    ensureAdminLayout();

    if (!user) {
      setMsg("請先登入。");

      const pendingList = getPendingListEl();
      const reportList = getReportListEl();

      if (pendingList) pendingList.innerHTML = `<div class="reported-guide-empty">請先登入後再進入審核頁。</div>`;
      if (reportList) reportList.innerHTML = `<div class="reported-guide-empty">請先登入後再進入審核頁。</div>`;

      return;
    }

    if (!isAdmin(user)) {
      setMsg("你沒有審核文章權限。");

      const pendingList = getPendingListEl();
      const reportList = getReportListEl();

      if (pendingList) pendingList.innerHTML = `<div class="reported-guide-empty">你沒有審核文章權限。</div>`;
      if (reportList) reportList.innerHTML = `<div class="reported-guide-empty">你沒有審核文章權限。</div>`;

      return;
    }

    setMsg("目前登入管理員：" + user.email, "success");

    listenPendingGuides();
    listenReports();
  });
})();
