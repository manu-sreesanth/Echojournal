'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { Lock } from "lucide-react"
import { Bot } from "lucide-react"
import { Mail } from "lucide-react"
import { Shield } from "lucide-react"
import { PartyPopper } from "lucide-react"
import { Zap } from "lucide-react"
import { saveUserAgreement } from "@/firebase/firestoreFunctions";

export default function UserAgreementPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [agreements, setAgreements] = useState({
    dataCollection: false,
    dataControl: false,
    newsletters: false,
    notifications: false,
    privacy: false,
    terms: false,
    security: false,
    age: false,
  });

  const [checkAllSecurity, setCheckAllSecurity] = useState(false);
  const router = useRouter();

  const requiredKeys = ['dataCollection', 'dataControl', 'privacy', 'terms', 'security', 'age'];

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  // Auto-check security checkboxes when "check all" is clicked
  useEffect(() => {
    setAgreements((prev) => ({
      ...prev,
      privacy: checkAllSecurity,
      terms: checkAllSecurity,
      security: checkAllSecurity,
      age: checkAllSecurity,
    }));
  }, [checkAllSecurity]);

  const handleCheckboxChange = (key: string) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const allRequiredChecked = requiredKeys.every((key) => agreements[key as keyof typeof agreements]);

  const finishButtonText = allRequiredChecked
  ? (
  <span className="inline-flex items-center">
    <PartyPopper className="w-5 h-5 mr-2" />
    Finish Setup
  </span>
) : (
  "Please accept required terms"
)

const handleSubmit = async () => {
  if (!userId) return;
  if (!allRequiredChecked) {
    alert("Please accept all required terms to continue.");
    return;
  }
  try {
    await saveUserAgreement(userId, {
      newsletter: agreements.newsletters,   // ✅ optional
      alerts: agreements.notifications,     // ✅ optional
    });

    router.push("/main");
  } catch (err) {
    console.error("❌ Error saving agreement:", err);
  }
};

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-4 relative font-inter">
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="shape w-20 h-20 top-[20%] left-[10%]" />
        <div className="shape w-32 h-32 top-[60%] right-[10%]" />
        <div className="shape w-16 h-16 bottom-[20%] left-[20%]" />
      </div>

      <div className="glass-effect rounded-2xl p-8 w-full max-w-4xl relative z-10">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm">Step 3 of 3</span>
            <span className="text-white/80 text-sm">100%</span>
          </div>
          <div className="bg-white/20 h-1 rounded-full overflow-hidden">
            <div className="bg-white h-full w-full" />
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="mb-4">
  <Lock className="mx-auto w-16 h-16 text-white" strokeWidth={2} />
</div>
          <h1 className="text-3xl font-bold text-white mb-2">Privacy & Terms</h1>
          <p className="text-white/80">Your privacy and security are our top priorities</p>
        </div>

        {/* Security assurance */}
<div className="security-badge bg-green-900/20 text-green-100 text-sm p-4 rounded-lg mb-6">
  <div className="flex items-start space-x-2">
    <svg
      className="w-5 h-5 mt-0.5 flex-shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
    <div>
      <p className="font-medium mb-1"> Your Data is Secure</p>
      <p>
        We use industry-standard encryption and security measures to protect
        your personal information and journal entries. You have full control
        over your data and can delete it anytime.
      </p>
    </div>
  </div>
</div>


        {/* Example section - Data Collection */}
        <div className="section-glass rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
  <Bot className="w-5 h-5 mr-2 text-white" strokeWidth={2} />
  Data Collection & AI Personalization
</h2>

          <div className="space-y-4">
            <AgreementItem
              id="dataCollection"
              title="Data Collection & AI Processing Agreement"
              description="I agree to allow the app to collect and process my personal information (name, age, location, work details, hobbies, and other provided details) and journal entries to provide personalized AI insights, recommendations, and improve my journaling experience. This data will be used solely for app functionality and AI personalization purposes."
              checked={agreements.dataCollection}
              required
              onChange={() => handleCheckboxChange('dataCollection')}
            />
            <AgreementItem
              id="dataControl"
              title="Data Control & Deletion Rights"
              description="I understand that I have full control over my data and can view, edit, or permanently delete all my personal information and journal entries from the app and database at any time through my profile settings. Upon deletion, all data will be permanently removed from our servers within 30 days."
              checked={agreements.dataControl}
              required
              onChange={() => handleCheckboxChange('dataControl')}
            />
          </div>
        </div>

        {/* Communication Preferences */}
