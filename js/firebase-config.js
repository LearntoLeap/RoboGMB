// ============================================================
// Firebase configuration
// ------------------------------------------------------------
// 1) Tạo project tại https://console.firebase.google.com
// 2) Vào Build → Realtime Database → Create database (test mode)
// 3) Project settings (bánh răng) → General → "Your apps" →
//    Add app → Web → đặt tên → Register app
// 4) Copy đoạn firebaseConfig và dán đè vào bên dưới.
// 5) (Khuyến nghị) Trong Rules của Realtime DB dán:
//    {
//      "rules": {
//        "competition": { ".read": true, ".write": true }
//      }
//    }
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, onValue, set, update, get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Nếu Realtime Database tạo ở region Singapore (asia-southeast1),
// đổi databaseURL thành:
//   "https://robogmb-default-rtdb.asia-southeast1.firebasedatabase.app"
const firebaseConfig = {
  apiKey: "AIzaSyAhrRa76VKujBVE02o4z1_fUWRoN4jAgyI",
  authDomain: "robogmb.firebaseapp.com",
  databaseURL: "https://robogmb-default-rtdb.firebaseio.com",
  projectId: "robogmb",
  storageBucket: "robogmb.firebasestorage.app",
  messagingSenderId: "101945042924",
  appId: "1:101945042924:web:4e5775cc5833229f7dc2c9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Single shared path for the whole competition state
export const compRef = ref(db, "competition");
export const arenaRef = (n) => ref(db, `competition/arenas/${n}`);
export const roundRef = ref(db, "competition/round");

export { onValue, set, update, get };
