"use client";

import React, { useState } from "react";
import { Lock, Bell, Download, Trash2 } from "lucide-react";
import GlassCard from "@/components/profile/GlassCard";

interface SettingsTabProps {
  email?: string;
  onSaveSecurity?: (data: { email: string; currentPassword: string; newPassword: string }) => void;
  onSavePreferences?: (data: { newsletter: boolean; alerts: boolean; reminders: boolean }) => void;
  onDownloadData?: () => void;
  onDeleteData?: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  email = "",
  onSaveSecurity,
  onSavePreferences,
  onDownloadData,
  onDeleteData,
}) => {
  const [securityData, setSecurityData] = useState({
    email,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preferences, setPreferences] = useState({
    newsletter: true,
    alerts: true,
    reminders: false,
  });

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    onSaveSecurity?.({
      email: securityData.email,
      currentPassword: securityData.currentPassword,
      newPassword: securityData.newPassword,
    });
  };

  const handlePreferencesSubmit = () => {
    onSavePreferences?.(preferences);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Account Security */}
      <GlassCard
        className="rounded-2xl p-6 transition-all duration-300 
                   hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] 
                   hover:bg-white/15"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Lock className="w-6 h-6 mr-3 text-white/90" />
          Account Security
        </h2>

        <form onSubmit={handleSecuritySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={securityData.email}
              onChange={handleSecurityChange}
              className="input-focus w-full px-4 py-3 bg-white/10 border border-white/20 
                         rounded-lg text-white placeholder-white/60 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={securityData.currentPassword}
              onChange={handleSecurityChange}
              placeholder="Enter current password"
              className="input-focus w-full px-4 py-3 bg-white/10 border border-white/20 
                         rounded-lg text-white placeholder-white/60 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={securityData.newPassword}
              onChange={handleSecurityChange}
              placeholder="Enter new password"
              className="input-focus w-full px-4 py-3 bg-white/10 border border-white/20 
                         rounded-lg text-white placeholder-white/60 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={securityData.confirmPassword}
              onChange={handleSecurityChange}
              placeholder="Confirm new password"
              className="input-focus w-full px-4 py-3 bg-white/10 border border-white/20 
                         rounded-lg text-white placeholder-white/60 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            className="save-btn w-full bg-white text-purple-700 font-semibold py-3 px-4 
                       rounded-lg transition-all duration-200 hover:bg-white/95"
          >
            Update Security Settings
          </button>
        </form>
      </GlassCard>

      {/* Privacy & Notifications */}
      <GlassCard
        className="rounded-2xl p-6 transition-all duration-300 
                   hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] 
                   hover:bg-white/15"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Bell className="w-6 h-6 mr-3 text-white/90" />
          Privacy & Notifications
        </h2>

        <div className="space-y-6">
          {/* Email Preferences */}
          <div className="section-glass rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Email Preferences
            </h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={preferences.newsletter}
                  onChange={handlePreferencesChange}
                  className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded 
                             focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-white/90">Newsletter & Updates</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="alerts"
                  checked={preferences.alerts}
                  onChange={handlePreferencesChange}
                  className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded 
                             focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-white/90">Security Alerts</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="reminders"
                  checked={preferences.reminders}
                  onChange={handlePreferencesChange}
                  className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded 
                             focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-white/90">Journaling Reminders</span>
              </label>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="section-glass rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Data & Privacy</h3>
            <div className="space-y-3">
              <button
                onClick={onDownloadData}
                className="w-full flex items-center px-4 py-3 bg-white/10 border border-white/20 
                           rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                <Download className="w-5 h-5 mr-2 text-white/80" />
                Download My Data
              </button>
              <button
                onClick={onDeleteData}
                className="w-full flex items-center px-4 py-3 bg-red-500/20 border border-red-400/30 
                           rounded-lg text-red-200 hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete All Data
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handlePreferencesSubmit}
          className="save-btn w-full mt-6 bg-white text-purple-700 font-semibold py-3 px-4 
                     rounded-lg transition-all duration-200 hover:bg-white/95"
        >
          Save Preferences
        </button>
      </GlassCard>
    </div>
  );
};

export default SettingsTab;

