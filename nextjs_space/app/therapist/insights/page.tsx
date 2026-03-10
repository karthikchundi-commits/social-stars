'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, Sparkles, TrendingUp, TrendingDown, Minus,
  Star, AlertTriangle, CheckCircle, MessageSquare, Trash2
} from 'lucide-react';

interface ChildData {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
  recentMoods: string[];
  totalCompleted: number;
}

interface Client {
  parentId: string;
  parentName: string;
  children: ChildData[];
}

interface Strength { title: string; detail: string }
interface AreaForGrowth { title: string; detail: string }

interface Insights {
  summary: string;
  strengths: Strength[];
  areasForGrowth: AreaForGrowth[];
  moodInsight: string;
  engagementTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  engagementDetail: string;
  nextSteps: string[];
  parentTips: string[];
  riskFlags: string[];
}

interface Note {
  id: string;
  content: string;
  noteType: string;
  isShared: boolean;
  createdAt: string;
  therapist: { name: string };
}

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', excited: '🤩', calm: '😌', tired: '😴',
  sad: '😢', anxious: '😟', angry: '😠', silly: '😜',
};

const NOTE_TYPE_STYLES: Record<string, string> = {
  observation: 'bg-blue-50 border-blue-200 text-blue-800',
  recommendation: 'bg-purple-50 border-purple-200 text-purple-800',
  milestone: 'bg-green-50 border-green-200 text-green-800',
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  observation: '👁 Observation',
  recommendation: '💡 Recommendation',
  milestone: '🏆 Milestone',
};

export default function InsightsPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('observation');
  const [isShared, setIsShared] = useState(true);
  const [savingNote, setSavingNote] = useState(false);

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

  const fetchNotes = async (childId: string) => {
    const res = await fetch(`/api/therapist/notes?childId=${childId}`);
    const data = await res.json();
    setNotes(data.notes ?? []);
  };

  const handleSelectChild = (child: ChildData) => {
    setSelectedChild(child);
    setInsights(null);
    setError('');
    fetchNotes(child.id);
  };

  const handleAnalyze = async () => {
    if (!selectedChild) return;
    setAnalyzing(true);
    setError('');
    setInsights(null);

    try {
      const res = await fetch('/api/therapist/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: selectedChild.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Analysis failed');
      } else {
        setInsights(data.insights);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedChild || !noteContent.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch('/api/therapist/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChild.id,
          content: noteContent,
          noteType,
          isShared,
        }),
      });
      if (res.ok) {
        setNoteContent('');
        await fetchNotes(selectedChild.id);
      }
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    await fetch(`/api/therapist/notes?noteId=${noteId}`, { method: 'DELETE' });
    if (selectedChild) await fetchNotes(selectedChild.id);
  };

  const TrendIcon = insights
    ? insights.engagementTrend === 'improving'
      ? TrendingUp
      : insights.engagementTrend === 'declining'
      ? TrendingDown
      : Minus
    : Minus;

  const trendColor = insights
    ? insights.engagementTrend === 'improving'
      ? 'text-green-600'
      : insights.engagementTrend === 'declining'
      ? 'text-red-600'
      : 'text-yellow-600'
    : 'text-gray-400';

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
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push('/therapist')}
          className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Portal
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-1 flex items-center gap-3">
            <TrendingUp className="w-10 h-10" /> AI Progress Intelligence
          </h1>
          <p className="text-gray-500 text-lg">Deep AI analysis of your client's progress, mood patterns, and recommendations</p>
        </div>

        {/* Child selector */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Select Client</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {allChildren.map((child) => (
              <button
                key={child.id}
                onClick={() => handleSelectChild(child)}
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
                <div className="text-xs text-gray-500">Age {child.age} · {child.totalCompleted} done</div>
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

          {selectedChild && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="mt-6 w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {analyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing {selectedChild.name}'s progress...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Analyze {selectedChild.name}
                </>
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Insights */}
        {insights && (
          <div className="space-y-6">
            {/* Risk flags */}
            {insights.riskFlags.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6">
                <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Attention Required
                </h3>
                <ul className="space-y-2">
                  {insights.riskFlags.map((flag, i) => (
                    <li key={i} className="text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary + engagement trend */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Clinical Summary</h2>
                <div className={`flex items-center gap-2 font-bold ${trendColor}`}>
                  <TrendIcon className="w-6 h-6" />
                  <span className="capitalize">{insights.engagementTrend.replace('_', ' ')}</span>
                </div>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">{insights.summary}</p>
              <p className="text-gray-500 italic">{insights.engagementDetail}</p>
            </div>

            {/* Strengths & Growth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-3xl p-6 border border-green-200">
                <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" /> Strengths
                </h3>
                <div className="space-y-4">
                  {insights.strengths.map((s, i) => (
                    <div key={i}>
                      <p className="font-bold text-green-800">{s.title}</p>
                      <p className="text-green-700 text-sm leading-relaxed">{s.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-3xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Areas for Growth
                </h3>
                <div className="space-y-4">
                  {insights.areasForGrowth.map((a, i) => (
                    <div key={i}>
                      <p className="font-bold text-blue-800">{a.title}</p>
                      <p className="text-blue-700 text-sm leading-relaxed">{a.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mood insight */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">😊 Mood Pattern Insight</h3>
              <p className="text-yellow-700 leading-relaxed">{insights.moodInsight}</p>
            </div>

            {/* Next steps */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-purple-500" /> Recommended Next Steps
              </h3>
              <div className="space-y-3">
                {insights.nextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                    <span className="w-7 h-7 rounded-full bg-purple-500 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Parent tips */}
            <div className="bg-pink-50 border border-pink-200 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-pink-800 mb-3">💝 Tips for Parents</h3>
              <ul className="space-y-2">
                {insights.parentTips.map((tip, i) => (
                  <li key={i} className="text-pink-700 flex items-start gap-2">
                    <span>•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Therapist Notes */}
        {selectedChild && (
          <div className="mt-8 bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-purple-500" /> Clinical Notes — {selectedChild.name}
            </h2>

            {/* New note form */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none bg-white"
                rows={3}
                placeholder="Write a clinical observation, recommendation, or milestone note..."
              />
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm font-semibold"
                >
                  <option value="observation">Observation</option>
                  <option value="recommendation">Recommendation</option>
                  <option value="milestone">Milestone</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-600 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  Share with parent
                </label>
                <button
                  onClick={handleSaveNote}
                  disabled={!noteContent.trim() || savingNote}
                  className="ml-auto px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {savingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </div>

            {/* Notes list */}
            {notes.length === 0 ? (
              <p className="text-gray-400 italic text-center py-4">No notes yet for {selectedChild.name}</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className={`rounded-2xl p-4 border ${NOTE_TYPE_STYLES[note.noteType] ?? 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-bold">{NOTE_TYPE_LABELS[note.noteType] ?? note.noteType}</span>
                          {note.isShared && <span className="text-xs bg-white bg-opacity-60 px-2 py-0.5 rounded-full">Shared with parent</span>}
                          <span className="text-xs opacity-60">{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="leading-relaxed">{note.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-current opacity-40 hover:opacity-70 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
