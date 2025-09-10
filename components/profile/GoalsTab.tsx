"use client";

import React, { useState } from "react";
import {
  Target,
  Plus,
  Edit3,
  Check,
  Trash2,
  Rocket,
  Sparkles,
  Brain,
  Heart,
  Loader2,
  CheckCircle,
} from "lucide-react";
import GlassCard from "@/components/profile/GlassCard";

interface Goal {
  id: number;
  text: string;
}

interface GoalsTabProps {
  initialGoals?: Goal[];
  maxGoals?: number;
  onSaveGoals?: (goals: Goal[]) => void;
}

const GoalsTab: React.FC<GoalsTabProps> = ({
  initialGoals = [],
  maxGoals = 10,
  onSaveGoals,
}) => {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [newGoalText, setNewGoalText] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const handleAddGoal = () => {
    if (!newGoalText.trim() || goals.length >= maxGoals) return;
    const newGoal: Goal = {
      id: Date.now(),
      text: newGoalText.trim(),
    };
    setGoals((prev) => [...prev, newGoal]);
    setNewGoalText("");
  };

  const handleDeleteGoal = (id: number) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  const handleEditGoal = (id: number) => {
    if (editId === id) {
      setEditId(null); // Save
    } else {
      setEditId(id); // Enable edit mode
    }
  };

  const handleGoalTextChange = (id: number, text: string) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === goal.id ? { ...goal, text } : goal))
    );
  };

  const handleSaveGoals = () => {
    onSaveGoals?.(goals);

    // show success indicator
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Life Goals Section */}
      <GlassCard
        className="rounded-2xl p-6 transition-all duration-300 
                   hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] 
                   hover:bg-white/15"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Target className="w-6 h-6 mr-3 text-white/90" />
          Life Goals
        </h2>

        <div className="space-y-6">
          {/* Add New Goal */}
          <div className="section-glass rounded-xl p-4 border-2 border-dashed border-white/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Add New Goal
              </h3>
              <span className="text-white/60 text-sm">
                {goals.length}/{maxGoals} goals
              </span>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter your life goal..."
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                className="glass-input input-focus flex-1 px-4 py-3 bg-white/10 border border-white/20 
                           rounded-lg text-white placeholder-white/60"
              />
              <button
                onClick={handleAddGoal}
                disabled={!newGoalText.trim() || goals.length >= maxGoals}
                className="bg-purple-600/70 border border-purple-400/100 text-purple-200 
                           font-medium py-3 px-6 rounded-lg hover:bg-purple-500/100 
                           transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
              >
                {goals.length >= maxGoals
                  ? "Maximum Goals Reached"
                  : "Add Goal"}
              </button>
            </div>
          </div>

          {/* Goals List */}
          <div className="section-glass rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              My Life Goals
            </h3>
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="goal-item flex items-center justify-between group"
                >
                  <div className="flex-1 pr-3">
                    <input
                      type="text"
                      value={goal.text}
                      readOnly={editId !== goal.id}
                      onChange={(e) =>
                        handleGoalTextChange(goal.id, e.target.value)
                      }
                      className={` glass-input input-focus goal-text bg-transparent text-white/90 border-none 
                                 outline-none w-full ${
                                   editId === goal.id
                                     ? "bg-white/10 border border-purple-400/50 rounded px-2"
                                     : ""
                                 }`}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditGoal(goal.id)}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                        editId === goal.id
                          ? "bg-green-500/70 text-green-200"
                          : "bg-blue-500/70 text-blue-200"
                      }`}
                    >
                      {editId === goal.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Edit3 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="w-8 h-8 rounded flex items-center justify-center 
                                 bg-red-500/70 text-red-200 hover:bg-red-500/100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveGoals}
          className="save-btn w-full mt-6 bg-white text-purple-700 font-semibold py-3 px-4 
                     rounded-lg transition-all duration-200 hover:bg-white/95"
        >
          Save Goals
        </button>

        {saved && (
          <div className="save-indicator mt-4 p-3 bg-green-500/20 border border-green-400/30 
                          rounded-lg text-green-200 text-sm flex items-center show">
            <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
            Goals saved successfully!
          </div>
        )}
      </GlassCard>

      {/* Coming Soon Side Section */}
      <GlassCard className="rounded-2xl p-6 relative overflow-hidden">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center">
            <Rocket className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-2xl font-bold text-white mb-2">Coming Soon!</h3>
            <p className="text-white/80 mb-4">
              Personal Development features are being crafted
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-purple-500/30 border border-purple-400/50 
                            rounded-full text-purple-200 text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              In Development
            </div>
          </div>
        </div>

        {/* Blurred background content */}
        <div className="filter blur-sm">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Sparkles className="w-6 h-6 mr-3 text-white/90" />
            Personal Development
          </h2>

          <div className="space-y-6">
            <div className="section-glass rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Learning & Skills
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/90">Advanced goal tracking</span>
                  <div className="w-20 h-6 bg-white/20 rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">Skill development plans</span>
                  <div className="w-20 h-6 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>

            <div className="section-glass rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Relationships & Social
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/90">Relationship insights</span>
                  <div className="w-20 h-6 bg-white/20 rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/90">Social goal tracking</span>
                  <div className="w-20 h-6 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full mt-6 bg-white/20 text-white font-semibold py-3 px-4 rounded-lg">
            Coming Soon
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default GoalsTab;

