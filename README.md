# RoboGMB · Competition Display

Hệ thống hiển thị trận đấu cho cuộc thi 2 vòng (vòng tính điểm + vòng đối kháng), gồm:

- **1 trang Admin** (`input.html`): nhập tên đội cho 4 sa bàn, chọn vòng đấu.
- **4 trang Display** (`display.html?arena=1..4`): mở trên mỗi thiết bị tại từng sa bàn, tự động hiển thị tên đội theo realtime.

Đồng bộ qua **Firebase Realtime Database**. Toàn bộ frontend là tĩnh, deploy trên **GitHub Pages**.

---

## 1. Cấu hình Firebase (5 phút)

1. Truy cập <https://console.firebase.google.com> → **Add project** (tắt Google Analytics nếu muốn).
2. Trong project, vào **Build → Realtime Database → Create database**.
   - Chọn location gần nhất (Singapore).
   - Chọn **Start in test mode** (đủ dùng cho cuộc thi vài giờ).
3. Vào **Project settings (bánh răng) → General → Your apps → Add app → Web (`</>`)**, đặt tên, **Register app**.
4. Copy đoạn `firebaseConfig` Firebase đưa ra.
5. Mở [`js/firebase-config.js`](js/firebase-config.js) và dán đè vào object `firebaseConfig`.
6. (Khuyến nghị) Vào **Realtime Database → Rules**, dán:
   ```json
   {
     "rules": {
       "competition": { ".read": true, ".write": true }
     }
   }
   ```
   → **Publish**.

> ⚠️ Sau cuộc thi nên xoá database hoặc đặt lại rules về `.read/.write: false`.

---

## 2. Chạy local

Vì dùng ES modules, mở bằng `file://` sẽ lỗi CORS. Chạy server tĩnh đơn giản:

```bash
# Python 3
python -m http.server 8080
# hoặc Node
npx serve .
```

Sau đó mở:
- Admin: <http://localhost:8080/input.html>
- Display: <http://localhost:8080/display.html?arena=1>

---

## 3. Deploy GitHub Pages

Repo: `LearntoLeap/RoboGMB`

```bash
git init
git add .
git commit -m "Initial competition display"
git branch -M main
git remote add origin https://github.com/LearntoLeap/RoboGMB.git
git push -u origin main
```

Bật Pages: **Repo Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.

Sau 1-2 phút, app sẵn sàng tại:
- `https://learntoleap.github.io/RoboGMB/`
- Admin: `https://learntoleap.github.io/RoboGMB/input.html`
- Display sa bàn 1: `https://learntoleap.github.io/RoboGMB/display.html?arena=1`
- Display sa bàn 2..4: đổi `?arena=2`, `?arena=3`, `?arena=4`.

---

## 4. Cách dùng trong cuộc thi

1. Máy ban tổ chức → mở `input.html`.
2. 4 thiết bị tại 4 sa bàn → mỗi máy mở `display.html?arena=N` tương ứng.
3. Chọn **Vòng tính điểm** hoặc **Vòng đối kháng** ở Admin → áp dụng đồng thời cho cả 4 màn hình.
4. Gõ tên đội vào ô tương ứng — màn hình sa bàn cập nhật trong < 1 giây.

- Vòng tính điểm: hiển thị 1 tên đội (lớn, ở giữa).
- Vòng đối kháng: hiển thị 2 đội với chữ **VS** ở giữa.

---

## 5. Cấu trúc dự án

```
.
├── index.html              # Trang chủ chọn vai trò
├── input.html              # Admin nhập đội
├── display.html            # Hiển thị sa bàn (?arena=1..4)
├── css/style.css           # Theme trắng + tím
└── js/
    ├── firebase-config.js  # Cấu hình Firebase (cần điền)
    ├── input.js            # Logic admin
    └── display.js          # Logic display
```
