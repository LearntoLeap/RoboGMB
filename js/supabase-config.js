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
//    alter publication supabase_realtime add table competition;
//
// 2) Database → Replication → bật "Realtime" cho bảng `competition` (nếu chưa).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = "https://ddjujhydpvnsnckwnmyf.supabase.co";
const SUPABASE_KEY = "sb_publishable_MXf0XLXa51K7Ex_vUTagYg_XjPeRIFK";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
});

export const ROW_ID = 1;

export async function fetchState() {
  const { data, error } = await supabase
    .from("competition")
    .select("data")
    .eq("id", ROW_ID)
    .single();
  if (error) throw error;
  return data?.data || defaultState();
}

export async function writeState(state) {
  const { error } = await supabase
    .from("competition")
    .update({ data: state, updated_at: new Date().toISOString() })
    .eq("id", ROW_ID);
  if (error) throw error;
}

export function subscribeState(onChange) {
  const channel = supabase
    .channel("competition-state")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "competition", filter: `id=eq.${ROW_ID}` },
      (payload) => {
        const next = payload?.new?.data;
        if (next) onChange(next);
      }
    )
    .subscribe();
  return channel;
}

export function defaultState() {
  return {
    round: "scoring",
    arenas: {
      1: { team1: "", team2: "" },
      2: { team1: "", team2: "" },
      3: { team1: "", team2: "" },
      4: { team1: "", team2: "" }
    }
  };
}
