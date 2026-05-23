// display.js — orchestrator.
// Timer chạy NGAY và độc lập. Supabase load lazy, fail thì timer vẫn OK.

import { initTimer } from "./timer.js";
import { toast } from "./fx.js";
import { soundDing, isMuted, toggleMute } from "./sound.js";

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

// ===== Mute button =====
const muteBtn = $("btn-mute");
function updateMuteIcon() {
  if (!muteBtn) return;
  muteBtn.textContent = isMuted() ? "🔇" : "🔊";
  muteBtn.title = isMuted() ? "Bật âm thanh" : "Tắt âm thanh";
}
if (muteBtn) {
  updateMuteIcon();
  muteBtn.addEventListener("click", () => {
    const nowMuted = toggleMute();
    updateMuteIcon();
    if (!nowMuted) soundDing();
  });
}

function setStatus(text) { if (statusEl) statusEl.textContent = text; }
function showErr(msg) {
  if (!errBox) return;
  errBox.classList.remove("hidden");
  errBox.textContent = "[Supabase] " + msg;
}

let lastTeam1 = "", lastTeam2 = "", lastRound = "", isFirstRender = true;
function renderTeams(state) {
  const round = state.round || "scoring";
  const a = (state.arenas && state.arenas[arenaNo]) || {};
  const team1 = (a.team1 || "").trim();
  const team2 = (a.team2 || "").trim();

  // ===== Toast + sound khi có đội mới (không hiện lần load đầu) =====
  if (!isFirstRender) {
    let dinged = false;
    if (round !== lastRound) {
      toast(`Chuyển sang ${round === "knockout" ? "Vòng đối kháng" : "Vòng tính điểm"}`, "info", 2500);
      dinged = true;
    }
    if (team1 && team1 !== lastTeam1) {
      toast(`Đội mới: ${team1}`, "team", 3000);
      dinged = true;
    }
    if (round === "knockout" && team2 && team2 !== lastTeam2) {
      toast(`Đối thủ: ${team2}`, "team", 3000);
      dinged = true;
    }
    if (dinged) soundDing();
  }
  lastTeam1 = team1; lastTeam2 = team2; lastRound = round;
  isFirstRender = false;

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
