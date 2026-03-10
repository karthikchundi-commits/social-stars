'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  TrendingUp, Award, Activity, Flame, Heart, MessageSquare,
  Plus, Link, LogOut, Play, Star, BarChart2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { signOut } from 'next-auth/react';
import { AVATAR_COLORS } from '@/lib/constants';

interface Child {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
}

interface TherapistNote {
  id: string;
  content: string;
  noteType: string;
  createdAt: string;
  therapist: { name: string };
}

interface MoodCheckIn {
  id: string;
  mood: string;
  checkedAt: string;
}

interface ChildProgress {
  child: Child;
  totalActivities: number;
  achievements: number;
  streak: number;
  byType: Record<string, number>;
  recentMoods: MoodCheckIn[];
}

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', excited: '🤩', calm: '😌', tired: '😴',
  sad: '😢', anxious: '😟', angry: '😠', silly: '😜',
};

const AUTISM_TIPS = [
  { icon: '🧘', title: 'Breathing Before Activities', body: 'If your child seems anxious or overwhelmed, start with a breathing activity.' },
  { icon: '⏰', title: 'Consistent Schedule', body: 'Try to do activities at the same time each day to build a positive habit.' },
  { icon: '🌟', title: 'Celebrate Every Win', body: 'Praise effort, not just results. Even trying an activity is a success!' },
  { icon: '📢', title: 'Use the Communication Board', body: 'Helps non-verbal children practice expressing needs and feelings.' },
  { icon: '😌', title: 'Mood Tracking Matters', body: 'Mood patterns help identify triggers and the best times for learning.' },
  { icon: '🔁', title: 'Repetition is Learning', body: 'It\'s normal and beneficial for children with autism to replay the same activity.' },
];

