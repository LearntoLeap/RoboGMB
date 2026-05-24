// display.js — STANDALONE per arena.

import { initTimer } from "./timer.js";
import { toast } from "./fx.js";
import { soundDing, isMuted, toggleMute } from "./sound.js";
import { getTeams, isRest } from "./teams.js";

const params = new URLSearchParams(location.search);
const arenaNo = parseInt(params.get("arena") || "1", 10);

const $ = (id) => document.getElementById(id);
const arenaNoEl  = $("arena-no");
const roundNumEl = $("round-num");
const roundTotalEl = $("round-total");
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

// ===== Teams =====
const TEAMS = getTeams(arenaNo);
const TOTAL = TEAMS.length;
roundTotalEl.textContent = TOTAL;

// ===== State + persistence =====
const ROUND_KEY = `round-arena-${arenaNo}`;
const ATTEMPT_KEY = `attempt-arena-${arenaNo}`;  // lưu theo {roundN: attemptM}

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

let isFirstRender = true;

function setRound(n, opts = {}) {
  if (n < 1) n = 1;
  if (n > TOTAL) n = TOTAL;
  const changed = n !== currentRound;
  currentRound = n;
  localStorage.setItem(ROUND_KEY, String(n));
  render();
  if (changed && !isFirstRender && !opts.silent) {
    const team = TEAMS[n - 1];
    if (isRest(team)) toast(`Vòng ${n}: Nghỉ`, "info", 2000);
    else {
      toast(`Vòng ${n}: ${team}`, "team", 2400);
      soundDing();
    }
  }
  isFirstRender = false;
}

function setAttempt(att, opts = {}) {
  if (att < 1 || att > 3) return;
  if (getAttempt(currentRound) === att) return;
  setAttemptState(currentRound, att);
  renderAttempt();
  if (!opts.silent) {
    toast(`Lượt ${att}`, "info", 1500);
    soundDing();
  }
}

function render() {
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
  renderList();
}

function renderAttempt() {
  const cur = getAttempt(currentRound);
  attemptToggle.querySelectorAll(".att-btn").forEach(b => {
    const a = parseInt(b.dataset.att, 10);
    b.classList.toggle("active", a === cur);
  });
}

function renderList() {
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

// ===== Wire interactions =====
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

document.addEventListener("keydown", (e) => {
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
  if (e.key === "ArrowLeft")       setRound(currentRound - 1);
  else if (e.key === "ArrowRight") setRound(currentRound + 1);
  else if (e.key === "l" || e.key === "L") openModal();
  else if (e.key === "Escape")     closeModal();
  else if (e.key === "1") setAttempt(1);
  else if (e.key === "2") setAttempt(2);
  else if (e.key === "3") setAttempt(3);
});

// ===== Boot =====
try { initTimer(arenaNo); } catch (e) { console.error("[timer]", e); }
setRound(currentRound, { silent: true });
console.log(`[display] arena ${arenaNo} ready · ${TOTAL} rounds`);
