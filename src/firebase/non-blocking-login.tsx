'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  User,
  UserCredential,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  // Return the promise so the caller can handle errors or completion if needed
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  // Return the promise so the caller can handle errors or completion if needed
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email verification (non-blocking). */
export function initiateEmailVerification(user: User): Promise<void> {
  // Return the promise so the caller can handle errors or completion if needed
  return sendEmailVerification(user);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  // Return the promise so the caller can handle errors or completion if needed
  return signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate password reset email (non-blocking). */
export function initiatePasswordReset(authInstance: Auth, email: string): Promise<void> {
  // Return the promise so the caller can handle errors or completion if needed
  return sendPasswordResetEmail(authInstance, email);
}
