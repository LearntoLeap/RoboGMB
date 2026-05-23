import { fetchState, writeState, subscribeState, defaultState } from "./supabase-config.js";

const ARENAS = [1, 2, 3, 4];
const statusEl = document.getElementById("status");
const arenasGrid = document.getElementById("arenas");
const btnScoring = document.getElementById("btn-scoring");
const btnKnockout = document.getElementById("btn-knockout");
const btnClear = document.getElementById("clear-all");
const btnPublish = document.getElementById("publish");
const dirtyFlag = document.getElementById("dirty-flag");

// published = trạng thái đang hiện trên các màn hình Display
// draft     = trạng thái admin đang gõ tại chỗ (chưa đẩy)
let published = defaultState();
let draft = defaultState();

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
    t1.addEventListener("input", () => updateDraft(n, "team1", t1.value));
    t2.addEventListener("input", () => updateDraft(n, "team2", t2.value));
  });
}

function updateDraft(arena, field, value) {
  if (!draft.arenas[arena]) draft.arenas[arena] = { team1: "", team2: "" };
  draft.arenas[arena][field] = value || "";
  refreshDirty();
}

// ------- Round toggle (cũng nằm trong draft) -------
function setRoundUI(round) {
  draft.round = round;
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

btnScoring.addEventListener("click", () => { setRoundUI("scoring"); refreshDirty(); });
btnKnockout.addEventListener("click", () => { setRoundUI("knockout"); refreshDirty(); });

btnClear.addEventListener("click", () => {
  if (!confirm("Xoá toàn bộ tên đội ở 4 sa bàn (chỉ ở nháp, chưa đẩy)?")) return;
  ARENAS.forEach(n => { draft.arenas[n] = { team1: "", team2: "" }; });
  renderInputsFromDraft();
  refreshDirty();
});

// ------- Publish -------
btnPublish.addEventListener("click", async () => {
  btnPublish.disabled = true;
  const prevText = btnPublish.textContent;
  btnPublish.textContent = "Đang đẩy…";
  try {
    await writeState(draft);
    published = deepClone(draft);
    refreshDirty();
    setStatus("online", "Đã đẩy lên màn hình");
  } catch (e) {
    console.error(e);
    setStatus("offline", "Đẩy thất bại");
    btnPublish.disabled = false;
  } finally {
    btnPublish.textContent = prevText;
  }
});

// ------- Dirty state -------
function isDirty() {
  return JSON.stringify(draft) !== JSON.stringify(published);
}
function refreshDirty() {
  const dirty = isDirty();
  btnPublish.disabled = !dirty;
  dirtyFlag.classList.toggle("hidden", !dirty);

  // Mark từng arena card có thay đổi
  ARENAS.forEach(n => {
    const card = document.querySelector(`.arena[data-arena="${n}"]`);
    if (!card) return;
    const d = draft.arenas[n] || {};
    const p = published.arenas[n] || {};
    const arenaDirty = (d.team1 || "") !== (p.team1 || "") || (d.team2 || "") !== (p.team2 || "");
    card.classList.toggle("dirty", arenaDirty);
  });
}

// ------- Render -------
function renderInputsFromDraft() {
  ARENAS.forEach(n => {
    const a = draft.arenas[n] || { team1: "", team2: "" };
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

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

// ------- Boot -------
async function boot() {
  buildCards();
  try {
    published = await fetchState();
    draft = deepClone(published);
    setRoundUI(draft.round || "scoring");
    renderInputsFromDraft();
    refreshDirty();
    setStatus("online", "Đã kết nối");
  } catch (e) {
    console.error(e);
    setStatus("offline", "Không tải được dữ liệu");
    return;
  }

  // Realtime: nếu có máy khác (hoặc tab khác) đẩy lên, cập nhật "published".
  // Nếu admin chưa có thay đổi nháp → đồng bộ luôn vào draft.
  subscribeState((next) => {
    const wasDirty = isDirty();
    published = next;
    if (!wasDirty) {
      draft = deepClone(next);
      setRoundUI(draft.round || "scoring");
      renderInputsFromDraft();
    }
    refreshDirty();
  });
}

boot();
