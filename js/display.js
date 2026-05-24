// display.js — STANDALONE per arena, 2 modes: scoring + knockout.

import { initTimer } from "./timer.js";
import { toast, confettiBurst } from "./fx.js";
import { soundDing, soundStart, isMuted, toggleMute } from "./sound.js";
import { getTeams, isRest, KNOCKOUT_TEAMS } from "./teams.js";

const params = new URLSearchParams(location.search);
const arenaNo = parseInt(params.get("arena") || "1", 10);

const $ = (id) => document.getElementById(id);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const arenaNoEl  = $("arena-no");
const roundNumEl = $("round-num");
const roundTotalEl = $("round-total");
const roundTagEl = $("round-tag");

// scoring
const teamNameEl = $("team-name");
const teamStateEl = $("team-state");
const attemptToggle = $("attempt-toggle");
const btnPrev = $("btn-prev");
const btnNext = $("btn-next");
const btnList = $("btn-list");
const modal = $("team-modal");
const modalArena = $("modal-arena");
const modalClose = $("modal-close");
const teamListEl = $("team-list");

// knockout
const koModal = $("ko-modal");
const koTeamListEl = $("ko-team-list");
const koStatsEl = $("ko-stats");
const btnEliminate = $("btn-eliminate");
const btnEliminateModal = $("btn-eliminate-modal");
const btnResetMatch = $("btn-reset-match");

// mode
const modeToggle = $("mode-toggle");
const modeContents = qsa(".mode-content");

arenaNoEl.textContent = arenaNo;
modalArena.textContent = arenaNo;
document.title = `Sa bàn ${arenaNo} · Display`;

// ===== Mute =====
const muteBtn = $("btn-mute");
function updateMuteIcon() {
  if (!muteBtn) return;
  muteBtn.textContent = isMuted() ? "🔇" : "🔊";
  muteBtn.title = isMuted() ? "Bật âm thanh" : "Tắt âm thanh";
}
if (muteBtn) {
  updateMuteIcon();
  muteBtn.addEventListener("click", () => {
    toggleMute(); updateMuteIcon();
    if (!isMuted()) soundDing();
  });
}

// ===========================================================
// MODE: scoring | knockout
// ===========================================================
const MODE_KEY = `mode-arena-${arenaNo}`;
let currentMode = localStorage.getItem(MODE_KEY) || "scoring";

function applyMode(mode) {
  currentMode = mode;
  localStorage.setItem(MODE_KEY, mode);
  modeToggle.querySelectorAll(".mode-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });
  modeContents.forEach(el => el.classList.toggle("hidden", el.dataset.mode !== mode));
  // round tag only in scoring
  roundTagEl.style.display = mode === "scoring" ? "" : "none";
  // refresh views
  if (mode === "scoring") renderScoring();
  else renderKnockout();
}
modeToggle.querySelectorAll(".mode-btn").forEach(b => {
  b.addEventListener("click", () => {
    const m = b.dataset.mode;
    if (m === currentMode) return;
    applyMode(m);
    toast(m === "scoring" ? "Chuyển sang Vòng tính điểm" : "Chuyển sang Vòng đối kháng", "info", 2200);
  });
});

// ===========================================================
// SCORING MODE
// ===========================================================
const TEAMS = getTeams(arenaNo);
const TOTAL = TEAMS.length;
roundTotalEl.textContent = TOTAL;

const ROUND_KEY = `round-arena-${arenaNo}`;
const ATTEMPT_KEY = `attempt-arena-${arenaNo}`;

let currentRound = parseInt(localStorage.getItem(ROUND_KEY) || "1", 10);
if (currentRound < 1 || currentRound > TOTAL) currentRound = 1;

let attemptMap = {};
try { attemptMap = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || "{}"); }
catch (_) { attemptMap = {}; }

function getAttempt(round) {
  const a = attemptMap[round];
  return (a && a >= 1 && a <= 3) ? a : 1;
}
function setAttemptState(round, att) {
  attemptMap[round] = att;
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attemptMap));
}

