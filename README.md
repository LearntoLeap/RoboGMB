# RoboGMB · Competition Display

Hệ thống hiển thị trận đấu cho cuộc thi 2 vòng (vòng tính điểm + vòng đối kháng), gồm:

- **1 trang Admin** (`input.html`): nhập tên đội cho 4 sa bàn, chọn vòng đấu.
- **4 trang Display** (`display.html?arena=1..4`): mở trên mỗi thiết bị tại từng sa bàn, tự động hiển thị tên đội realtime.

Đồng bộ qua **Supabase Realtime**. Frontend tĩnh, deploy trên **GitHub Pages**.

---

## 1. Setup Supabase (1 lần — 2 phút)

Vào [Supabase Dashboard](https://supabase.com/dashboard) → project của bạn → **SQL Editor** → **New query** → dán đoạn SQL sau → **Run**:

```sql
create table if not exists competition (
  id int primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

insert into competition (id, data) values (
  1,
  '{"round":"scoring","arenas":{"1":{"team1":"","team2":""},"2":{"team1":"","team2":""},"3":{"team1":"","team2":""},"4":{"team1":"","team2":""}}}'::jsonb
) on conflict (id) do nothing;

alter table competition enable row level security;

drop policy if exists "anon read"  on competition;
drop policy if exists "anon write" on competition;
create policy "anon read"  on competition for select using (true);
create policy "anon write" on competition for update using (true) with check (true);

do $$ begin
  alter publication supabase_realtime add table competition;
exception when duplicate_object then null; end $$;
```

> Sau cuộc thi, có thể đổi policy `using (true)` thành `using (false)` để khoá ghi.

Vào **Database → Replication** → kiểm tra bảng `competition` đã bật **Realtime** (ON). Nếu chưa, bật lên.

Xong. Config đã sẵn trong [`js/supabase-config.js`](js/supabase-config.js).

---

## 2. Chạy local

ES modules cần serve qua HTTP (không mở bằng `file://`):

```bash
python -m http.server 8080
# hoặc:  npx serve .
```

- Admin: <http://localhost:8080/input.html>
- Display: <http://localhost:8080/display.html?arena=1>

---

## 3. Deploy GitHub Pages

Đã deploy tại: **https://learntoleap.github.io/RoboGMB/**

Khi sửa code:
```bash
git add . && git commit -m "update" && git push
```

GitHub Pages tự rebuild sau 30-60s.

---

## 4. Cách dùng trong cuộc thi

| Vai trò | Mở URL |
|---|---|
| Máy ban tổ chức | `https://learntoleap.github.io/RoboGMB/input.html` |
| TV/Máy chiếu sa bàn 1 | `…/display.html?arena=1` |
| TV/Máy chiếu sa bàn 2 | `…/display.html?arena=2` |
| TV/Máy chiếu sa bàn 3 | `…/display.html?arena=3` |
| TV/Máy chiếu sa bàn 4 | `…/display.html?arena=4` |

- Bấm **Vòng tính điểm** → cả 4 màn hiển thị **1 tên đội** (chữ rất lớn).
- Bấm **Vòng đối kháng** → hiển thị **Đội 1 VS Đội 2**.
- Gõ tên ở Admin → màn hình sa bàn cập nhật trong < 1 giây.

---

## 5. Cấu trúc

```
.
├── index.html              # Trang chủ chọn vai trò
├── input.html              # Admin nhập đội
├── display.html            # Hiển thị sa bàn (?arena=1..4)
├── css/style.css           # Theme trắng + tím
└── js/
    ├── supabase-config.js  # Cấu hình + helpers
    ├── input.js            # Logic admin
    └── display.js          # Logic display
```
