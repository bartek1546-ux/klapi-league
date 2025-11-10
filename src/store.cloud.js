// src/store.cloud.js
import { db } from "./firebase";
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, arrayUnion
} from "firebase/firestore";
import { useEffect, useState } from "react";

/* ---------- helpers ---------- */
const ts = v => (v && v.toMillis ? v.toMillis() : v);

/* ---------- realtime state ---------- */
export function useCloudState() {
  const [state, setState] = useState({ players: [], gps: [], posts: [], logs: [] });

  useEffect(() => {
    const unsubs = [];

    // players
    unsubs.push(onSnapshot(query(collection(db, "players"), orderBy("name", "asc")), snap => {
      setState(s => ({ ...s, players: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
    }));

    // gp/events
    unsubs.push(onSnapshot(collection(db, "gps"), snap => {
      const gps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // spójny typ daty (string YYYY-MM-DD) i wyników (mapa -> tablice liczb)
      gps.forEach(g => { if (g.date && g.date.toDate) g.date = g.date.toDate().toISOString().slice(0,10); });
      setState(s => ({ ...s, gps }));
    }));

    // posts
    unsubs.push(onSnapshot(query(collection(db, "posts"), orderBy("date", "desc")), snap => {
      setState(s => ({
        ...s,
        posts: snap.docs.map(d => {
          const o = { id: d.id, ...d.data() };
          o.date = ts(o.date) ?? Date.now();
          return o;
        })
      }));
    }));

    // logs (opcjonalnie)
    unsubs.push(onSnapshot(query(collection(db, "logs"), orderBy("ts", "desc")), snap => {
      setState(s => ({
        ...s,
        logs: snap.docs.map(d => ({ id: d.id, ...d.data(), ts: ts(d.data().ts) }))
      }));
    }));

    return () => unsubs.forEach(u => u());
  }, []);

  return state;
}

/* ---------- actions (API zgodne z Twoimi mutacjami) ---------- */

// LOG
export async function addLog(type, msg) {
  await addDoc(collection(db, "logs"), { ts: serverTimestamp(), type, msg });
}

// GP planowane
export async function addPlanned(date) {
  await addDoc(collection(db, "gps"), { date, planned: true });
}
export async function editPlanned(id, newDate) {
  await updateDoc(doc(db, "gps", id), { date: newDate });
}
export async function deleteGP(id) {
  await deleteDoc(doc(db, "gps", id));
}

// GP rozegrane
export async function addPlayed(date, results) {
  // Jeśli istnieje plan na tę datę → nadpisz go jako rozegrane, w p.p. dodaj nowe
  const q = query(collection(db, "gps"), where("date", "==", date), where("planned", "==", true));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(doc(db, "gps", snap.docs[0].id), { planned: false, results });
  } else {
    await addDoc(collection(db, "gps"), { date, planned: false, results });
  }
}
export async function editPlayedDate(id, newDate) {
  await updateDoc(doc(db, "gps", id), { date: newDate });
}
export async function editPlayedResults(id, results) {
  await updateDoc(doc(db, "gps", id), { results, planned: false });
}

// GRACZE
export async function addPlayer({ name, avatar, bio }) {
  const id = name.toLowerCase().replace(/\s+/g, "-");
  await setDoc(doc(db, "players", id), { name, avatar: avatar || "", bio: bio || "" });
}
export async function updatePlayer(player) {
  await updateDoc(doc(db, "players", player.id), {
    name: player.name, avatar: player.avatar || "", bio: player.bio || ""
  });
}
export async function deletePlayer(id) {
  await deleteDoc(doc(db, "players", id));
}

// POSTY
export async function addPost({ title, body, author }) {
  await addDoc(collection(db, "posts"), {
    title, body, author, date: serverTimestamp(), comments: []
  });
}
export async function deletePost(id) {
  await deleteDoc(doc(db, "posts", id));
}
export async function addComment(postId, comment) {
  const ref = doc(db, "posts", postId);
  // serverTimestamp NIE może siedzieć w arrayUnion → używamy Date.now()
  await setDoc(
    ref,
    {
      comments: arrayUnion({
        ...comment,
        ts: Date.now(),          // ✅ zwykły znacznik czasu (liczba)
      }),
      lastCommentAt: serverTimestamp(), // ✅ sentinel poza arrayUnion
    },
    { merge: true }
  );

}
