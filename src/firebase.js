import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Wklej swój firebaseConfig z konsoli:
const firebaseConfig = {
  apiKey: "AIzaSyDZ7UYS91L54q3Mk3Oe4Ix3ILpr2O9VtC4",
  authDomain: "klapi-league.firebaseapp.com",
  projectId: "klapi-league",
  storageBucket: "klapi-league.firebasestorage.app",
  messagingSenderId: "721066056953",
  appId: "1:721066056953:web:63c1a067abc4b9f3b31628",
  measurementId: "G-QR34XJGM0G"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// bezpieczny login anonimowy + log błędów
const auth = getAuth(app);
onAuthStateChanged(auth, (u) => {
  if (!u) signInAnonymously(auth).catch(e => console.error("Anon login error:", e));
});
