/**
 * Mochikan - Main Application Logic (app.js)
 * モバイルファースト・完全オフライン対応の患者管理ロジック
 */

// アプリ全体の状態
const state = {
  currentTab: "inpatient", // 'inpatient' | 'outpatient' | 'discharged'
  patients: [],
  defaultDoctor: "自分",
  filterQuery: "",
  filterOnlyMy: false,
  filterOnlyExam: false,
  editingPatient: null,
  prescriptionModalPatient: null,
  bowelModalPatient: null,
  visitModalPatient: null,
  memoModalPatient: null,
  statusChangeModalData: null,
};

// ==========================================
// インラインSVGアイコン定義
// ==========================================
const SVG_ICONS = {
  plus: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  inpatient: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path><circle cx="9" cy="12" r="2"></circle></svg>`,
  outpatient: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"></circle><path d="M5.5 21v-3a6.5 6.5 0 0 1 13 0v3"></path></svg>`,
  discharged: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
  edit: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  pill: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>`,
  alert: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  check: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  user: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  fileText: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  activity: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
  close: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  trash: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
  calendar: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  search: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
};

function getIcon(name) {
  return SVG_ICONS[name] || "";
}

// ==========================================
// 日付ヘルパー関数
// ==========================================
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${Number(parts[1])}/${Number(parts[2])}`;
  }
  return dateStr;
}

function addDaysToDate(baseDateStr, days) {
  const numDays = Number(days);
  if (isNaN(numDays)) return baseDateStr || getTodayString();
  const d = baseDateStr ? new Date(baseDateStr + "T00:00:00") : new Date();
  if (isNaN(d.getTime())) return getTodayString();
  d.setDate(d.getDate() + numDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 高速全文検索用の正規化インデックス文字列を生成
 */
function buildPatientSearchIndex(p) {
  return [
    p.name || "",
    p.room || "",
    p.diagnosis || "",
    p.doctorInCharge || "",
    p.attendingDoctor || "",
    p.notes || "",
    p.medications || "",
    p.liverFunction || "",
    p.renalFunction || "",
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * 入力イベント等の過剰発火を抑えるデバウンス関数
 */
function debounce(fn, delay = 120) {
  let timerId = null;
  return function (...args) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn.apply(this, args);
      timerId = null;
    }, delay);
  };
}

/**
 * 最終排便日からの経過日数計算
 * @param {string} lastBowelDate
 * @param {string|number} todayStrOrMs "YYYY-MM-DD" 文字列またはミリ秒
 */
function calculateBowelDaysAgo(lastBowelDate, todayStrOrMs) {
  if (!lastBowelDate) {
    return { text: "未入力", cls: "badge-gray", days: null };
  }
  const d1 = new Date(lastBowelDate + "T00:00:00").getTime();
  const d2 =
    typeof todayStrOrMs === "number"
      ? todayStrOrMs
      : new Date((todayStrOrMs || getTodayString()) + "T00:00:00").getTime();
  const diffDays = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: "今日", cls: "badge-success", days: 0 };
  } else if (diffDays === 1) {
    return { text: "1日前", cls: "badge-info", days: 1 };
  } else if (diffDays === 2) {
    return { text: "2日前", cls: "badge-warning", days: 2 };
  } else if (diffDays >= 3) {
    return {
      text: `${diffDays}日前(?)`,
      cls: "badge-danger",
      days: diffDays,
    };
  } else {
    return { text: "未来日", cls: "badge-gray", days: diffDays };
  }
}

/**
 * 次回診察日までの残り日数計算（外来用）
 * @param {string} nextVisitDate "YYYY-MM-DD"
 * @param {string|number} todayStrOrMs "YYYY-MM-DD" 文字列またはミリ秒
 */
function calculateVisitDays(nextVisitDate, todayStrOrMs) {
  if (!nextVisitDate) return null;
  const d1 = new Date(nextVisitDate + "T00:00:00").getTime();
  const d2 =
    typeof todayStrOrMs === "number"
      ? todayStrOrMs
      : new Date((todayStrOrMs || getTodayString()) + "T00:00:00").getTime();
  const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: "今日", days: 0, cls: "visit-badge-today" };
  } else if (diffDays === 1) {
    return { text: "あと1日", days: 1, cls: "visit-badge-soon" };
  } else if (diffDays > 1) {
    return {
      text: `あと${diffDays}日`,
      days: diffDays,
      cls: diffDays <= 7 ? "visit-badge-soon" : "visit-badge-normal",
    };
  } else {
    return {
      text: `${Math.abs(diffDays)}日超過`,
      days: diffDays,
      cls: "visit-badge-overdue",
    };
  }
}

// ==========================================
// ソートロジック
// ==========================================
const roomCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function sortPatients(list, tab) {
  return [...list].sort((a, b) => {
    if (tab === "inpatient") {
      // 部屋番号の自然順ソート（102A, 102B, 201 など）
      const roomA = (a.room || "").trim();
      const roomB = (b.room || "").trim();
      if (!roomA && !roomB) return (a.name || "").localeCompare(b.name || "");
      if (!roomA) return 1;
      if (!roomB) return -1;
      const roomDiff = roomCollator.compare(roomA, roomB);
      if (roomDiff !== 0) return roomDiff;
      return (a.name || "").localeCompare(b.name || "");
    } else if (tab === "outpatient") {
      // 次回診察日の昇順（近い順）、未設定は末尾
      const dateA = a.nextVisitDate || "";
      const dateB = b.nextVisitDate || "";
      if (!dateA && !dateB) return (a.name || "").localeCompare(b.name || "");
      if (!dateA) return 1;
      if (!dateB) return -1;
      const dateDiff = dateA.localeCompare(dateB);
      if (dateDiff !== 0) return dateDiff;
      return (a.name || "").localeCompare(b.name || "");
    } else if (tab === "discharged") {
      // 担当終了日の降順（新しいものが一番上、古いものが一番下）
      const dateA = a.statusChangeDate || a.dischargedDate || a.updatedAt || "";
      const dateB = b.statusChangeDate || b.dischargedDate || b.updatedAt || "";
      if (!dateA && !dateB) return (a.name || "").localeCompare(b.name || "");
      if (!dateA) return 1;
      if (!dateB) return -1;
      const dateDiff = dateB.localeCompare(dateA); // 降順
      if (dateDiff !== 0) return dateDiff;
      return (a.name || "").localeCompare(b.name || "");
    }
    return 0;
  });
}

// ==========================================
// トースト通知
// ==========================================
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 800);
}

