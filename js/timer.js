// ============================================================
// Timer - hoàn toàn LOCAL, không phụ thuộc Supabase.
// Chạy ngay khi DOM ready, kể cả khi mạng Supabase fail.
// ============================================================
import { toast, shake, confettiBurst, glitch, showCountdownNumber, flashOverlay } from "./fx.js";

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
function parseMMSS(str) {
  if (!str) return 0;
  const m = String(str).match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

const $ = (id) => document.getElementById(id);

export function initTimer(arenaNo) {
  const timerBig   = $("timer-big");
  const timerState = $("timer-state");
  const timerInput = $("timer-input");
  const btnToggle  = $("btn-toggle");
  const btnReset   = $("btn-reset");
  const fxOverlay  = $("fx-overlay");

  if (!timerBig || !timerInput || !btnToggle || !btnReset) {
    console.warn("[timer] DOM not ready");
    return;
  }

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
  let lastCountdownNum = null;  // để countdown 5..1 không spam

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
      // ===== Đếm ngược 5..1 =====
      if (rem >= 1 && rem <= 5 && rem !== lastCountdownNum) {
        lastCountdownNum = rem;
        showCountdownNumber(rem);
        if (rem === 1) {
          // chuẩn bị bùm cuối
          setTimeout(() => shake("sm"), 200);
        }
      } else if (rem > 5) {
        lastCountdownNum = null;
      }
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
    // FX: flash + shake + confetti + toast
    flashStart();
    shake("md");
    confettiBurst(80);
    toast("Trận đấu bắt đầu!", "start", 2500);
    renderTimer();
    updateToggleBtn();
  }
  function stopTimer() {
    const rem = getRemaining();
    timer.endsAt = null;
    timer.pausedRemaining = rem;
    timer.running = false;
    saveTimer();
    // FX: flash + shake mạnh + glitch + toast
    flashStop();
    shake("lg");
    glitch(timerBig, 700);
    toast(rem === 0 ? "Hết giờ!" : "Đã tạm dừng", "stop", 2500);
    renderTimer();
    updateToggleBtn();
  }
  function resetTimer() {
    const setSecs = parseMMSS(timerInput.value) || timer.duration || 180;
    autoStopped = false;
    timer = { duration: setSecs, endsAt: null, pausedRemaining: setSecs, running: false };
    saveTimer();
    flashReset();
    toast("Đã đặt lại đồng hồ", "info", 1800);
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

  function flashStart() { flashOverlay("fx-start", "<span>START</span>", 900); }
  function flashStop()  { flashOverlay("fx-stop",  "<span>STOP</span>",  900); }
  function flashReset() { flashOverlay("fx-reset", "<span>RESET</span>", 600); }

  updateToggleBtn();
  renderTimer();
  setInterval(renderTimer, 200);

  console.log("[timer] initialized for arena", arenaNo);
}
