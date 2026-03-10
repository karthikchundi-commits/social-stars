'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, TrendingUp, Award, Activity, Flame, Heart, MessageSquare } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface Child {
  id: string;
  name: string;
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
  happy: '😊',
  excited: '🤩',
  calm: '😌',
  tired: '😴',
  sad: '😢',
  anxious: '😟',
  angry: '😠',
  silly: '😜',
};

const AUTISM_TIPS = [
  {
    icon: '🧘',
    title: 'Breathing Before Activities',
    body: 'If your child seems anxious or overwhelmed, try starting with a "Calm Down" breathing activity before others.',
  },
  {
    icon: '⏰',
    title: 'Consistent Schedule',
    body: 'Autism often responds well to routine. Try to do activities at the same time each day to build a positive habit.',
  },
  {
    icon: '🌟',
    title: 'Celebrate Every Win',
    body: 'Praise effort, not just results. Even trying an activity is a success worth celebrating!',
  },
  {
    icon: '📢',
    title: 'Use the Communication Board',
    body: 'The Communication Board helps non-verbal or minimally verbal children practice expressing needs and feelings.',
  },
  {
    icon: '😌',
    title: 'Mood Tracking Matters',
    body: 'Watching mood patterns over time can help identify triggers and the best times for learning activities.',
  },
  {
    icon: '🔁',
    title: 'Repetition is Learning',
    body: 'It\'s completely normal and beneficial for children with autism to replay the same activity multiple times.',
  },
];

