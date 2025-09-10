'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/firebaseConfig';
import {
  sendEmailVerification,
  signOut,
  reload,
  onAuthStateChanged,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

export default function VerifyPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // 🧠 Send verification email with proper error handling
  const sendVerificationEmailSafe = async (user: typeof auth.currentUser) => {
    if (!user) return;

    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent! Please check your inbox.');
      setMessageType('success');
      setCooldown(30); // prevent spamming
    } catch (err) {
      console.error('Error sending verification email:', err);

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/too-many-requests':
            // Firebase still sometimes sends the email — don’t scare the user
            setMessage(
              'Verification email already sent. Please wait a bit before resending.'
            );
            setMessageType('success');
            setCooldown(60);
            return;

          case 'auth/network-request-failed':
            setMessage('Network error. Please check your connection.');
            break;

          default:
            setMessage('Something went wrong. Try again later.');
        }
      } else {
        setMessage('Unexpected error occurred.');
      }
      setMessageType('error');
    }
  };

  // 👀 Watch for auth state + send first email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (user.emailVerified) {
        router.push('/onboarding/goals');
        return;
      }

      setEmail(user.email ?? '');
      await sendVerificationEmailSafe(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 🔁 Poll to auto-redirect once verified
  useEffect(() => {
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (!user) return;

      await reload(user);
      if (user.emailVerified) {
        clearInterval(interval);
        router.push('/onboarding/goals');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  // ⏳ Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // ✉️ Manual resend
  const handleResend = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setResending(true);
    await sendVerificationEmailSafe(user);
    setResending(false);
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <main className="max-w-md mx-auto py-20 px-4 text-center">
        <p>Loading your account...</p>
      </main>
    );
  }

  return (
    <main className="gradient-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating shapes */}
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      {/* Main glass card */}
      <div className="glass-effect rounded-2xl p-8 w-full max-w-md relative z-10 text-center">
        {/* Icon + Heading */}
        <div className="mb-8">
          <div className="text-6xl mb-4 pulse-animation">📧</div>
          <h1 className="text-2xl font-bold text-white mb-6">
            Verify Your Email
          </h1>
        </div>

        {/* Info notification box */}
        <div className="notification-box text-yellow-100 text-sm p-4 rounded-lg mb-6">
          <p>
            We’ve sent a verification email to{' '}
            <strong className="text-yellow-300">{email}</strong>.
          </p>
          <p className="mt-2">
            Once you verify, we’ll move you forward automatically.
          </p>
        </div>

        {/* Status message */}
        {message && (
          <div className="mb-6">
            <p
              className={`text-sm text-center ${
                messageType === 'success' ? 'text-green-300' : 'text-red-300'
              }`}
            >
              {message}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className={`resend-btn w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:bg-white/95 disabled:opacity-50 disabled:cursor-not-allowed ${
              resending || cooldown > 0
                ? 'bg-white text-purple-700 opacity-50'
                : 'bg-white text-purple-700'
            }`}
          >
            {resending
              ? 'Resending...'
              : cooldown > 0
              ? `Wait ${cooldown}s to resend`
              : 'Resend verification email'}
          </button>

          <button
            onClick={handleLogout}
            className="cancel-btn w-full bg-white/10 border border-white/30 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:bg-white/20"
          >
            Cancel & Log Out
          </button>
        </div>

        {/* Footer tip */}
        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            Check your spam folder if you don’t see the email
          </p>
        </div>
      </div>
    </main>
  );
}




