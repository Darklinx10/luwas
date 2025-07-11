// Import firebase the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDLrv_LRMahsiYAja0GrY83ym-EhCGlp48",
    authDomain: "bmis-aa88e.firebaseapp.com",
    projectId: "bmis-aa88e",
    storageBucket: "bmis-aa88e.firebasestorage.app",
    messagingSenderId: "510898786622",
    appId: "1:510898786622:web:b6393f0344d26cfe50dc6f",
    measurementId: "G-GTD4E2VXX1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };