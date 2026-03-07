'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, Sparkles, Baby, Target, ClipboardList,
  CheckCircle, Loader2, RefreshCw, Send,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface ChildData {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
  recentMoods: string[];
  totalCompleted: number;
  assignedActivities: { type: string }[];
}

interface Client {
  parentId: string;
  parentName: string;
  children: ChildData[];
}

interface GeneratedActivity {
  id: string;
  title: string;
  description: string;
  type: string;
}

const ACTIVITY_TYPES = [
  { value: 'emotion', label: '😊 Emotion Recognition', desc: 'Child picks the correct emotion face' },
  { value: 'scenario', label: '🤝 Social Scenario', desc: 'Multiple-choice social situation' },
  { value: 'story', label: '📖 Interactive Story', desc: 'Page-by-page story with questions' },
  { value: 'breathing', label: '🌬️ Breathing Exercise', desc: 'Guided calm-down breathing' },
  { value: 'communication', label: '💬 Communication Board', desc: 'Tap-to-speak board activity' },
];

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', excited: '🤩', calm: '😌', tired: '😴',
  sad: '😢', anxious: '😟', angry: '😠', silly: '😜',
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [selectedChildId, setSelectedChildId] = useState('');
  const [activityType, setActivityType] = useState('scenario');
  const [goals, setGoals] = useState('');
  const [challenges, setChallenges] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');

  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedActivity | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'therapist') router.push('/select-child');
      else fetchClients();
    }
  }, [status]);

  const fetchClients = async () => {
    const res = await fetch('/api/therapist/clients');
    const data = await res.json();
    setClients(data.clients ?? []);
    setLoadingClients(false);
  };

  const allChildren = clients.flatMap((c) => c.children);
  const selectedChild = allChildren.find((c) => c.id === selectedChildId);

  const handleGenerate = async () => {
    if (!selectedChildId || !activityType) return;
    setGenerating(true);
    setError('');
    setGenerated(null);

    const child = selectedChild!;
    const completedTypes = [...new Set(child.assignedActivities.map((a) => a.type))];

    const res = await fetch('/api/therapist/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId: child.id,
        childName: child.name,
        childAge: child.age,
        goals,
        recentMoods: child.recentMoods,
        completedTypes,
        challenges,
        activityType,
        extraInstructions,
      }),
    });

    const data = await res.json();
    setGenerating(false);

    if (!res.ok) {
      setError(data.error || 'Generation failed. Please try again.');
      return;
    }

    setGenerated(data.activity);
  };

  if (status === 'loading' || loadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/therapist')} className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700">
          <ArrowLeft className="w-5 h-5" /> Back to Portal
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-3xl p-8 text-white mb-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Activity Generator</h1>
              <p className="text-purple-100">Powered by Claude Opus — tailored to each child's current state</p>
            </div>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-600 mb-2">No linked families yet</h2>
            <p className="text-gray-500 mb-4">Enrol a family first before generating personalised activities.</p>
            <button onClick={() => router.push('/therapist/enroll')} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl">
              Enrol a Family
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Step 1 — Select child */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-xl font-bold text-gray-700 mb-5 flex items-center gap-2">
                <Baby className="w-5 h-5 text-pink-500" /> Step 1 — Select a Child
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clients.map((client) =>
                  client.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        selectedChildId === child.id
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300 ring-offset-1'
                          : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: child.avatarColor }}>
                          {child.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{child.name}</p>
                          <p className="text-sm text-gray-500">Age {child.age} · {client.parentName}</p>
                        </div>
                        {selectedChildId === child.id && <CheckCircle className="w-5 h-5 text-purple-500 ml-auto" />}
                      </div>
                      {child.recentMoods.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          <span className="text-xs text-gray-400 mr-1">Recent moods:</span>
                          {child.recentMoods.slice(0, 5).map((m, i) => (
                            <span key={i} className="text-base">{MOOD_EMOJI[m] ?? '😐'}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Step 2 — Activity type */}
            {selectedChildId && (
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-xl font-bold text-gray-700 mb-5 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" /> Step 2 — Choose Activity Type
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ACTIVITY_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setActivityType(t.value)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        activityType === t.value
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300 ring-offset-1'
                          : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-bold text-gray-800 mb-1">{t.label}</p>
                      <p className="text-sm text-gray-500">{t.desc}</p>
                      {activityType === t.value && <CheckCircle className="w-4 h-4 text-purple-500 mt-2" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Context */}
            {selectedChildId && (
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-xl font-bold text-gray-700 mb-5 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-500" /> Step 3 — Add Context
                  <span className="text-sm font-normal text-gray-400">(optional but recommended)</span>
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
                      <Target className="w-4 h-4 text-green-500" /> Treatment Goals
                    </label>
                    <textarea
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none text-sm"
                      rows={3}
                      placeholder="e.g. Improve emotion identification, practise turn-taking, reduce anxiety during transitions..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Current Challenges / Clinical Notes</label>
                    <textarea
                      value={challenges}
                      onChange={(e) => setChallenges(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none text-sm"
                      rows={3}
                      placeholder="e.g. Struggles with unexpected changes, strong interest in animals, responds well to visual cues..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Extra Instructions for AI</label>
                    <textarea
                      value={extraInstructions}
                      onChange={(e) => setExtraInstructions(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none text-sm"
                      rows={2}
                      placeholder="e.g. Use a dinosaur theme, make it extra gentle, focus on sharing scenarios..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Generate button */}
            {selectedChildId && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-bold text-xl rounded-2xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-xl"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Claude is crafting a personalised activity…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Generate Activity for {selectedChild?.name}
                  </>
                )}
              </button>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-2xl">
                {error}
              </div>
            )}

            {/* Success — generated activity */}
            {generated && (
              <div className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Activity Created & Assigned!</h2>
                    <p className="text-gray-500 text-sm">It will appear on {selectedChild?.name}'s dashboard under "From Your Therapist"</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">{generated.type}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{generated.title}</h3>
                  <p className="text-gray-600">{generated.description}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setGenerated(null);
                      setExtraInstructions('');
                    }}
                    className="flex-1 py-3 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" /> Generate Another
                  </button>
                  <button
                    onClick={() => router.push('/therapist')}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" /> Back to Portal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
