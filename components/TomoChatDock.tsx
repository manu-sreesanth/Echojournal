'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { serverTimestamp } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore'; 

const TomoChatDock = ({ forceOpen }: { forceOpen?: boolean }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  if (forceOpen) {
    setIsOpen(true);
  }
}, [forceOpen]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessagesRef = useRef(messages);
  latestMessagesRef.current = messages;

  useEffect(() => {
  latestMessagesRef.current = messages;
}, [messages]);


useEffect(() => {
  if (!user?.uid) return;

  const chatRef = collection(db, 'users', user.uid, 'agent_chatHistory');
  const q = query(chatRef, orderBy('timestamp'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const liveMessages = snapshot.docs.map((doc) => {
  const data = doc.data();
  return {
    sender: data.sender || data.role || 'assistant', // fallback if 'sender' is missing
    text: data.text || data.content || '',           // fallback if 'text' is missing
  };
});

    setMessages(liveMessages);
  });

  return () => unsubscribe(); // 👈 clean up listener on unmount
}, [user?.uid]);


  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

const handleSend = async () => {
  const trimmed = input.trim();
  if (!trimmed || !user?.uid) return;

  const newMsg = { sender: 'user', text: trimmed, timestamp: serverTimestamp() };
  setMessages(prev => [...prev, newMsg]);
  setInput('');
  setIsLoading(true);
  scrollToBottom();

  const chatRef = collection(db, 'users', user.uid, 'agent_chatHistory');
  await addDoc(chatRef, newMsg);


  try {
    // 🧠 Fetch memory from Firestore
    const memorySnap = await getDoc(doc(db, 'users', user.uid, 'agent', 'memory'));
    const memory = memorySnap.exists() ? memorySnap.data() : {};
    const nickname = memory.nickname || 'your user';
    const workDetails = memory.workDetails || 'an awesome human';
    const lifeGoals = Array.isArray(memory.lifeGoals) ? memory.lifeGoals.join(', ') : 'not specified';

    // 🧠 Fetch recent journal entries with mood
    const journalRef = collection(db, 'users', user.uid, 'journalEntries');
    const q = query(journalRef, orderBy('createdAt', 'desc'), limit(5));
    const journalSnap = await getDocs(q);

    const journalContext = journalSnap.docs.map(doc => {
      const data = doc.data();
      const date = data.createdAt?.toDate().toLocaleDateString() || 'unknown date';
      const mood = data.mood || 'unknown mood';
      const content = data.content || '';
      return `
Journal Entry:
- Date: ${date}
- Mood: ${mood}
- Content: ${content.slice(0, 300)}
`.trim();
    }).join('\n');

    // 🧠 Create system prompt
    const systemPrompt = {
      role: 'system',
      content: `You are Tomo, a sharp-witted yet caring AI mentor-friend inside a journaling app. Speak like someone who's smart, warm, and knows how to keep it real. Your tone is short, insightful, and occasionally witty. Avoid generic advice or motivational fluff.

The user, "${nickname}", works as ${workDetails}. Keep that in mind when giving responses that relate to daily struggles, motivation, or purpose.

Always refer to the user by their nickname (“${nickname}”) if available. Insert emojis only when they enhance tone — not every message needs one.

Personality rules:
- Be serious when emotions are heavy; casual when mood is good.
- Focus your responses around the user's life goals: ${lifeGoals}, but don’t mention them unless it naturally fits.
- Occasionally comment on mood patterns or word triggers from journal if it adds value.

Examples:
- “Sounds like a rough one, ${nickname}. Wanna unpack it?”
- “That’s some real growth. Silent applause 👏”
- “Hmm, that goal you mentioned... I see echoes of it here.”
- “You’ve been a bit down this week. Let’s not ignore it.”

Avoid long explanations. Think like a mentor who drops gems, not essays.

Here are recent journal entries from the user:
${journalContext || 'No recent journal data available.'}

Respond thoughtfully and with emotional warmth.`,
    };

    // 🧠 Add systemPrompt to chat history
    const chatPayload = [
      systemPrompt,
      ...latestMessagesRef.current.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: trimmed },
    ];

    const res = await fetch('/api/tomoChat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatPayload }),
    });

    const data = await res.json();
    const botReply = {
      sender: 'tomo',
      text: data.text || "Hmm... not sure how to respond 🤔",
      timestamp: serverTimestamp(),
    };
    setMessages(prev => [...prev, botReply]);
    await addDoc(chatRef, botReply);
  } catch (err) {
    console.error("TomoChat Error:", err);
    const fallback = {
      sender: 'tomo',
      text: "Oops, I tripped over a digital rock 🪨. Mind trying again?",
      timestamp: serverTimestamp(), // Optional but safe fallback
    };
    setMessages(prev => [...prev, fallback]);
  }

  setIsLoading(false);
  scrollToBottom();
};


  return (
    <>
      {/* Floating Button */}
      {!forceOpen && (
  <div onClick={() => setIsOpen(!isOpen)} style={{
    position: "fixed",
    bottom: "20px",
    right: "20px",
    backgroundColor: "#007AFF",
    color: "white",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    cursor: "pointer",
    zIndex: 999,
  }}>
    💬
  </div>
)}


      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '320px',
            maxHeight: '500px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#4A90E2',
              color: '#fff',
              padding: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ backgroundColor: '#f4f4f4', borderRadius: '50%', padding: '4px' }}
            >
              <circle cx="50" cy="50" r="45" stroke="#444" strokeWidth="4" fill="#fff" />
              <circle cx="35" cy="40" r="6" fill="#444" />
              <circle cx="65" cy="40" r="6" fill="#444" />
              <rect x="30" y="60" width="40" height="8" rx="4" fill="#444" />
            </svg>
            Tomo Chat
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: '12px',
              overflowY: 'auto',
              background: '#f9f9f9',
              fontSize: '0.95rem',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  textAlign: msg.sender === 'user' ? 'right' : 'left',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    background: msg.sender === 'user' ? '#DCF8C6' : '#eee',
                    padding: '8px 12px',
                    borderRadius: '18px',
                    display: 'inline-block',
                    maxWidth: '80%',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {isLoading && (
              <div style={{ textAlign: 'left', marginBottom: '8px', fontStyle: 'italic', color: '#888' }}>
                Tomo is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              display: 'flex',
              borderTop: '1px solid #ddd',
              padding: '8px',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '18px',
                border: '1px solid #ccc',
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              style={{
                marginLeft: '8px',
                background: '#4A90E2',
                color: '#fff',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '18px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TomoChatDock;
