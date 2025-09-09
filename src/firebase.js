// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_RrpIdz_bUS3n5NKiZ-E1uu8YfWOP3eo",
  authDomain: "react-todo-app-5c778.firebaseapp.com",
  projectId: "react-todo-app-5c778",
  storageBucket: "react-todo-app-5c778.firebasestorage.app",
  messagingSenderId: "532011472272",
  appId: "1:532011472272:web:c5926cb947b11e5b48cf15",
  measurementId: "G-0M53PB9FTG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