export default function ParentDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [children, setChildren] = useState<Child[]>([]);
  const [progressData, setProgressData] = useState<ChildProgress[]>([]);
  const [therapistNotes, setTherapistNotes] = useState<Record<string, TherapistNote[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const childrenRes = await fetch('/api/children');
      const childrenData = await childrenRes.json();
      const childrenList = childrenData?.children ?? [];
      setChildren(childrenList);

      const progressPromises = childrenList.map(async (child: Child) => {
        const [progressRes, moodRes] = await Promise.all([
          fetch(`/api/progress?childId=${child?.id}`),
          fetch(`/api/mood?childId=${child?.id}`),
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
        childrenList.map(async (child: Child) => {
          try {
            const notesRes = await fetch(`/api/therapist/notes?childId=${child.id}`);
            const notesData = await notesRes.json();
            return { childId: child.id, notes: notesData.notes ?? [] };
          } catch {
            return { childId: child.id, notes: [] };
          }
        })
      );
      const notesMap: Record<string, TherapistNote[]> = {};
      notesResults.forEach(({ childId, notes }) => { notesMap[childId] = notes; });
      setTherapistNotes(notesMap);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">Loading...</div>
      </div>
    );
  }

  const childrenActivityData = progressData.map((p) => ({
    name: p?.child?.name ?? 'Child',
    activities: p?.totalActivities ?? 0,
    achievements: p?.achievements ?? 0,
  }));

  const activityTypeData = [
    {
      name: 'Emotions',
      value: progressData.reduce((sum, p) => sum + (p?.byType?.['emotion'] ?? 0), 0),
      color: '#FF9149',
    },
    {
      name: 'Scenarios',
      value: progressData.reduce((sum, p) => sum + (p?.byType?.['scenario'] ?? 0), 0),
      color: '#60B5FF',
    },
    {
      name: 'Stories',
      value: progressData.reduce((sum, p) => sum + (p?.byType?.['story'] ?? 0), 0),
      color: '#80D8C3',
    },
    {
      name: 'Breathing',
      value: progressData.reduce((sum, p) => sum + (p?.byType?.['breathing'] ?? 0), 0),
      color: '#4ECDC4',
    },
    {
      name: 'Communication',
      value: progressData.reduce((sum, p) => sum + (p?.byType?.['communication'] ?? 0), 0),
      color: '#BB8FCE',
    },
  ].filter((d) => d.value > 0);

  const totalActivities = progressData.reduce((sum, p) => sum + (p?.totalActivities ?? 0), 0);
  const totalAchievements = progressData.reduce((sum, p) => sum + (p?.achievements ?? 0), 0);
  const maxStreak = progressData.reduce((max, p) => Math.max(max, p?.streak ?? 0), 0);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/select-child')}
          className="mb-6 px-6 py-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-5xl font-bold text-purple-600 mb-2">Parent Dashboard</h1>
          <p className="text-xl text-gray-600">Track your children's progress and achievements</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
            <Activity className="w-10 h-10 mb-3" />
            <div className="text-4xl font-bold">{totalActivities}</div>
            <div className="text-blue-100 mt-1">Total Activities</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-6 text-white shadow-xl">
            <Award className="w-10 h-10 mb-3" />
            <div className="text-4xl font-bold">{totalAchievements}</div>
            <div className="text-yellow-100 mt-1">Achievements</div>
          </div>
          <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-6 text-white shadow-xl">
            <Flame className="w-10 h-10 mb-3" />
            <div className="text-4xl font-bold">{maxStreak}</div>
            <div className="text-orange-100 mt-1">Best Streak (days)</div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl p-6 text-white shadow-xl">
            <TrendingUp className="w-10 h-10 mb-3" />
            <div className="text-4xl font-bold">{children?.length ?? 0}</div>
            <div className="text-purple-100 mt-1">Children</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Activities by Child</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={childrenActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="activities" fill="#60B5FF" radius={[8, 8, 0, 0]} name="Activities" />
                <Bar dataKey="achievements" fill="#BB8FCE" radius={[8, 8, 0, 0]} name="Achievements" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Activity Types</h2>
            {activityTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={activityTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {activityTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry?.color ?? '#888'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
                No activities completed yet
              </div>
            )}
          </div>
        </div>

        {/* Individual Child Progress + Mood History */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Individual Progress & Mood</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {progressData.map((p) => (
              <div
                key={p?.child?.id}
                className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
                style={{ borderTopColor: p?.child?.avatarColor ?? '#888', borderTopWidth: '4px' }}
              >
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{p?.child?.name ?? 'Child'}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Activities:</span>
                    <span className="text-xl font-bold text-blue-600">{p?.totalActivities ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Achievements:</span>
                    <span className="text-xl font-bold text-yellow-600">{p?.achievements ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Streak:</span>
                    <span className="text-xl font-bold text-orange-500 flex items-center gap-1">
                      <Flame className="w-5 h-5" /> {p?.streak ?? 0}d
                    </span>
                  </div>
                </div>

                {/* Activity type breakdown */}
                {Object.keys(p?.byType ?? {}).length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">By Type:</div>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(p?.byType ?? {}).map(([type, count]) => (
                        <span
                          key={type}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold"
                        >
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Moods */}
                {p?.recentMoods?.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Recent Moods:</div>
                    <div className="flex gap-1 flex-wrap">
                      {p.recentMoods.map((m) => (
                        <span
                          key={m.id}
                          title={`${m.mood} — ${new Date(m.checkedAt).toLocaleDateString()}`}
                          className="text-2xl cursor-default"
                        >
                          {MOOD_EMOJI[m.mood] ?? '😐'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Therapist Notes */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-purple-500" />
              Notes from Your Therapist
            </h2>
            <div className="space-y-6">
              {children.map((child) => {
                const notes = therapistNotes[child.id] ?? [];
                return (
                  <div key={child.id}>
                    <h3
                      className="text-lg font-bold mb-3 flex items-center gap-2"
                      style={{ color: child.avatarColor }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: child.avatarColor }}
                      >
                        {child.name.charAt(0)}
                      </div>
                      {child.name}
                    </h3>
                    {notes.length === 0 ? (
                      <p className="text-gray-400 italic text-sm mb-4">No notes from your therapist yet.</p>
                    ) : (
                      <div className="space-y-3 mb-4">
                        {notes.map((note) => (
                          <div
                            key={note.id}
                            className={`rounded-2xl p-4 border ${
                              note.noteType === 'milestone'
                                ? 'bg-green-50 border-green-200'
                                : note.noteType === 'recommendation'
                                ? 'bg-purple-50 border-purple-200'
                                : 'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold uppercase tracking-wide opacity-70">
                                {note.noteType === 'milestone' ? '🏆 Milestone' : note.noteType === 'recommendation' ? '💡 Recommendation' : '👁 Observation'}
                              </span>
                              <span className="text-xs opacity-50 ml-auto">{note.therapist.name} · {new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-800 leading-relaxed">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        {/* Autism Support Tips */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500" />
            Tips for Supporting Your Child
          </h2>
          <p className="text-gray-500 mb-6">Evidence-informed strategies for children with autism</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTISM_TIPS.map((tip, i) => (
              <div key={i} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                <div className="text-3xl mb-2">{tip.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{tip.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
