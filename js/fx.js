// ============================================================
// fx.js — Hiệu ứng 2D + thông báo cho học sinh
// ============================================================

const $ = (id) => document.getElementById(id);

// ====================== TOAST ======================
const TOAST_ICONS = {
  info: "💡", success: "🎉", warn: "⚠️", danger: "🛑",
  start: "🚀", stop: "🏁", team: "🤖"
};

export function toast(message, type = "info", duration = 3000) {
  const stack = $("toast-stack");
  if (!stack) return;
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || "💡"}</span>
    <span class="toast-msg">${message}</span>
  `;
  stack.appendChild(t);
  // animate in next frame
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    t.classList.add("hide");
    setTimeout(() => t.remove(), 400);
  }, duration);
}

// ====================== SCREEN SHAKE ======================
export function shake(intensity = "md") {
  const root = $("display-root");
  if (!root) return;
  root.classList.remove("shake-sm", "shake-md", "shake-lg");
  root.classList.add(`shake-${intensity}`);
  setTimeout(() => root.classList.remove(`shake-${intensity}`), 600);
}

// ====================== CONFETTI ======================
const CONFETTI_EMOJI = ["🎉", "🎊", "⭐", "🌟", "🤖", "🏆", "✨", "💜"];
const CONFETTI_COLORS = ["#7c3aed", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];

export function confettiBurst(count = 60) {
  const layer = $("confetti-layer");
  if (!layer) return;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    const isEmoji = Math.random() > 0.5;
    if (isEmoji) {
      piece.className = "confetti emoji";
      piece.textContent = CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)];
    } else {
      piece.className = "confetti dot";
      piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    }
    const startX = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 40;
    const dur = 1.8 + Math.random() * 1.6;
    const delay = Math.random() * 0.4;
    const rot = (Math.random() - 0.5) * 720;
    const size = 14 + Math.random() * 18;
    piece.style.left = `${startX}vw`;
    piece.style.fontSize = `${size}px`;
    piece.style.setProperty("--drift", `${drift}vw`);
    piece.style.setProperty("--rot", `${rot}deg`);
    piece.style.animationDuration = `${dur}s`;
    piece.style.animationDelay = `${delay}s`;
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), (dur + delay) * 1000 + 200);
  }
}

// ====================== GLITCH on text element ======================
export function glitch(el, ms = 700) {
  if (!el) return;
  el.classList.add("glitch");
  setTimeout(() => el.classList.remove("glitch"), ms);
}

// ====================== COUNTDOWN 5..1 ======================
export function showCountdownNumber(n) {
  const ov = $("countdown-overlay");
  if (!ov) return;
  // clean previous
  ov.innerHTML = "";
  const span = document.createElement("div");
  span.className = "countdown-num";
  span.textContent = String(n);
  ov.appendChild(span);
  setTimeout(() => span.remove(), 850);
}

// ====================== FLASH overlay (legacy) ======================
export function flashOverlay(cls, html, ms = 900) {
  const fx = $("fx-overlay");
  if (!fx) return;
  fx.className = `fx-overlay show ${cls}`;
  fx.innerHTML = `<div class="fx-content">${html}</div>`;
  clearTimeout(flashOverlay._t);
  flashOverlay._t = setTimeout(() => fx.classList.remove("show"), ms);
}
