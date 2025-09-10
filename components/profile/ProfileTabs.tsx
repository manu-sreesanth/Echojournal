"use client";

import React, { useState } from "react";
import GlassCard from "@/components/profile/GlassCard";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ProfileTabsProps {
  tabs: Tab[];
  onTabChange?: (tabId: string) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ tabs, onTabChange }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <GlassCard
      className="mb-8 p-4 rounded-2xl 
                 transition-all duration-300 
                 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] 
                 hover:bg-white/15"
    >

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
  key={tab.id}
  onClick={() => handleTabClick(tab.id)}
  className={`tab-button flex items-center justify-center gap-2 flex-1 min-w-0 px-4 py-3 
              rounded-lg text-white font-medium border border-white/20 
              hover:bg-white/10 transition-all relative
    ${
      activeTab === tab.id
        ? "bg-[rgba(102,126,234,0.3)] border-[rgba(102,126,234,0.5)] after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#667eea] after:rounded"
        : ""
    }`}
>
  <span className="flex items-center gap-2">
    {tab.icon}
    <span className="hidden sm:inline">{tab.label}</span>
  </span>
</button>

        ))}
      </div>
    </GlassCard>
  );
};

export default ProfileTabs;