let isFirstScoringRender = true;

function setRound(n, opts = {}) {
  if (n < 1) n = 1;
  if (n > TOTAL) n = TOTAL;
  const changed = n !== currentRound;
  currentRound = n;
  localStorage.setItem(ROUND_KEY, String(n));
  renderScoring();
  if (changed && !isFirstScoringRender && !opts.silent) {
    const team = TEAMS[n - 1];
    if (isRest(team)) toast(`Vòng ${n}: Nghỉ`, "info", 2000);
    else { toast(`Vòng ${n}: ${team}`, "team", 2400); soundDing(); }
  }
  isFirstScoringRender = false;
}

function setAttempt(att, opts = {}) {
  if (att < 1 || att > 3) return;
  if (getAttempt(currentRound) === att) return;
  setAttemptState(currentRound, att);
  renderAttempt();
  if (!opts.silent) { toast(`Lượt ${att}`, "info", 1500); soundDing(); }
}

function renderScoring() {
  roundNumEl.textContent = currentRound;
  const team = TEAMS[currentRound - 1] || "";
  if (isRest(team)) {
    teamNameEl.textContent = "— Nghỉ —";
    teamNameEl.classList.add("rest");
    teamStateEl.textContent = "Không có đội thi đấu vòng này";
    attemptToggle.classList.add("disabled");
  } else {
    if (teamNameEl.textContent !== team) {
      teamNameEl.textContent = team;
      teamNameEl.style.animation = "none";
      teamNameEl.offsetHeight;
      teamNameEl.style.animation = "";
    }
    teamNameEl.classList.remove("rest");
    teamStateEl.textContent = "";
    attemptToggle.classList.remove("disabled");
  }
  btnPrev.disabled = currentRound <= 1;
  btnNext.disabled = currentRound >= TOTAL;
  renderAttempt();
  renderTeamList();
}

function renderAttempt() {
  const cur = getAttempt(currentRound);
  attemptToggle.querySelectorAll(".att-btn").forEach(b => {
    b.classList.toggle("active", parseInt(b.dataset.att, 10) === cur);
  });
}

function renderTeamList() {
  if (!teamListEl) return;
  teamListEl.innerHTML = TEAMS.map((name, i) => {
    const round = i + 1;
    const isCur = round === currentRound;
    const rest = isRest(name);
    return `
      <li class="team-item ${isCur ? "current" : ""} ${rest ? "rest" : ""}" data-round="${round}">
        <span class="ti-round">${round}</span>
        <span class="ti-name">${rest ? "— Nghỉ —" : name}</span>
        ${isCur ? '<span class="ti-current-tag">Đang thi</span>' : ""}
      </li>
    `;
  }).join("");
  teamListEl.querySelectorAll(".team-item").forEach(li => {
    li.addEventListener("click", () => {
      const r = parseInt(li.dataset.round, 10);
      setRound(r);
      closeModal();
    });
  });
}

btnPrev.addEventListener("click", () => setRound(currentRound - 1));
btnNext.addEventListener("click", () => setRound(currentRound + 1));
attemptToggle.querySelectorAll(".att-btn").forEach(b => {
  b.addEventListener("click", () => {
    if (attemptToggle.classList.contains("disabled")) return;
    setAttempt(parseInt(b.dataset.att, 10));
  });
});

function openModal() {
  modal.classList.remove("hidden");
  setTimeout(() => {
    const cur = teamListEl.querySelector(".team-item.current");
    if (cur) cur.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 50);
}
function closeModal() { modal.classList.add("hidden"); }
btnList.addEventListener("click", openModal);
modalClose.addEventListener("click", closeModal);
modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);

// ===========================================================
// KNOCKOUT MODE
// ===========================================================
const ELIM_KEY = "eliminated-teams";   // shared key (per device)
const KO_KEY = `ko-state-arena-${arenaNo}`;

