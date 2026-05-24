// ============================================================
// Lịch thi đấu — 13 vòng × 4 sa bàn
// Sửa file này nếu cần đổi danh sách đội.
// ============================================================
export const SCHEDULE = {
  1: [
    "XUÂN ĐỈNH 1", "XUÂN ĐỈNH 2", "XUÂN ĐỈNH 3", "XUÂN ĐỈNH 4",
    "XUÂN ĐỈNH 5", "XUÂN ĐỈNH 6",
    "VĨNH HƯNG 1", "VĨNH HƯNG 2", "VĨNH HƯNG 3", "VĨNH HƯNG 4",
    "VĨNH HƯNG 5", "VĨNH HƯNG 6",
    "TÂN MAI 1"
  ],
  2: [
    "TÂN MAI 2", "TÂN MAI 3", "TÂN MAI 4",
    "TRẦN PHÚ 1", "TRẦN PHÚ 2", "TRẦN PHÚ 3",
    "YÊN SỞ 1", "YÊN SỞ 2",
    "TECHDREAMHUNTER", "TDH SPARKS",
    "LẠNG SƠN", "DỊCH VỌNG",
    "MỄ TRÌ 1"
  ],
  3: [
    "MỄ TRÌ 2", "MỄ TRÌ 3", "MỄ TRÌ 4", "MỄ TRÌ 5",
    "BẮC TỪ LIÊM 1", "BẮC TỪ LIÊM 2", "BẮC TỪ LIÊM 3",
    "NHA TRANG 1", "NHA TRANG 2",
    "QT PRIME ALPHA", "QT PRIME BETA",
    "NGUYÊN VIỆT XUÂN 1", "NGUYÊN VIỆT XUÂN 2"
  ],
  4: [
    "THANH TRÌ 1", "THANH TRÌ 2", "THANH TRÌ 3", "THANH TRÌ 4",
    "CHU VĂN AN 1", "CHU VĂN AN 2", "CHU VĂN AN 3", "CHU VĂN AN 4", "CHU VĂN AN 5",
    "THCS TIÊN THÀNH",
    "", "", ""  // 3 vòng nghỉ
  ]
};

export function getTeams(arenaNo) {
  return SCHEDULE[arenaNo] || [];
}

export function isRest(name) {
  return !name || !name.trim();
}

// ============================================================
// 16 đội vượt qua vòng tính điểm → vào vòng Đối kháng
// (Top 4 từ mỗi bảng)
// ============================================================
export const KNOCKOUT_TEAMS = [
  // Bảng 1
  "THANH TRÌ 3", "QT PRIME ALPHA", "NGUYÊN VIỆT XUÂN 2", "VĨNH HƯNG 5",
  // Bảng 2
  "NHA TRANG 2", "CHU VĂN AN 1", "NGUYÊN VIỆT XUÂN 1", "TÂN MAI 2",
  // Bảng 3
  "NHA TRANG 1", "QT PRIME BETA", "CHU VĂN AN 3", "THANH TRÌ 4",
  // Bảng 4
  "XUÂN ĐỈNH 3", "VĨNH HƯNG 2", "DỊCH VỌNG", "CHU VĂN AN 2"
];

