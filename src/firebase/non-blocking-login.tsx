'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch((error) => {
    console.error("Anonymous Sign-In Error:", error.code, error.message);
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch((error) => {
    console.error("Email Sign-Up Error:", error.code, error.message);
  });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch((error) => {
    console.error("Email Sign-In Error:", error.code, error.message);
  });
}

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  // We use popup for Google sign-in.
  signInWithPopup(authInstance, provider).catch((error) => {
    // This will catch common errors like auth/operation-not-allowed or auth/unauthorized-domain
    console.error("Google Sign-In Error:", error.code, error.message);
    
    if (error.code === 'auth/unauthorized-domain') {
      alert("This domain is not authorized for Google Sign-In. Please add it to your Firebase Console 'Authorized domains' list in Authentication > Settings.");
    } else if (error.code === 'auth/operation-not-allowed') {
      alert("Google Sign-In is not enabled in your Firebase Console. Please enable it in the Authentication > Sign-in method tab.");
    } else {
      alert(`Sign-in error: ${error.message}`);
    }
  });
}
