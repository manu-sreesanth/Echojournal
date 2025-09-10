import React from "react";
import GlassCard from "@/components/profile/GlassCard";
import ProgressRing from "@/components/profile/ProgressRing";
import { Pencil } from "lucide-react";

interface ProfileHeaderProps {
  initials: string;
  name: string;
  title: string;
  hobbies: string[];
  profileCompletion: number;
  onEditAvatar: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  initials,
  name,
  title,
  hobbies,
  profileCompletion,
  onEditAvatar
}) => {
  return (
    <GlassCard
      className="mb-8 p-8 rounded-2xl 
             flex flex-col md:flex-row md:items-center md:justify-between gap-6
             transition-all duration-300 
             hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] 
             hover:bg-white/15"
    >
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
          {initials}
          <button
            onClick={onEditAvatar}
            className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-200 
                       hover:bg-gray-100 hover:scale-110 transition-transform duration-200"
            title="Edit Avatar"
          >
            <Pencil className="w-4 h-4 text-purple-600" />
          </button>
        </div>

        {/* User Info */}
        <div>
          <h1 className="text-3xl font-bold text-white">{name}</h1>
          <h4 className="text-white/80 text-lg">{title}</h4>

          {/* Hobbies */}
          <div className="flex flex-wrap gap-2 mt-3">
            {hobbies.map((hobby, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-sm text-white bg-white/20 backdrop-blur-md"
              >
                {hobby}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Profile Completion */}
      <div className="flex flex-col items-center justify-center">
        <ProgressRing radius={45} stroke={6} progress={profileCompletion}>
          <span className="text-white font-bold text-lg">
            {profileCompletion}%
          </span>
        </ProgressRing>
        <p className="text-white/70 text-sm mt-2">Profile Complete</p>
      </div>
    </GlassCard>
  );
};

export default ProfileHeader;



