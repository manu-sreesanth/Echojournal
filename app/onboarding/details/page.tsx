"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { saveUserProfileAndAgentMemory } from "@/firebase/firestoreFunctions";
import { User } from "lucide-react"
import { ClipboardList } from "lucide-react"
import { Briefcase } from "lucide-react"
import { UserProfile } from "@/types/UserProfile";

// ---- Types ----
interface PersonalDetails {
  firstName: string;
  lastName: string;
  nickname: string;
  age: string;
  location: string;
  hobbies: string;
  personalContext: string;
}

interface WorkDetails {
  status: keyof typeof FIELD_CONFIGS | "";
  workContext: string;
  dynamic: Record<string, string>;
}

// ---- Field configurations ----
const FIELD_CONFIGS = {
  student: [
    { name: "school", label: "School/University", placeholder: "Name of your educational institution" },
    { name: "major", label: "Major/Field of Study", placeholder: "What are you studying?" },
    { name: "year", label: "Academic Year", placeholder: "Freshman, Sophomore, Junior..." },
    { name: "gpa", label: "GPA (Optional)", placeholder: "Your current GPA" },
  ],
  employed: [
    { name: "company", label: "Company Name", placeholder: "Where do you work?" },
    { name: "position", label: "Job Title", placeholder: "Your current position" },
    { name: "department", label: "Department", placeholder: "Which department/team?" },
    { name: "experience", label: "Years of Experience", placeholder: "How long in this role/field?" },
  ],
  "business-owner": [
    { name: "businessName", label: "Business Name", placeholder: "Name of your business" },
    { name: "businessType", label: "Business Type", placeholder: "What kind of business?" },
    { name: "employees", label: "Number of Employees", placeholder: "How many people work for you?" },
    { name: "founded", label: "Year Founded", placeholder: "When did you start?" },
  ],
  freelancer: [
    { name: "specialization", label: "Specialization", placeholder: "What services do you offer?" },
    { name: "platforms", label: "Main Platforms", placeholder: "Upwork, Fiverr, direct clients..." },
    { name: "experience", label: "Years Freelancing", placeholder: "How long have you been freelancing?" },
    { name: "clients", label: "Typical Client Type", placeholder: "Startups, enterprises, individuals..." },
  ],
  unemployed: [
    { name: "targetRole", label: "Target Role/Position", placeholder: "What job are you looking for?" },
    { name: "industry", label: "Target Industry", placeholder: "Which industry interests you?" },
    { name: "experience", label: "Previous Experience", placeholder: "Your background/previous roles" },
    { name: "jobSearchDuration", label: "Job Search Duration", placeholder: "How long have you been looking?" },
  ],
  retired: [
    { name: "previousCareer", label: "Previous Career", placeholder: "What did you do before retiring?" },
    { name: "retirementYear", label: "Year Retired", placeholder: "When did you retire?" },
    { name: "currentActivities", label: "Current Activities", placeholder: "What keeps you busy now?" },
    { name: "volunteer", label: "Volunteer Work", placeholder: "Any volunteer activities?" },
  ],
  other: [
    { name: "currentSituation", label: "Current Situation", placeholder: "Describe your current status" },
    { name: "mainActivity", label: "Main Activity", placeholder: "What do you spend most time on?" },
    { name: "goals", label: "Current Goals", placeholder: "What are you working towards?" },
    { name: "background", label: "Background", placeholder: "Tell us about your background" },
  ],
} as const;

export default function DetailsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [lifeGoals, setLifeGoals] = useState<string[]>([]);
  const [personal, setPersonal] = useState<PersonalDetails>({
    firstName: "",
    lastName: "",
    nickname: "",
    age: "",
    location: "",
    hobbies: "",
    personalContext: "",
  });
  const [work, setWork] = useState<WorkDetails>({
    status: "",
    workContext: "",
    dynamic: {},
  });

  const [email, setEmail] = useState(""); // 👈 top-level email

  const router = useRouter();

  // ---- Effects ----
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        if (user.email) setEmail(user.email); // 👈 prefill from Firebase auth
      }
    });

    const storedGoals = localStorage.getItem("lifeGoals");
    if (storedGoals) setLifeGoals(JSON.parse(storedGoals));

    return () => unsubscribe();
  }, []);

  // ---- Handlers ----
  const handleChange =
    <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    <K extends keyof T>(field: K, value: T[K]) => {
      setter((prev) => ({ ...prev, [field]: value }));
    };

  const handleDynamicChange = (field: string, value: string) => {
    setWork((prev) => ({
      ...prev,
      dynamic: { ...prev.dynamic, [field]: value },
    }));
  };

