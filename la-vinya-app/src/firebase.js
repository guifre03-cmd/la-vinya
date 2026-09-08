// Configuració de Firebase — substitueix aquests valors pels de LA TEVA app de Firebase.
// Els trobaràs a: Firebase Console > Configuració del projecte > Les teves apps > (icona web) </>
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJ8IbcRnXTw5t389ipyxpocY2N621vlr8",
  authDomain: "la-vinya-4cad8.firebaseapp.com",
  projectId: "la-vinya-4cad8",
  storageBucket: "la-vinya-4cad8.firebasestorage.app",
  messagingSenderId: "776585108740",
  appId: "1:776585108740:web:ca08e06eea475307e6c451",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
