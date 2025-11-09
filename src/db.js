// src/db.js
import { db } from "./firebase";
import {
  collection, addDoc, query, orderBy, limit, where,
  onSnapshot, serverTimestamp
} from "firebase/firestore";

/* -------- POSTS -------- */
export async function addPost({ title, body, author = "admin" }) {
  await addDoc(collection(db, "posts"), {
    title, body, author, created_at: serverTimestamp()
  });
}
export function subPosts(handler, n = 20) {
  const q = query(collection(db, "posts"), orderBy("created_at", "desc"), limit(n));
  return onSnapshot(q, snap => handler(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

/* -------- PLAYERS -------- */
export async function addPlayer({ nickname }) {
  await addDoc(collection(db, "players"), {
    nickname, created_at: serverTimestamp()
  });
}
export function subPlayers(handler) {
  const q = query(collection(db, "players"), orderBy("nickname", "asc"));
  return onSnapshot(q, snap => handler(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

/* -------- EVENTS (GP) -------- */
export async function addEvent({ title, event_date, location }) {
  await addDoc(collection(db, "events"), {
    title, event_date, location, created_at: serverTimestamp()
  });
}
export function subEvents(handler) {
  const q = query(collection(db, "events"), orderBy("event_date", "desc"));
  return onSnapshot(q, snap => handler(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

/* -------- RESULTS -------- */
export async function addResult({ event_id, player_id, points }) {
  await addDoc(collection(db, "results"), {
    event_id, player_id, points: Number(points) || 0, created_at: serverTimestamp()
  });
}
export function subResultsByEvent(event_id, handler) {
  if (!event_id) return () => {};
  const q = query(
    collection(db, "results"),
    where("event_id", "==", event_id),
    orderBy("points", "desc")
  );
  return onSnapshot(q, snap => handler(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}