<div className="section-glass rounded-xl p-6 mb-6">
  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
  <Mail className="w-5 h-5 mr-2 text-white" strokeWidth={2} />
  Communication Preferences
</h2>

  <div className="space-y-4">
    {/* Newsletter */}
    <div className="agreement-item p-4 rounded-lg border border-white/10 transition-all duration-200 hover:bg-white/5 hover:shadow-lg hover:scale-[1.01]">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="newsletters"
          name="newsletters"
          className="custom-checkbox mt-1 flex-shrink-0"
          checked={agreements.newsletters}
          onChange={() => handleCheckboxChange('newsletters')}
        />
        <div>
          <label
            htmlFor="newsletters"
            className="text-white font-medium cursor-pointer"
          >
            Newsletter &amp; Updates (Optional)
          </label>
          <p className="text-white/70 text-sm mt-1">
            I would like to receive newsletters, feature updates, and helpful
            journaling tips via email. You can unsubscribe at any time by
            clicking the unsubscribe link in any email or through your profile
            settings.
          </p>
        </div>
      </div>
    </div>

    {/* Notifications */}
    <div className="agreement-item p-4 rounded-lg border border-white/10 transition-all duration-200 hover:bg-white/5 hover:shadow-lg hover:scale-[1.01]">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="notifications"
          name="notifications"
          className="custom-checkbox mt-1 flex-shrink-0"
          checked={agreements.notifications}
          onChange={() => handleCheckboxChange('notifications')}
        />
        <div>
          <label
            htmlFor="notifications"
            className="text-white font-medium cursor-pointer"
          >
            Email Notifications (Optional)
          </label>
          <p className="text-white/70 text-sm mt-1">
            I would like to receive email notifications for important account
            updates, security alerts, and journaling reminders. You can
            customize or disable these notifications in your profile settings.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

{/* Security & Privacy Terms */}
<div className="section-glass rounded-xl p-6">
  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
  <Shield className="w-5 h-5 mr-2 text-white" strokeWidth={2} />
  Security & Privacy Terms
</h2>

  {/* Check All Option */}
  <div className="agreement-item p-4 rounded-lg border-2 border-purple-400/30 bg-purple-500/10 mb-4">
    <div className="flex items-start space-x-3">
      <input
        type="checkbox"
        id="checkAllSecurity"
        className="custom-checkbox mt-1 flex-shrink-0"
        checked={checkAllSecurity}
        onChange={(e) => setCheckAllSecurity(e.target.checked)}
  
        
      />
      <div>
  <label
    htmlFor="checkAllSecurity"
    className="text-white font-semibold cursor-pointer flex items-center"
  >
    <Zap className="w-5 h-5 mr-2 text-white" strokeWidth={2} />
    Check All Security & Privacy Terms
    <span className="ml-2 text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full">
      Convenience
    </span>
  </label>
  <p className="text-white/70 text-sm mt-1">
    Select this to automatically check all required security and privacy
    agreements below for your convenience.
  </p>
