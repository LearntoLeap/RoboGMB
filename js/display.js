import { compRef, onValue } from "./firebase-config.js";

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

function render(round, team1, team2) {
  roundTagEl.textContent = round === "knockout" ? "Vòng đối kháng" : "Vòng tính điểm";

  const hasAny = (team1 && team1.trim()) || (team2 && team2.trim());
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
    // restart animation
    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = "";
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}

onValue(compRef, (snap) => {
  const data = snap.val() || {};
  const round = data.round || "scoring";
  const a = (data.arenas && data.arenas[arenaNo]) || {};
  render(round, a.team1 || "", a.team2 || "");
  setStatus("● live");
}, (err) => {
  console.error(err);
  setStatus("offline");
});
