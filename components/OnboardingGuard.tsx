// File: /components/OnboardingGuard.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkOnboardingStatus } from '@/lib/checkOnboardingStatus';
import { auth } from '@/firebase/firebaseConfig';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    const runCheck = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          // Not authenticated — allow other auth guards to handle; or redirect to login
          router.replace('/auth/login');
          return;
        }
        const ok = await checkOnboardingStatus(user.uid);
        if (!ok) {
          router.replace('/onboarding/goals');
          return;
        }
      } catch (e) {
        console.error('Onboarding guard error', e);
        router.replace('/auth/login');
      } finally {
        if (mounted) setChecked(true);
      }
    };
    runCheck();
    return () => { mounted = false; };
  }, [router]);

  if (!checked) {
    // optionally show skeleton/loader while checking
    return <div className="min-h-screen flex items-center justify-center">Checking...</div>;
  }

  return <>{children}</>;
}
