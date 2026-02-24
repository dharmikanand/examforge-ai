import { initializeApp, getApps } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyAQ0Jtbx1eedNAz71nASbSbtOuG6PsquqA",
  authDomain: "studio-2645965705-c0aaa.firebaseapp.com",
  projectId: "studio-2645965705-c0aaa",
  storageBucket: "studio-2645965705-c0aaa.firebasestorage.app",
  messagingSenderId: "543137308160",
  appId: "1:543137308160:web:da3b5045ee9ae592e102e5"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
