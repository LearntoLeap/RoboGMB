import {
  fetchState, subscribeState,
  formatMMSS, parseMMSS
} from "./supabase-config.js";

const $ = (id) => document.getElementById(id);

const params = new URLSearchParams(location.search);
const arenaNo = parseInt(params.get("arena") || "1", 10);

// ===== DOM
const arenaNoEl  = $("arena-no");
const roundTagEl = $("round-tag");
const viewScoring  = $("view-scoring");
const viewKnockout = $("view-knockout");
const viewEmpty    = $("view-empty");
const scoringTeam = $("scoring-team");
const koTeam1     = $("ko-team1");
const koTeam2     = $("ko-team2");
const statusEl    = $("status");

const timerBig   = $("timer-big");
const timerState = $("timer-state");
const timerInput = $("timer-input");
const btnToggle  = $("btn-toggle");
const btnReset   = $("btn-reset");
const fxOverlay  = $("fx-overlay");

arenaNoEl.textContent = arenaNo;
document.title = `Sa bàn ${arenaNo} · Display`;

// ===== Team rendering
function renderTeams(state) {
  const round = state.round || "scoring";
  const a = (state.arenas && state.arenas[arenaNo]) || {};
  const team1 = (a.team1 || "").trim();
  const team2 = (a.team2 || "").trim();

  roundTagEl.textContent = round === "knockout" ? "Vòng đối kháng" : "Vòng tính điểm";
  roundTagEl.dataset.round = round;

  viewScoring.classList.add("hidden");
  viewKnockout.classList.add("hidden");
  viewEmpty.classList.add("hidden");

  if (!team1 && !team2) {
    viewEmpty.classList.remove("hidden");
    return;
  }
  if (round === "knockout") {
    viewKnockout.classList.remove("hidden");
    setText(koTeam1, team1 || "—");
    setText(koTeam2, team2 || "—");
  } else {
    viewScoring.classList.remove("hidden");
    setText(scoringTeam, team1 || "—");
  }
}
function setText(el, val) {
  if (el.textContent !== val) {
    el.textContent = val;
    el.style.animation = "none"; el.offsetHeight; el.style.animation = "";
  }
}
function setStatus(text) { statusEl.textContent = text; }

// ===== Timer (per-arena, lưu localStorage)
const TIMER_KEY = `timer-arena-${arenaNo}`;

function loadTimer() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { duration: 180, endsAt: null, pausedRemaining: 180, running: false };
}
function saveTimer() { localStorage.setItem(TIMER_KEY, JSON.stringify(timer)); }

let timer = loadTimer();
let autoStopped = false;

function getRemaining() {
  if (timer.running && timer.endsAt) {
    const ms = new Date(timer.endsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
  }
  return Math.max(0, timer.pausedRemaining || 0);
}

function renderTimer() {
  const rem = getRemaining();
  const text = formatMMSS(rem);
  if (timerBig.textContent !== text) timerBig.textContent = text;

  timerBig.classList.remove("running", "warn", "ended", "paused");

  if (timer.running && rem <= 0 && !autoStopped) {
    autoStopped = true;
    timer.running = false;
    timer.endsAt = null;
    timer.pausedRemaining = 0;
    saveTimer();
    flashStop();
    updateToggleBtn();
  }

  if (rem === 0 && !timer.running) {
    timerBig.classList.add("ended");
    timerState.textContent = "Hết giờ";
  } else if (timer.running) {
    timerBig.classList.add("running");
    timerState.textContent = "Đang chạy";
    if (rem <= 10) timerBig.classList.add("warn");
  } else if ((timer.pausedRemaining || 0) < (timer.duration || 0)) {
    timerBig.classList.add("paused");
    timerState.textContent = "Tạm dừng";
  } else {
    timerState.textContent = "Sẵn sàng";
  }

  if (document.activeElement !== timerInput) {
    timerInput.value = formatMMSS(timer.duration || 0);
  }
}

function updateToggleBtn() {
  if (timer.running) {
    btnToggle.textContent = "⏸ Dừng";
    btnToggle.classList.remove("btn-success");
    btnToggle.classList.add("btn-danger");
  } else {
    btnToggle.textContent = "▶ Bắt đầu";
    btnToggle.classList.remove("btn-danger");
    btnToggle.classList.add("btn-success");
  }
}

function startTimer() {
  const rem = timer.running ? getRemaining() : (timer.pausedRemaining || timer.duration || 0);
  if (rem <= 0) return;
  autoStopped = false;
  timer.endsAt = new Date(Date.now() + rem * 1000).toISOString();
  timer.pausedRemaining = rem;
  timer.running = true;
  saveTimer();
  flashStart();
  renderTimer();
  updateToggleBtn();
}
function stopTimer() {
  const rem = getRemaining();
  timer.endsAt = null;
  timer.pausedRemaining = rem;
  timer.running = false;
  saveTimer();
  flashStop();
  renderTimer();
  updateToggleBtn();
}
function resetTimer() {
  const setSecs = parseMMSS(timerInput.value) || timer.duration || 180;
  autoStopped = false;
  timer = { duration: setSecs, endsAt: null, pausedRemaining: setSecs, running: false };
  saveTimer();
  flashReset();
  renderTimer();
  updateToggleBtn();
}

btnToggle.addEventListener("click", () => timer.running ? stopTimer() : startTimer());
btnReset.addEventListener("click", resetTimer);

document.querySelectorAll(".adj").forEach(btn => {
  btn.addEventListener("click", () => {
    const delta = parseInt(btn.dataset.adj, 10) || 0;
    const rem = getRemaining();
    if (timer.running) {
      const newRem = Math.max(0, rem + delta);
      timer.endsAt = new Date(Date.now() + newRem * 1000).toISOString();
      timer.pausedRemaining = newRem;
      timer.duration = Math.max(0, (timer.duration || 0) + delta);
    } else {
      const newDur = Math.max(0, (timer.duration || 0) + delta);
      timer.duration = newDur;
      timer.pausedRemaining = newDur;
    }
    saveTimer();
    renderTimer();
  });
});

timerInput.addEventListener("change", () => {
  const secs = parseMMSS(timerInput.value);
  if (secs <= 0) { timerInput.value = formatMMSS(timer.duration || 180); return; }
  timerInput.value = formatMMSS(secs);
  if (!timer.running) {
    timer.duration = secs;
    timer.pausedRemaining = secs;
    saveTimer();
    renderTimer();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.target === timerInput) return;
  if (e.code === "Space") { e.preventDefault(); timer.running ? stopTimer() : startTimer(); }
  else if (e.key === "r" || e.key === "R") { resetTimer(); }
});

// ===== FX overlays
function flash(cls, html, ms = 900) {
  fxOverlay.className = `fx-overlay show ${cls}`;
  fxOverlay.innerHTML = `<div class="fx-content">${html}</div>`;
  clearTimeout(flash._t);
  flash._t = setTimeout(() => fxOverlay.classList.remove("show"), ms);
}
function flashStart() { flash("fx-start", "<span>START</span>", 900); }
function flashStop()  { flash("fx-stop",  "<span>STOP</span>",  900); }
function flashReset() { flash("fx-reset", "<span>RESET</span>", 600); }

// ===== Boot
async function boot() {
  updateToggleBtn();
  renderTimer();
  try {
    const { state } = await fetchState();
    renderTeams(state);
    setStatus("● live");
  } catch (e) {
    console.error(e);
    setStatus("offline");
  }
  subscribeState(
    (next) => renderTeams(next),
    (mode, text) => setStatus(text)
  );
  setInterval(renderTimer, 200);
}
boot();