let eliminated = [];
try { eliminated = JSON.parse(localStorage.getItem(ELIM_KEY) || "[]"); }
catch (_) { eliminated = []; }

let koState = { team1: "", team2: "", score1: 0, score2: 0 };
try {
  const saved = JSON.parse(localStorage.getItem(KO_KEY) || "null");
  if (saved) koState = { ...koState, ...saved };
} catch (_) {}

function saveKoState() { localStorage.setItem(KO_KEY, JSON.stringify(koState)); }
function saveElim() { localStorage.setItem(ELIM_KEY, JSON.stringify(eliminated)); }
function isEliminated(name) { return eliminated.includes(name); }

function getKoSelect(side) { return document.querySelector(`.ko-select[data-side="${side}"]`); }
function getKoNameEl(side) { return document.getElementById(`ko-name-${side}`); }
function getKoScoreEl(side) { return document.getElementById(`ko-score-${side}`); }

function renderKnockout() {
  // populate dropdowns
  [1, 2].forEach(side => {
    const sel = getKoSelect(side);
    if (!sel) return;
    const currentVal = side === 1 ? koState.team1 : koState.team2;
    const opposite = side === 1 ? koState.team2 : koState.team1;
    let html = `<option value="">— Chọn đội —</option>`;
    KNOCKOUT_TEAMS.forEach(team => {
      const elim = isEliminated(team);
      // Hide eliminated AND the team chosen on the opposite side
      if (elim && team !== currentVal) return;
      if (team === opposite && team !== currentVal) return;
      const sel_ = team === currentVal ? " selected" : "";
      const tag = elim ? " (đã loại)" : "";
      html += `<option value="${team}"${sel_}>${team}${tag}</option>`;
    });
    sel.innerHTML = html;
    sel.value = currentVal || "";
  });

  // names + scores
  getKoNameEl(1).textContent = koState.team1 || "—";
  getKoNameEl(2).textContent = koState.team2 || "—";
  getKoNameEl(1).classList.toggle("empty", !koState.team1);
  getKoNameEl(2).classList.toggle("empty", !koState.team2);
  getKoScoreEl(1).textContent = koState.score1;
  getKoScoreEl(2).textContent = koState.score2;

  // highlight leader
  qsa(".ko-side").forEach(el => el.classList.remove("leading"));
  if (koState.team1 && koState.team2) {
    if (koState.score1 > koState.score2) document.querySelector('.ko-side[data-side="1"]')?.classList.add("leading");
    else if (koState.score2 > koState.score1) document.querySelector('.ko-side[data-side="2"]')?.classList.add("leading");
  }

  renderEliminationList();
}

function renderEliminationList() {
  if (!koTeamListEl) return;
  koTeamListEl.innerHTML = KNOCKOUT_TEAMS.map(team => {
    const elim = isEliminated(team);
    return `
      <li class="ko-team-item ${elim ? "eliminated" : ""}" data-team="${team}">
        <span class="kti-name">${team}</span>
        <span class="kti-tag">${elim ? "❌ Đã loại" : "✓ Còn"}</span>
      </li>
    `;
  }).join("");
  koTeamListEl.querySelectorAll(".ko-team-item").forEach(li => {
    li.addEventListener("click", () => {
      const team = li.dataset.team;
      if (isEliminated(team)) {
        eliminated = eliminated.filter(t => t !== team);
        toast(`Khôi phục: ${team}`, "info", 1800);
      } else {
        eliminated.push(team);
        toast(`Đã loại: ${team}`, "danger", 2200);
      }
      saveElim();
      renderKnockout();
    });
  });
  const remain = KNOCKOUT_TEAMS.length - eliminated.length;
  koStatsEl.textContent = `Còn lại: ${remain} / ${KNOCKOUT_TEAMS.length} đội`;
}

