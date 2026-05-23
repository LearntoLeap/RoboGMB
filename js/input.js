import { compRef, arenaRef, roundRef, onValue, set, update, get } from "./firebase-config.js";

const ARENAS = [1, 2, 3, 4];
const statusEl = document.getElementById("status");
const arenasGrid = document.getElementById("arenas");
const btnScoring = document.getElementById("btn-scoring");
const btnKnockout = document.getElementById("btn-knockout");
const btnClear = document.getElementById("clear-all");

let currentRound = "scoring";
let suppressWriteback = false;
const debounceTimers = {};

// ------- Build arena cards -------
function buildCards() {
  arenasGrid.innerHTML = ARENAS.map(n => `
    <div class="arena" data-arena="${n}">
      <div class="arena-head">
        <h3><span class="arena-no">${n}</span> Sa bàn ${n}</h3>
        <span class="live">LIVE</span>
      </div>
      <div class="input-row">
        <label for="t1-${n}">Đội 1</label>
        <input type="text" id="t1-${n}" placeholder="Tên đội..." autocomplete="off" />
        <label for="t2-${n}" class="lbl-t2">Đội 2</label>
        <input type="text" id="t2-${n}" placeholder="Tên đội đối kháng..." autocomplete="off" />
      </div>
    </div>
  `).join("");

  ARENAS.forEach(n => {
    const t1 = document.getElementById(`t1-${n}`);
    const t2 = document.getElementById(`t2-${n}`);
    t1.addEventListener("input", () => scheduleWrite(n, "team1", t1.value));
    t2.addEventListener("input", () => scheduleWrite(n, "team2", t2.value));
  });
}

function scheduleWrite(arena, field, value) {
  if (suppressWriteback) return;
  const key = `${arena}:${field}`;
  clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(() => {
    update(arenaRef(arena), { [field]: value || "" }).catch(err => {
      console.error(err);
      setStatus("offline", "Lỗi ghi");
    });
  }, 250);
}

// ------- Round toggle -------
function setRoundUI(round) {
  currentRound = round;
  btnScoring.classList.toggle("active", round === "scoring");
  btnKnockout.classList.toggle("active", round === "knockout");
  // Disable team2 inputs in scoring round
  ARENAS.forEach(n => {
    const t2 = document.getElementById(`t2-${n}`);
    const lbl = document.querySelector(`#arenas .arena[data-arena="${n}"] .lbl-t2`);
    const isScoring = round === "scoring";
    t2.disabled = isScoring;
    t2.placeholder = isScoring ? "(không dùng ở vòng tính điểm)" : "Tên đội đối kháng...";
    if (lbl) lbl.style.opacity = isScoring ? .4 : 1;
  });
}

btnScoring.addEventListener("click", () => writeRound("scoring"));
btnKnockout.addEventListener("click", () => writeRound("knockout"));
function writeRound(r) {
  set(roundRef, r).catch(err => {
    console.error(err);
    setStatus("offline", "Lỗi ghi");
  });
}

btnClear.addEventListener("click", () => {
  if (!confirm("Xoá toàn bộ tên đội ở 4 sa bàn?")) return;
  const empty = { team1: "", team2: "" };
  ARENAS.forEach(n => set(arenaRef(n), empty));
});

// ------- Live read -------
function bindLive() {
  onValue(compRef, (snap) => {
    const data = snap.val() || {};
    suppressWriteback = true;
    setRoundUI(data.round || "scoring");
    ARENAS.forEach(n => {
      const a = (data.arenas && data.arenas[n]) || {};
      const t1 = document.getElementById(`t1-${n}`);
      const t2 = document.getElementById(`t2-${n}`);
      if (document.activeElement !== t1) t1.value = a.team1 || "";
      if (document.activeElement !== t2) t2.value = a.team2 || "";
    });
    suppressWriteback = false;
    setStatus("online", "Đã kết nối");
  }, (err) => {
    console.error(err);
    setStatus("offline", "Mất kết nối");
  });
}

// ------- Init seed (chạy 1 lần nếu DB rỗng) -------
async function seedIfEmpty() {
  try {
    const snap = await get(compRef);
    if (!snap.exists()) {
      const init = {
        round: "scoring",
        arenas: { 1: { team1: "", team2: "" }, 2: { team1: "", team2: "" },
                  3: { team1: "", team2: "" }, 4: { team1: "", team2: "" } }
      };
      await set(compRef, init);
    }
  } catch (e) { console.warn(e); }
}

function setStatus(cls, text) {
  statusEl.className = "status " + cls;
  statusEl.textContent = text;
}

// ------- Boot -------
buildCards();
setRoundUI("scoring");
seedIfEmpty().then(bindLive);
