"use client";

import React, { useState } from "react";
import { ClipboardList, MessageSquare, CheckCircle } from "lucide-react";
import GlassCard from "@/components/profile/GlassCard";

interface PersonalInfoTabProps {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  age?: number;
  location?: string;
  hobbies?: string;
  personalContext?: string;
  onSavePersonalInfo?: (data: any) => void;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  firstName = "",
  lastName = "",
  nickname = "",
  age = 0,
  location = "",
  hobbies = "",
  personalContext = "",
  onSavePersonalInfo,
}) => {
  const [formData, setFormData] = useState({
    firstName,
    lastName,
    nickname,
    age,
    location,
    hobbies,
    personalContext,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePersonalInfo?.(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Basic Information */}
      <GlassCard
        className="rounded-2xl p-6 transition-all duration-300 
                   hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] 
                   hover:bg-white/15"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <ClipboardList className="w-6 h-6 mr-3 text-white/90" />
          Basic Information
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First + Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
                
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
              />
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Nickname
            </label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
            />
          </div>

          {/* Age + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
              />
            </div>
          </div>

          {/* Hobbies */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Hobbies & Interests
            </label>
            <input
              type="text"
              name="hobbies"
              value={formData.hobbies}
              onChange={handleChange}
              className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
            />
          </div>

          {/* Save */}
          <button
            type="submit"
            className="save-btn w-full bg-white text-purple-700 font-semibold py-3 px-4 rounded-lg 
                       transition-all duration-200 hover:bg-white/95"
          >
            Save Changes
          </button>
        </form>
      </GlassCard>

      {/* About Me */}
      <GlassCard
        className="rounded-2xl p-6 mb-8 transition-all duration-300 
                   hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] 
                   hover:bg-white/15"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <MessageSquare className="w-6 h-6 mr-3 text-white/90" />
          About Me
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Personal Context
            </label>
            <textarea
              rows={8}
              name="personalContext"
              value={formData.personalContext}
              onChange={handleChange}
              className="glass-input input-focus w-full px-4 py-3 rounded-lg placeholder-white/60 text-white focus:bg-white focus:text-black transition-all duration-200"
              placeholder="Tell our AI about yourself..."
            />
          </div>

          <button
            type="submit"
            className="save-btn w-full bg-white text-purple-700 font-semibold py-3 px-4 rounded-lg 
                       transition-all duration-200 hover:bg-white/95"
          >
            Save Changes
          </button>
        </form>

        {saved && (
          <div className="save-indicator mt-4 p-3 bg-green-500/20 border border-green-400/30 
                          rounded-lg text-green-200 text-sm flex items-center show">
            <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
            Changes saved successfully!
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default PersonalInfoTab;
