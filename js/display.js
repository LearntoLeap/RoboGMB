import {
  fetchState, subscribeState,
  formatMMSS, getTimerRemaining
} from "./supabase-config.js";

const $ = (id) => document.getElementById(id);

const params = new URLSearchParams(location.search);
const arenaNo = parseInt(params.get("arena") || "1", 10);

const arenaNoEl  = $("arena-no");
const roundTagEl = $("round-tag");
const viewScoring  = $("view-scoring");
const viewKnockout = $("view-knockout");
const viewEmpty    = $("view-empty");
const scoringTeam = $("scoring-team");
const koTeam1     = $("ko-team1");
const koTeam2     = $("ko-team2");
const timerBig    = $("timer-big");
const timerState  = $("timer-state");
const statusEl    = $("status");

arenaNoEl.textContent = arenaNo;
document.title = `Sa bàn ${arenaNo} · Display`;

let current = null;

function renderTeams(state) {
  const round = state.round || "scoring";
  const a = (state.arenas && state.arenas[arenaNo]) || {};
  const team1 = (a.team1 || "").trim();
  const team2 = (a.team2 || "").trim();

  roundTagEl.textContent = round === "knockout" ? "Vòng đối kháng" : "Vòng tính điểm";

  const hasAny = team1 || team2;
  viewScoring.classList.add("hidden");
  viewKnockout.classList.add("hidden");
  viewEmpty.classList.add("hidden");

  if (!hasAny) {
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
    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = "";
  }
}

function renderTimer() {
  if (!current) return;
  const t = current.timer || {};
  const rem = getTimerRemaining(t);
  timerBig.textContent = formatMMSS(rem);

  timerBig.classList.remove("running", "paused", "ended", "warn");
  if (rem <= 0 && (t.running || (t.pausedRemaining === 0))) {
    timerBig.classList.add("ended");
    timerState.textContent = "Hết giờ";
  } else if (t.running) {
    timerBig.classList.add("running");
    timerState.textContent = "Đang chạy";
    if (rem <= 10) timerBig.classList.add("warn");
  } else if ((t.pausedRemaining || 0) < (t.duration || 0)) {
    timerBig.classList.add("paused");
    timerState.textContent = "Tạm dừng";
  } else {
    timerState.textContent = "Sẵn sàng";
  }
}

function setStatus(text) { statusEl.textContent = text; }

async function boot() {
  try {
    const { state } = await fetchState();
    current = state;
    renderTeams(current);
    renderTimer();
    setStatus("● live");
  } catch (e) {
    console.error(e);
    setStatus("offline");
    return;
  }
  subscribeState(
    (next) => {
      current = next;
      renderTeams(current);
      renderTimer();
    },
    (mode, text) => setStatus(text)
  );
  // Tick local mỗi 200ms cho đồng hồ chạy mượt
  setInterval(renderTimer, 200);
}

boot();
