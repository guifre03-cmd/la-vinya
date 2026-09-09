// Capa d'accés a Firestore basada en col·leccions: cada element (record, pla,
// anècdota, perfil, PIN) és el seu propi document independent. Això evita que
// dos membres es trepitgin en escriure alhora, i que un document compartit
// creixi fins a superar el límit de mida de Firestore (1 MB).
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";

export function subscribeCollection(name, callback) {
  return onSnapshot(
    collection(db, name),
    (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      callback(items);
    },
    (err) => console.error(`Error escoltant "${name}"`, err)
  );
}

export async function setItem(collectionName, id, data) {
  try {
    await setDoc(doc(db, collectionName, id), data, { merge: true });
  } catch (e) {
    console.error(`Error desant a "${collectionName}/${id}"`, e);
  }
}

export async function updateItem(collectionName, id, fields) {
  try {
    await updateDoc(doc(db, collectionName, id), fields);
  } catch (e) {
    console.error(`Error actualitzant "${collectionName}/${id}"`, e);
  }
}

export async function deleteItem(collectionName, id) {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (e) {
    console.error(`Error eliminant "${collectionName}/${id}"`, e);
  }
}

export { arrayUnion, arrayRemove };
