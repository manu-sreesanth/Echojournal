import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAnx1xikqP7fGVyNuuu2MHwYLsXDIUrJqw",
  authDomain: "tomo2-3625a.firebaseapp.com",
  projectId: "tomo2-3625a",
  storageBucket: "tomo2-3625a.firebasestorage.app",
  messagingSenderId: "1096219789551",
  appId: "1:1096219789551:web:8d7fdd44e5df44b1b7b31a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Enable ignoreUndefinedProperties to avoid Firestore errors
const db = getFirestore(app);

export { auth, db };

