'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Play } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  type: string;
}

export default function CircleHostPage() {
  const router = useRouter();
  const { data: authSession } = useSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [hostName, setHostName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authSession?.user?.name) setHostName(authSession.user.name);
    fetch('/api/activities')
      .then(r => r.json())
      .then(d => {
        const stories = (d.activities ?? []).filter((a: Activity) => a.type === 'story');
        setActivities(stories);
        if (stories.length > 0) setSelectedId(stories[0].id);
      });
  }, [authSession]);

  const handleCreate = async () => {
    if (!selectedId) { setError('Please select a story.'); return; }
    setLoading(true); setError('');
    try {
      const therapistId = (authSession?.user as any)?.id;
      const res = await fetch('/api/circle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: selectedId, hostName, therapistId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not create session.'); return; }
      router.push(`/circle/session/${data.sessionId}?participantId=${data.participantId}`);
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-3xl font-black text-purple-700">Start Circle Time</h1>
          <p className="text-gray-500 mt-2">Choose a story and invite children to join</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Your Name</label>
            <input
              type="text"
              value={hostName}
              onChange={e => setHostName(e.target.value)}
              placeholder="Teacher / Parent name"
              className="w-full px-4 py-3 text-lg border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">Choose a Story</label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-500 font-semibold bg-white"
            >
              {activities.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full child-button bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <Play className="w-5 h-5" />
            {loading ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
