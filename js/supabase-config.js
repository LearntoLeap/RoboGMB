// ============================================================
// Supabase configuration
// ------------------------------------------------------------
// Setup 1 lần trên https://supabase.com/dashboard:
//
// 1) SQL Editor → Run SQL sau:
//
//    create table if not exists competition (
//      id int primary key,
//      data jsonb not null default '{}'::jsonb,
//      updated_at timestamptz default now()
//    );
//
//    insert into competition (id, data) values (
//      1,
//      '{"round":"scoring","arenas":{"1":{"team1":"","team2":""},"2":{"team1":"","team2":""},"3":{"team1":"","team2":""},"4":{"team1":"","team2":""}}}'::jsonb
//    ) on conflict (id) do nothing;
//
//    alter table competition enable row level security;
//
//    drop policy if exists "anon read"  on competition;
//    drop policy if exists "anon write" on competition;
//    create policy "anon read"  on competition for select using (true);
//    create policy "anon write" on competition for update using (true) with check (true);
//
//    do $$ begin
//      alter publication supabase_realtime add table competition;
//    exception when duplicate_object then null; end $$;
//
// 2) Database → Replication → bật "Realtime" cho bảng `competition` (nếu chưa).
//    (Nếu không bật Realtime cũng OK — code có polling fallback 1.5s.)
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const SUPABASE_URL = "https://ddjujhydpvnsnckwnmyf.supabase.co";
const SUPABASE_KEY = "sb_publishable_MXf0XLXa51K7Ex_vUTagYg_XjPeRIFK";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
});

export const ROW_ID = 1;

export async function fetchState() {
  const { data, error } = await supabase
    .from("competition")
    .select("data, updated_at")
    .eq("id", ROW_ID)
    .single();
  if (error) throw error;
  return { state: data?.data || defaultState(), updatedAt: data?.updated_at || null };
}

export async function writeState(state) {
  const { error } = await supabase
    .from("competition")
    .update({ data: state, updated_at: new Date().toISOString() })
    .eq("id", ROW_ID);
  if (error) throw error;
}

// Subscribe via Realtime + polling fallback (1.5s).
// onChange(state) fires whenever state actually changes.
// onStatus("realtime" | "polling" | "offline", text) for UI badge.
export function subscribeState(onChange, onStatus = () => {}) {
  let lastUpdatedAt = null;
  let lastStateStr = "";

  function emit(state, updatedAt) {
    const s = JSON.stringify(state);
    if (s === lastStateStr) return;
    lastStateStr = s;
    lastUpdatedAt = updatedAt;
    onChange(state);
  }

  // ---- Realtime
  let realtimeOk = false;
  const channel = supabase
    .channel("competition-state-" + Math.random().toString(36).slice(2))
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "competition", filter: `id=eq.${ROW_ID}` },
      (payload) => {
        const next = payload?.new?.data;
        const at = payload?.new?.updated_at;
        if (next) emit(next, at);
      }
    )
    .subscribe((status) => {
      console.log("[supabase] channel status:", status);
      if (status === "SUBSCRIBED") {
        realtimeOk = true;
        onStatus("realtime", "● realtime");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        realtimeOk = false;
        onStatus("polling", "● polling");
      }
    });

  // ---- Polling fallback: always run, cheap (one row).
  // If realtime is working, polling will be silent (no diff). If not, this saves us.
  const pollTimer = setInterval(async () => {
    try {
      const { state, updatedAt } = await fetchState();
      if (updatedAt && updatedAt !== lastUpdatedAt) {
        emit(state, updatedAt);
      } else if (!lastUpdatedAt) {
        // first poll establishes baseline if realtime hasn't fired yet
        emit(state, updatedAt);
      }
      if (!realtimeOk) onStatus("polling", "● polling");
    } catch (e) {
      console.warn("[supabase] poll error:", e?.message || e);
      onStatus("offline", "offline");
    }
  }, 1500);

  return {
    unsubscribe() {
      clearInterval(pollTimer);
      supabase.removeChannel(channel);
    }
  };
}

export function defaultState() {
  return {
    round: "scoring",
    arenas: {
      1: { team1: "", team2: "" },
      2: { team1: "", team2: "" },
      3: { team1: "", team2: "" },
      4: { team1: "", team2: "" }
    },
    timer: {
      duration: 180,         // tổng giây ban đầu (vd 03:00)
      endsAt: null,          // ISO string khi đang chạy
      pausedRemaining: 180,  // giây còn lại lúc tạm dừng
      running: false
    }
  };
}

export function getTimerRemaining(timer) {
  if (!timer) return 0;
  if (timer.running && timer.endsAt) {
    const ms = new Date(timer.endsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
  }
  return Math.max(0, timer.pausedRemaining || 0);
}

export function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function parseMMSS(str) {
  if (!str) return 0;
  const m = String(str).match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}
