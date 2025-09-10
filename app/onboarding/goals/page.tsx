'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { saveUserProfileAndAgentMemory  } from '@/firebase/firestoreFunctions';
import { UserProfile } from '@/types/UserProfile';
import { Target } from "lucide-react"

export default function GoalsPage() {
  const [goals, setGoals] = useState<string[]>(['']);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const handleGoalChange = (index: number, value: string) => {
    const updatedGoals = [...goals];
    updatedGoals[index] = value;
    setGoals(updatedGoals);
  };

  const addGoalField = () => {
    if (goals.length < 10) setGoals([...goals, '']);
  };

  const removeGoalField = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

 const handleSubmit = async () => {
    if (!userId) return;

    const cleanedGoals = goals.filter((g) => g.trim() !== '');
    if (cleanedGoals.length === 0) return;

    const profileUpdate: Partial<UserProfile> = {
      lifeGoals: cleanedGoals,
    };

    try {
      await saveUserProfileAndAgentMemory(userId, profileUpdate);
      localStorage.setItem('lifeGoals', JSON.stringify(cleanedGoals));
      router.push('/onboarding/details');
    } catch (err) {
      console.error('❌ Error saving goals:', err);
    }
  };

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating shapes */}
      <div className="floating-shapes">
        <div className="shape" />
        <div className="shape" />
        <div className="shape" />
      </div>

      {/* Glass card */}
      <div className="glass-effect rounded-2xl p-8 w-full max-w-2xl relative z-10 shadow-lg">
        
        {/* Progress bar */}
<div className="mb-6">
  <div className="flex justify-between items-center mb-2">
    <span className="text-white/80 text-sm">Step 1 of 3</span>
    <span className="text-white/80 text-sm">33%</span>
  </div>
  <div className="progress-bar">
    <div
      className="progress-fill"
      style={{ width: '33%' }}
    />
  </div>
</div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="mb-4">
  <Target className="mx-auto w-16 h-16 text-white" strokeWidth={2} />
</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Set Your Life Goals
          </h1>
          <p className="text-white/80">
            What do you want to achieve? Add your most important life goals to get started.
          </p>
        </div>

        {/* Goal fields */}
        <div className="space-y-6">
          {goals.map((goal, index) => (
            <div key={index} className="goal-field space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Life Goal {index + 1}
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
                  placeholder="e.g., Learn a new language, Start a business, Travel the world..."
                  value={goal}
                  onChange={(e) => handleGoalChange(index, e.target.value)}
                />
                {index > 0 && (
                  <button
                    type="button"
                    className="remove-btn px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:text-red-300"
                    onClick={() => removeGoalField(index)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add Goal Button */}
          {goals.length < 10 && (
            <button
              type="button"
              onClick={addGoalField}
              className="add-btn w-full bg-white/10 border border-white/30 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-white/20"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>
                Add Another Goal {goals.length > 0 && `(${goals.length}/10)`}
              </span>
            </button>
          )}

          {/* Submit */}
          <div className="pt-4">
            <button
              onClick={handleSubmit}
              disabled={goals.filter(g => g.trim() !== "").length === 0}
    className={`next-btn w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
      goals.filter(g => g.trim() !== "").length === 0
        ? "bg-white/50 text-purple-400 cursor-not-allowed"
        : "bg-white text-purple-700 hover:bg-white/95"
    }`}
  >
              Next Step →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            You can always modify these goals later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}

