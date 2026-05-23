import {
  fetchState, writeState, subscribeState, defaultState,
  formatMMSS, parseMMSS, getTimerRemaining
} from "./supabase-config.js";

const ARENAS = [1, 2, 3, 4];
const $ = (id) => document.getElementById(id);

const statusEl = $("status");
const arenasGrid = $("arenas");
const btnScoring = $("btn-scoring");
const btnKnockout = $("btn-knockout");
const btnClear = $("clear-all");
const btnPublish = $("publish");
const dirtyFlag = $("dirty-flag");

const timerDisplay = $("timer-display");
const timerInput = $("timer-input");
const btnStart = $("btn-start");
const btnPause = $("btn-pause");
const btnReset = $("btn-reset");

// published = state đang trên Display; draft = nháp local (chỉ áp dụng cho round + đội)
let published = defaultState();
let draft = defaultState();

// ============ Arena cards ============
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
    $(`t1-${n}`).addEventListener("input", (e) => updateDraft(n, "team1", e.target.value));
    $(`t2-${n}`).addEventListener("input", (e) => updateDraft(n, "team2", e.target.value));
  });
}

function updateDraft(arena, field, value) {
  if (!draft.arenas[arena]) draft.arenas[arena] = { team1: "", team2: "" };
  draft.arenas[arena][field] = value || "";
  refreshDirty();
}

// ============ Round ============
function setRoundUI(round) {
  draft.round = round;
  btnScoring.classList.toggle("active", round === "scoring");
  btnKnockout.classList.toggle("active", round === "knockout");
  ARENAS.forEach(n => {
    const t2 = $(`t2-${n}`);
    const lbl = document.querySelector(`#arenas .arena[data-arena="${n}"] .lbl-t2`);
    const isScoring = round === "scoring";
    if (t2) {
      t2.disabled = isScoring;
      t2.placeholder = isScoring ? "(không dùng ở vòng tính điểm)" : "Tên đội đối kháng...";
    }
    if (lbl) lbl.style.opacity = isScoring ? .4 : 1;
  });
}

btnScoring.addEventListener("click", () => { setRoundUI("scoring"); refreshDirty(); });
btnKnockout.addEventListener("click", () => { setRoundUI("knockout"); refreshDirty(); });

btnClear.addEventListener("click", () => {
  if (!confirm("Xoá toàn bộ tên đội (chỉ ở nháp, chưa đẩy)?")) return;
  ARENAS.forEach(n => { draft.arenas[n] = { team1: "", team2: "" }; });
  renderInputsFromDraft();
  refreshDirty();
});

// ============ Publish (đội + vòng) ============
btnPublish.addEventListener("click", async () => {
  btnPublish.disabled = true;
  const prev = btnPublish.textContent;
  btnPublish.textContent = "Đang đẩy…";
  try {
    // Giữ nguyên timer đang chạy, chỉ ghi đè round + arenas
    const next = { ...published, round: draft.round, arenas: draft.arenas };
    await writeState(next);
    published = JSON.parse(JSON.stringify(next));
    refreshDirty();
    setStatus("online", "Đã đẩy lên màn hình");
  } catch (e) {
    console.error(e);
    setStatus("offline", "Đẩy thất bại");
    btnPublish.disabled = false;
  } finally {
    btnPublish.textContent = prev;
  }
});

function isDirty() {
  return draft.round !== published.round
      || JSON.stringify(draft.arenas) !== JSON.stringify(published.arenas);
}
function refreshDirty() {
  const dirty = isDirty();
  btnPublish.disabled = !dirty;
  dirtyFlag.classList.toggle("hidden", !dirty);
  ARENAS.forEach(n => {
    const card = document.querySelector(`.arena[data-arena="${n}"]`);
    if (!card) return;
    const d = draft.arenas[n] || {};
    const p = published.arenas[n] || {};
    const arenaDirty = (d.team1 || "") !== (p.team1 || "") || (d.team2 || "") !== (p.team2 || "");
    card.classList.toggle("dirty", arenaDirty);
  });
}

