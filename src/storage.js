// Petita capa d'accés a Firestore: cada "clau" és un document dins la col·lecció "la-vinya".
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export async function loadJSON(key, fallback) {
  try {
    const ref = doc(db, "la-vinya", key);
    const snap = await getDoc(ref);
    if (!snap.exists()) return fallback;
    return snap.data().value;
  } catch (e) {
    console.error("Error carregant", key, e);
    return fallback;
  }
}

export async function saveJSON(key, value) {
  try {
    const ref = doc(db, "la-vinya", key);
    await setDoc(ref, { value });
  } catch (e) {
    console.error("Error desant", key, e);
  }
}

export function subscribeJSON(key, fallback, callback) {
  const ref = doc(db, "la-vinya", key);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback(snap.data().value);
    else callback(fallback);
  });
}
