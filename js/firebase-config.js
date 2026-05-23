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

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://PASTE_YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "PASTE_YOUR_PROJECT",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxx"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Single shared path for the whole competition state
export const compRef = ref(db, "competition");
export const arenaRef = (n) => ref(db, `competition/arenas/${n}`);
export const roundRef = ref(db, "competition/round");

export { onValue, set, update, get };
