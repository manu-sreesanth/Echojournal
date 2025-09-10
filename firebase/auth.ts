import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  reload,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

// 🔐 Sign up with email & password + send verification email
export const signUp = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await sendEmailVerification(user);
    

    return user;
  } catch (error) {
    console.error('Signup Error:', error);
    throw error;
  }
};

// 🔓 Log in with email & password + Remember Me support
export const logIn = async (
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<User> => {
  try {
    // Set persistence
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create session cookie
    const idToken = await user.getIdToken();
    await fetch('/api/sessionLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    return user;
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
  }
};

// 🔐 Google sign-in + Remember Me support
export const signInWithGoogle = async (
  rememberMe: boolean = false
): Promise<User> => {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

  

    const idToken = await user.getIdToken();
    await fetch('/api/sessionLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    return user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

// 📧 Forgot password
export const forgotPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Forgot Password Error:', error);
    throw error;
  }
};

// 🚪 Log out and clear session cookie
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
    await fetch('/api/sessionLogout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
};

// ✅ Check if current user's email is verified
export const isEmailVerified = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    await reload(user);
    return user.emailVerified;
  } catch (error) {
    console.error('Verification Check Error:', error);
    return false;
  }
};