function renderInputsFromDraft() {
  ARENAS.forEach(n => {
    const a = draft.arenas[n] || { team1: "", team2: "" };
    const t1 = $(`t1-${n}`); const t2 = $(`t2-${n}`);
    if (t1 && document.activeElement !== t1) t1.value = a.team1 || "";
    if (t2 && document.activeElement !== t2) t2.value = a.team2 || "";
  });
}

// ============ Timer (push tức thì) ============
async function pushTimer(timer) {
  try {
    const next = { ...published, timer };
    await writeState(next);
    published = JSON.parse(JSON.stringify(next));
    renderTimer();
  } catch (e) {
    console.error(e);
    setStatus("offline", "Lỗi đẩy timer");
  }
}

btnStart.addEventListener("click", () => {
  const t = published.timer || defaultState().timer;
  const remaining = t.running
    ? getTimerRemaining(t)
    : (t.pausedRemaining || t.duration || 0);
  if (remaining <= 0) return;
  pushTimer({
    duration: t.duration || remaining,
    endsAt: new Date(Date.now() + remaining * 1000).toISOString(),
    pausedRemaining: remaining,
    running: true
  });
});

btnPause.addEventListener("click", () => {
  const t = published.timer || defaultState().timer;
  const remaining = getTimerRemaining(t);
  pushTimer({
    duration: t.duration,
    endsAt: null,
    pausedRemaining: remaining,
    running: false
  });
});

btnReset.addEventListener("click", () => {
  const setSecs = parseMMSS(timerInput.value) || (published.timer?.duration || 180);
  pushTimer({
    duration: setSecs,
    endsAt: null,
    pausedRemaining: setSecs,
    running: false
  });
});

// Khi sửa input mm:ss → cập nhật duration (nhưng không bắt đầu)
timerInput.addEventListener("change", () => {
  const secs = parseMMSS(timerInput.value);
  if (secs <= 0) {
    timerInput.value = formatMMSS(published.timer?.duration || 180);
    return;
  }
  timerInput.value = formatMMSS(secs);
  // Nếu đang không chạy → đồng bộ luôn giá trị mới
  if (!published.timer?.running) {
    pushTimer({
      duration: secs, endsAt: null, pausedRemaining: secs, running: false
    });
  }
});

function renderTimer() {
  const t = published.timer || defaultState().timer;
  const rem = getTimerRemaining(t);
  timerDisplay.textContent = formatMMSS(rem);
  timerDisplay.classList.toggle("running", t.running);
  timerDisplay.classList.toggle("ended", rem <= 0 && !t.running && t.pausedRemaining === 0);

  btnStart.disabled = t.running || rem <= 0;
  btnPause.disabled = !t.running;
  // Đồng bộ ô input theo duration đã set
  if (document.activeElement !== timerInput) {
    timerInput.value = formatMMSS(t.duration || 0);
  }
}

// Tick mỗi 250ms để timer-display ở admin chạy mượt
setInterval(renderTimer, 250);

// ============ Boot ============
function setStatus(cls, text) {
  statusEl.className = "status " + cls;
  statusEl.textContent = text;
}

async function boot() {
  buildCards();
  try {
    const { state } = await fetchState();
    published = state;
    draft = JSON.parse(JSON.stringify(published));
    setRoundUI(draft.round || "scoring");
    renderInputsFromDraft();
    renderTimer();
    refreshDirty();
    setStatus("online", "Đã kết nối");
  } catch (e) {
    console.error(e);
    setStatus("offline", "Không tải được dữ liệu");
    return;
  }

  subscribeState(
    (next) => {
      const wasDirty = isDirty();
      published = next;
      if (!wasDirty) {
        draft = JSON.parse(JSON.stringify(next));
        setRoundUI(draft.round || "scoring");
        renderInputsFromDraft();
      }
      renderTimer();
      refreshDirty();
    },
    (mode, text) => {
      if (mode === "offline") setStatus("offline", "offline");
      else setStatus("online", text);
    }
  );
}

boot();
