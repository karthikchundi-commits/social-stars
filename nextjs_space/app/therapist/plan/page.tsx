'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Sparkles, Target, Calendar, ChevronDown, ChevronUp, Lightbulb, CheckCircle } from 'lucide-react';

interface ChildData {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
  recentMoods: string[];
}

interface Client {
  parentId: string;
  parentName: string;
  children: ChildData[];
}

interface PlanWeek {
  weekNumber: number;
  focus: string;
  activityTypes: string[];
  activitiesPerWeek: number;
  goals: string[];
  tips: string[];
  parentNote: string;
}

interface PlanData {
  title: string;
  weeklyGoal: string;
  durationWeeks: number;
  weeks: PlanWeek[];
  overallTips: string[];
}

const TYPE_COLORS: Record<string, string> = {
  breathing: 'bg-teal-100 text-teal-700',
  emotion: 'bg-orange-100 text-orange-700',
  scenario: 'bg-blue-100 text-blue-700',
  story: 'bg-green-100 text-green-700',
  communication: 'bg-purple-100 text-purple-700',
  social_coach: 'bg-pink-100 text-pink-700',
};

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', excited: '🤩', calm: '😌', tired: '😴',
  sad: '😢', anxious: '😟', angry: '😠', silly: '😜',
};

export default function TherapyPlanPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [goals, setGoals] = useState('');
  const [challenges, setChallenges] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!selectedChild) return;
    setGenerating(true);
    setError('');
    setPlan(null);

    try {
      const res = await fetch('/api/therapist/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChild.id,
          durationWeeks,
          goals,
          challenges,
          focusAreas,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Generation failed');
      } else {
        setPlan(data.data);
        setExpandedWeek(0);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">Loading...</div>
      </div>
    );
  }

  const allChildren = clients.flatMap((c) => c.children);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/therapist')}
          className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Portal
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-1 flex items-center gap-3">
            <Calendar className="w-10 h-10" /> AI Therapy Plan Generator
          </h1>
          <p className="text-gray-500 text-lg">Generate a personalised multi-week therapy roadmap for your client</p>
        </div>

        {/* Config Card */}
        {!plan && (
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Plan Details</h2>

            {/* Child selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Select Child *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {allChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedChild?.id === child.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2"
                      style={{ backgroundColor: child.avatarColor }}
                    >
                      {child.name.charAt(0)}
                    </div>
                    <div className="font-semibold text-gray-800 text-sm">{child.name}</div>
                    <div className="text-xs text-gray-500">Age {child.age}</div>
                    {child.recentMoods.length > 0 && (
                      <div className="mt-1 flex gap-0.5 flex-wrap">
                        {child.recentMoods.slice(0, 4).map((m, i) => (
                          <span key={i} className="text-sm">{MOOD_EMOJI[m] ?? '😐'}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {allChildren.length === 0 && (
                <p className="text-gray-400 italic">No clients linked yet.</p>
              )}
            </div>

            {/* Duration */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Plan Duration</label>
              <div className="flex gap-3 flex-wrap">
                {[2, 4, 6, 8].map((w) => (
                  <button
                    key={w}
                    onClick={() => setDurationWeeks(w)}
                    className={`px-5 py-2 rounded-xl font-semibold transition-all ${
                      durationWeeks === w
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                    }`}
                  >
                    {w} weeks
                  </button>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Therapy Goals (optional)</label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                rows={2}
                placeholder="e.g. Improve emotion regulation, increase peer interaction..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Current Challenges (optional)</label>
              <textarea
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                rows={2}
                placeholder="e.g. Struggles with transitions, sensitivity to loud sounds..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Focus Areas (optional)</label>
              <input
                value={focusAreas}
                onChange={(e) => setFocusAreas(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                placeholder="e.g. Breathing, Social stories, Communication..."
              />
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedChild || generating}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
            >
              {generating ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Generating plan... this may take a moment
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" /> Generate {durationWeeks}-Week Plan
                </>
              )}
            </button>
          </div>
        )}

        {/* Generated Plan */}
        {plan && (
          <div className="space-y-6">
            {/* Plan header */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-purple-200 text-sm font-semibold mb-1">THERAPY PLAN — {selectedChild?.name}</p>
                  <h2 className="text-3xl font-bold mb-3">{plan.title}</h2>
                  <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-2xl px-4 py-2 w-fit">
                    <Target className="w-5 h-5" />
                    <span className="font-semibold">{plan.weeklyGoal}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold">{plan.durationWeeks}</div>
                  <div className="text-purple-200 text-sm">weeks</div>
                </div>
              </div>
            </div>

            {/* Weeks */}
            {plan.weeks.map((week, i) => (
              <div key={i} className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <button
                  onClick={() => setExpandedWeek(expandedWeek === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold text-xl flex items-center justify-center">
                      {week.weekNumber}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-800 text-lg">Week {week.weekNumber}</div>
                      <div className="text-gray-500">{week.focus}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 flex-wrap justify-end">
                      {week.activityTypes.map((type) => (
                        <span key={type} className={`px-3 py-1 rounded-full text-xs font-bold ${TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                    {expandedWeek === i ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {expandedWeek === i && (
                  <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Goals */}
                      <div className="bg-blue-50 rounded-2xl p-4">
                        <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" /> Goals
                        </h4>
                        <ul className="space-y-2">
                          {week.goals.map((g, gi) => (
                            <li key={gi} className="flex items-start gap-2 text-blue-700 text-sm">
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {g}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tips */}
                      <div className="bg-yellow-50 rounded-2xl p-4">
                        <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" /> Tips for Practice
                        </h4>
                        <ul className="space-y-2">
                          {week.tips.map((t, ti) => (
                            <li key={ti} className="text-yellow-700 text-sm">• {t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Parent note */}
                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                      <p className="text-sm font-bold text-purple-700 mb-1">📝 Note for Parent</p>
                      <p className="text-purple-800 text-sm">{week.parentNote}</p>
                    </div>

                    <p className="text-sm text-gray-500">
                      Recommended: <span className="font-semibold">{week.activitiesPerWeek} activities/week</span>
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Overall tips */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-500" /> Overall Guidance
              </h3>
              <ul className="space-y-3">
                {plan.overallTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <span className="text-purple-500 font-bold">{i + 1}.</span> {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Generate new plan button */}
            <button
              onClick={() => { setPlan(null); setError(''); }}
              className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all"
            >
              Generate Another Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
