import { initializeApp, getApps } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyXXXX",
  authDomain: "studio-2645965705-c0aaa.firebaseapp.com",
  projectId: "studio-2645965705-c0aaa",
  appId: "1:543137308160:web:XXXX",
  messagingSenderId: "543137308160"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
