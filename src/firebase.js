import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDimPLQ6SlmlG_WO8vaxZw9RbB-VS9R6z0",
  authDomain: "global-lost-and-found.firebaseapp.com",
  projectId: "global-lost-and-found",
  storageBucket: "global-lost-and-found.appspot.com",
  messagingSenderId: "1040378089270",
  appId: "1:1040378089270:web:88cbbafdd739b171c6d97",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
