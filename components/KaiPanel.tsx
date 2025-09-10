'use client';

import { useEffect, useState } from 'react';

// Reuse this in your backend too via /types/ChatMessage.ts
type ChatMessage = {
  role: 'user' | 'kai';
  content: string;
};

interface KaiPanelProps {
  uid: string;
  onClose: () => void;
}

export default function KaiPanel({ uid, onClose }: KaiPanelProps) {
  const [mentoring, setMentoring] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Fetch initial mentoring summary from Kai (via /api/kaimentor)
  useEffect(() => {
    const fetchMentoring = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/kaimentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch Kai mentoring.');

        setMentoring(data.mentoringText);
        setChatHistory([{ role: 'kai', content: data.mentoringText }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMentoring();
  }, [uid]);

  // Send message to Kai and receive response via /api/kai-chat
  const sendMessage = async () => {
    if (!message.trim()) return;

    const newUserMessage: ChatMessage = { role: 'user', content: message };
    const updatedHistory = [...chatHistory, newUserMessage];

    setChatHistory(updatedHistory);
    setMessage('');

    try {
      const res = await fetch('/api/kai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, messages: updatedHistory }),
      });

      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || 'Kai did not respond');

      setChatHistory((prev) => [...prev, { role: 'kai', content: data.reply }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'kai',
          content:
            err instanceof Error
              ? `⚠️ ${err.message}`
              : '⚠️ Something went wrong.',
        },
      ]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full max-w-2xl h-[90vh] bg-white dark:bg-zinc-900 text-black dark:text-white rounded-lg shadow-lg flex flex-col overflow-hidden relative animate-slide-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white text-lg"
        >
          ✕
        </button>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h2 className="text-xl font-bold">Kai’s Mentoring</h2>

          {loading && <p>Loading Kai’s insights...</p>}
          {error && <p className="text-red-600">Error: {error}</p>}

          {!loading && mentoring && (
            <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded whitespace-pre-line">
              {mentoring}
            </div>
          )}

          {/* Chat Messages */}
          <div className="mt-4 space-y-2">
            {chatHistory.slice(1).map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded max-w-xl ${
                  msg.role === 'user'
                    ? 'bg-blue-100 dark:bg-blue-600 text-blue-900 dark:text-white self-end ml-auto'
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-white'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp-style Chat Bar */}
        <div className="p-4 border-t border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center gap-2">
          <input
            type="text"
            value={message}
            placeholder="Ask Kai something..."
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-zinc-700 rounded px-4 py-2 bg-white dark:bg-zinc-800 text-black dark:text-white outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