const saveProfile = async (
  personalDetails: Partial<PersonalDetails>,
  workDetails: Partial<WorkDetails>
) => {
  if (!userId) return;

  const profileUpdate: Partial<UserProfile> = {
    email,
  };

  // only keep lifeGoals if there’s something
  if (lifeGoals && lifeGoals.length > 0) {
    profileUpdate.lifeGoals = lifeGoals;
  }

  // only keep personalDetails if not empty
  if (personalDetails && Object.keys(personalDetails).some((k) => personalDetails[k as keyof PersonalDetails])) {
    profileUpdate.personalDetails = personalDetails;
  }

  // only keep workDetails if not empty
  if (
    workDetails &&
    (workDetails.status ||
      workDetails.workContext ||
      (workDetails.dynamic && Object.keys(workDetails.dynamic).length > 0))
  ) {
    profileUpdate.workDetails = workDetails;
  }

  await saveUserProfileAndAgentMemory(userId, profileUpdate);
};


  const saveAndContinue = async () => {
    try {
      await saveProfile(personal, work);
      router.push("/onboarding/useragreement");
    } catch (err) {
      console.error("❌ Error saving details:", err);
    }
  };

  const skipStep = async () => {
    try {
      await saveProfile({}, {});
      router.push("/onboarding/useragreement");
    } catch (err) {
      console.error("❌ Error skipping onboarding:", err);
    }
  };

  // ---- Render Helpers ----
  const renderPersonalFields = () =>
    (Object.entries({
      firstName: "First Name",
      lastName: "Last Name",
      nickname: "What should we call you?",
      age: "Age",
      location: "City, Country",
      hobbies: "Reading, hiking, cooking...",
    }) as [keyof PersonalDetails, string][]).map(([field, label]) => (
      <div key={field}>
        <label className="block text-sm font-medium text-white/90 mb-2">
          {label}
        </label>
        <input
          type={field === "age" ? "number" : "text"}
          min={field === "age" ? 13 : undefined}
          value={personal[field]}
          onChange={(e) => handleChange(setPersonal)(field, e.target.value)}
          className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
          placeholder={label}
        />
      </div>
    ));


  const renderDynamicFields = () =>
    work.status &&
    FIELD_CONFIGS[work.status]?.map((field) => (
      <div key={field.name}>
        <label className="block text-sm font-medium text-white/90 mb-2">{field.label}</label>
        <input
          type="text"
          value={work.dynamic[field.name] || ""}
          onChange={(e) => handleDynamicChange(field.name, e.target.value)}
          className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
          placeholder={field.placeholder}
        />
      </div>
    ));

  return (
    <main className="gradient-bg min-h-screen flex items-center justify-center p-4 relative font-inter">
      {/* Floating background shapes */}
      <div className="floating-shapes absolute w-full h-full overflow-hidden z-0">
        <div className="shape absolute w-20 h-20 top-[20%] left-[10%] rounded-full bg-white/10 animate-[float_6s_ease-in-out_infinite]" />
        <div className="shape absolute w-32 h-32 top-[60%] right-[10%] rounded-full bg-white/10 animate-[float_6s_ease-in-out_infinite]" />
        <div className="shape absolute w-16 h-16 bottom-[20%] left-[20%] rounded-full bg-white/10 animate-[float_6s_ease-in-out_infinite]" />
      </div>

      {/* Main Card */}
      <div className="glass-effect rounded-2xl p-8 w-full max-w-3xl relative z-10">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-white/80 text-sm mb-2">
            <span>Step 2 of 3</span>
            <span>66%</span>
          </div>
          <div className="bg-white/20 h-1 rounded overflow-hidden">
            <div className="bg-white h-full w-2/3" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
  <User className="mx-auto w-16 h-16 text-white mb-4" strokeWidth={2} />
  <h1 className="text-3xl font-bold text-white mb-2">Tell Us About Yourself</h1>
  <p className="text-white/80">Help us personalize your experience</p>
</div>

        {/* Recommendation */}
        <div className="text-blue-100 text-sm p-4 rounded-lg mb-6 bg-blue-500/15 border border-blue-500/30 backdrop-blur-md flex space-x-2">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p>
            We strongly recommend adding these details to get the maximum experience inside the app. Our AI will use this information to provide personalized insights and recommendations for your journaling and life improvement journey.
          </p>
        </div>

        {/* Personal Information */}
        <section className="section-glass rounded-xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
    <ClipboardList className="w-5 h-5 mr-2 text-white" strokeWidth={2} />
    Personal Information
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {renderPersonalFields()}
  
{/* Email field 👇 */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
                placeholder="Enter your email address"
              />
            </div>
          </div>


          <div className="mt-4">
            <label className="block text-sm font-medium text-white/90 mb-2">Tell our AI about yourself</label>
            <textarea
              rows={3}
              value={personal.personalContext}
              onChange={(e) => handleChange(setPersonal)("personalContext", e.target.value)}
              className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
              placeholder="Share anything you'd like our AI to know about you - your household situation, current challenges, what you're working on, or anything that might help personalize your experience..."
            />
          </div>
        </section>

        {/* Work/Education */}
        <section className="section-glass rounded-xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-white" strokeWidth={2} />
    Work & Education
          </h2>
          <div className="space-y-4">
            {/* Status dropdown */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Current Status</label>
              <select
                value={work.status}
                onChange={(e) => {
  handleChange(setWork)(
    "status",
    e.target.value as WorkDetails["status"] // 👈 cast to the union type
  );
  setWork((prev) => ({ ...prev, dynamic: {} }));
}}
                className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
              >
                <option value="">Select your current status</option>
                {Object.keys(FIELD_CONFIGS).map((key) => (
                  <option key={key} value={key}>
                    {key.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic fields */}
            {work.status && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderDynamicFields()}</div>}

            {/* Work/Education context */}
            {work.status && (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Tell our AI about your work/education situation
                </label>
                <textarea
                  rows={3}
                  value={work.workContext}
                  onChange={(e) => handleChange(setWork)("workContext", e.target.value)}
                  className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
                  placeholder="Share details about your current situation, challenges, goals, or anything else that might help personalize your experience..."
                />
              </div>
            )}
          </div>
        </section>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={saveAndContinue}
            className="next-btn flex-1 bg-white text-purple-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:bg-white/95"
          >
            Next Step →
          </button>
          <button
            onClick={skipStep}
            className="skip-btn flex-1 bg-white/10 border border-white/30 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:bg-white/20"
          >
            Skip This Step
          </button>
        </div>

        <p className="text-center mt-6 text-white/60 text-sm">
          You can add/edit these details in your profile later.
        </p>
      </div>
    </main>
  );
}