</div>
    </div>
  </div>

  <div className="space-y-4">
    {/* Privacy Policy */}
    <div className="agreement-item p-4 rounded-lg border border-white/10 transition-all duration-200 hover:bg-white/5 hover:shadow-lg hover:scale-[1.01]">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="privacy"
          name="privacy"
          className="custom-checkbox mt-1 flex-shrink-0"
          checked={agreements.privacy}
          onChange={() => handleCheckboxChange('privacy')}
      
        />
        <div>
          <label
            htmlFor="privacy"
            className="text-white font-medium cursor-pointer"
          >
            Privacy Policy Agreement
          </label>
          <p className="text-white/70 text-sm mt-1">
            I have read and agree to the Privacy Policy. I understand how my
            data is collected, used, stored, and protected. My personal
            information will never be sold to third parties, and all data is
            encrypted both in transit and at rest using industry-standard
            security measures.
          </p>
        </div>
      </div>
    </div>

    {/* Terms of Service */}
    <div className="agreement-item p-4 rounded-lg border border-white/10 transition-all duration-200 hover:bg-white/5 hover:shadow-lg hover:scale-[1.01]">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="terms"
          name="terms"
          className="custom-checkbox mt-1 flex-shrink-0"
          checked={agreements.terms}
          onChange={() => handleCheckboxChange('terms')}
        
        />
        <div>
          <label
            htmlFor="terms"
            className="text-white font-medium cursor-pointer"
          >
            Terms of Service Agreement
          </label>
          <p className="text-white/70 text-sm mt-1">
            I agree to the Terms of Service and understand the acceptable use
            policies. I will use this app responsibly and in accordance with all
            applicable laws. I understand that violation of terms may result in
            account suspension or termination.
          </p>
        </div>
      </div>
    </div>

    {/* Security Responsibility */}
    <div className="agreement-item p-4 rounded-lg border border-white/10 transition-all duration-200 hover:bg-white/5 hover:shadow-lg hover:scale-[1.01]">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="security"
          name="security"
          className="custom-checkbox mt-1 flex-shrink-0"
          checked={agreements.security}
          onChange={() => handleCheckboxChange('security')}
        
        />
        <div>
          <label
            htmlFor="security"
            className="text-white font-medium cursor-pointer"
          >
            Security & Account Responsibility
          </label>
          <p className="text-white/70 text-sm mt-1">
            I understand that I am responsible for maintaining the security of
            my account credentials. I will use a strong password, enable
            two-factor authentication when available, and immediately report
            any suspicious account activity. I understand that the app uses
            end-to-end encryption for sensitive data.
          </p>
        </div>
      </div>
    </div>

    {/* Age Verification */}
    <div className="agreement-item p-4 rounded-lg border border-white/10 transition-all duration-200 hover:bg-white/5 hover:shadow-lg hover:scale-[1.01]">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="age"
          name="age"
          className="custom-checkbox mt-1 flex-shrink-0"
          checked={agreements.age}
          onChange={() => handleCheckboxChange('age')}
        
        />
        <div>
          <label
            htmlFor="age"
            className="text-white font-medium cursor-pointer"
          >
            Age Verification
          </label>
          <p className="text-white/70 text-sm mt-1">
            I confirm that I am at least 13 years of age (or the minimum age
            required in my jurisdiction) and have the legal capacity to enter
            into this agreement. If I am under 18, I have obtained parental or
            guardian consent to use this service.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

        {/* ...repeat for other sections exactly as in HTML design */}

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="back-btn flex-1 bg-white/10 border border-white/30 text-white font-medium py-3 px-4 rounded-lg hover:bg-white/20"
          >
            ← Back
          </button>
          <button
  type="button"
  onClick={handleSubmit}
  disabled={!allRequiredChecked}
  className={`finish-btn flex-1 font-semibold py-3 px-4 rounded-lg transition-colors ${
    allRequiredChecked
      ? 'bg-white text-purple-700 hover:bg-white/95 cursor-pointer'
      : 'bg-white/50 text-purple-700 cursor-not-allowed'
  }`}
>
  {finishButtonText}
</button>
        </div>
        <p className="text-center mt-6 text-white/70 text-sm">
          By completing setup, you're ready to start your personalized AI journaling journey!
        </p>
        <p className="text-center text-white/70 text-xs mt-2">
          You can review and modify these preferences anytime in your account settings.
        </p>
      </div>
    </div>
  );
}

function AgreementItem({ id, title, description, checked, onChange, required = false }: any) {
  return (
    <div className="agreement-item p-4 rounded-lg border border-white/10 transition-all duration-200 hover:bg-white/5 hover:shadow-lg hover:scale-[1.01]">
      <div className="flex items-start space-x-3">
        <input
          id={id}
          type="checkbox"
          className="custom-checkbox mt-1 flex-shrink-0"
          checked={checked}
          onChange={onChange}
          required={required}
        />
        <div>
          <label htmlFor={id} className="text-white font-medium cursor-pointer">
            {title}
          </label>
          <p className="text-white/70 text-sm mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

