// Import the functions you need from the SDKs you need
// CAMBIAR ESTAS LÍNEAS:
// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getDatabase } from "firebase/database";

// POR ESTAS LÍNEAS CON LAS URLs DEL CDN:
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Tu configuración existente
const firebaseConfig = {
  apiKey: "AIzaSyC0zsLLOXJ3atSBqHeQaACT3hrpabXC9CM",
  authDomain: "logincorreo-9d4c9.firebaseapp.com",
  databaseURL: "https://logincorreo-9d4c9-default-rtdb.firebaseio.com",
  projectId: "logincorreo-9d4c9",
  storageBucket: "logincorreo-9d4c9.firebasestorage.app",
  messagingSenderId: "202517555750",
  appId: "1:202517555750:web:33a83f04a3ab94497014e7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { auth, db };
