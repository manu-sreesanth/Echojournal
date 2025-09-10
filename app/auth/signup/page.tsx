'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signInWithGoogle } from '@/firebase/auth';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: 'Weak' });

  const evaluatePassword = (value: string) => {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    let label = 'Weak';
    if (score === 2) label = 'Fair';
    if (score === 3) label = 'Good';
    if (score >= 4) label = 'Strong';

    setStrength({ score, label });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await signUp(email, password);
      console.log('User signed up:', user.uid);

      // Redirect based on verification status
      if (user.emailVerified) {
        router.push('/onboarding/goals'); // if already verified (unlikely but safe check)
      } else {
        router.push('/auth/verify');
      }
    } catch (err: unknown) {
      setLoading(false);

      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'auth/email-already-in-use'
      ) {
        setError('Email already exists. Redirecting to login...');
        setTimeout(() => {
          router.push(`/auth/login?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const user = await signInWithGoogle(); // this already sets the session!
      console.log('Google user signed in:', user.uid);

      router.push('/onboarding/goals');
    } catch (err) {
      setLoading(false);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during Google sign-in');
      }
    }
  };

return (
  <main
    className={`${inter.className} gradient-bg min-h-screen flex items-center justify-center p-4 relative`}
  >
    {/* Floating shapes */}
    <div className="floating-shapes">
      <div className="shape"></div>
      <div className="shape"></div>
      <div className="shape"></div>
    </div>

    {/* Card */}
    <div className="glass-effect rounded-2xl p-8 w-full max-w-md relative z-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-white/80">Join us and start your journey today</p>
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSignUp} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Email Address
          </label>
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
          <label className="block text-sm font-medium text-white/90 mb-2">
            Password
          </label>
          <input
            type="password"
            placeholder="Create a password"
            className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              evaluatePassword(e.target.value);
            }}
            required
          />

          {/* Password strength meter */}
          {password && (
            <div className="mt-2">
              <div className="h-2 w-full bg-white/20 rounded">
                <div
                  className={`h-2 rounded transition-all duration-300 ${
                    strength.score === 1
                      ? 'bg-red-400'
                      : strength.score === 2
                      ? 'bg-yellow-400'
                      : strength.score === 3
                      ? 'bg-blue-400'
                      : strength.score >= 4
                      ? 'bg-green-400'
                      : 'bg-transparent'
                  }`}
                  style={{
                    width: `${(strength.score / 4) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm mt-1 text-white/80">
                Strength: <span className="font-semibold">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          className={`signup-btn w-full bg-white text-purple-800 font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:bg-white/95 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-white/20"></div>
        <span className="px-4 text-white/70 text-sm">or</span>
        <div className="flex-1 border-t border-white/20"></div>
      </div>

      {/* Google Signup */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={`google-btn w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 hover:bg-gray-50 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
        <span>Continue with Google</span>
      </button>

      {/* Sign in link */}
      <p className="text-center text-white/70 text-sm mt-6">
        Already have an account?{' '}
        <a
          href="/auth/login"
          className="text-white font-medium hover:underline"
        >
          Sign in
        </a>
      </p>
    </div>
  </main>
);
}





