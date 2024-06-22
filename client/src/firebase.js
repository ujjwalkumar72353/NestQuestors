// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "nestquestors.firebaseapp.com",
  projectId: "nestquestors",
  storageBucket: "nestquestors.appspot.com",
  messagingSenderId: "894302435422",
  appId: "1:894302435422:web:1bc6c44ad47a7b7f529ccf"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);