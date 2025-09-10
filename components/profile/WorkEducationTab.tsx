"use client";

import React, { useState } from "react";
import { Briefcase, CheckCircle } from "lucide-react";
import GlassCard from "@/components/profile/GlassCard";

interface FieldConfig {
  name: string;
  label: string;
  placeholder: string;
}

interface WorkEducationTabProps {
  status?: string;
  initialFields?: Record<string, string>;
  onSaveWorkInfo?: (data: any) => void;
}

const fieldConfigs: Record<string, FieldConfig[]> = {
  student: [
    { name: "school", label: "School/University", placeholder: "Name of your educational institution" },
    { name: "major", label: "Major/Field of Study", placeholder: "What are you studying?" },
    { name: "year", label: "Academic Year", placeholder: "Freshman, Sophomore, Junior, Senior, Graduate..." },
    { name: "gpa", label: "GPA (Optional)", placeholder: "Your current GPA" }
  ],
  employed: [
    { name: "company", label: "Company Name", placeholder: "Where do you work?" },
    { name: "position", label: "Job Title", placeholder: "Your current position" },
    { name: "department", label: "Department", placeholder: "Which department/team?" },
    { name: "experience", label: "Years of Experience", placeholder: "How long in this role/field?" }
  ],
  "business-owner": [
    { name: "businessName", label: "Business Name", placeholder: "Name of your business" },
    { name: "businessType", label: "Business Type", placeholder: "What kind of business?" },
    { name: "employees", label: "Number of Employees", placeholder: "How many people work for you?" },
    { name: "founded", label: "Year Founded", placeholder: "When did you start?" }
  ],
  freelancer: [
    { name: "specialization", label: "Specialization", placeholder: "What services do you offer?" },
    { name: "platforms", label: "Main Platforms", placeholder: "Upwork, Fiverr, direct clients..." },
    { name: "experience", label: "Years Freelancing", placeholder: "How long have you been freelancing?" },
    { name: "clients", label: "Typical Client Type", placeholder: "Startups, enterprises, individuals..." }
  ],
  unemployed: [
    { name: "targetRole", label: "Target Role/Position", placeholder: "What job are you looking for?" },
    { name: "industry", label: "Target Industry", placeholder: "Which industry interests you?" },
    { name: "experience", label: "Previous Experience", placeholder: "Your background/previous roles" },
    { name: "jobSearchDuration", label: "Job Search Duration", placeholder: "How long have you been looking?" }
  ],
  retired: [
    { name: "previousCareer", label: "Previous Career", placeholder: "What did you do before retiring?" },
    { name: "retirementYear", label: "Year Retired", placeholder: "When did you retire?" },
    { name: "currentActivities", label: "Current Activities", placeholder: "What keeps you busy now?" },
    { name: "volunteer", label: "Volunteer Work", placeholder: "Any volunteer activities?" }
  ],
  other: [
    { name: "currentSituation", label: "Current Situation", placeholder: "Describe your current status" },
    { name: "mainActivity", label: "Main Activity", placeholder: "What do you spend most time on?" },
    { name: "goals", label: "Current Goals", placeholder: "What are you working towards?" },
    { name: "background", label: "Background", placeholder: "Tell us about your background" }
  ]
};

const WorkEducationTab: React.FC<WorkEducationTabProps> = ({
  status = "employed",
  initialFields = {},
  onSaveWorkInfo
}) => {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [fields, setFields] = useState<Record<string, string>>(initialFields);
  const [workContext, setWorkContext] = useState(initialFields?.workContext || "");
  const [saved, setSaved] = useState(false);

  const handleChangeField = (name: string, value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
  e.preventDefault();

  onSaveWorkInfo?.({
    status: currentStatus,
    dynamic: fields,
    workContext,
  });

  setSaved(true);
  setTimeout(() => setSaved(false), 3000);
};



  return (
    <GlassCard
      className="rounded-2xl p-6 transition-all duration-300 
                 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] 
                 hover:bg-white/15"
    >
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <Briefcase className="w-6 h-6 mr-3 text-white/90" />
        Work & Education
      </h2>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Status Select */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">Current Status</label>
          <select
            value={currentStatus}
            onChange={(e) => {
              setCurrentStatus(e.target.value);
              setFields({});
            }}
            className="glass-input input-focus custom-select w-full px-4 py-3 bg-white/10 border border-white/20 
                       rounded-lg text-white transition-all duration-200"
          >
            <option value="employed">Employed</option>
            <option value="student">Student</option>
            <option value="business-owner">Business Owner</option>
            <option value="freelancer">Freelancer</option>
            <option value="unemployed">Looking for Work</option>
            <option value="retired">Retired</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Dynamic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fieldConfigs[currentStatus]?.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-white/90 mb-2">{field.label}</label>
              <input
                type="text"
                value={fields[field.name] || ""}
                onChange={(e) => handleChangeField(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="glass-input input-focus w-full px-4 py-3 bg-white/10 border border-white/20 
                           rounded-lg text-white placeholder-white/60 transition-all duration-200"
              />
            </div>
          ))}
        </div>

        {/* Work Context */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">Work Context</label>
          <textarea
            rows={4}
            value={workContext}
            onChange={(e) => setWorkContext(e.target.value)}
            placeholder="Tell us about your work, studies, or professional context..."
            className="glass-input input-focus w-full px-4 py-3 bg-white/10 border border-white/20 
                       rounded-lg text-white placeholder-white/60 transition-all duration-200 resize-none"
          />
        </div>

        <button
          type="submit"
          className="save-btn w-full bg-white text-purple-700 font-semibold py-3 px-4 rounded-lg 
                     transition-all duration-200 hover:bg-white/95"
        >
          Save Work Information
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
  );
};

export default WorkEducationTab;



