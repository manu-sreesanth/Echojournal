'use client';

import { useEffect, useState } from 'react';
import { getAgentMemory, updateAgentMemory } from '@/firebase/firestoreFunctions';
import { useAuth } from "@/context/AuthContext";

export default function TomoProfilePage() {
  const { user } = useAuth();
  const [memory, setMemory] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchMemory = async () => {
      const data = await getAgentMemory(user.uid);
      setMemory({
        nickname: '',
        lifeGoals: [''], // start with at least one input
        workDetails: '',
        personalDetails: '',
        notes: '',
        ...data, // merge existing
      });
    };

    fetchMemory();
  }, [user]);

  const handleChange = (field: string, value: any) => {
    setMemory((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGoalChange = (index: number, value: string) => {
    const updatedGoals = [...memory.lifeGoals];
    updatedGoals[index] = value;
    handleChange('lifeGoals', updatedGoals);
  };

  const addLifeGoal = () => {
    if (memory.lifeGoals.length >= 10) return;
    handleChange('lifeGoals', [...memory.lifeGoals, '']);
  };

  const removeLifeGoal = (index: number) => {
    const updatedGoals = [...memory.lifeGoals];
    updatedGoals.splice(index, 1);
    handleChange('lifeGoals', updatedGoals);
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    await updateAgentMemory(user.uid, {
      ...memory,
      lifeGoals: memory.lifeGoals.filter((g: string) => g.trim() !== ''), // skip empty
    });
    setIsSaving(false);
    alert('Tomo profile updated!');
  };

  if (!memory) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>🧠 Edit Tomo Profile</h1>

      <label style={labelStyle}>Nickname (what Tomo should call you)</label>
      <input
        style={inputStyle}
        value={memory.nickname}
        onChange={(e) => handleChange('nickname', e.target.value)}
      />

      <label style={labelStyle}>🎯 Life Goals (max 10)</label>
      {memory.lifeGoals.map((goal: string, i: number) => (
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder={`Goal ${i + 1}`}
            value={goal}
            onChange={(e) => handleGoalChange(i, e.target.value)}
          />
          {memory.lifeGoals.length > 1 && (
            <button type="button" onClick={() => removeLifeGoal(i)} style={removeBtnStyle}>
              ❌
            </button>
          )}
        </div>
      ))}

      {memory.lifeGoals.length < 10 && (
        <button type="button" onClick={addLifeGoal} style={addBtnStyle}>
          ➕ Add Goal
        </button>
      )}

      <label style={labelStyle}>💼 Work Details</label>
      <textarea
        style={textareaStyle}
        value={memory.workDetails}
        onChange={(e) => handleChange('workDetails', e.target.value)}
        placeholder="e.g. I’m a product designer at a startup..."
      />

      <label style={labelStyle}>🏠 Personal Details</label>
      <textarea
        style={textareaStyle}
        value={memory.personalDetails}
        onChange={(e) => handleChange('personalDetails', e.target.value)}
        placeholder="e.g. I live in Bangalore with my dog and love hiking..."
      />

      <label style={labelStyle}>📝 Notes for Tomo</label>
      <textarea
        style={textareaStyle}
        value={memory.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        placeholder="e.g. Please keep things casual. I like humor."
      />

      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          marginTop: '24px',
          padding: '12px 20px',
          fontSize: '1rem',
          backgroundColor: '#222',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: isSaving ? 'not-allowed' : 'pointer',
        }}
      >
        {isSaving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginTop: '20px',
  marginBottom: '8px',
  fontWeight: 600,
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  fontSize: '1rem',
  borderRadius: '6px',
  border: '1px solid #ccc',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '80px',
};

const addBtnStyle = {
  marginTop: '8px',
  marginBottom: '16px',
  padding: '8px 12px',
  fontSize: '0.9rem',
  backgroundColor: '#4caf50',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

const removeBtnStyle = {
  backgroundColor: '#e74c3c',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '6px 10px',
  cursor: 'pointer',
};