// ==========================================
// メイン初期化 & レンダリング
// ==========================================
async function initApp() {
  // 1. 最優先: UIイベントリスナーを即座に同期登録
  try {
    setupEventListeners();
  } catch (err) {
    console.error("Failed to setup event listeners:", err);
  }

  // 2. Service Worker登録（エラー時も後続処理を止めない）
  if (
    "serviceWorker" in navigator &&
    (location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1")
  ) {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (err) {
      console.warn("Service Worker registration skipped:", err);
    }
  }

  // 3. 設定読み込み & 日替わり判定
  try {
    const savedDoctor = await patientDB.getSetting(
      "defaultDoctorInCharge",
      "自分",
    );
    if (savedDoctor) state.defaultDoctor = savedDoctor;

    const today = getTodayString();
    const resetResult = await patientDB.checkAndPerformDailyReset(today);
    if (resetResult && resetResult.resetOccurred && resetResult.count > 0) {
      showToast(
        `日付が変わりました。${resetResult.count}件のカルテ記載・レスキュー回数をリセットしました`,
        "info",
      );
    }
  } catch (err) {
    console.error("Database setup warning:", err);
  }

  // 4. アプリ復帰時の日替わり判定
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") {
      try {
        const res = await patientDB.checkAndPerformDailyReset(getTodayString());
        if (res && res.resetOccurred && res.count > 0) {
          showToast("日替わりリセットが実行されました", "info");
          await loadAndRender();
        }
      } catch (err) {
        console.error(err);
      }
    }
  });

  // 5. 初回データロード＆描画
  try {
    await loadAndRender();
  } catch (err) {
    console.error("Failed to load and render patients:", err);
  }
}

// DOM読み込み状態をチェック（発火済みでも即座に実行）
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

/**
 * データ読み込みと画面描画
 */
async function loadAndRender() {
  const patients = await patientDB.getAllPatients();
  for (let i = 0; i < patients.length; i++) {
    patients[i]._searchIndex = buildPatientSearchIndex(patients[i]);
  }
  state.patients = patients;
  updateTabBadges();
  renderPatientList();
}

/**
 * タブバッジの件数更新
 */
function updateTabBadges() {
  const counts = { inpatient: 0, outpatient: 0, discharged: 0 };
  state.patients.forEach((p) => {
    if (counts[p.status] !== undefined) {
      counts[p.status]++;
    }
  });

  const badgeIn = document.getElementById("badge-inpatient");
  const badgeOut = document.getElementById("badge-outpatient");
  const badgeDis = document.getElementById("badge-discharged");

  if (badgeIn) badgeIn.textContent = counts.inpatient;
  if (badgeOut) badgeOut.textContent = counts.outpatient;
  if (badgeDis) badgeDis.textContent = counts.discharged;
}

/**
 * 患者一覧のレンダリング
 */
