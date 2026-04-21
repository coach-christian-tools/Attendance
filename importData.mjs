import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyDwP1QX33FHa44deLDoG_6LZ-gtoYmd83E",
  authDomain: "velocity-attendance.firebaseapp.com",
  projectId: "velocity-attendance",
  storageBucket: "velocity-attendance.firebasestorage.app",
  messagingSenderId: "448467347068",
  appId: "1:448467347068:web:e5c3ba6200454e1f33cbf9",
  measurementId: "G-P2ZH829MWF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const data = JSON.parse(fs.readFileSync('athletes_import.json', 'utf8'));

async function importData() {
  const col = collection(db, 'athletes');
  let count = 0;
  for (const a of data) {
    try {
      await addDoc(col, a);
      count++;
    } catch (e) {
      console.error(e);
    }
  }
  console.log(`Added ${count} athletes!`);
  process.exit(0);
}
importData();
