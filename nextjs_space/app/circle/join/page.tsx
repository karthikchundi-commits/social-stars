'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { AVATAR_COLORS } from '@/lib/circleTime';

export default function CircleJoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState((searchParams?.get('code') ?? '').toUpperCase());
  const [name, setName] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!code.trim() || !name.trim()) { setError('Please enter your name and the join code.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/circle/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: code.toUpperCase(), displayName: name.trim(), avatarColor: color }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not join. Check the code and try again.'); return; }
      router.push(`/circle/session/${data.sessionId}?participantId=${data.participantId}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⭐</div>
          <h1 className="text-3xl font-black text-purple-700">Join Circle Time!</h1>
          <p className="text-gray-500 mt-2">Enter your name and the join code</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sam"
              className="w-full px-4 py-3 text-lg border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-500 font-semibold"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Join Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. ABC123"
              className="w-full px-4 py-3 text-2xl text-center tracking-[0.5em] border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-500 font-black uppercase"
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Pick Your Colour</label>
            <div className="flex gap-3 flex-wrap">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full transition-all ${color === c ? 'scale-125 ring-4 ring-offset-2 ring-purple-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full child-button bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {loading ? 'Joining...' : 'Join!'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
