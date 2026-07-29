import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Konfigurasi asli milikmu dari Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAjaLNGg2HECg4iGwoA8IMStx8oEaV1W8s",
  authDomain: "netzach-fc-web.firebaseapp.com",
  projectId: "netzach-fc-web",
  storageBucket: "netzach-fc-web.firebasestorage.app",
  messagingSenderId: "318468545434",
  appId: "1:318468545434:web:4a2cd0c623074bf5427823",
  measurementId: "G-VWYZK289G6",
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Export Firestore & Auth agar bisa dipakai di App.vue
export const db = getFirestore(app);
export const auth = getAuth(app);
