// display.js — orchestrator.
// Timer chạy NGAY và độc lập. Supabase load lazy, fail thì timer vẫn OK.

import { initTimer } from "./timer.js";

const params = new URLSearchParams(location.search);
const arenaNo = parseInt(params.get("arena") || "1", 10);

const $ = (id) => document.getElementById(id);
const arenaNoEl  = $("arena-no");
const roundTagEl = $("round-tag");
const viewScoring  = $("view-scoring");
const viewKnockout = $("view-knockout");
const viewEmpty    = $("view-empty");
const scoringTeam = $("scoring-team");
const koTeam1     = $("ko-team1");
const koTeam2     = $("ko-team2");
const statusEl    = $("status");
const errBox      = $("err-box");

arenaNoEl.textContent = arenaNo;
document.title = `Sa bàn ${arenaNo} · Display`;

function setStatus(text) { if (statusEl) statusEl.textContent = text; }
function showErr(msg) {
  if (!errBox) return;
  errBox.classList.remove("hidden");
  errBox.textContent = "[Supabase] " + msg;
}

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

// ============ 1) Timer init NGAY (sync, không phụ thuộc gì) ============
try {
  initTimer(arenaNo);
} catch (e) {
  console.error("[timer init failed]", e);
  showErr("Timer init: " + (e.message || e));
}

// ============ 2) Supabase load LAZY ============
(async () => {
  setStatus("đang nối Supabase…");
  let mod;
  try {
    mod = await import("./supabase-config.js");
  } catch (e) {
    console.error("[supabase import failed]", e);
    showErr("Không load được Supabase JS từ CDN.\n" + (e.message || e));
    setStatus("offline (CDN lỗi)");
    return;
  }

  const { fetchState, subscribeState } = mod;

  try {
    const { state } = await fetchState();
    console.log("[display] initial state:", state);
    renderTeams(state);
    setStatus("● connected");
  } catch (e) {
    console.error("[fetchState failed]", e);
    showErr("Fetch lỗi: " + (e.message || e));
    setStatus("offline (DB lỗi)");
    return;
  }

  subscribeState(
    (next) => {
      console.log("[display] update received");
      renderTeams(next);
    },
    (mode, text) => setStatus(text)
  );
})();
