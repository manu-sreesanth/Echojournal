"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import {
  getUserProfile,
  saveUserProfileAndAgentMemory
} from "@/firebase/firestoreFunctions";
import { UserProfile } from "@/types/UserProfile";

import FloatingShapes from "@/components/profile/FloatingShapes";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import PersonalInfoTab from "@/components/profile/PersonalInfoTab";
import GoalsTab from "@/components/profile/GoalsTab";
import WorkEducationTab from "@/components/profile/WorkEducationTab";
import SettingsTab from "@/components/profile/SettingsTab";
import { User, Target, Briefcase, Settings } from "lucide-react";


export default function ProfilePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const calcProfileCompletion = (profile: UserProfile) => {
  let total = 0;
  let filled = 0;

  // Personal Details
  const personalFields = [
    profile.personalDetails?.firstName,
    profile.personalDetails?.lastName,
    profile.personalDetails?.nickname,
    profile.personalDetails?.age,
    profile.personalDetails?.location,
    profile.personalDetails?.hobbies,
    profile.personalDetails?.personalContext
  ];
  total += personalFields.length;
  filled += personalFields.filter((f) => f && f !== "").length;

  // Goals
  total += 3; // weight for goals (adjust as you like)
  if (profile.lifeGoals && profile.lifeGoals.length > 0) {
    filled += Math.min(profile.lifeGoals.length, 3);
  }

  // Work & Education
  const workFields = [
    profile.workDetails?.status,
    profile.workDetails?.dynamic && Object.keys(profile.workDetails.dynamic).length > 0
      ? "filled"
      : ""
  ];
  total += workFields.length;
  filled += workFields.filter((f) => f && f !== "").length;

  // Settings / Preferences (optional)
  if (profile.preferences) {
    total += 1;
    filled += 1;
  }

  // Avoid divide-by-zero
  if (total === 0) return 0;

  return Math.round((filled / total) * 100);
};



  // Watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
        setProfile(null);
      }
    });
    return () => unsub();
  }, []);

  // Fetch profile when uid is set
  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoading(true);
      const data = await getUserProfile(uid);
      if (data) {
        setProfile(data);
      }
      setLoading(false);
    })();
  }, [uid]);

  // Save wrapper
  const updateProfile = async (changes: Partial<UserProfile>) => {
    if (!uid) return;
    const updated = { ...profile, ...changes } as UserProfile;
    setProfile(updated);
    await saveUserProfileAndAgentMemory(uid, updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        No profile found.
      </div>
    );
  }

  return (
    <div className="gradient-bg min-h-screen py-8 px-4 relative">
      <FloatingShapes />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <ProfileHeader
          initials={profile.personalDetails?.nickname?.[0] ?? ""}
          name={`${profile.personalDetails?.firstName ?? ""} ${
            profile.personalDetails?.lastName ?? ""
          }`}
          title={`${profile.workDetails?.status ?? "Job not set"} • ${profile.personalDetails?.location ?? ""}`}

          hobbies={profile.personalDetails?.hobbies?.split(",") ?? []}
          profileCompletion={calcProfileCompletion(profile)}
          onEditAvatar={() => console.log("Edit avatar clicked")}
        />

        {/* Tabs */}
<ProfileTabs
  tabs={[
    { id: "personal", label: "Personal Info", icon: <User className="w-5 h-5" /> },
    { id: "goals", label: "Goals", icon: <Target className="w-5 h-5" /> },
    { id: "work", label: "Work & Education", icon: <Briefcase className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> }
  ]}
  onTabChange={(tabId) => setActiveTab(tabId)}
/>

         
        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === "personal" && (
            
            <PersonalInfoTab
              firstName={profile.personalDetails?.firstName ?? ""}
              lastName={profile.personalDetails?.lastName ?? ""}
              nickname={profile.personalDetails?.nickname ?? ""}
              age={
  profile.personalDetails?.age !== undefined
    ? Number(profile.personalDetails.age)
    : undefined
}
              location={profile.personalDetails?.location ?? ""}
              hobbies={profile.personalDetails?.hobbies ?? ""}
              personalContext={profile.personalDetails?.personalContext ?? ""}
              onSavePersonalInfo={(data) =>
                updateProfile({ personalDetails: data })
              }
            />
           
          )}

          {activeTab === "goals" && (
            <GoalsTab
  initialGoals={
    (profile.lifeGoals ?? []).map((g, index) =>
      typeof g === "string" ? { id: index + 1, text: g } : g
    )
  }
  onSaveGoals={(goals) =>
    updateProfile({ lifeGoals: goals.map((g) => g.text) }) // save only strings
  }
/>
          )}

          {activeTab === "work" && (
  <WorkEducationTab
  status={profile.workDetails?.status ?? "employed"}
  initialFields={{
    ...profile.workDetails?.dynamic,
    workContext: profile.workDetails?.workContext ?? ""
  }}
  onSaveWorkInfo={(data) =>
    updateProfile({
      workDetails: {
        ...profile.workDetails,
        ...data,   // ✅ spread correctly (status, dynamic, workContext)
      },
    })
  }
/>

)}

          {activeTab === "settings" && (
            <SettingsTab
              email={profile.email ?? ""}
              onSaveSecurity={(data) =>
                console.log("Security changes", data) // optional API for auth
              }
              onSavePreferences={(prefs) =>
                updateProfile({ preferences: prefs })
              }
              onDownloadData={() => console.log("Download data")}
              onDeleteData={() => console.log("Delete data")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

