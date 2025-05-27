import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASHmfbPb4d468nZPsh_g-VUZJozxNFpBs",
  authDomain: "gam-faltas.firebaseapp.com",
  projectId: "gam-faltas",
  storageBucket: "gam-faltas.firebasestorage.app",
  messagingSenderId: "1057637671098",
  appId: "1:1057637671098:web:f6579fed0bce694f022283",
  measurementId: "G-C2XCWCD1DM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
