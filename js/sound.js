// ============================================================
// sound.js — Âm thanh sinh tổng hợp (Web Audio API).
// Không cần file mp3, hoạt động offline.
// ============================================================

let ctx = null;
let muted = localStorage.getItem("sound-muted") === "1";

function getCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { console.warn("[sound] AudioContext not available"); return null; }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function beep({ freq = 800, duration = 0.15, type = "sine", volume = 0.25,
                attack = 0.005, release = 0.04, delay = 0 } = {}) {
  if (muted) return;
  const ac = getCtx(); if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain); gain.connect(ac.destination);
  const t0 = ac.currentTime + delay;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + attack);
  gain.gain.linearRampToValueAtTime(0, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + release);
}

function sweep({ from = 400, to = 800, duration = 0.3, type = "sine", volume = 0.25, delay = 0 } = {}) {
  if (muted) return;
  const ac = getCtx(); if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.connect(gain); gain.connect(ac.destination);
  const t0 = ac.currentTime + delay;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + duration);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.linearRampToValueAtTime(0, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

// ===== Public API =====

// Tiếng bắt đầu: 3 nốt đi lên (C5 → E5 → G5) — vui tươi
export function soundStart() {
  beep({ freq: 523, duration: 0.12, volume: 0.22, delay: 0    });
  beep({ freq: 659, duration: 0.12, volume: 0.22, delay: 0.10 });
  beep({ freq: 784, duration: 0.22, volume: 0.25, delay: 0.20 });
}

// Tiếng dừng giữa chừng: 2 nốt đi xuống (mềm)
export function soundStop() {
  beep({ freq: 440, duration: 0.18, type: "triangle", volume: 0.22, delay: 0    });
  beep({ freq: 294, duration: 0.30, type: "triangle", volume: 0.22, delay: 0.15 });
}

// Tiếng hết giờ: còi mạnh
export function soundFinalBuzzer() {
  sweep({ from: 880, to: 220, duration: 0.6, type: "sawtooth", volume: 0.25, delay: 0 });
  beep({ freq: 200, duration: 0.5, type: "square", volume: 0.22, delay: 0.55 });
}

// Tick mỗi giây (countdown 5..2)
export function soundTick() {
  beep({ freq: 1000, duration: 0.05, volume: 0.18 });
}

// Reset: blip ngắn
export function soundReset() {
  beep({ freq: 600, duration: 0.05, volume: 0.15, delay: 0    });
  beep({ freq: 400, duration: 0.05, volume: 0.12, delay: 0.05 });
}

// Đội mới được đẩy lên: ding nhẹ
export function soundDing() {
  beep({ freq: 1320, duration: 0.08, type: "sine", volume: 0.18, delay: 0    });
  beep({ freq: 1760, duration: 0.12, type: "sine", volume: 0.15, delay: 0.06 });
}

// ===== Mute control =====
export function isMuted() { return muted; }
export function setMuted(m) {
  muted = !!m;
  localStorage.setItem("sound-muted", muted ? "1" : "0");
}
export function toggleMute() { setMuted(!muted); return muted; }