function renderPatientList() {
  const container = document.getElementById("patient-list-container");
  if (!container) return;

  const currentTab = state.currentTab;
  let filtered = state.patients.filter((p) => p.status === currentTab);

  // 1. 検索フィルター（事前キャッシュインデックスを利用した高速AND検索）
  if (state.filterQuery.trim()) {
    const keywords = state.filterQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    filtered = filtered.filter((p) => {
      const idx = p._searchIndex || buildPatientSearchIndex(p);
      return keywords.every((kw) => idx.includes(kw));
    });
  }

  // 2. 「担当が自分のみ」フィルター
  if (state.filterOnlyMy) {
    const myName = (state.defaultDoctor || "自分").trim().toLowerCase();
    filtered = filtered.filter((p) => {
      const doc = (p.doctorInCharge || "").trim().toLowerCase();
      return (
        doc === myName ||
        doc.includes("自分") ||
        (myName !== "自分" && doc.includes(myName))
      );
    });
  }

  // 3. 「診察予定のみ」フィルター
  if (state.filterOnlyExam) {
    filtered = filtered.filter((p) => !!p.examPlanned);
  }

  // ソート
  const sorted = sortPatients(filtered, currentTab);

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${getIcon(currentTab)}</div>
        <p class="empty-title">${getTabTitle(currentTab)}の該当患者はいません</p>
        <p class="empty-desc">検索・フィルター条件を見直すか、右上の「＋追加」ボタンから登録してください。</p>
        ${state.patients.length === 0
        ? `
          <button type="button" class="btn btn-secondary mt-3" id="btn-load-sample-empty">
            ${getIcon("plus")} サンプルデータを読み込む
          </button>
        `
        : ""
      }
      </div>
    `;
    return;
  }

  const today = getTodayString();
  const todayMidnightMs = new Date(today + "T00:00:00").getTime();
  let html = "";

  for (let i = 0; i < sorted.length; i++) {
    html += renderPatientCard(sorted[i], currentTab, today, todayMidnightMs);
  }

  container.innerHTML = html;
  // ※カード内イベントは setupEventListeners によるイベント委譲で常時リッスンするため attachCardEvents() は不要
}

function getTabTitle(tab) {
  if (tab === "inpatient") return "入院担当中";
  if (tab === "outpatient") return "外来担当中";
  if (tab === "discharged") return "担当終了";
  return "";
}

/**
 * 患者カード1枚のHTMLレンダリング（高密度・コンパクト・日々データ1行化）
 */
function renderPatientCard(patient, tab, today, todayMidnightMs) {
  const isPrescriptionAlert =
    tab === "inpatient" &&
    Boolean(patient.nextPrescriptionDate && patient.nextPrescriptionDate <= today);
  const bowelInfo = calculateBowelDaysAgo(
    patient.lastBowelDate,
    todayMidnightMs || today,
  );
  const visitInfo =
    tab === "outpatient" && patient.nextVisitDate
      ? calculateVisitDays(patient.nextVisitDate, todayMidnightMs || today)
      : null;

  // 性別・年齢の表示
  let genderText = "";
  if (patient.gender === "male") genderText = "男";
  else if (patient.gender === "female") genderText = "女";

  const ageText = patient.age ? `${patient.age}歳` : "";
  const profileInfo = [ageText, genderText].filter(Boolean).join("");

  // 排便日バッジのクラス判定
  let bowelClass = "pill-bowel-warn";
  if (bowelInfo.days === 0 || bowelInfo.days === 1) {
    bowelClass = "pill-bowel-ok";
  } else if (bowelInfo.days !== null && bowelInfo.days >= 3) {
    bowelClass = "pill-bowel-alert";
  }

  // 基礎データ（主病名、肝機能、腎機能、主治医、担当）
  const hasDiagOrOrgan =
    patient.diagnosis || patient.liverFunction || patient.renalFunction;
  const hasDoctors = patient.attendingDoctor || patient.doctorInCharge;

  return `
    <article class="patient-card ${isPrescriptionAlert ? "has-prescription-alert" : ""}" data-id="${patient.id}">
      <!-- カード上段: 部屋番号・氏名・属性・編集ボタン -->
      <header class="card-header">
        <div class="card-title-group">
          ${patient.room ? `<span class="room-badge">${escapeHtml(patient.room)}</span>` : ""}
          <h2 class="patient-name">${escapeHtml(patient.name)}</h2>
          ${profileInfo ? `<span class="patient-profile">${profileInfo}</span>` : ""}
        </div>
        <div class="card-header-actions">
          <button type="button" class="btn-edit-inline btn-edit-patient" data-id="${patient.id}" title="編集" aria-label="編集">
            ${getIcon("edit")}
          </button>
        </div>
      </header>

      <!-- 基礎データ部: 1〜2行で極力行数を減らしてコンパクト表示（担当開始日は非表示） -->
      ${hasDiagOrOrgan || hasDoctors
      ? `
        <section class="card-compact-info">
          <div class="compact-info-row">
          ${hasDiagOrOrgan
        ? `
              ${patient.diagnosis
          ? `<div class="info-item-compact"><span class="info-label-compact">病名:</span><span class="info-val-compact bold">${escapeHtml(patient.diagnosis)}</span></div>`
          : ""
        }
              ${patient.liverFunction
          ? `<div class="info-item-compact"><span class="info-label-compact">肝:</span><span class="info-val-compact">${escapeHtml(patient.liverFunction)}</span></div>`
          : ""
        }
              ${patient.renalFunction
          ? `<div class="info-item-compact"><span class="info-label-compact">腎:</span><span class="info-val-compact">${escapeHtml(patient.renalFunction)}</span></div>`
          : ""
        }
            
          `
        : ""
      }
          ${hasDoctors
        ? `
              <div class="info-item-compact">
                <span class="info-label-compact">主治医:</span>
                <span class="info-val-compact">${escapeHtml(patient.attendingDoctor || "-")}</span>
              </div>
              <div class="info-item-compact">
                <span class="info-label-compact">担当:</span>
                <span class="info-val-compact">${escapeHtml(patient.doctorInCharge || "-")}</span>
              </div>
            
          `
        : ""
      }
          </div>
        </section>
      `
      : ""
    }

      <!-- 日々データ部: 完全1行横並び（入院 & 担当終了タブ） -->
      ${tab !== "outpatient"
      ? `
        <section class="card-daily-row">
          <!-- 1. 診察予定チェック -->
          <div class="daily-chip-item">
            <label class="mini-checkbox-label is-exam ${patient.examPlanned ? "active" : ""}">
              <input type="checkbox" class="cb-exam-check" data-id="${patient.id}" ${patient.examPlanned ? "checked" : ""}>
              <span class="mini-checkmark"></span>
              <span>診察</span>
            </label>
          </div>

          <!-- 2. カルテ記載チェック -->
          <div class="daily-chip-item">
            <label class="mini-checkbox-label is-record ${patient.medicalRecordChecked ? "active" : "inactive"}">
              <input type="checkbox" class="cb-record-check" data-id="${patient.id}" ${patient.medicalRecordChecked ? "checked" : ""}>
              <span class="mini-checkmark"></span>
              <span>${patient.medicalRecordChecked ? "ｶﾙﾃ済" : "ｶﾙﾃ未"}</span>
            </label>
          </div>

          <!-- 3. レスキューミニステッパー -->
          <div class="daily-chip-item">
            <div class="mini-stepper">
              <span class="mini-rescue-label">R:</span>
              <button type="button" class="btn-mini-step btn-rescue-minus" data-id="${patient.id}" aria-label="レスキュー減らす">－</button>
              <span class="mini-rescue-display ${patient.rescueCount > 0 ? "text-highlight" : ""}">${patient.rescueCount || 0}</span>
              <button type="button" class="btn-mini-step btn-rescue-plus" data-id="${patient.id}" aria-label="レスキュー増やす">＋</button>
            </div>
          </div>

          <!-- 4. 最終排便日ボタン -->
          <div class="daily-chip-item">
            <button type="button" class="btn-mini-pill ${bowelClass} btn-bowel-trigger" data-id="${patient.id}" title="タップで排便日を更新">
              便:${bowelInfo.text}
            </button>
          </div>

          <!-- 5. 次回処方日ボタン -->
          <div class="daily-chip-item">
            <button type="button" class="btn-mini-pill ${isPrescriptionAlert ? "pill-rx-alert pulse-animation" : patient.nextPrescriptionDate ? "pill-rx-ok" : ""} btn-prescription-trigger" data-id="${patient.id}" title="タップで処方日を更新">
              ${isPrescriptionAlert ? `<span class="icon-inline">${getIcon("alert")}</span>` : ""}${getIcon("pill")}:${patient.nextPrescriptionDate ? formatDateDisplay(patient.nextPrescriptionDate) : "未"}
            </button>
          </div>
        </section>
      `
      : ""
    }

      <!-- 外来タブ専用項目: 次回診察日（タップで編集可能） -->
      ${tab === "outpatient"
      ? `
        <section class="card-outpatient-info">
          <div class="outpatient-visit-row">
            <span class="visit-label"><span class="icon-inline">${getIcon("calendar")}</span>次回診察日:</span>
            <button type="button" class="btn-visit-trigger" data-id="${patient.id}" title="タップで次回診察日を更新">
              ${
                patient.nextVisitDate
                  ? `${formatDateDisplay(patient.nextVisitDate)}${visitInfo ? ` <span class="visit-days-tag ${visitInfo.cls}">${visitInfo.text}</span>` : ""}`
                  : "未定 (設定する)"
              }
            </button>
          </div>
        </section>
      `
      : ""
    }

      <!-- 担当終了タブ専用項目: 担当終了日 -->
      ${tab === "discharged"
      ? `
        <section class="card-discharged-info">
          <div class="compact-info-row">
            <div class="info-item-compact">
              <span class="info-label-compact">担当終了日:</span>
              <span class="info-val-compact bold">${formatDateDisplay(patient.statusChangeDate || patient.dischargedDate) || "-"}</span>
            </div>
          </div>
        </section>
      `
      : ""
    }

      <!-- 共通: 使用中薬 & 備考（タップで即座に編集可能） -->
      <section class="card-memo-section">
        ${patient.medications
      ? `
          <div class="memo-block memo-block-clickable btn-memo-trigger" data-id="${patient.id}" data-field="medications" title="タップで使用中薬(処方)を編集">
            <span class="memo-title">${getIcon("pill")}:</span>
            <span class="memo-content">${escapeHtml(patient.medications)}</span>
            <span class="memo-edit-hint">${getIcon("edit")}</span>
          </div>
        `
      : ""
    }
        ${patient.notes
      ? `
          <div class="memo-block memo-block-clickable btn-memo-trigger" data-id="${patient.id}" data-field="notes" title="タップで備考を編集">
            <span class="memo-title">${getIcon("fileText")}:</span>
            <span class="memo-content">${escapeHtml(patient.notes)}</span>
            <span class="memo-edit-hint">${getIcon("edit")}</span>
          </div>
        `
      : ""
    }
        ${!patient.medications && !patient.notes
      ? `
          <button type="button" class="memo-empty-btn btn-memo-trigger" data-id="${patient.id}" data-field="notes" title="タップで処方・備考メモを追加">
            ${getIcon("plus")} 処方・備考メモを追加
          </button>
        `
      : ""
    }
      </section>
    </article>
  `;
}

// ==========================================
// 全体イベントリスナー初期化
// ==========================================
function setupEventListeners() {
  // 患者一覧コンテナに対するイベント委譲（レンダリング毎のリスナー再生成・DOM走査を完全撤廃）
  const patientListContainer = document.getElementById(
    "patient-list-container",
  );
  if (patientListContainer) {
    // 1. チェックボックス変更イベント委譲（診察予定、カルテ記載）
    patientListContainer.addEventListener("change", async (e) => {
      const target = e.target;
      const id = Number(target.dataset.id);
      if (!id) return;
      const patient = state.patients.find((p) => p.id === id);
      if (!patient) return;

      if (target.classList.contains("cb-exam-check")) {
        patient.examPlanned = target.checked;
        await patientDB.updatePatient(patient);
        const label = target.closest("label");
        if (label) {
          label.classList.toggle("active", patient.examPlanned);
        }
        showToast(
          `診察予定: ${patient.examPlanned ? "予定あり" : "なし"}に更新`,
          "success",
        );
      } else if (target.classList.contains("cb-record-check")) {
        patient.medicalRecordChecked = target.checked;
        await patientDB.updatePatient(patient);
        const label = target.closest("label");
        if (label) {
          const span = label.querySelector("span:last-child");
          if (span)
            span.textContent = patient.medicalRecordChecked ? "ｶﾙﾃ済" : "ｶﾙﾃ未";
          label.classList.toggle("active", patient.medicalRecordChecked);
          label.classList.toggle("inactive", !patient.medicalRecordChecked);
        }
        showToast(
          `カルテ記載: ${patient.medicalRecordChecked ? "完了" : "未記載"}に更新`,
          "success",
        );
      }
    });

    // 2. クリックイベント委譲（ボタン・ステッパー・モーダルトリガー）
    patientListContainer.addEventListener("click", async (e) => {
      // 編集ボタン
      const editBtn = e.target.closest(".btn-edit-patient");
      if (editBtn) {
        const id = Number(editBtn.dataset.id);
        if (id) openPatientModal(id);
        return;
      }

      // 処方・備考クイック編集
      const memoTrigger = e.target.closest(".btn-memo-trigger");
      if (memoTrigger) {
        const id = Number(memoTrigger.dataset.id);
        const field = memoTrigger.dataset.field || "notes";
        if (id) openMemoModal(id, field);
        return;
      }

      // 排便日クイック更新トリガー
      const bowelTrigger = e.target.closest(".btn-bowel-trigger");
      if (bowelTrigger) {
        const id = Number(bowelTrigger.dataset.id);
        if (id) openBowelModal(id);
        return;
      }

      // 処方日更新トリガー
      const rxTrigger = e.target.closest(".btn-prescription-trigger");
      if (rxTrigger) {
        const id = Number(rxTrigger.dataset.id);
        if (id) openPrescriptionModal(id);
        return;
      }

      // 外来: 次回診察日トリガー
      const visitTrigger = e.target.closest(".btn-visit-trigger");
      if (visitTrigger) {
        const id = Number(visitTrigger.dataset.id);
        if (id) openVisitModal(id);
        return;
      }

      // レスキュー＋ボタン
      const plusBtn = e.target.closest(".btn-rescue-plus");
      if (plusBtn) {
        const id = Number(plusBtn.dataset.id);
        const patient = state.patients.find((p) => p.id === id);
        if (patient) {
          patient.rescueCount = (patient.rescueCount || 0) + 1;
          await patientDB.updatePatient(patient);
          const counter = plusBtn
            .closest(".mini-stepper")
            ?.querySelector(".mini-rescue-display");
          if (counter) {
            counter.textContent = patient.rescueCount;
            counter.classList.add("text-highlight");
          }
        }
        return;
      }

      // レスキュー−ボタン
      const minusBtn = e.target.closest(".btn-rescue-minus");
      if (minusBtn) {
        const id = Number(minusBtn.dataset.id);
        const patient = state.patients.find((p) => p.id === id);
        if (patient && (patient.rescueCount || 0) > 0) {
          patient.rescueCount = Math.max(0, patient.rescueCount - 1);
          await patientDB.updatePatient(patient);
          const counter = minusBtn
            .closest(".mini-stepper")
            ?.querySelector(".mini-rescue-display");
          if (counter) {
            counter.textContent = patient.rescueCount;
            if (patient.rescueCount === 0) {
              counter.classList.remove("text-highlight");
            }
          }
        }
        return;
      }

      // 空白時のサンプル読み込みボタン
      const sampleBtn = e.target.closest("#btn-load-sample-empty");
      if (sampleBtn) {
        await patientDB.loadSampleData();
        showToast("サンプルデータを読み込みました", "success");
        await loadAndRender();
        return;
      }
    });
  }

  // タブ切り替え
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const tab = e.currentTarget.dataset.tab;
      if (state.currentTab === tab) return;

      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      state.currentTab = tab;

      // タブ切り替え時にも日替わりチェック
      const res = await patientDB.checkAndPerformDailyReset(getTodayString());
      if (res.resetOccurred && res.count > 0) {
        showToast("日替わりリセットが実行されました", "info");
      }

      await loadAndRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // 検索トグルボタン
  const toggleSearchBtn = document.getElementById("btn-toggle-search");
  if (toggleSearchBtn) {
    toggleSearchBtn.addEventListener("click", () => {
      const searchContainer = document.getElementById("search-container");
      if (searchContainer) {
        const isCollapsed =
          searchContainer.classList.toggle("search-collapsed");
        toggleSearchBtn.classList.toggle("active", !isCollapsed);
        if (!isCollapsed) {
          const input = document.getElementById("search-input");
          if (input) input.focus();
        }
      }
    });
  }

  // フィルター「自分のみ」ボタン
  const filterMyBtn = document.getElementById("btn-filter-my");
  if (filterMyBtn) {
    filterMyBtn.addEventListener("click", () => {
      state.filterOnlyMy = !state.filterOnlyMy;
      filterMyBtn.classList.toggle("active", state.filterOnlyMy);
      renderPatientList();
    });
  }

  // フィルター「診察予定のみ」ボタン
  const filterExamBtn = document.getElementById("btn-filter-exam");
  if (filterExamBtn) {
    filterExamBtn.addEventListener("click", () => {
      state.filterOnlyExam = !state.filterOnlyExam;
      filterExamBtn.classList.toggle("active", state.filterOnlyExam);
      renderPatientList();
    });
  }

  // 検索入力（デバウンス対応）
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    const debouncedSearch = debounce((val) => {
      state.filterQuery = val;
      renderPatientList();
    }, 120);

    searchInput.addEventListener("input", (e) => {
      debouncedSearch(e.target.value);
    });
  }

  // 検索クリア
  const clearBtn = document.getElementById("btn-clear-search");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        state.filterQuery = "";
        renderPatientList();
      }
    });
  }

  // 「＋追加」ボタン
  const addBtn = document.getElementById("btn-add-patient");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      openPatientModal(null);
    });
  }

  // 「⚙️設定」ボタン
  const settingsBtn = document.getElementById("btn-settings");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      openSettingsModal();
    });
  }

  // 各モーダルの閉じるボタン & 背景クリック
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });

  document.querySelectorAll(".btn-modal-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeAllModals();
    });
  });

  // 患者編集フォーム保存
  const patientForm = document.getElementById("patient-form");
  if (patientForm) {
    patientForm.addEventListener("submit", handlePatientFormSubmit);
  }

  // 患者削除ボタン
  const deleteBtn = document.getElementById("btn-delete-patient");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", handlePatientDelete);
  }

  // 転帰変更フォーム
  const statusForm = document.getElementById("status-change-form");
  if (statusForm) {
    statusForm.addEventListener("submit", handleStatusChangeSubmit);
  }

  // 処方日更新モーダル内のボタン
  setupPrescriptionModalEvents();

  // 排便日更新モーダル内のボタン
  setupBowelModalEvents();

  // 次回診察日更新モーダル内のボタン
  setupVisitModalEvents();

  // 処方・備考更新モーダル内のボタン
  setupMemoModalEvents();

  // 設定モーダル内のイベント
  setupSettingsModalEvents();
}

// ==========================================
// 処方日更新モーダル
// ==========================================
function openPrescriptionModal(patientId) {
  const patient = state.patients.find((p) => p.id === patientId);
  if (!patient) return;

  state.prescriptionModalPatient = patient;
  const modal = document.getElementById("modal-prescription");
  const title = document.getElementById("prescription-modal-title");
  const currentSpan = document.getElementById("prescription-current-date");
  const inputDate = document.getElementById("prescription-next-date-input");

  if (title) title.textContent = `次回処方予定日: ${patient.name}${patient.room ? ` (${patient.room})` : ""}`;
  if (currentSpan)
    currentSpan.textContent = patient.nextPrescriptionDate
      ? formatDateDisplay(patient.nextPrescriptionDate)
      : "未設定";
  if (inputDate) inputDate.value = getTodayString(); // デフォルト今日

  modal.classList.add("active");
}

function setupPrescriptionModalEvents() {
  // 処方モーダル内のクイック日数ボタンのみにスコープを限定
  document
    .querySelectorAll("#modal-prescription .btn-quick-days")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const days = Number(e.currentTarget.dataset.days);
        if (isNaN(days)) return;
        const input = document.getElementById("prescription-next-date-input");
        if (input) {
          input.value = addDaysToDate(getTodayString(), days);
        }
      });
    });

  // 「処方実施として更新」ボタン
  const confirmBtn = document.getElementById("btn-confirm-prescription");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      const patient = state.prescriptionModalPatient;
      const input = document.getElementById("prescription-next-date-input");
      if (!patient || !input || !input.value) {
        alert("次回処方日を選択してください。");
        return;
      }

      patient.nextPrescriptionDate = input.value;
      await patientDB.updatePatient(patient);
      closeAllModals();
      showToast(
        `次回処方日を ${formatDateDisplay(input.value)} に更新しました`,
        "success",
      );
      await loadAndRender();
    });
  }

  // 「処方不要になったとして空白にする」ボタン
  const clearPrescriptionBtn = document.getElementById(
    "btn-clear-prescription",
  );
  if (clearPrescriptionBtn) {
    clearPrescriptionBtn.addEventListener("click", async () => {
      const patient = state.prescriptionModalPatient;
      if (!patient) return;
      patient.nextPrescriptionDate = "";
      await patientDB.updatePatient(patient);
      closeAllModals();
      showToast("処方日をクリアしました", "info");
      await loadAndRender();
    });
  }
}

// ==========================================
// 排便日更新モーダル
// ==========================================
function openBowelModal(patientId) {
  const patient = state.patients.find((p) => p.id === patientId);
  if (!patient) return;

  state.bowelModalPatient = patient;
  const modal = document.getElementById("modal-bowel");
  const title = document.getElementById("bowel-modal-title");
  const currentSpan = document.getElementById("bowel-current-display");
  const inputDate = document.getElementById("bowel-custom-date-input");

  const bowelInfo = calculateBowelDaysAgo(
    patient.lastBowelDate,
    getTodayString(),
  );

  if (title) title.textContent = `最終排便日: ${patient.name}${patient.room ? ` (${patient.room})` : ""}`;
  if (currentSpan)
    currentSpan.textContent = patient.lastBowelDate
      ? `${formatDateDisplay(patient.lastBowelDate)} (${bowelInfo.text})`
      : "未入力";
  if (inputDate) inputDate.value = patient.lastBowelDate || getTodayString();

  modal.classList.add("active");
}

function setupBowelModalEvents() {
  const todayBtn = document.getElementById("btn-bowel-today");
  const yestBtn = document.getElementById("btn-bowel-yesterday");
  const twoDaysBtn = document.getElementById("btn-bowel-2daysago");
  const inputDate = document.getElementById("bowel-custom-date-input");

  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      if (inputDate) inputDate.value = getTodayString();
    });
  }
  if (yestBtn) {
    yestBtn.addEventListener("click", () => {
      if (inputDate) inputDate.value = addDaysToDate(getTodayString(), -1);
    });
  }
  if (twoDaysBtn) {
    twoDaysBtn.addEventListener("click", () => {
      if (inputDate) inputDate.value = addDaysToDate(getTodayString(), -2);
    });
  }

  // 確定ボタン
  const confirmBtn = document.getElementById("btn-confirm-bowel");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      const patient = state.bowelModalPatient;
      if (!patient || !inputDate) return;

      patient.lastBowelDate = inputDate.value;
      await patientDB.updatePatient(patient);
      closeAllModals();
      showToast(`最終排便日を更新しました`, "success");
      await loadAndRender();
    });
  }

  // クリアボタン
  const clearBtn = document.getElementById("btn-clear-bowel");
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      const patient = state.bowelModalPatient;
      if (!patient) return;

      patient.lastBowelDate = "";
      await patientDB.updatePatient(patient);
      closeAllModals();
      showToast("排便記録をクリアしました", "info");
      await loadAndRender();
    });
  }
}

// ==========================================
// 次回診察日更新モーダル（外来用）
// ==========================================
function openVisitModal(patientId) {
  const patient = state.patients.find((p) => p.id === patientId);
  if (!patient) return;

  state.visitModalPatient = patient;
  const modal = document.getElementById("modal-visit-date");
  const title = document.getElementById("visit-modal-title");
  const currentSpan = document.getElementById("visit-current-display");
  const inputDate = document.getElementById("visit-next-date-input");

  const visitInfo = calculateVisitDays(patient.nextVisitDate, getTodayString());

  if (title) title.textContent = `次回診察日の更新: ${patient.name}`;
  if (currentSpan) {
    currentSpan.textContent = patient.nextVisitDate
      ? `${formatDateDisplay(patient.nextVisitDate)}${visitInfo ? ` (${visitInfo.text})` : ""}`
      : "未定";
  }
  if (inputDate) {
    inputDate.value =
      patient.nextVisitDate || addDaysToDate(getTodayString(), 14);
  }

  modal.classList.add("active");
}

function setupVisitModalEvents() {
  // 外来モーダル内のクイック日数ボタンのみにスコープを限定
  document
    .querySelectorAll("#modal-visit-date .btn-quick-visit")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const days = Number(e.currentTarget.dataset.days);
        if (isNaN(days)) return;
        const input = document.getElementById("visit-next-date-input");
        if (input) {
          input.value = addDaysToDate(getTodayString(), days);
        }
      });
    });

  // 確定ボタン
  const confirmBtn = document.getElementById("btn-confirm-visit");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      const patient = state.visitModalPatient;
      const input = document.getElementById("visit-next-date-input");
      if (!patient || !input) return;

      patient.nextVisitDate = input.value;
      await patientDB.updatePatient(patient);
      closeAllModals();
      showToast(
        patient.nextVisitDate
          ? `次回診察日を ${formatDateDisplay(patient.nextVisitDate)} に更新しました`
          : "次回診察日を更新しました",
        "success",
      );
      await loadAndRender();
    });
  }

  // 未定（空白）にするボタン
  const clearBtn = document.getElementById("btn-clear-visit");
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      const patient = state.visitModalPatient;
      if (!patient) return;

      patient.nextVisitDate = "";
      await patientDB.updatePatient(patient);
      closeAllModals();
      showToast("次回診察日を未定（空白）にしました", "info");
      await loadAndRender();
    });
  }
}

// ==========================================
// 処方・備考クイック更新モーダル
// ==========================================
function openMemoModal(patientId, focusField = "notes") {
  const patient = state.patients.find((p) => p.id === patientId);
  if (!patient) return;

  state.memoModalPatient = patient;
  const modal = document.getElementById("modal-memo");
  const title = document.getElementById("memo-modal-title");
  const medsInput = document.getElementById("memo-modal-medications");
  const notesInput = document.getElementById("memo-modal-notes");

  if (title) {
    title.textContent = `処方・備考: ${patient.name}${patient.room ? ` (${patient.room})` : ""}`;
  }
  if (medsInput) medsInput.value = patient.medications || "";
  if (notesInput) notesInput.value = patient.notes || "";

  modal.classList.add("active");

  setTimeout(() => {
    if (focusField === "medications" && medsInput) {
      medsInput.focus();
    } else if (notesInput) {
      notesInput.focus();
    }
  }, 100);
}

function setupMemoModalEvents() {
  const form = document.getElementById("memo-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const patient = state.memoModalPatient;
      if (!patient) return;

      const medsInput = document.getElementById("memo-modal-medications");
      const notesInput = document.getElementById("memo-modal-notes");

      patient.medications = medsInput ? medsInput.value.trim() : "";
      patient.notes = notesInput ? notesInput.value.trim() : "";

      await patientDB.updatePatient(patient);
      closeAllModals();
      showToast("処方・備考を更新しました", "success");
      await loadAndRender();
    });
  }
}

// ==========================================
// 転帰変更モーダル
// ==========================================
function openStatusChangeModal(patientId, targetStatus) {
  const patient = state.patients.find((p) => p.id === patientId);
  if (!patient) return;

  state.statusChangeModalData = { patientId, targetStatus };
  const modal = document.getElementById("modal-status-change");
  const title = document.getElementById("status-modal-title");
  const desc = document.getElementById("status-modal-desc");
  const dateInput = document.getElementById("status-change-date-input");

  const targetTitle = getTabTitle(targetStatus);
  if (title) title.textContent = `転帰変更: ${patient.name}`;
  if (desc)
    desc.textContent = `ステータスを「${targetTitle}」に変更します。変更日を入力してください。`;
  if (dateInput) dateInput.value = getTodayString();

  modal.classList.add("active");
}

async function handleStatusChangeSubmit(e) {
  e.preventDefault();
  if (!state.statusChangeModalData) return;

  const { patientId, targetStatus } = state.statusChangeModalData;
  const dateInput = document.getElementById("status-change-date-input");
  const changeDate = dateInput ? dateInput.value : getTodayString();

  const patient = state.patients.find((p) => p.id === patientId);
  if (patient) {
    patient.status = targetStatus;
    patient.statusChangeDate = changeDate;
    if (targetStatus === "discharged") {
      patient.dischargedDate = changeDate;
    }
    await patientDB.updatePatient(patient);
    closeAllModals();
    showToast(`「${getTabTitle(targetStatus)}」へ移動しました`, "success");
    await loadAndRender();
  }
}

// ==========================================
// 新規追加 & 編集モーダル
// ==========================================
function openPatientModal(patientId) {
  const modal = document.getElementById("modal-patient");
  if (!modal) {
    console.error("modal-patient element not found");
    return;
  }
  const title = document.getElementById("patient-modal-title");
  const form = document.getElementById("patient-form");
  const deleteBtn = document.getElementById("btn-delete-patient");
  const statusActionsSection = document.getElementById(
    "form-section-status-actions",
  );
  const statusActionsGroup = document.getElementById("status-action-btn-group");

  if (form) form.reset();

  // ヘルパー: 要素が存在する場合のみ値をセット
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== null && val !== undefined ? val : "";
  };
  const setChecked = (id, checked) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!checked;
  };

  if (patientId) {
    // 編集モード
    const p = state.patients.find((item) => item.id === patientId);
    if (!p) return;

    state.editingPatient = p;
    if (title) title.textContent = "患者情報の編集";
    if (deleteBtn) deleteBtn.style.display = "inline-flex";

    // フォームに値をセット
    setVal("form-patient-id", p.id);
    setVal("form-status", p.status || state.currentTab);
    setVal("form-room", p.room || "");
    setVal("form-name", p.name || "");
    setVal("form-age", p.age);
    setVal("form-gender", p.gender || "");
    setVal("form-diagnosis", p.diagnosis || "");
    setVal("form-liver", p.liverFunction || "");
    setVal("form-renal", p.renalFunction || "");
    setVal("form-start-date", p.startDate || getTodayString());
    setVal("form-attending", p.attendingDoctor || "");
    setVal("form-in-charge", p.doctorInCharge || state.defaultDoctor);

    // 日々データ
    setChecked("form-exam-planned", p.examPlanned);
    setChecked("form-record-checked", p.medicalRecordChecked);
    setVal("form-rescue-count", p.rescueCount || 0);
    setVal("form-bowel-date", p.lastBowelDate || "");
    setVal("form-prescription-date", p.nextPrescriptionDate || "");
    setVal("form-medications", p.medications || "");
    setVal("form-notes", p.notes || "");

    // 外来項目
    setVal("form-next-visit", p.nextVisitDate || "");

    // 担当終了項目
    setVal(
      "form-discharged-date",
      p.statusChangeDate || p.dischargedDate || "",
    );

    // 転帰変更ボタン群を編集画面に生成（要件1）
    if (statusActionsSection && statusActionsGroup) {
      statusActionsSection.style.display = "block";
      statusActionsGroup.innerHTML = "";

      const currStatus = p.status || state.currentTab;

      const createStatusBtn = (targetStatus, labelText, iconName) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-status-action";
        btn.innerHTML = `${getIcon(iconName)} <span>${labelText}</span>`;
        btn.addEventListener("click", () => {
          openStatusChangeModal(p.id, targetStatus);
        });
        return btn;
      };

      if (currStatus === "inpatient") {
        statusActionsGroup.appendChild(
          createStatusBtn("outpatient", "外来担当中にする", "outpatient"),
        );
        statusActionsGroup.appendChild(
          createStatusBtn("discharged", "担当終了にする", "discharged"),
        );
      } else if (currStatus === "outpatient") {
        statusActionsGroup.appendChild(
          createStatusBtn("inpatient", "入院担当中にする", "inpatient"),
        );
        statusActionsGroup.appendChild(
          createStatusBtn("discharged", "担当終了にする", "discharged"),
        );
      } else if (currStatus === "discharged") {
        statusActionsGroup.appendChild(
          createStatusBtn("inpatient", "入院担当に戻す", "inpatient"),
        );
        statusActionsGroup.appendChild(
          createStatusBtn("outpatient", "外来担当にする", "outpatient"),
        );
      }
    }
  } else {
    // 新規追加モード
    state.editingPatient = null;
    if (title) title.textContent = "新規患者の追加";
    if (deleteBtn) deleteBtn.style.display = "none";
    if (statusActionsSection) statusActionsSection.style.display = "none";

    setVal("form-patient-id", "");
    setVal("form-status", state.currentTab);
    setVal("form-start-date", getTodayString());
    setVal("form-in-charge", state.defaultDoctor || "自分");
    setVal("form-rescue-count", 0);
    setVal("form-discharged-date", "");
  }

  // 外来・担当終了フィールドの表示/非表示制御
  toggleOutpatientFields();

  modal.classList.add("active");

  // 要件10: 患者編集ボタンを押したときは日々データを画面中央に持ってくるようスクロール
  if (patientId) {
    setTimeout(() => {
      const dailySection = document.getElementById("form-group-daily");
      if (dailySection && dailySection.style.display !== "none") {
        dailySection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  } else {
    setTimeout(() => {
      const nameInput = document.getElementById("form-name");
      if (nameInput) nameInput.focus();
    }, 100);
  }
}

function toggleOutpatientFields() {
  const statusSelect = document.getElementById("form-status");
  const outpatientGroup = document.getElementById("form-group-outpatient");
  const dischargedGroup = document.getElementById("form-group-discharged");
  const dailyGroup = document.getElementById("form-group-daily");

  if (!statusSelect) return;
  const status = statusSelect.value;
  const isOutpatient = status === "outpatient";
  const isDischarged = status === "discharged";

  if (outpatientGroup)
    outpatientGroup.style.display = isOutpatient ? "block" : "none";
  if (dischargedGroup)
    dischargedGroup.style.display = isDischarged ? "block" : "none";
  if (dailyGroup) dailyGroup.style.display = isOutpatient ? "none" : "block";
}

document
  .getElementById("form-status")
  ?.addEventListener("change", toggleOutpatientFields);

async function handlePatientFormSubmit(e) {
  e.preventDefault();

  const idVal = document.getElementById("form-patient-id").value;
  const name = document.getElementById("form-name").value.trim();
  if (!name) {
    alert("患者氏名は必須です。");
    return;
  }

  const ageVal = document.getElementById("form-age").value;
  const rescueVal = document.getElementById("form-rescue-count").value;
  const statusVal =
    document.getElementById("form-status").value || state.currentTab;
  const dischargedDateVal = document.getElementById(
    "form-discharged-date",
  )?.value;

  const patientData = {
    room: document.getElementById("form-room").value.trim(),
    name: name,
    age: ageVal ? Number(ageVal) : null,
    gender: document.getElementById("form-gender").value,
    diagnosis: document.getElementById("form-diagnosis").value.trim(),
    liverFunction: document.getElementById("form-liver").value.trim(),
    renalFunction: document.getElementById("form-renal").value.trim(),
    startDate:
      document.getElementById("form-start-date").value || getTodayString(),
    attendingDoctor: document.getElementById("form-attending").value.trim(),
    doctorInCharge:
      document.getElementById("form-in-charge").value.trim() ||
      state.defaultDoctor,

    examPlanned: document.getElementById("form-exam-planned")?.checked || false,
    medicalRecordChecked:
      document.getElementById("form-record-checked")?.checked || false,
    rescueCount: rescueVal ? Math.max(0, Number(rescueVal)) : 0,
    lastBowelDate: document.getElementById("form-bowel-date").value,
    nextPrescriptionDate: document.getElementById("form-prescription-date")
      .value,
    medications: document.getElementById("form-medications").value.trim(),
    notes: document.getElementById("form-notes").value.trim(),

    nextVisitDate: document.getElementById("form-next-visit").value,
    status: statusVal,
  };

  if (statusVal === "discharged" && dischargedDateVal) {
    patientData.statusChangeDate = dischargedDateVal;
    patientData.dischargedDate = dischargedDateVal;
  }

  if (idVal) {
    // 更新
    patientData.id = Number(idVal);
    await patientDB.updatePatient(patientData);
    showToast("患者情報を更新しました", "success");
  } else {
    // 新規追加
    await patientDB.addPatient(patientData);
    showToast("新規患者を登録しました", "success");
  }

  closeAllModals();
  await loadAndRender();
}

async function handlePatientDelete() {
  if (!state.editingPatient) return;
  const confirmDelete = confirm(
    `患者「${state.editingPatient.name}」のデータを完全に削除しますか？\n※この操作は取り消せません。`,
  );
  if (confirmDelete) {
    await patientDB.deletePatient(state.editingPatient.id);
    closeAllModals();
    showToast("患者データを削除しました", "info");
    await loadAndRender();
  }
}

// ==========================================
// 設定 & インポート/エクスポート モーダル
// ==========================================
function openSettingsModal() {
  const modal = document.getElementById("modal-settings");
  if (!modal) return;

  // 即座にモーダルを開く
  modal.classList.add("active");

  const doctorInput = document.getElementById("settings-default-doctor");
  if (doctorInput) {
    doctorInput.value = state.defaultDoctor || "自分";
    patientDB
      .getSetting("defaultDoctorInCharge", "自分")
      .then((savedDoctor) => {
        if (savedDoctor) {
          doctorInput.value = savedDoctor;
          state.defaultDoctor = savedDoctor;
        }
      })
      .catch((err) => console.warn("Could not load setting:", err));
  }
}

function setupSettingsModalEvents() {
  // 担当者デフォルト名保存
  const saveDoctorBtn = document.getElementById("btn-save-doctor");
  if (saveDoctorBtn) {
    saveDoctorBtn.addEventListener("click", async () => {
      const input = document.getElementById("settings-default-doctor");
      const val = (input?.value || "").trim() || "自分";
      await patientDB.setSetting("defaultDoctorInCharge", val);
      state.defaultDoctor = val;
      showToast(`担当者のデフォルトを「${val}」に保存しました`, "success");
    });
  }

  // JSONエクスポート
  const exportBtn = document.getElementById("btn-export-json");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      const data = await patientDB.exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mochikan_backup_${getTodayString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("JSONファイルを書き出しました", "success");
    });
  }

  // JSONインポートファイル選択
  const fileInput = document.getElementById("import-file-input");
  const importMergeBtn = document.getElementById("btn-import-merge");
  const importReplaceBtn = document.getElementById("btn-import-replace");

  const triggerImport = (mode) => {
    if (!fileInput.files || fileInput.files.length === 0) {
      alert("インポートするJSONファイルを選択してください。");
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (mode === "replace") {
          if (
            !confirm(
              "現在の全データを消去し、ファイルの内容ですべて置き換えますか？",
            )
          ) {
            return;
          }
        }
        await patientDB.importAllData(json, mode);
        showToast(
          mode === "replace"
            ? "データを置き換えて復元しました"
            : "既存データにマージしました",
          "success",
        );
        closeAllModals();
        await loadAndRender();
      } catch (err) {
        alert("JSONファイルの読み込みに失敗しました: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  if (importMergeBtn) {
    importMergeBtn.addEventListener("click", () => triggerImport("merge"));
  }
  if (importReplaceBtn) {
    importReplaceBtn.addEventListener("click", () => triggerImport("replace"));
  }

  // サンプルデータ読み込みボタン
  const sampleBtn = document.getElementById("btn-load-sample");
  if (sampleBtn) {
    sampleBtn.addEventListener("click", async () => {
      if (confirm("デモ用のサンプル患者データを追加しますか？")) {
        await patientDB.loadSampleData();
        showToast("サンプル患者データを追加しました", "success");
        closeAllModals();
        await loadAndRender();
      }
    });
  }

  // 全データ初期化ボタン
  const clearBtn = document.getElementById("btn-clear-all");
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      if (
        confirm(
          "警告: 全ての患者データが完全に削除されます。\n本当によろしいですか？",
        )
      ) {
        if (confirm("本当の本当に消去してよろしいですか？（元に戻せません）")) {
          await patientDB.clearAll();
          showToast("全データを消去しました", "info");
          closeAllModals();
          await loadAndRender();
        }
      }
    });
  }
}

// ==========================================
// ユーティリティ
// ==========================================
function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.classList.remove("active");
  });
  state.editingPatient = null;
  state.prescriptionModalPatient = null;
  state.bowelModalPatient = null;
  state.visitModalPatient = null;
  state.memoModalPatient = null;
  state.statusChangeModalData = null;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// グローバルスコープへ公開（HTMLのonclickやコンソールからの直接実行にも対応）
window.openPatientModal = openPatientModal;
window.openSettingsModal = openSettingsModal;
window.openBowelModal = openBowelModal;
window.openPrescriptionModal = openPrescriptionModal;
window.openVisitModal = openVisitModal;
window.openMemoModal = openMemoModal;
window.closeAllModals = closeAllModals;
window.loadAndRender = loadAndRender;
