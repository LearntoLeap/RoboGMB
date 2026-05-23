import { fetchState, subscribeState } from "./supabase-config.js";

const params = new URLSearchParams(location.search);
const arenaNo = parseInt(params.get("arena") || "1", 10);

const arenaNoEl = document.getElementById("arena-no");
const roundTagEl = document.getElementById("round-tag");
const viewScoring = document.getElementById("view-scoring");
const viewKnockout = document.getElementById("view-knockout");
const viewEmpty = document.getElementById("view-empty");
const scoringTeam = document.getElementById("scoring-team");
const koTeam1 = document.getElementById("ko-team1");
const koTeam2 = document.getElementById("ko-team2");
const statusEl = document.getElementById("status");

arenaNoEl.textContent = arenaNo;
document.title = `Sa bàn ${arenaNo} · Display`;

function render(state) {
  const round = state.round || "scoring";
  const a = (state.arenas && state.arenas[arenaNo]) || {};
  const team1 = a.team1 || "";
  const team2 = a.team2 || "";

  roundTagEl.textContent = round === "knockout" ? "Vòng đối kháng" : "Vòng tính điểm";

  const hasAny = team1.trim() || team2.trim();
  if (!hasAny) {
    viewScoring.classList.add("hidden");
    viewKnockout.classList.add("hidden");
    viewEmpty.classList.remove("hidden");
    return;
  }

  if (round === "knockout") {
    viewScoring.classList.add("hidden");
    viewEmpty.classList.add("hidden");
    viewKnockout.classList.remove("hidden");
    setText(koTeam1, team1);
    setText(koTeam2, team2);
  } else {
    viewKnockout.classList.add("hidden");
    viewEmpty.classList.add("hidden");
    viewScoring.classList.remove("hidden");
    setText(scoringTeam, team1);
  }
}

function setText(el, val) {
  const v = (val && val.trim()) || "—";
  if (el.textContent !== v) {
    el.textContent = v;
    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = "";
  }
}

function setStatus(text) { statusEl.textContent = text; }

async function boot() {
  try {
    const state = await fetchState();
    render(state);
    setStatus("● live");
  } catch (e) {
    console.error(e);
    setStatus("offline");
    return;
  }
  subscribeState((next) => {
    render(next);
    setStatus("● live");
  });
}

boot();