// Wire knockout interactions
[1, 2].forEach(side => {
  const sel = getKoSelect(side);
  if (sel) {
    sel.addEventListener("change", () => {
      const val = sel.value || "";
      if (side === 1) koState.team1 = val;
      else koState.team2 = val;
      saveKoState();
      renderKnockout();
      if (val) {
        toast(`Đội ${side}: ${val}`, "team", 2000);
        soundDing();
      }
    });
  }
});

qsa(".ko-score-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const side = parseInt(btn.dataset.side, 10);
    const delta = parseInt(btn.dataset.delta, 10);
    const key = side === 1 ? "score1" : "score2";
    koState[key] = Math.max(0, (koState[key] || 0) + delta);
    saveKoState();
    renderKnockout();
    if (delta > 0) {
      soundDing();
      confettiBurst(15);
    }
  });
});

btnResetMatch.addEventListener("click", () => {
  if (!confirm("Xoá tỷ số và đội đã chọn? (Đội đã loại vẫn giữ nguyên)")) return;
  koState = { team1: "", team2: "", score1: 0, score2: 0 };
  saveKoState();
  renderKnockout();
  toast("Đã xoá trận đấu hiện tại", "info", 1800);
});

btnEliminate.addEventListener("click", () => {
  if (!koState.team1 || !koState.team2) {
    toast("Cần chọn đủ 2 đội trước", "warn", 2200);
    return;
  }
  if (koState.score1 === koState.score2) {
    toast("Tỷ số đang hoà — chưa xác định đội thua", "warn", 2500);
    return;
  }
  const loser = koState.score1 < koState.score2 ? koState.team1 : koState.team2;
  const winner = koState.score1 > koState.score2 ? koState.team1 : koState.team2;
  if (!confirm(`Loại "${loser}"?\nĐội thắng "${winner}" sẽ đi tiếp.`)) return;
  if (!eliminated.includes(loser)) eliminated.push(loser);
  saveElim();
  // Clear loser from current match, keep winner
  if (koState.team1 === loser) { koState.team1 = ""; koState.score1 = 0; koState.score2 = 0; }
  else { koState.team2 = ""; koState.score1 = 0; koState.score2 = 0; }
  saveKoState();
  renderKnockout();
  toast(`🏆 ${winner} thắng! Loại ${loser}`, "success", 3000);
  confettiBurst(80);
  soundStart();
});

btnEliminateModal.addEventListener("click", () => {
  koModal.classList.remove("hidden");
  renderEliminationList();
});
qsa("[data-close-ko]").forEach(el => {
  el.addEventListener("click", () => koModal.classList.add("hidden"));
});
$("ko-reset-elim").addEventListener("click", () => {
  if (!confirm("Khôi phục toàn bộ 16 đội về trạng thái chưa loại?")) return;
  eliminated = [];
  saveElim();
  renderKnockout();
  toast("Đã khôi phục toàn bộ đội", "info", 2000);
});

// ===========================================================
// Keyboard shortcuts (chỉ áp dụng khi đúng mode)
// ===========================================================
document.addEventListener("keydown", (e) => {
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
  if (e.key === "Escape") {
    closeModal();
    koModal.classList.add("hidden");
    return;
  }
  if (currentMode === "scoring") {
    if (e.key === "ArrowLeft")       setRound(currentRound - 1);
    else if (e.key === "ArrowRight") setRound(currentRound + 1);
    else if (e.key === "l" || e.key === "L") openModal();
    else if (e.key === "1") setAttempt(1);
    else if (e.key === "2") setAttempt(2);
    else if (e.key === "3") setAttempt(3);
  } else if (currentMode === "knockout") {
    if (e.key === "l" || e.key === "L") {
      koModal.classList.remove("hidden"); renderEliminationList();
    }
  }
});

// ===== Boot =====
try { initTimer(arenaNo); } catch (e) { console.error("[timer]", e); }
applyMode(currentMode);
setRound(currentRound, { silent: true });
console.log(`[display] arena ${arenaNo} ready · mode=${currentMode}`);
