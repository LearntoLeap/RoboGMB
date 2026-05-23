import { fetchState, writeState, subscribeState, defaultState } from "./supabase-config.js";

const ARENAS = [1, 2, 3, 4];
const statusEl = document.getElementById("status");
const arenasGrid = document.getElementById("arenas");
const btnScoring = document.getElementById("btn-scoring");
const btnKnockout = document.getElementById("btn-knockout");
const btnClear = document.getElementById("clear-all");

let state = defaultState();
let writeTimer = null;
let suppressRender = false;

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
    t1.addEventListener("input", () => updateLocal(n, "team1", t1.value));
    t2.addEventListener("input", () => updateLocal(n, "team2", t2.value));
  });
}

function updateLocal(arena, field, value) {
  if (!state.arenas[arena]) state.arenas[arena] = { team1: "", team2: "" };
  state.arenas[arena][field] = value || "";
  scheduleWrite();
}

function scheduleWrite() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeState(state).catch(err => {
      console.error(err);
      setStatus("offline", "Lỗi ghi");
    });
  }, 250);
}

// ------- Round toggle -------
function setRoundUI(round) {
  state.round = round;
  btnScoring.classList.toggle("active", round === "scoring");
  btnKnockout.classList.toggle("active", round === "knockout");
  ARENAS.forEach(n => {
    const t2 = document.getElementById(`t2-${n}`);
    const lbl = document.querySelector(`#arenas .arena[data-arena="${n}"] .lbl-t2`);
    const isScoring = round === "scoring";
    t2.disabled = isScoring;
    t2.placeholder = isScoring ? "(không dùng ở vòng tính điểm)" : "Tên đội đối kháng...";
    if (lbl) lbl.style.opacity = isScoring ? .4 : 1;
  });
}

btnScoring.addEventListener("click", () => { setRoundUI("scoring"); scheduleWrite(); });
btnKnockout.addEventListener("click", () => { setRoundUI("knockout"); scheduleWrite(); });

btnClear.addEventListener("click", () => {
  if (!confirm("Xoá toàn bộ tên đội ở 4 sa bàn?")) return;
  ARENAS.forEach(n => { state.arenas[n] = { team1: "", team2: "" }; });
  renderFromState();
  scheduleWrite();
});

// ------- Render full state into DOM (used on first load + on remote change) -------
function renderFromState() {
  setRoundUI(state.round || "scoring");
  ARENAS.forEach(n => {
    const a = (state.arenas && state.arenas[n]) || { team1: "", team2: "" };
    const t1 = document.getElementById(`t1-${n}`);
    const t2 = document.getElementById(`t2-${n}`);
    if (document.activeElement !== t1) t1.value = a.team1 || "";
    if (document.activeElement !== t2) t2.value = a.team2 || "";
  });
}

function setStatus(cls, text) {
  statusEl.className = "status " + cls;
  statusEl.textContent = text;
}

// ------- Boot -------
async function boot() {
  buildCards();
  setRoundUI("scoring");
  try {
    state = await fetchState();
    renderFromState();
    setStatus("online", "Đã kết nối");
  } catch (e) {
    console.error(e);
    setStatus("offline", "Không tải được dữ liệu");
    return;
  }
  subscribeState((next) => {
    state = next;
    renderFromState();
  });
}

boot();