export default function ParentDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [children, setChildren] = useState<Child[]>([]);
  const [progressData, setProgressData] = useState<ChildProgress[]>([]);
  const [therapistNotes, setTherapistNotes] = useState<Record<string, TherapistNote[]>>({});
  const [loading, setLoading] = useState(true);

  // Add child modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('3');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);

  // Link therapist modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [linkResult, setLinkResult] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated') fetchDashboardData();
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const childrenRes = await fetch('/api/children');
      const childrenData = await childrenRes.json();
      const childrenList: Child[] = childrenData?.children ?? [];
      setChildren(childrenList);

      const progressPromises = childrenList.map(async (child) => {
        const [progressRes, moodRes] = await Promise.all([
          fetch(`/api/progress?childId=${child.id}`),
          fetch(`/api/mood?childId=${child.id}`),
        ]);
        const progressData = await progressRes.json();
        const moodData = await moodRes.json();
        const completed = progressData?.completedActivities ?? [];
        const byType: Record<string, number> = {};
        completed.forEach((ca: any) => {
          const type = ca?.activity?.type ?? 'other';
          byType[type] = (byType[type] ?? 0) + 1;
        });
        return {
          child,
          totalActivities: completed.length,
          achievements: progressData?.achievements?.length ?? 0,
          streak: progressData?.streak ?? 0,
          byType,
          recentMoods: (moodData?.checkIns ?? []).slice(0, 7),
        };
      });

      const allProgress = await Promise.all(progressPromises);
      setProgressData(allProgress);

      // Fetch therapist notes for each child
      const notesResults = await Promise.all(
        childrenList.map(async (child) => {
          try {
            const res = await fetch(`/api/therapist/notes?childId=${child.id}`);
            const data = await res.json();
            return { childId: child.id, notes: data.notes ?? [] };
          } catch {
            return { childId: child.id, notes: [] };
          }
        })
      );
      const notesMap: Record<string, TherapistNote[]> = {};
      notesResults.forEach(({ childId, notes }) => { notesMap[childId] = notes; });
      setTherapistNotes(notesMap);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newChildName, age: newChildAge, avatarColor: selectedColor }),
    });
    if (res.ok) {
      setShowAddModal(false);
      setNewChildName('');
      setNewChildAge('3');
      fetchDashboardData();
    }
  };

  const handleLinkTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/therapist/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: linkCode }),
    });
    const data = await res.json();
    setLinkResult(res.ok ? `✅ Linked to ${data.therapistName}!` : `❌ ${data.error}`);
    if (res.ok) setLinkCode('');
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">Loading...</div>
      </div>
    );
  }

  const totalActivities = progressData.reduce((s, p) => s + p.totalActivities, 0);
  const totalAchievements = progressData.reduce((s, p) => s + p.achievements, 0);
  const maxStreak = progressData.reduce((m, p) => Math.max(m, p.streak), 0);

  const childrenActivityData = progressData.map((p) => ({
    name: p.child.name,
    activities: p.totalActivities,
    achievements: p.achievements,
  }));

  const activityTypeData = [
    { name: 'Emotions', value: progressData.reduce((s, p) => s + (p.byType['emotion'] ?? 0), 0), color: '#FF9149' },
    { name: 'Scenarios', value: progressData.reduce((s, p) => s + (p.byType['scenario'] ?? 0), 0), color: '#60B5FF' },
    { name: 'Stories', value: progressData.reduce((s, p) => s + (p.byType['story'] ?? 0), 0), color: '#80D8C3' },
    { name: 'Breathing', value: progressData.reduce((s, p) => s + (p.byType['breathing'] ?? 0), 0), color: '#4ECDC4' },
    { name: 'Communication', value: progressData.reduce((s, p) => s + (p.byType['communication'] ?? 0), 0), color: '#BB8FCE' },
    { name: 'Social Coach', value: progressData.reduce((s, p) => s + (p.byType['social_coach'] ?? 0), 0), color: '#FF6B9D' },
  ].filter((d) => d.value > 0);

  const hasNotes = children.some((c) => (therapistNotes[c.id] ?? []).length > 0);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-bold text-purple-600 mb-1">Parent Dashboard</h1>
            <p className="text-xl text-gray-600">Welcome back, {session?.user?.name} 👋</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowLinkModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
            >
              <Link className="w-5 h-5" /> Link Therapist
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" /> Add Child
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-5 py-3 bg-gray-500 text-white font-bold rounded-2xl hover:bg-gray-600 transition-all flex items-center gap-2 shadow-lg"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>

        {/* Children Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Your Children</h2>
          {children.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
              <div className="text-6xl mb-4">👶</div>
              <h3 className="text-2xl font-bold text-gray-600 mb-2">No children yet</h3>
              <p className="text-gray-500 mb-6">Add a child profile to get started.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add Your First Child
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {children.map((child) => {
                const progress = progressData.find((p) => p.child.id === child.id);
                const notes = therapistNotes[child.id] ?? [];
                return (
                  <div
                    key={child.id}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col"
                    style={{ borderTop: `5px solid ${child.avatarColor}` }}
                  >
                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                          style={{ backgroundColor: child.avatarColor }}
                        >
                          {child.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{child.name}</h3>
                          <p className="text-gray-500 text-sm">Age {child.age}</p>
                        </div>
                      </div>

                      {progress && (
                        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                          <div className="bg-blue-50 rounded-xl p-2">
                            <div className="font-bold text-blue-600 text-lg">{progress.totalActivities}</div>
                            <div className="text-xs text-gray-500">Done</div>
                          </div>
                          <div className="bg-yellow-50 rounded-xl p-2">
                            <div className="font-bold text-yellow-600 text-lg">{progress.achievements}</div>
                            <div className="text-xs text-gray-500">Badges</div>
                          </div>
                          <div className="bg-orange-50 rounded-xl p-2">
                            <div className="font-bold text-orange-500 text-lg flex items-center justify-center gap-0.5">
                              <Flame className="w-4 h-4" />{progress.streak}
                            </div>
                            <div className="text-xs text-gray-500">Streak</div>
                          </div>
                        </div>
                      )}

                      {progress && progress.recentMoods.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Recent moods:</p>
                          <div className="flex gap-1 flex-wrap">
                            {progress.recentMoods.map((m) => (
                              <span key={m.id} title={m.mood} className="text-lg">{MOOD_EMOJI[m.mood] ?? '😐'}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {notes.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">🩺 {notes.length} therapist note{notes.length > 1 ? 's' : ''}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => router.push(`/dashboard/${child.id}`)}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                    >
                      <Play className="w-4 h-4" /> Start Activities
                    </button>
                  </div>
                );
              })}

              {/* Add child card */}
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-white rounded-3xl shadow-xl border-2 border-dashed border-purple-300 hover:border-purple-500 flex flex-col items-center justify-center gap-3 text-purple-500 hover:text-purple-700 transition-all min-h-[200px]"
              >
                <Plus className="w-10 h-10" />
                <span className="font-bold">Add Child</span>
              </button>
            </div>
          )}
        </div>

        {/* Summary stats */}
        {children.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl p-5 text-white shadow-xl">
              <Activity className="w-8 h-8 mb-2" />
              <div className="text-3xl font-bold">{totalActivities}</div>
              <div className="text-blue-100 text-sm">Total Activities</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-5 text-white shadow-xl">
              <Award className="w-8 h-8 mb-2" />
              <div className="text-3xl font-bold">{totalAchievements}</div>
              <div className="text-yellow-100 text-sm">Achievements</div>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-5 text-white shadow-xl">
              <Flame className="w-8 h-8 mb-2" />
              <div className="text-3xl font-bold">{maxStreak}</div>
              <div className="text-orange-100 text-sm">Best Streak</div>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl p-5 text-white shadow-xl">
              <Star className="w-8 h-8 mb-2" />
              <div className="text-3xl font-bold">{children.length}</div>
              <div className="text-purple-100 text-sm">Children</div>
            </div>
          </div>
        )}

        {/* Charts */}
        {totalActivities > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" /> Activities by Child
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={childrenActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="activities" fill="#60B5FF" radius={[6, 6, 0, 0]} name="Activities" />
                  <Bar dataKey="achievements" fill="#BB8FCE" radius={[6, 6, 0, 0]} name="Badges" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" /> Activity Types
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={activityTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {activityTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Therapist Notes */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-purple-500" /> Notes from Your Therapist
          </h2>
          {!hasNotes ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🩺</div>
              <p className="text-gray-500">No therapist notes yet.</p>
              <p className="text-gray-400 text-sm mt-1">
                Link a therapist using the button above and they can leave notes here for you.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {children.map((child) => {
                const notes = therapistNotes[child.id] ?? [];
                if (notes.length === 0) return null;
                return (
                  <div key={child.id}>
                    <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: child.avatarColor }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: child.avatarColor }}>
                        {child.name.charAt(0)}
                      </div>
                      {child.name}
                    </h3>
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div key={note.id} className={`rounded-2xl p-4 border ${
                          note.noteType === 'milestone' ? 'bg-green-50 border-green-200' :
                          note.noteType === 'recommendation' ? 'bg-purple-50 border-purple-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wide opacity-70">
                              {note.noteType === 'milestone' ? '🏆 Milestone' : note.noteType === 'recommendation' ? '💡 Recommendation' : '👁 Observation'}
                            </span>
                            <span className="text-xs opacity-50 ml-auto">
                              {note.therapist.name} · {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-800 leading-relaxed">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Heart className="w-7 h-7 text-pink-500" /> Tips for Supporting Your Child
          </h2>
          <p className="text-gray-500 mb-6 text-sm">Evidence-informed strategies for children with autism</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTISM_TIPS.map((tip, i) => (
              <div key={i} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                <div className="text-3xl mb-2">{tip.icon}</div>
                <h3 className="text-base font-bold text-gray-800 mb-1">{tip.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Link Therapist Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🩺</div>
              <h2 className="text-2xl font-bold text-purple-600 mb-2">Connect with Your Therapist</h2>
              <p className="text-gray-500 text-sm">Enter the invite code your therapist shared with you.</p>
              <ul className="mt-3 text-sm text-left text-gray-600 space-y-1 bg-purple-50 rounded-xl p-4">
                <li>✅ They can view your child's progress and moods</li>
                <li>✅ Assign personalised activities to your child</li>
                <li>✅ Leave notes and recommendations for you</li>
              </ul>
            </div>
            <form onSubmit={handleLinkTherapist} className="space-y-4">
              <input
                type="text"
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-xl font-bold tracking-widest text-center"
                placeholder="THER-XXXXXX"
                required
              />
              {linkResult && <p className="text-center font-semibold">{linkResult}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowLinkModal(false); setLinkResult(''); setLinkCode(''); }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl">Connect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Child Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-purple-600 mb-6">Add a Child</h2>
            <form onSubmit={handleAddChild} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Child's Name</label>
                <input type="text" value={newChildName} onChange={(e) => setNewChildName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="Enter name" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                <select value={newChildAge} onChange={(e) => setNewChildAge(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none">
                  {[3, 4, 5, 6].map((age) => <option key={age} value={age}>{age} years old</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Choose a Colour</label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_COLORS.map((color) => (
                    <button key={color} type="button" onClick={() => setSelectedColor(color)}
                      className={`w-full aspect-square rounded-xl transition-all ${selectedColor === color ? 'ring-4 ring-purple-500 scale-110' : ''}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl">Cancel</button>
                <button type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl">Add Child</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
