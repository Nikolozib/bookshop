import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyArs84l7Dl2AF4GE_i4bXzF4mfLZw3xrTA",
  authDomain: "book-de67c.firebaseapp.com",
  projectId: "book-de67c",
  storageBucket: "book-de67c.firebasestorage.app",
  messagingSenderId: "82514748330",
  appId: "1:82514748330:web:68b59e4bf76ddd651401d3",
  measurementId: "G-F81XRG4K3F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
