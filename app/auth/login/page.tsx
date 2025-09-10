

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logIn, signInWithGoogle, forgotPassword } from '@/firebase/auth';
import { checkOnboardingStatus } from '@/lib/checkOnboardingStatus';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState('');

  // 🔐 Email/password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const user = await logIn(email, password, rememberMe);

      if (!user.emailVerified) {
        setError('Please verify your email before continuing.');
        router.push('/auth/verify');
        return;
      }

      const hasCompletedOnboarding = await checkOnboardingStatus(user.uid);
      router.push(hasCompletedOnboarding ? '/main' : '/onboarding/goals');
    } catch (err: unknown) {
      setLoading(false);

      if (err instanceof Error) {
        if (err.message === 'EMAIL_ALREADY_REGISTERED') {
          setError('This email is registered with Google. Please log in using Google.');
          setTimeout(() => router.push(`/auth/login?email=${encodeURIComponent(email)}`), 2000);
        } else {
          setError(err.message);
        }
      } else if (typeof err === 'object' && err !== null && 'code' in err) {
        const code = (err as { code: string }).code;
        switch (code) {
          case 'auth/user-not-found':
            setError('No account found with this email.');
            break;
          case 'auth/wrong-password':
            setError('Incorrect password. Please try again.');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Please try again later.');
            break;
          default:
            setError('Login failed. Please check your credentials.');
            break;
        }
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  // 🔑 Forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password.');
      return;
    }
    try {
      await forgotPassword(email);
      setMessage('Password reset email sent! Check your inbox.');
      setError('');
    } catch {
      setError('Error sending password reset email.');
    }
  };

  // 🔐 Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const user = await signInWithGoogle(rememberMe);

      const hasCompletedOnboarding = await checkOnboardingStatus(user.uid);
      router.push(hasCompletedOnboarding ? '/main' : '/onboarding/goals');
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        if (err.message === 'EMAIL_NOT_REGISTERED_GOOGLE') {
          setError('No account found with this Google email. Please sign up first.');
          setTimeout(() => router.push('/auth/signup'), 2000);
        } else if (err.message === 'EMAIL_ALREADY_REGISTERED') {
          setError('This email is registered with email/password. Please log in using email & password.');
          setTimeout(() => router.push(`/auth/login?email=${encodeURIComponent(email)}`), 2000);
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred during Google sign-in');
      }
    }
  };

  return (
    <main className={`${inter.className} gradient-bg min-h-screen flex items-center justify-center p-4 relative`}>
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      <div className="glass-effect rounded-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/80">Log in to continue your journey</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm text-white/80">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="cursor-pointer"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-white/80 font-medium hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {message && <p className="text-green-400 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`signup-btn w-full bg-white text-purple-800 font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:bg-white/95 cursor-pointer ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="px-4 text-white/70 text-sm">or</span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={`google-btn w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 hover:bg-gray-50 cursor-pointer ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          <span>Log in with Google</span>
        </button>

        <p className="text-center text-white/70 text-sm mt-6">
          Don’t have an account?{' '}
          <a href="/auth/signup" className="text-white font-medium hover:underline cursor-pointer">
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}




